import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderRepository } from './orders.repository';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  QueryOrderDto,
} from './dto/order.dto';
import {
  assertAdminOrderStatusTransition,
  canonicalOrderStatus,
} from './order-status.util';
import {
  parsePipeShippingParts,
  serializeShippingAddressInput,
} from './shipping-address.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { VnpayService } from '../payments/vnpay.service';
import { OrderEventsService } from '../order-events/order-events.service';
import { ReviewsService } from '../reviews/reviews.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { ProductRepository } from '../products/products.repository';
import { OrderDocument } from './schemas/order.schema';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private orderRepository: OrderRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly vnpayService: VnpayService,
    private readonly orderEvents: OrderEventsService,
    private readonly reviewsService: ReviewsService,
    private readonly vouchersService: VouchersService,
    private readonly productRepository: ProductRepository,
  ) {}

  /** Khớp Cart / Checkout: giao nhanh 60k; tiêu chuẩn 30k hoặc miễn phí khi tạm tính > 500k */
  private computeShippingFee(
    shippingMethod: string | undefined,
    itemsSubtotal: number,
  ): number {
    if (shippingMethod === 'express') return 60000;
    return itemsSubtotal > 500000 ? 0 : 30000;
  }

  /** Đọc giá trị đã lưu (DB) — không throw; null nếu rỗng/không nhận diện. */
  private parsePaymentMethod(pm: string | undefined): string | null {
    const s = (pm || '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'vnpay') return 'VNPAY';
    if (s === 'cod') return 'COD';
    if (s === 'banking') return 'Banking';
    if (s === 'momo') return 'MoMo';
    return null;
  }

  /** Chỉ dùng khi tạo đơn từ API — bắt buộc cod / vnpay (hoặc banking/momo nếu mở sau). */
  private requirePaymentMethodForCreate(pm: string): string {
    const m = this.parsePaymentMethod(pm);
    if (!m) {
      throw new BadRequestException(
        'Chọn phương thức thanh toán (cod hoặc vnpay).',
      );
    }
    return m;
  }

  private generateOrderCode(): string {
    const t = Date.now().toString(36).toUpperCase();
    const r = randomBytes(4).toString('hex').toUpperCase();
    return `ORD-${t}-${r}`;
  }

  /** Khách chỉ hủy khi đơn còn Chờ xử lý / chờ VNPay (chưa xác nhận). */
  private canUserCancelOrder(order: { orderStatus?: string }): boolean {
    const st = (order.orderStatus || '').trim();
    const low = st.toLowerCase();
    return low === 'pending' || st === 'Chờ xử lý' || low === 'awaitingpayment';
  }

  /**
   * findById populate userId → có thể là ObjectId hoặc object { _id, fullName, ... }.
   * Không dùng String(order.userId) — sẽ thành "[object Object]".
   */
  private extractOrderOwnerUserId(order: { userId?: unknown }): string {
    const uid = order.userId;
    if (uid == null) return '';
    if (typeof uid === 'string') return uid;
    if (uid instanceof Types.ObjectId) return uid.toHexString();
    if (typeof uid === 'object' && '_id' in uid) {
      const inner = (uid as { _id: unknown })._id;
      if (inner == null) return '';
      if (typeof inner === 'string') return inner;
      if (inner instanceof Types.ObjectId) return inner.toHexString();
    }
    return '';
  }

  private clientIp(req?: Request): string {
    if (!req) return '127.0.0.1';
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.trim()) {
      return xf.split(',')[0].trim();
    }
    const ip = req.ip || req.socket?.remoteAddress;
    if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
    return typeof ip === 'string' ? ip : '127.0.0.1';
  }

  /** Chuẩn hóa đơn Mongo → dữ liệu admin (danh sách) */
  private mapOrderForAdminList(order: Record<string, unknown>) {
    const u = this.extractUser(order);
    const items = (order.items as Record<string, unknown>[]) || [];
    let itemCount = 0;
    for (const it of items) {
      itemCount += Number(it.quantity) || 0;
    }
    const oid = order._id as Types.ObjectId;
    const created = (order.createdAt as Date) || (order.updatedAt as Date);
    const ts = created ? new Date(created).getTime() : 0;
    const codeFromDb =
      typeof order.orderCode === 'string' && order.orderCode.trim()
        ? order.orderCode.trim()
        : '';
    return {
      _id: oid,
      orderCode:
        codeFromDb || (ts ? `ORD${ts}` : `ORD${String(oid).slice(-12)}`),
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      customerPhone: u.phone ?? '',
      orderDate: created,
      itemCount,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
    };
  }

  private extractUser(order: Record<string, unknown>): {
    fullName?: string;
    email?: string;
    phone?: string;
  } {
    const u = order.userId as
      | Record<string, unknown>
      | Types.ObjectId
      | undefined;
    if (u && typeof u === 'object' && 'email' in u) {
      return {
        fullName: u.fullName as string | undefined,
        email: u.email as string | undefined,
        phone: (u.phone as string | undefined) ?? undefined,
      };
    }
    return {};
  }

  /** Chuẩn hóa địa chỉ lưu DB (chuỗi, object hoặc JSON legacy) → một chuỗi hiển thị */
  private formatShippingAddressToString(value: unknown): string {
    if (value == null || value === '') return '';
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return serializeShippingAddressInput(value);
    }
    if (typeof value === 'string') {
      const t = value.trim();
      if (!t || t === '[object Object]') return '';
      // Hỗ trợ đơn cũ lưu shippingAddress dạng JSON.stringify({...})
      if (t.startsWith('{') && t.endsWith('}')) {
        try {
          const obj = JSON.parse(t);
          if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            return serializeShippingAddressInput(obj);
          }
        } catch {
          // không phải JSON hợp lệ, dùng chuỗi gốc
        }
      }
      return t;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }
    return '';
  }

  private paymentMethodLabelVi(raw: string): string {
    const s = raw.trim().toLowerCase();
    if (s === 'cod') return 'Thanh toán khi nhận hàng (COD)';
    if (s === 'vnpay') return 'VNPay';
    if (!s) return '—';
    return raw.trim();
  }

  private shippingMethodLabelVi(raw: string | undefined): string {
    const s = (raw || '').trim().toLowerCase();
    if (s === 'express') return 'Giao hàng nhanh';
    if (s === 'standard') return 'Giao hàng tiêu chuẩn';
    return raw?.trim() ? String(raw) : '—';
  }

  private resolveVariantLabels(
    product: Record<string, unknown> | undefined,
    variantId: unknown,
  ): { sizeName: string; colorName: string; variantSummary: string } {
    const dash = '—';
    if (!product || variantId == null || variantId === '') {
      return { sizeName: dash, colorName: dash, variantSummary: '' };
    }
    const variants = product.variants as Record<string, unknown>[] | undefined;
    if (!Array.isArray(variants)) {
      return { sizeName: dash, colorName: dash, variantSummary: '' };
    }
    const toIdStr = (id: unknown): string => {
      if (id == null) return '';
      if (id instanceof Types.ObjectId) return id.toHexString();
      if (typeof id === 'string') return id;
      return '';
    };
    const idStr = toIdStr(variantId);
    const v = variants.find((x) => {
      if (!x) return false;
      const bid = (x as { _id?: unknown })._id;
      return bid != null && toIdStr(bid) === idStr;
    });
    if (!v) {
      return { sizeName: dash, colorName: dash, variantSummary: '' };
    }
    const attrs =
      v.attributes && typeof v.attributes === 'object'
        ? (v.attributes as Record<string, string>)
        : {};
    const size =
      (typeof v.size === 'string' && v.size) || attrs.size || attrs.Size || '';
    const color =
      (typeof v.color === 'string' && v.color) ||
      attrs.color ||
      attrs.Color ||
      '';
    const extra = Object.entries(attrs)
      .filter(([k]) => !/^(size|color)$/i.test(k))
      .map(([, val]) => val)
      .filter(Boolean);
    const parts = [size, color, ...extra].filter(Boolean);
    const variantSummary = parts.join(' · ');
    return {
      sizeName: size || dash,
      colorName: color || dash,
      variantSummary,
    };
  }

  /** Chi tiết admin: khớp field mà frontend đọc (không dùng mock SQL) */
  private mapOrderForAdminDetail(order: Record<string, unknown>) {
    const u = this.extractUser(order);
    // Hỗ trợ: shippingAddress có thể là string pipe, object, "[object Object]", hoặc rỗng
    const shippingStr = this.formatShippingAddressToString(
      order.shippingAddress,
    );
    const parsed = parsePipeShippingParts(shippingStr);
    const receiverName = parsed?.receiverName || u.fullName || '';
    const receiverPhone = parsed?.receiverPhone || u.phone || '';
    const addressParts = parsed
      ? [parsed.addressLine, parsed.district, parsed.city].filter(Boolean)
      : [];
    // Nếu tất cả parts địa chỉ rỗng nhưng có pipe string → dùng chuỗi gốc (loại bỏ tiền tố tên/SĐT)
    const addressDisplay =
      addressParts.length > 0
        ? addressParts.join(', ')
        : shippingStr || '';
    const noteRaw = order.note;
    const noteStr =
      typeof noteRaw === 'string' && noteRaw.trim()
        ? noteRaw.trim()
        : parsed?.noteInPipe?.trim() || '';

    const payMethodRaw =
      typeof order.paymentMethod === 'string' ? order.paymentMethod : '—';
    const shipRaw =
      typeof order.shippingMethod === 'string'
        ? order.shippingMethod
        : undefined;

    const items = ((order.items as Record<string, unknown>[]) || []).map(
      (it, idx) => {
        const p = it.productId as Record<string, unknown> | undefined;
        let productName = 'Sản phẩm';
        if (p && typeof p === 'object' && 'productName' in p) {
          const pn = p.productName;
          productName = typeof pn === 'string' ? pn : productName;
        }
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const { sizeName, colorName, variantSummary } =
          this.resolveVariantLabels(p, it.variantId);
        return {
          _id: it._id ?? idx,
          productName,
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty,
          sizeName,
          colorName,
          variantSummary:
            variantSummary ||
            (sizeName !== '—' || colorName !== '—'
              ? [sizeName, colorName].filter((x) => x && x !== '—').join(' / ')
              : ''),
          variantId: it.variantId,
        };
      },
    );
    const oid = order._id as Types.ObjectId;
    const created = (order.createdAt as Date) || (order.updatedAt as Date);
    const ts = created ? new Date(created).getTime() : 0;
    const total = Number(order.totalAmount) || 0;
    const codeFromDb =
      typeof order.orderCode === 'string' && order.orderCode.trim()
        ? order.orderCode.trim()
        : '';
    return {
      _id: oid,
      orderCode:
        codeFromDb || (ts ? `ORD${ts}` : `ORD${String(oid).slice(-12)}`),
      orderStatus: order.orderStatus,
      statusName: order.orderStatus,
      orderDate: created,
      totalAmount: total,
      paymentMethod: payMethodRaw,
      paymentMethodLabel: this.paymentMethodLabelVi(payMethodRaw),
      paymentStatus: order.paymentStatus,
      shippingAddress: shippingStr,
      /** Một chuỗi — không bao giờ là object */
      addressDisplay,
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      customerPhone: u.phone ?? '',
      receiverName,
      receiverPhone,
      addressLine: parsed?.addressLine ?? '',
      ward: '',
      district: parsed?.district ?? '',
      city: parsed?.city ?? '',
      shippingMethod: shipRaw ?? '',
      shippingMethodLabel: this.shippingMethodLabelVi(shipRaw),
      /** @deprecated dùng shippingMethodLabel — giữ để tương thích */
      shippingMethodName: this.shippingMethodLabelVi(shipRaw),
      note: noteStr || undefined,
      voucherCode: order.voucherCode,
      voucherName: '',
      voucherDiscountAmount: order.voucherDiscountAmount,
      items,
      payments: [
        {
          paymentMethodName: this.paymentMethodLabelVi(payMethodRaw),
          amount: total,
        },
      ],
    };
  }

  private async assertOrderItemsMatchVariantRules(
    items: CreateOrderDto['items'],
  ): Promise<void> {
    for (const item of items) {
      const p = await this.productRepository.findById(item.productId);
      if (!p) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm: ${item.productId}`,
        );
      }
      const plain =
        typeof (p as { toObject?: () => object }).toObject === 'function'
          ? (p as { toObject: () => object }).toObject()
          : (p as object);
      const vars = Array.isArray((plain as { variants?: unknown }).variants)
        ? (plain as { variants: { _id?: unknown }[] }).variants
        : [];
      if (vars.length > 0) {
        const vTrim = item.variantId?.trim();
        if (!vTrim) {
          throw new BadRequestException(
            'Sản phẩm có biến thể — vui lòng chọn size/màu và cập nhật giỏ hàng.',
          );
        }
        const ok = vars.some((v) => String(v._id) === vTrim);
        if (!ok) {
          throw new BadRequestException('Biến thể sản phẩm không hợp lệ');
        }
      }
    }
  }

  private async deductInventoryForOrderItems(
    items: CreateOrderDto['items'],
  ): Promise<{ productId: string; variantId?: string; quantity: number }[]> {
    const applied: {
      productId: string;
      variantId?: string;
      quantity: number;
    }[] = [];
    for (const item of items) {
      const vid = item.variantId?.trim() || undefined;
      const ok = await this.productRepository.decrementStockForLine(
        item.productId,
        vid,
        item.quantity,
      );
      if (!ok) {
        for (const r of [...applied].reverse()) {
          await this.productRepository.incrementStockForLine(
            r.productId,
            r.variantId,
            r.quantity,
          );
        }
        throw new BadRequestException(
          'Không đủ hàng trong kho (sản phẩm đã thay đổi). Vui lòng làm mới giỏ hàng.',
        );
      }
      applied.push({
        productId: item.productId,
        variantId: vid,
        quantity: item.quantity,
      });
    }
    return applied;
  }

  private async rollbackInventoryLines(
    applied: { productId: string; variantId?: string; quantity: number }[],
  ): Promise<void> {
    for (const r of [...applied].reverse()) {
      await this.productRepository.incrementStockForLine(
        r.productId,
        r.variantId,
        r.quantity,
      );
    }
  }

  private async restoreInventoryIfDeducted(
    order: OrderDocument,
  ): Promise<void> {
    const o = order as OrderDocument & {
      inventoryDeducted?: boolean;
      items?: {
        productId: unknown;
        variantId?: unknown;
        quantity?: number;
      }[];
    };
    // Chỉ bỏ qua khi đã hoàn lại rồi (inventoryDeducted === false).
    // inventoryDeducted === undefined (đơn cũ chưa có flag) → vẫn hoàn lại.
    if (o.inventoryDeducted === false) return;
    const items = o.items || [];
    for (const it of items) {
      const q = Number(it.quantity) || 0;
      if (q < 1) continue;
      let pid = '';
      const rawPid = it.productId;
      if (rawPid instanceof Types.ObjectId) {
        pid = rawPid.toHexString();
      } else if (
        rawPid &&
        typeof rawPid === 'object' &&
        '_id' in (rawPid as object)
      ) {
        pid = String((rawPid as { _id: unknown })._id);
      } else {
        pid = String(rawPid ?? '');
      }
      let vid: string | undefined;
      const rawVid = it.variantId;
      if (rawVid instanceof Types.ObjectId) {
        vid = rawVid.toHexString();
      } else if (rawVid != null && rawVid !== '') {
        vid = String(rawVid);
      }
      if (!pid) continue;
      await this.productRepository.incrementStockForLine(pid, vid, q);
    }
  }

  async createOrder(userId: string, createDto: CreateOrderDto, req?: Request) {
    const paymentMethod = this.requirePaymentMethodForCreate(
      createDto.paymentMethod,
    );

    // ── Kiểm tra cấu hình VNPay SỚM — trước khi tạo đơn / trừ tồn kho ──
    if (paymentMethod === 'VNPAY') {
      if (!this.vnpayService.isConfigured()) {
        throw new BadRequestException(
          'Chưa cấu hình VNPay (VNPAY_TMN_CODE / VNPAY_HASH_SECRET) trên server. Vui lòng chọn thanh toán COD hoặc liên hệ shop.',
        );
      }
      // Kiểm tra RETURN_URL có set không (gọi thử, bắt lỗi)
      try {
        this.vnpayService.getReturnUrl();
      } catch {
        throw new BadRequestException(
          'Chưa cấu hình VNPAY_RETURN_URL trên server. Vui lòng chọn thanh toán COD hoặc liên hệ shop.',
        );
      }
    }

    const itemsSubtotal = createDto.items.reduce(
      (s, it) => s + Number(it.price) * Number(it.quantity),
      0,
    );
    const shippingFee = this.computeShippingFee(
      createDto.shippingMethod,
      itemsSubtotal,
    );

    const voucherCodeRaw = createDto.voucherCode?.trim();
    let voucherSnapshot: {
      code: string;
      discountAmount: number;
      voucherId: string;
    } | null = null;

    if (voucherCodeRaw) {
      const v = await this.vouchersService.validateForOrder(
        userId,
        voucherCodeRaw,
        itemsSubtotal,
      );
      const expectedTotal = Math.round(
        itemsSubtotal - v.discountAmount + shippingFee,
      );
      if (Math.abs(expectedTotal - Number(createDto.totalAmount)) > 2) {
        throw new BadRequestException(
          'Số tiền không khớp với mã giảm giá. Vui lòng làm mới giỏ hàng và thử lại.',
        );
      }
      voucherSnapshot = {
        code: v.voucher.code,
        discountAmount: v.discountAmount,
        voucherId: String(v.voucher._id),
      };
    }

    await this.assertOrderItemsMatchVariantRules(createDto.items);
    const appliedInventory = await this.deductInventoryForOrderItems(
      createDto.items,
    );

    const payload = {
      items: createDto.items.map((item) => {
        const row: {
          productId: Types.ObjectId;
          quantity: number;
          price: number;
          variantId?: Types.ObjectId;
        } = {
          productId: new Types.ObjectId(item.productId),
          quantity: item.quantity,
          price: item.price,
        };
        const v = item.variantId?.trim();
        if (v) row.variantId = new Types.ObjectId(v);
        return row;
      }),
      shippingAddress: serializeShippingAddressInput(createDto.shippingAddress),
      totalAmount: createDto.totalAmount,
      orderCode: this.generateOrderCode(),
      paymentMethod,
      userId: new Types.ObjectId(userId),
      /** VNPay: chỉ vào hàng chờ admin sau khi thanh toán thành công */
      orderStatus: paymentMethod === 'VNPAY' ? 'AwaitingPayment' : 'Pending',
      paymentStatus: 'Pending',
      note: createDto.note?.trim() || undefined,
      shippingMethod: createDto.shippingMethod?.trim() || undefined,
      voucherCode: voucherSnapshot?.code,
      voucherDiscountAmount: voucherSnapshot?.discountAmount,
      inventoryDeducted: true,
    } as any;

    let order: OrderDocument;
    try {
      order = await this.orderRepository.create(payload);
    } catch (e: unknown) {
      await this.rollbackInventoryLines(appliedInventory);
      throw e;
    }

    if (voucherSnapshot) {
      try {
        await this.vouchersService.recordUsageAfterOrder(
          userId,
          voucherSnapshot.voucherId,
          String(order._id),
          voucherSnapshot.code,
        );
      } catch (e: unknown) {
        await this.orderRepository.delete(String(order._id));
        await this.rollbackInventoryLines(appliedInventory);
        const code =
          e && typeof e === 'object' && 'code' in e
            ? (e as { code?: number }).code
            : undefined;
        if (code === 11000) {
          throw new BadRequestException(
            'Mã voucher không áp dụng được (đã sử dụng hoặc trùng lượt).',
          );
        }
        throw e;
      }
    }

    let paymentUrl: string | undefined;
    if (paymentMethod === 'VNPAY') {
      try {
        paymentUrl = this.vnpayService.buildPaymentUrl({
          orderId: String(order._id),
          amountVnd: Math.round(Number(createDto.totalAmount)),
          orderDescription: `Thanh toan don hang ${String(order._id)}`,
          ipAddr: this.clientIp(req),
        });
      } catch (e) {
        // Nếu build URL thất bại sau khi đã tạo đơn → xóa đơn + hoàn tồn kho
        await this.orderRepository.delete(String(order._id)).catch(() => null);
        await this.rollbackInventoryLines(appliedInventory).catch(() => null);
        throw e;
      }
    }

    // Fire-and-forget: không block response (đặc biệt VNPay cần trả paymentUrl ngay)
    void this.orderEvents
      .onOrderCreated(order, { paymentUrl })
      .catch((e) =>
        this.logger.error(
          `orderEvents.onOrderCreated: ${e instanceof Error ? e.message : e}`,
        ),
      );

    return {
      message: 'Tạo đơn hàng thành công',
      order,
      paymentUrl,
    };
  }

  async getMyOrders(userId: string) {
    const orders = await this.orderRepository.findAll(
      { userId: new Types.ObjectId(userId) },
      0,
      100,
    );
    return { orders };
  }

  async getAllOrders(query: QueryOrderDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    const statusVal = (query.status || query.orderStatus || '').trim();
    if (statusVal) {
      match.orderStatus = statusVal;
    } else {
      /** Ẩn đơn VNPay chưa trả — admin chỉ thấy sau khi thanh toán hoặc chuyển COD */
      match.orderStatus = { $nin: ['AwaitingPayment'] };
    }
    const pay = query.paymentStatus?.trim();
    if (pay) match.paymentStatus = pay;

    const start = query.startDate?.trim();
    const end = query.endDate?.trim();
    if (start || end) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (start) {
        const d = new Date(start);
        if (!Number.isNaN(d.getTime())) range.$gte = d;
      }
      if (end) {
        const d = new Date(end);
        if (!Number.isNaN(d.getTime())) {
          const endDay = new Date(d);
          endDay.setHours(23, 59, 59, 999);
          range.$lte = endDay;
        }
      }
      if (Object.keys(range).length) match.createdAt = range;
    }

    const q = query.search?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      const or: Record<string, unknown>[] = [
        { shippingAddress: rx },
        { orderStatus: rx },
        { paymentMethod: rx },
      ];
      if (Types.ObjectId.isValid(q) && String(new Types.ObjectId(q)) === q) {
        or.push({ _id: new Types.ObjectId(q) });
      }
      const userIds = await this.userModel.distinct('_id', {
        $or: [{ email: rx }, { fullName: rx }, { phone: rx }],
      });
      if (userIds.length) {
        or.push({ userId: { $in: userIds } });
      }
      match.$or = or;
    }

    const [orders, total] = await Promise.all([
      this.orderRepository.findAll(match, skip, limit),
      this.orderRepository.count(match),
    ]);

    return {
      orders: orders.map((o) =>
        this.mapOrderForAdminList(o.toObject ? o.toObject() : (o as any)),
      ),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  /** Admin: chi tiết đầy đủ, map field — không cần req.user */
  async getOrderByIdForAdmin(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const plain = order.toObject ? order.toObject() : (order as any);
    return this.mapOrderForAdminDetail(plain);
  }

  async getOrderById(id: string, userId?: string, role?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (role === 'Admin') {
      return order;
    }

    const plain = order.toObject ? order.toObject() : (order as any);
    const uid = plain.userId;
    const ownerId =
      uid && typeof uid === 'object' && uid._id
        ? String(uid._id)
        : uid
          ? String(uid)
          : '';

    if (userId && ownerId && ownerId !== userId) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng thuộc quyền của bạn',
      );
    }

    if (userId && ownerId === userId) {
      const reviewByProductId = await this.reviewsService.findMapForOrder(
        userId,
        id,
      );
      return {
        ...plain,
        reviewByProductId,
      };
    }

    return order;
  }

  /**
   * Tạo lại URL VNPay cho đơn chưa thanh toán (hết tiền / hủy cổng / lỗi).
   */
  async getVnpayRetryUrl(
    userId: string,
    orderId: string,
    req?: Request,
  ): Promise<{ message: string; paymentUrl: string }> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ');
    }
    const order = await this.orderRepository.findByIdRaw(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (this.extractOrderOwnerUserId(order) !== userId) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng thuộc quyền của bạn',
      );
    }
    if (
      this.parsePaymentMethod(String(order.paymentMethod ?? '')) !== 'VNPAY'
    ) {
      throw new BadRequestException('Đơn không dùng thanh toán VNPay');
    }
    if (String(order.paymentStatus || '').toLowerCase() === 'paid') {
      throw new BadRequestException(
        'Đơn đã thanh toán, không cần thanh toán lại',
      );
    }
    const ost = String(order.orderStatus || '')
      .trim()
      .toLowerCase();
    if (ost !== 'awaitingpayment' && ost !== 'pending') {
      throw new BadRequestException(
        'Đơn không còn ở trạng thái chờ thanh toán VNPay',
      );
    }
    if (!this.vnpayService.isConfigured()) {
      throw new BadRequestException(
        'Chưa cấu hình VNPay trên server (VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_RETURN_URL)',
      );
    }
    const paymentUrl = this.vnpayService.buildPaymentUrl({
      orderId: String(order._id),
      amountVnd: Math.round(Number(order.totalAmount)),
      orderDescription: `Thanh toan don hang ${String(order._id)}`,
      ipAddr: this.clientIp(req),
    });
    return { message: 'Đang chuyển tới VNPay', paymentUrl };
  }

  /**
   * Đổi sang COD khi VNPay chưa thành công — đơn vào hàng chờ admin như đặt COD thường.
   */
  async switchUnpaidVnpayToCod(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ');
    }
    const order = await this.orderRepository.findByIdRaw(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (this.extractOrderOwnerUserId(order) !== userId) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng thuộc quyền của bạn',
      );
    }
    if (
      this.parsePaymentMethod(String(order.paymentMethod ?? '')) !== 'VNPAY'
    ) {
      throw new BadRequestException('Chỉ đổi được khi đơn đang chọn VNPay');
    }
    if (String(order.paymentStatus || '').toLowerCase() === 'paid') {
      throw new BadRequestException('Đơn đã thanh toán');
    }
    const ost = String(order.orderStatus || '')
      .trim()
      .toLowerCase();
    if (ost !== 'awaitingpayment' && ost !== 'pending') {
      throw new BadRequestException(
        'Đơn không còn ở trạng thái chờ thanh toán',
      );
    }
    const updated = await this.orderRepository.update(orderId, {
      paymentMethod: 'COD',
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
    } as any);
    if (!updated) throw new NotFoundException('Không tìm thấy đơn hàng');

    try {
      await this.orderEvents.notifyAdminsOrderPendingReview(updated);
    } catch (e) {
      this.logger.error(
        `notifyAdminsOrderPendingReview: ${e instanceof Error ? e.message : e}`,
      );
    }

    return {
      message:
        'Đã chuyển sang thanh toán khi nhận hàng (COD). Shop sẽ xác nhận đơn.',
      order: updated,
    };
  }

  async cancelMyOrder(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ');
    }
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const ownerId = this.extractOrderOwnerUserId(order);
    if (ownerId !== userId) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng thuộc quyền của bạn',
      );
    }
    if (!this.canUserCancelOrder(order)) {
      throw new BadRequestException(
        'Chỉ hủy được đơn khi trạng thái là Chờ xử lý (chưa xác nhận). Đơn đã xác nhận hoặc đã thanh toán không thể hủy tại đây.',
      );
    }
    const raw = await this.orderRepository.findByIdRaw(orderId);
    if (raw) await this.restoreInventoryIfDeducted(raw);
    const updated = await this.orderRepository.update(orderId, {
      orderStatus: 'Cancelled',
      inventoryDeducted: false,
    });
    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    void this.orderEvents
      .onOrderCancelled(String(updated._id), 'user')
      .catch((e) =>
        this.logger.error(
          `onOrderCancelled user: ${e instanceof Error ? e.message : e}`,
        ),
      );
    return { message: 'Đã hủy đơn hàng', order: updated };
  }

  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto) {
    const before = await this.orderRepository.findById(id);
    if (!before) throw new NotFoundException('Không tìm thấy đơn hàng');

    const payload: any = { ...updateDto };
    // Map statusName → orderStatus nếu frontend gửi field cũ
    if (updateDto.statusName && !updateDto.orderStatus) {
      payload.orderStatus = updateDto.statusName;
      delete payload.statusName;
    }
    if (
      payload.orderStatus !== undefined &&
      String(payload.orderStatus).trim() === ''
    ) {
      delete payload.orderStatus;
    }

    const willChangeOrderStatus =
      payload.orderStatus !== undefined &&
      payload.orderStatus !== null &&
      String(payload.orderStatus).trim() !== '';
    if (willChangeOrderStatus) {
      const canonNext = assertAdminOrderStatusTransition(
        before.orderStatus,
        String(payload.orderStatus),
      );
      payload.orderStatus = canonNext;
      const prevCanon = canonicalOrderStatus(before.orderStatus);
      if (prevCanon && canonNext === 'Cancelled' && prevCanon !== 'Cancelled') {
        const raw = await this.orderRepository.findByIdRaw(id);
        if (raw) await this.restoreInventoryIfDeducted(raw);
        payload.inventoryDeducted = false;
      }
    }

    const order = await this.orderRepository.update(id, payload);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const prevSt2 = String(before.orderStatus || '')
      .trim()
      .toLowerCase();
    const newSt2 = String(order.orderStatus || '')
      .trim()
      .toLowerCase();
    if (newSt2 === 'cancelled' && prevSt2 !== 'cancelled') {
      void this.orderEvents
        .onOrderCancelled(String(order._id), 'admin')
        .catch((e) =>
          this.logger.error(
            `onOrderCancelled admin: ${e instanceof Error ? e.message : e}`,
          ),
        );
    } else if (
      willChangeOrderStatus &&
      newSt2 !== 'cancelled' &&
      newSt2 !== prevSt2
    ) {
      try {
        await this.orderEvents.onOrderStatusUpdated(
          String(order._id),
          order.orderStatus ?? '',
        );
      } catch (e) {
        this.logger.error(
          `onOrderStatusUpdated: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    return { message: 'Cập nhật trạng thái đơn hàng thành công', order };
  }

  /** Xóa hẳn bản ghi đơn (admin) — không hoàn tác */
  async deleteOrderByAdmin(id: string) {
    const before = await this.orderRepository.findByIdRaw(id);
    if (!before) throw new NotFoundException('Không tìm thấy đơn hàng');
    await this.restoreInventoryIfDeducted(before);
    const deleted = await this.orderRepository.delete(id);
    if (!deleted) throw new NotFoundException('Không tìm thấy đơn hàng');
    return { message: 'Đã xóa đơn hàng' };
  }

  async getOrderStats(_query?: any) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    /**
     * Điều kiện "đã thu được tiền":
     *  - VNPay: paymentStatus = 'Paid'  (đã chuyển khoản thành công, dù chưa giao xong)
     *  - COD  : orderStatus  = 'Delivered' (thu tiền mặt khi giao hàng)
     * Loại trừ đơn VNPay đã hủy sau khi thanh toán (cần hoàn tiền).
     */
    const PAID_MATCH = {
      $or: [
        { paymentMethod: 'VNPAY', paymentStatus: 'Paid', orderStatus: { $ne: 'Cancelled' } },
        { paymentMethod: 'COD',   orderStatus: 'Delivered' },
      ],
    };

    const [totalOrders, pendingOrders, completedOrders, revenueAgg] =
      await Promise.all([
        this.orderRepository.count({}),
        this.orderRepository.count({
          orderStatus: { $in: ['Pending', 'Chờ xử lý'] },
        }),
        this.orderRepository.count({
          orderStatus: { $in: ['Delivered', 'Hoàn thành'] },
        }),
        this.orderRepository.aggregate([
          { $match: PAID_MATCH },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

    const monthAgg = await this.orderRepository.aggregate([
      { $match: { $and: [PAID_MATCH, { createdAt: { $gte: startOfMonth } }] } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const revenueByDay = await this.orderRepository.aggregate([
      {
        $match: {
          $and: [
            PAID_MATCH,
            { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
          ],
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
    ]);

    const topProducts = await this.orderRepository.aggregate([
      { $match: PAID_MATCH },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          productId: { $toString: '$_id' },
          productName: {
            $ifNull: ['$product.productName', 'Sản phẩm đã xóa'],
          },
          image: { $arrayElemAt: ['$product.images', 0] },
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return {
      overview: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: revenueAgg[0]?.total ?? 0,
        thisMonthOrders: monthAgg[0]?.count ?? 0,
        thisMonthRevenue: monthAgg[0]?.revenue ?? 0,
      },
      revenueByDay30: revenueByDay,
      topProducts,
    };
  }
}

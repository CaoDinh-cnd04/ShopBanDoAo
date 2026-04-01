import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { VoucherRepository } from './vouchers.repository';
import { VoucherUsageRepository } from './voucher-usage.repository';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  QueryVoucherDto,
} from './dto/voucher.dto';
import { VoucherDocument } from './schemas/voucher.schema';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Admin thường nhập chỉ ngày (ISO date) → lưu 00:00:00.000Z.
 * So sánh `now > endDate` khiến mã **hết hạn ngay trong ngày** (sau 00:00 UTC).
 * Coi ngày kết thúc là còn hiệu lực đến 23:59:59.999 UTC cùng ngày.
 */
function isUtcMidnight(d: Date): boolean {
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

function endDateInclusiveUtc(end: Date): Date {
  const d = new Date(end);
  if (isUtcMidnight(d)) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
}

function normalizeEndDateForStorage(d: Date): Date {
  return endDateInclusiveUtc(new Date(d));
}

@Injectable()
export class VouchersService {
  constructor(
    private voucherRepository: VoucherRepository,
    private voucherUsageRepository: VoucherUsageRepository,
  ) {}

  async createVoucher(createDto: CreateVoucherDto) {
    const existing = await this.voucherRepository.findByCode(createDto.code);
    if (existing) throw new BadRequestException('Mã voucher đã tồn tại');

    const payload = {
      ...createDto,
      code: createDto.code.trim().toUpperCase(),
      voucherName: createDto.voucherName?.trim() ?? '',
      description: createDto.description?.trim() ?? '',
      startDate: new Date(createDto.startDate),
      endDate: normalizeEndDateForStorage(new Date(createDto.endDate)),
    };
    const voucher = await this.voucherRepository.create(payload);
    return { message: 'Tạo mã giảm giá thành công', voucher };
  }

  async getAllVouchers(query: QueryVoucherDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit || '20', 10) || 20),
    );
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = {};
    const q = query.search?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      match.$or = [{ code: rx }, { voucherName: rx }, { description: rx }];
    }
    if (query.isActive !== undefined && query.isActive !== '') {
      match.isActive = query.isActive === 'true';
    }
    const now = new Date();
    if (query.isExpired !== undefined && query.isExpired !== '') {
      if (query.isExpired === 'true') {
        match.endDate = { $lt: now };
      } else {
        match.endDate = { $gte: now };
      }
    }

    const [vouchers, total] = await Promise.all([
      this.voucherRepository.findAll(match, skip, limit),
      this.voucherRepository.count(match),
    ]);

    return {
      vouchers,
      pagination: {
        currentPage: page,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  private computeDiscountAmount(
    voucher: VoucherDocument,
    orderValue: number,
  ): number {
    let discountAmount = 0;
    if (voucher.discountType === 'fixed') {
      discountAmount = voucher.discountValue;
    } else if (voucher.discountType === 'percent') {
      discountAmount = (orderValue * voucher.discountValue) / 100;
      if (
        voucher.maxDiscountAmount &&
        discountAmount > voucher.maxDiscountAmount
      ) {
        discountAmount = voucher.maxDiscountAmount;
      }
    }
    return Math.round(discountAmount);
  }

  /**
   * Kiểm tra mã + (nếu có userId) user chưa từng dùng mã này.
   */
  private async evaluateVoucher(
    code: string,
    orderValue: number,
    userId?: string,
  ): Promise<{ voucher: VoucherDocument; discountAmount: number }> {
    const voucher = await this.voucherRepository.findByCode(code);
    if (!voucher)
      throw new NotFoundException('Mã giảm giá không hợp lệ hoặc đã hết hạn');

    if (!voucher.isActive) {
      throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
    }

    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException(
        'Mã giảm giá chưa đến ngày áp dụng hoặc đã hết hạn',
      );
    }

    const limit = voucher.usageLimit;
    if (
      typeof limit === 'number' &&
      limit >= 0 &&
      limit <= (voucher.usedCount ?? 0)
    ) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    if (voucher.minOrderValue && orderValue < voucher.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu phải đạt ${voucher.minOrderValue}đ để áp dụng mã này`,
      );
    }

    if (userId) {
      const used = await this.voucherUsageRepository.hasUsed(
        userId,
        voucher._id,
      );
      if (used) {
        throw new BadRequestException(
          'Bạn đã sử dụng mã này cho một đơn hàng trước đó. Mỗi tài khoản chỉ được dùng mỗi voucher một lần.',
        );
      }
    }

    const discountAmount = this.computeDiscountAmount(voucher, orderValue);
    return { voucher, discountAmount };
  }

  async applyVoucher(
    code: string,
    orderValue: number | undefined,
    userId: string,
  ) {
    const raw = Number(orderValue);
    const safeOrderValue =
      Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : 0;
    const { voucher, discountAmount } = await this.evaluateVoucher(
      code,
      safeOrderValue,
      userId,
    );
    return {
      message: 'Áp dụng mã thành công',
      discountAmount,
      voucherCode: voucher.code,
      voucherName: voucher.voucherName || '',
    };
  }

  /** Dùng khi tạo đơn — đảm bảo user chưa dùng mã và trả về số tiền giảm. */
  async validateForOrder(
    userId: string,
    code: string,
    itemsSubtotal: number,
  ): Promise<{ voucher: VoucherDocument; discountAmount: number }> {
    return this.evaluateVoucher(code, itemsSubtotal, userId);
  }

  /** Ghi nhận sau khi đơn đã tạo (cùng transaction nếu có session). */
  async recordUsageAfterOrder(
    userId: string,
    voucherId: string,
    orderId: string,
    voucherCode: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.voucherUsageRepository.create(
      {
        userId,
        voucherId,
        orderId,
        voucherCode,
      },
      session,
    );
    await this.voucherRepository.incrementUsedCount(voucherId, session);
  }

  async updateVoucher(id: string, updateDto: UpdateVoucherDto) {
    const payload: any = { ...updateDto };
    if (updateDto.startDate) payload.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) {
      payload.endDate = normalizeEndDateForStorage(new Date(updateDto.endDate));
    }

    const voucher = await this.voucherRepository.update(id, payload);
    if (!voucher) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return { message: 'Cập nhật mã giảm giá thành công', voucher };
  }

  async deleteVoucher(id: string) {
    const voucher = await this.voucherRepository.softDeactivate(id);
    if (!voucher) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return { message: 'Đã vô hiệu hóa mã giảm giá' };
  }

  /** Chuẩn hóa JSON — luôn có `code` (tránh client nhận document thiếu field khi serialize) */
  private mapVoucherForClient(v: VoucherDocument) {
    const o = v.toObject
      ? v.toObject()
      : (v as unknown as Record<string, unknown>);
    const rawCode = o.code ?? o.voucherCode;
    const code =
      typeof rawCode === 'string'
        ? rawCode.trim().toUpperCase()
        : String(rawCode ?? '').trim();
    return {
      _id: o._id,
      code,
      voucherName: (o.voucherName as string) ?? '',
      description: (o.description as string) ?? '',
      discountType: o.discountType,
      discountValue: o.discountValue,
      minOrderValue: (o.minOrderValue as number) ?? 0,
      maxDiscountAmount: (o.maxDiscountAmount as number) ?? 0,
      startDate: o.startDate,
      endDate: o.endDate,
    };
  }

  async getPublicVouchers() {
    const now = new Date();
    /** Lấy cả mã có endDate = 00:00 UTC (đã lưu cũ) — lọc theo ngày kết thúc inclusive */
    const looseEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1,
        0,
        0,
        0,
        0,
      ),
    );
    const list = await this.voucherRepository.findAll(
      {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: looseEnd },
      },
      0,
      100,
    );
    const vouchers = list
      .filter((doc) => {
        const endAt = endDateInclusiveUtc(new Date(doc.endDate));
        return now.getTime() <= endAt.getTime();
      })
      .slice(0, 50)
      .map((doc) => this.mapVoucherForClient(doc));
    return { vouchers };
  }

  /**
   * Trang khách: voucher đang hiệu lực mà user **chưa dùng** + lịch sử đã áp dụng (theo đơn).
   */
  async getMyVoucherOverview(userId: string) {
    const now = new Date();
    const looseEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1,
        0,
        0,
        0,
        0,
      ),
    );
    const candidates = await this.voucherRepository.findAll(
      {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: looseEnd },
      },
      0,
      200,
    );

    const usages = await this.voucherUsageRepository.findByUser(userId);
    const usedVoucherIds = new Set(usages.map((u) => String(u.voucherId)));

    const available = candidates
      .filter((v) => {
        const endAt = endDateInclusiveUtc(new Date(v.endDate));
        return now.getTime() <= endAt.getTime();
      })
      .filter((v) => !usedVoucherIds.has(String(v._id)))
      .filter((v) => {
        const lim = v.usageLimit;
        const used = v.usedCount ?? 0;
        if (typeof lim !== 'number' || lim < 0) return true;
        return used < lim;
      })
      .map((doc) => this.mapVoucherForClient(doc));

    const used = usages.map((u) => {
      const plain = u.toObject();
      const ord = plain.orderId as unknown;
      let orderCode = '';
      if (
        ord &&
        typeof ord === 'object' &&
        ord !== null &&
        'orderCode' in ord
      ) {
        orderCode = String((ord as { orderCode?: string }).orderCode ?? '');
      }
      return {
        voucherCode: u.voucherCode,
        orderId: String(u.orderId),
        orderCode: orderCode || String(u.orderId),
        usedAt: plain.createdAt,
      };
    });

    return { available, used };
  }

  async getVoucherStats() {
    const now = new Date();
    const [totalVouchers, activeVouchers, expiredVouchers] = await Promise.all([
      this.voucherRepository.count({}),
      this.voucherRepository.count({ isActive: true, endDate: { $gte: now } }),
      this.voucherRepository.count({ endDate: { $lt: now } }),
    ]);
    return { totalVouchers, activeVouchers, expiredVouchers };
  }
}

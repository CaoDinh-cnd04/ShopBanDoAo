import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderRepository } from './orders.repository';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  QueryOrderDto,
} from './dto/order.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class OrdersService {
  constructor(
    private orderRepository: OrderRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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
    return {
      _id: oid,
      orderCode: ts ? `ORD${ts}` : `ORD${String(oid).slice(-12)}`,
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

  /** Chi tiết admin: khớp field mà frontend đọc (không dùng mock SQL) */
  private mapOrderForAdminDetail(order: Record<string, unknown>) {
    const u = this.extractUser(order);
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
        return {
          _id: it._id ?? idx,
          productName,
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty,
          sizeName: '—',
          colorName: '—',
        };
      },
    );
    const oid = order._id as Types.ObjectId;
    const created = (order.createdAt as Date) || (order.updatedAt as Date);
    const ts = created ? new Date(created).getTime() : 0;
    const total = Number(order.totalAmount) || 0;
    const payMethod =
      typeof order.paymentMethod === 'string' ? order.paymentMethod : '—';
    return {
      _id: oid,
      orderCode: ts ? `ORD${ts}` : `ORD${String(oid).slice(-12)}`,
      orderStatus: order.orderStatus,
      statusName: order.orderStatus,
      orderDate: created,
      totalAmount: total,
      paymentMethod: payMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      receiverName: u.fullName ?? '',
      receiverPhone: u.phone ?? '',
      addressLine: order.shippingAddress,
      ward: '',
      district: '',
      city: '',
      shippingMethodName: payMethod,
      items,
      payments: [
        {
          paymentMethodName: payMethod,
          amount: total,
        },
      ],
    };
  }

  async createOrder(userId: string, createDto: CreateOrderDto) {
    const payload = {
      ...createDto,
      userId: new Types.ObjectId(userId),
      items: createDto.items.map((item) => ({
        ...item,
        productId: new Types.ObjectId(item.productId),
      })),
    } as any;

    const order = await this.orderRepository.create(payload);
    return { message: 'Tạo đơn hàng thành công', order };
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
    if (statusVal) match.orderStatus = statusVal;
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

    return order;
  }

  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto) {
    const payload: any = { ...updateDto };
    // Map statusName → orderStatus nếu frontend gửi field cũ
    if (updateDto.statusName && !updateDto.orderStatus) {
      payload.orderStatus = updateDto.statusName;
      delete payload.statusName;
    }
    const order = await this.orderRepository.update(id, payload);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return { message: 'Cập nhật trạng thái đơn hàng thành công', order };
  }

  /** Xóa hẳn bản ghi đơn (admin) — không hoàn tác */
  async deleteOrderByAdmin(id: string) {
    const deleted = await this.orderRepository.delete(id);
    if (!deleted) throw new NotFoundException('Không tìm thấy đơn hàng');
    return { message: 'Đã xóa đơn hàng' };
  }

  async getOrderStats(_query?: any) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
          { $match: { paymentStatus: { $in: ['Paid', 'Đã thanh toán'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

    const monthAgg = await this.orderRepository.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
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
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          Revenue: { $sum: '$totalAmount' },
          Orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', Revenue: 1, Orders: 1 } },
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
    };
  }
}

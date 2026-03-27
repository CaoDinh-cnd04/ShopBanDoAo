import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrderRepository } from './orders.repository';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  QueryOrderDto,
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private orderRepository: OrderRepository) {}

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
    if (query.orderStatus) match.orderStatus = query.orderStatus;
    if (query.paymentStatus) match.paymentStatus = query.paymentStatus;

    const [orders, total] = await Promise.all([
      this.orderRepository.findAll(match, skip, limit),
      this.orderRepository.count(match),
    ]);

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  async getOrderById(id: string, userId?: string, role?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Nếu là user thường, chỉ xem được đơn của mình
    if (
      role !== 'Admin' &&
      order.userId._id.toString() !== userId &&
      order.userId.toString() !== userId
    ) {
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

  async getOrderStats(query?: any) {
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

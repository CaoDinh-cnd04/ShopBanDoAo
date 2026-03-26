import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrderRepository } from './orders.repository';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private orderRepository: OrderRepository) {}

  async createOrder(userId: string, createDto: CreateOrderDto) {
    const payload = {
      ...createDto,
      userId: new Types.ObjectId(userId),
      items: createDto.items.map(item => ({
        ...item,
        productId: new Types.ObjectId(item.productId),
      }))
    } as any;

    const order = await this.orderRepository.create(payload);
    return { message: 'Tạo đơn hàng thành công', order };
  }

  async getMyOrders(userId: string) {
    const orders = await this.orderRepository.findAll({ userId: new Types.ObjectId(userId) }, 0, 100);
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
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    };
  }

  async getOrderById(id: string, userId?: string, role?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    
    // Nếu là user thường, chỉ xem được đơn của mình
    if (role !== 'Admin' && order.userId._id.toString() !== userId && order.userId.toString() !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng thuộc quyền của bạn');
    }
    
    return order;
  }

  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.update(id, updateDto);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return { message: 'Cập nhật trạng thái đơn hàng thành công', order };
  }
}

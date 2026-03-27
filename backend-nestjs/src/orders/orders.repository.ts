import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(
    match: any,
    skip: number,
    limit: number,
  ): Promise<OrderDocument[]> {
    return this.orderModel
      .find(match)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .populate('items.productId', 'productName defaultPrice')
      .exec();
  }

  async count(match: any): Promise<number> {
    return this.orderModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<OrderDocument | null> {
    return this.orderModel
      .findById(id)
      .populate('userId', 'fullName email')
      .populate('items.productId', 'productName defaultPrice')
      .exec();
  }

  async create(data: Partial<Order>): Promise<OrderDocument> {
    const newOrder = new this.orderModel(data);
    return newOrder.save();
  }

  async update(
    id: string,
    updateData: Partial<Order>,
  ): Promise<OrderDocument | null> {
    return this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<OrderDocument | null> {
    return this.orderModel.findByIdAndDelete(id).exec();
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.orderModel.aggregate(pipeline).exec();
  }
}

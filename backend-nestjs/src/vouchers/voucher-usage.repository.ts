import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  VoucherUsage,
  VoucherUsageDocument,
} from './schemas/voucher-usage.schema';

@Injectable()
export class VoucherUsageRepository {
  constructor(
    @InjectModel(VoucherUsage.name)
    private readonly model: Model<VoucherUsageDocument>,
  ) {}

  async hasUsed(
    userId: string,
    voucherId: Types.ObjectId | string,
  ): Promise<boolean> {
    const n = await this.model
      .countDocuments({
        userId: new Types.ObjectId(userId),
        voucherId: new Types.ObjectId(String(voucherId)),
      })
      .exec();
    return n > 0;
  }

  async create(
    data: {
      userId: string;
      voucherId: Types.ObjectId | string;
      orderId: Types.ObjectId | string;
      voucherCode: string;
    },
    session?: ClientSession,
  ): Promise<VoucherUsageDocument> {
    const doc = new this.model({
      userId: new Types.ObjectId(data.userId),
      voucherId: new Types.ObjectId(String(data.voucherId)),
      orderId: new Types.ObjectId(String(data.orderId)),
      voucherCode: data.voucherCode.trim().toUpperCase(),
    });
    return doc.save(session ? { session } : {});
  }

  /** Lịch sử dùng voucher của user (mới nhất trước) */
  async findByUser(userId: string): Promise<VoucherUsageDocument[]> {
    return this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate({ path: 'orderId', select: 'orderCode' })
      .exec();
  }
}

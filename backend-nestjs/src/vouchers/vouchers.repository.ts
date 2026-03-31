import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Voucher, VoucherDocument } from './schemas/voucher.schema';

@Injectable()
export class VoucherRepository {
  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<VoucherDocument>,
  ) {}

  async findAll(
    match: any,
    skip: number,
    limit: number,
  ): Promise<VoucherDocument[]> {
    return this.voucherModel
      .find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async count(match: any): Promise<number> {
    return this.voucherModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<VoucherDocument | null> {
    return this.voucherModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<VoucherDocument | null> {
    const c = code.trim().toUpperCase();
    return this.voucherModel.findOne({ code: c, isActive: true }).exec();
  }

  async incrementUsedCount(id: string, session?: ClientSession): Promise<void> {
    await this.voucherModel.updateOne(
      { _id: id },
      { $inc: { usedCount: 1 } },
      session ? { session } : {},
    );
  }

  async create(data: Partial<Voucher>): Promise<VoucherDocument> {
    const newVoucher = new this.voucherModel(data);
    return newVoucher.save();
  }

  async update(
    id: string,
    updateData: Partial<Voucher>,
  ): Promise<VoucherDocument | null> {
    return this.voucherModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<VoucherDocument | null> {
    return this.voucherModel.findByIdAndDelete(id).exec();
  }

  async softDeactivate(id: string): Promise<VoucherDocument | null> {
    return this.voucherModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }
}

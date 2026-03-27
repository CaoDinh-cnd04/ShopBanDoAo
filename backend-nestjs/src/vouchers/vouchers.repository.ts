import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    return this.voucherModel.find(match).skip(skip).limit(limit).exec();
  }

  async count(match: any): Promise<number> {
    return this.voucherModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<VoucherDocument | null> {
    return this.voucherModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<VoucherDocument | null> {
    return this.voucherModel.findOne({ code, isActive: true }).exec();
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
}

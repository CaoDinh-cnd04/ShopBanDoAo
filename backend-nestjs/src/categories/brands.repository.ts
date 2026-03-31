import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  async findAll(match: any = {}): Promise<BrandDocument[]> {
    return this.brandModel.find(match).sort({ brandName: 1 }).exec();
  }

  async findById(id: string): Promise<BrandDocument | null> {
    return this.brandModel.findById(id).exec();
  }

  async create(data: Partial<Brand>): Promise<BrandDocument> {
    return new this.brandModel(data).save();
  }

  async update(
    id: string,
    data: Partial<Brand>,
  ): Promise<BrandDocument | null> {
    return this.brandModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<BrandDocument | null> {
    return this.brandModel.findByIdAndDelete(id).exec();
  }
}

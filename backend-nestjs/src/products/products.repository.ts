import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductRepository {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async findAll(match: any, skip: number, limit: number): Promise<ProductDocument[]> {
    return this.productModel.find(match).skip(skip).limit(limit).exec();
  }

  async count(match: any): Promise<number> {
    return this.productModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).exec();
  }

  async create(data: Partial<Product>): Promise<ProductDocument> {
    const newProduct = new this.productModel(data);
    return newProduct.save();
  }

  async update(id: string, updateData: Partial<Product>): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async softDelete(id: string): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  }
}

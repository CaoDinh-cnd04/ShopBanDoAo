import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(
    match: any,
    skip: number,
    limit: number,
    sort?: Record<string, 1 | -1>,
  ): Promise<ProductDocument[]> {
    return this.productModel
      .find(match)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'categoryName categorySlug')
      .sort(sort && Object.keys(sort).length ? sort : { createdAt: -1 })
      .exec();
  }

  async count(match: any): Promise<number> {
    return this.productModel.countDocuments(match).exec();
  }

  /** Distinct brand từ sản phẩm (admin filter / dropdown) */
  async distinctBrands(): Promise<string[]> {
    const raw = await this.productModel
      .distinct('brand', {
        isActive: true,
        brand: { $exists: true, $nin: ['', null] },
      })
      .exec();
    return raw.filter(
      (b): b is string => typeof b === 'string' && b.trim().length > 0,
    );
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel
      .findById(id)
      .populate('categoryId', 'categoryName categorySlug')
      .exec();
  }

  async create(data: Partial<Product>): Promise<ProductDocument> {
    const newProduct = new this.productModel(data);
    return newProduct.save();
  }

  async update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }
}

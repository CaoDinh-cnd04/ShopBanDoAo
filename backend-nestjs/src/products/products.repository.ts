import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  /** Lấy SP đang bán theo thứ tự _id (giữ thứ tự xếp hạng bán chạy) */
  async findActiveByIdsPreserveOrder(
    ids: Types.ObjectId[],
  ): Promise<ProductDocument[]> {
    if (!ids.length) return [];
    const list = await this.productModel
      .find({
        _id: { $in: ids },
        isActive: true,
      })
      .populate('categoryId', 'categoryName categorySlug')
      .exec();
    const map = new Map(list.map((p) => [String(p._id), p]));
    return ids
      .map((id) => map.get(String(id)))
      .filter(Boolean) as ProductDocument[];
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

  /**
   * Trừ tồn kho theo biến thể (hoặc tồn gốc khi không có variants).
   * Atomic: chỉ thành công khi đủ stock.
   */
  async decrementStockForLine(
    productId: string,
    variantId: string | undefined | null,
    quantity: number,
  ): Promise<boolean> {
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) return false;
    if (!Types.ObjectId.isValid(productId)) return false;
    const pid = new Types.ObjectId(productId);

    const doc = await this.productModel
      .findById(pid)
      .select('variants stockQuantity')
      .lean()
      .exec();
    if (!doc) return false;
    const variants = Array.isArray((doc as { variants?: unknown }).variants)
      ? (doc as { variants: { _id?: Types.ObjectId; stockQuantity?: number }[] })
          .variants
      : [];
    const hasVariants = variants.length > 0;

    if (hasVariants) {
      if (!variantId || !Types.ObjectId.isValid(String(variantId))) {
        return false;
      }
      const vid = new Types.ObjectId(String(variantId));
      const res = await this.productModel.updateOne(
        {
          _id: pid,
          variants: {
            $elemMatch: {
              _id: vid,
              stockQuantity: { $gte: qty },
            },
          },
        },
        { $inc: { 'variants.$.stockQuantity': -qty } },
      );
      return res.modifiedCount === 1;
    }

    const res = await this.productModel.updateOne(
      { _id: pid, stockQuantity: { $gte: qty } },
      { $inc: { stockQuantity: -qty } },
    );
    return res.modifiedCount === 1;
  }

  /** Hoàn tồn kho khi hủy đơn (đối xứng với decrementStockForLine). */
  async incrementStockForLine(
    productId: string,
    variantId: string | undefined | null,
    quantity: number,
  ): Promise<void> {
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) return;
    if (!Types.ObjectId.isValid(productId)) return;
    const pid = new Types.ObjectId(productId);

    if (variantId && Types.ObjectId.isValid(String(variantId))) {
      const vid = new Types.ObjectId(String(variantId));
      await this.productModel.updateOne(
        { _id: pid },
        { $inc: { 'variants.$[v].stockQuantity': qty } },
        { arrayFilters: [{ 'v._id': vid }] },
      );
      return;
    }
    await this.productModel.updateOne(
      { _id: pid },
      { $inc: { stockQuantity: qty } },
    );
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistRepository {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
  ) {}

  /** `images` (mảng imageUrl) — không dùng `image` vì Product schema không có field đó */
  private readonly productPopulateSelect =
    'productName defaultPrice images';

  async findAllByUser(userId: string): Promise<WishlistDocument[]> {
    return this.wishlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('productId', this.productPopulateSelect)
      .exec();
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<WishlistDocument | null> {
    return this.wishlistModel
      .findOne({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(productId),
      })
      .exec();
  }

  async create(userId: string, productId: string): Promise<WishlistDocument> {
    const newWishlist = new this.wishlistModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    const saved = await newWishlist.save();
    await saved.populate('productId', this.productPopulateSelect);
    return saved;
  }

  async delete(id: string): Promise<WishlistDocument | null> {
    return this.wishlistModel.findByIdAndDelete(id).exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistRepository {
  constructor(@InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>) {}

  async findAllByUser(userId: string): Promise<WishlistDocument[]> {
    return this.wishlistModel.find({ userId: new Types.ObjectId(userId) })
      .populate('productId', 'productName defaultPrice image')
      .exec();
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<WishlistDocument | null> {
    return this.wishlistModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    }).exec();
  }

  async create(userId: string, productId: string): Promise<WishlistDocument> {
    const newWishlist = new this.wishlistModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    return newWishlist.save();
  }

  async delete(id: string): Promise<WishlistDocument | null> {
    return this.wishlistModel.findByIdAndDelete(id).exec();
  }
}

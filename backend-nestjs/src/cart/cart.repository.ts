import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';

@Injectable()
export class CartRepository {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  async findByUserId(userId: string): Promise<CartDocument | null> {
    return this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.productId', 'productName defaultPrice image')
      .exec();
  }

  async create(userId: string): Promise<CartDocument> {
    const newCart = new this.cartModel({
      userId: new Types.ObjectId(userId),
      items: [],
    });
    return newCart.save();
  }

  async save(cart: CartDocument): Promise<CartDocument> {
    return cart.save();
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel
      .findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { items: [] })
      .exec();
  }
}

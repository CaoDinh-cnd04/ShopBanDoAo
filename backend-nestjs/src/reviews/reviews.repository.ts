import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async findAll(
    match: any,
    skip: number,
    limit: number,
  ): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .populate('productId', 'productName')
      .populate('courtId', 'courtName address')
      .exec();
  }

  async count(match: any): Promise<number> {
    return this.reviewModel.countDocuments(match).exec();
  }

  async create(data: Partial<Review>): Promise<ReviewDocument> {
    const newReview = new this.reviewModel(data);
    return newReview.save();
  }

  async findById(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findById(id).exec();
  }

  async update(
    id: string,
    updateData: Partial<Review>,
  ): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findByIdAndDelete(id).exec();
  }

  async findByUserAndOrder(
    userId: string,
    orderId: string,
  ): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        userId: new Types.ObjectId(userId),
        orderId: new Types.ObjectId(orderId),
      })
      .exec();
  }

  async findOneByUserProductOrder(
    userId: string,
    productId: string,
    orderId: string,
  ): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(productId),
        orderId: new Types.ObjectId(orderId),
      })
      .exec();
  }

  /** Một user — một đánh giá / sản phẩm (không gắn đơn hoặc đã gắn đơn khác) */
  async findOneByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(productId),
        $or: [{ reviewType: 'product' }, { reviewType: { $exists: false } }],
      })
      .exec();
  }

  async findOneByUserSite(userId: string): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        reviewType: 'site',
      })
      .exec();
  }

  async findOneByUserAndBooking(
    userId: string,
    bookingId: string,
  ): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        bookingId: new Types.ObjectId(bookingId),
        reviewType: 'court',
      })
      .exec();
  }
}

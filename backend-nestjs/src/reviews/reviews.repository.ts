import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName')
      .populate('productId', 'productName')
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
}

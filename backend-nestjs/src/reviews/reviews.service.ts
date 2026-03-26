import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewRepository } from './reviews.repository';
import { CreateReviewDto, UpdateReviewDto, QueryReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private reviewRepository: ReviewRepository) {}

  async createReview(userId: string, createDto: CreateReviewDto) {
    const payload = {
      ...createDto,
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(createDto.productId),
    };
    const review = await this.reviewRepository.create(payload);
    return { message: 'Đánh giá sản phẩm thành công', review };
  }

  async getAllReviews(query: QueryReviewDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.productId) match.productId = new Types.ObjectId(query.productId);
    if (query.isVisible !== undefined) match.isVisible = query.isVisible === 'true';

    const [reviews, total] = await Promise.all([
      this.reviewRepository.findAll(match, skip, limit),
      this.reviewRepository.count(match),
    ]);

    return {
      reviews,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    };
  }

  async updateReviewVisibility(id: string, updateDto: UpdateReviewDto) {
    const review = await this.reviewRepository.update(id, updateDto);
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    return { message: 'Cập nhật trạng thái hiển thị đánh giá thành công', review };
  }

  async deleteReview(id: string, userId?: string, role?: string) {
    const reviewSnapshot = await this.reviewRepository.findById(id);
    if (!reviewSnapshot) throw new NotFoundException('Không tìm thấy đánh giá');

    // Nếu không phải Admin thì chỉ được xoá đánh giá của chính mình
    if (role !== 'Admin' && reviewSnapshot.userId._id?.toString() !== userId && reviewSnapshot.userId.toString() !== userId) {
      throw new NotFoundException('Bạn không có quyền xoá đánh giá này');
    }

    await this.reviewRepository.delete(id);
    return { message: 'Xóa đánh giá thành công' };
  }
}

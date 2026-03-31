import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewRepository } from './reviews.repository';
import {
  CreateReviewDto,
  UpdateReviewDto,
  QueryReviewDto,
} from './dto/review.dto';

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

  /** Đánh giá theo sản phẩm — dùng cho PDP (chỉ hiển thị isVisible) */
  async getReviewsByProduct(productId: string) {
    const { reviews } = await this.getAllReviews({
      productId,
      page: '1',
      limit: '200',
      isVisible: 'true',
    } as QueryReviewDto);
    return reviews;
  }

  async getAllReviews(query: QueryReviewDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const type = (query.type || 'all').toLowerCase();
    if (type === 'court') {
      return {
        reviews: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          totalReviews: 0,
          limit,
        },
      };
    }

    const match: any = {};
    if (query.productId) match.productId = new Types.ObjectId(query.productId);

    const vis =
      query.isVisible !== undefined && query.isVisible !== ''
        ? query.isVisible
        : query.isApproved !== undefined && query.isApproved !== ''
          ? query.isApproved
          : undefined;
    if (vis !== undefined) match.isVisible = vis === 'true';

    if (query.rating !== undefined && query.rating !== '') {
      const r = parseInt(query.rating, 10);
      if (!Number.isNaN(r) && r >= 1 && r <= 5) match.rating = r;
    }

    const [reviews, total] = await Promise.all([
      this.reviewRepository.findAll(match, skip, limit),
      this.reviewRepository.count(match),
    ]);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        totalItems: total,
        totalReviews: total,
        limit,
      },
    };
  }

  async updateReviewVisibility(id: string, updateDto: UpdateReviewDto) {
    const review = await this.reviewRepository.update(id, updateDto);
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    return {
      message: 'Cập nhật trạng thái hiển thị đánh giá thành công',
      review,
    };
  }

  async deleteReview(id: string, userId?: string, role?: string) {
    const reviewSnapshot = await this.reviewRepository.findById(id);
    if (!reviewSnapshot) throw new NotFoundException('Không tìm thấy đánh giá');

    if (
      role !== 'Admin' &&
      reviewSnapshot.userId._id?.toString() !== userId &&
      reviewSnapshot.userId.toString() !== userId
    ) {
      throw new NotFoundException('Bạn không có quyền xoá đánh giá này');
    }

    await this.reviewRepository.delete(id);
    return { message: 'Xóa đánh giá thành công' };
  }

  async getReviewStats() {
    const [totalProductReviews, visibleReviews, hiddenReviews] =
      await Promise.all([
        this.reviewRepository.count({}),
        this.reviewRepository.count({ isVisible: true }),
        this.reviewRepository.count({ isVisible: false }),
      ]);
    return {
      totalProductReviews,
      visibleReviews,
      hiddenReviews,
      pendingTotal: hiddenReviews,
    };
  }
}

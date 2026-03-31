import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { ReviewRepository } from './reviews.repository';
import {
  CreateReviewDto,
  UpdateReviewDto,
  QueryReviewDto,
} from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private reviewRepository: ReviewRepository,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  /** Map productId (string) → { _id, rating } cho đơn đã giao */
  async findMapForOrder(
    userId: string,
    orderId: string,
  ): Promise<Record<string, { _id: string; rating: number }>> {
    const list = await this.reviewRepository.findByUserAndOrder(
      userId,
      orderId,
    );
    const map: Record<string, { _id: string; rating: number }> = {};
    for (const r of list) {
      const pid =
        typeof r.productId === 'object' && r.productId && '_id' in r.productId
          ? String((r.productId as { _id: Types.ObjectId })._id)
          : String(r.productId);
      map[pid] = { _id: String(r._id), rating: r.rating };
    }
    return map;
  }

  private isDeliveredOrderStatus(status: string): boolean {
    const s = (status || '').trim().toLowerCase();
    return (
      s === 'delivered' ||
      s === 'completed' ||
      s.includes('hoàn thành') ||
      s.includes('đã giao')
    );
  }

  async createReview(userId: string, createDto: CreateReviewDto) {
    const reviewType = (createDto.reviewType || 'product').toLowerCase();

    if (reviewType === 'site') {
      const dup = await this.reviewRepository.findOneByUserSite(userId);
      if (dup) {
        throw new BadRequestException(
          'Bạn đã gửi đánh giá trang web. Mỗi tài khoản chỉ được gửi một lần.',
        );
      }
      const review = await this.reviewRepository.create({
        userId: new Types.ObjectId(userId),
        reviewType: 'site',
        rating: createDto.rating,
        comment: createDto.comment?.trim() || undefined,
        isVisible: false,
      } as any);
      return {
        message:
          'Đã gửi đánh giá. Nội dung sẽ hiển thị sau khi được quản trị viên duyệt.',
        review,
      };
    }

    if (reviewType === 'court') {
      if (!createDto.courtId || !createDto.bookingId) {
        throw new BadRequestException('Thiếu courtId hoặc bookingId');
      }
      const booking = await this.bookingModel
        .findById(createDto.bookingId)
        .exec();
      if (!booking) {
        throw new NotFoundException('Không tìm thấy lịch đặt sân');
      }
      const owner =
        booking.userId &&
        typeof booking.userId === 'object' &&
        '_id' in booking.userId
          ? String((booking.userId as { _id: Types.ObjectId })._id)
          : String(booking.userId);
      if (owner !== userId) {
        throw new ForbiddenException(
          'Bạn không thể đánh giá lịch đặt của người khác',
        );
      }
      const courtIdStr = String(booking.courtId);
      if (courtIdStr !== createDto.courtId) {
        throw new BadRequestException('Sân không khớp với lịch đặt');
      }
      if (booking.paymentStatus !== 'DepositPaid') {
        throw new BadRequestException(
          'Chỉ đánh giá sau khi đã thanh toán cọc VNPAY thành công',
        );
      }
      const dup = await this.reviewRepository.findOneByUserAndBooking(
        userId,
        createDto.bookingId,
      );
      if (dup) {
        throw new BadRequestException('Bạn đã đánh giá lịch đặt sân này rồi');
      }
      const review = await this.reviewRepository.create({
        userId: new Types.ObjectId(userId),
        reviewType: 'court',
        courtId: new Types.ObjectId(createDto.courtId),
        bookingId: new Types.ObjectId(createDto.bookingId),
        rating: createDto.rating,
        comment: createDto.comment?.trim() || undefined,
        isVisible: false,
      } as any);
      return {
        message:
          'Đã gửi đánh giá. Nội dung sẽ hiển thị sau khi được quản trị viên duyệt.',
        review,
      };
    }

    if (!createDto.productId) {
      throw new BadRequestException('Thiếu mã sản phẩm (productId)');
    }

    let orderIdObj: Types.ObjectId | undefined;

    if (createDto.orderId) {
      const order = await this.orderModel.findById(createDto.orderId).exec();
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }
      if (String(order.userId) !== userId) {
        throw new ForbiddenException(
          'Bạn không thể đánh giá đơn của người khác',
        );
      }
      if (!this.isDeliveredOrderStatus(order.orderStatus || '')) {
        throw new BadRequestException(
          'Chỉ có thể đánh giá khi đơn hàng đã được giao (Hoàn thành).',
        );
      }
      const pid = createDto.productId;
      const inOrder = (order.items || []).some((it: { productId: unknown }) => {
        const id = it.productId;
        const sid =
          id && typeof id === 'object' && id !== null && '_id' in id
            ? String((id as { _id: Types.ObjectId })._id)
            : String(id);
        return sid === pid;
      });
      if (!inOrder) {
        throw new BadRequestException('Sản phẩm không thuộc đơn hàng này');
      }
      const dup = await this.reviewRepository.findOneByUserProductOrder(
        userId,
        createDto.productId,
        createDto.orderId,
      );
      if (dup) {
        throw new BadRequestException(
          'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi',
        );
      }
      orderIdObj = new Types.ObjectId(createDto.orderId);
    } else {
      const dup = await this.reviewRepository.findOneByUserAndProduct(
        userId,
        createDto.productId,
      );
      if (dup) {
        throw new BadRequestException(
          'Bạn đã đánh giá sản phẩm này rồi. Mỗi tài khoản chỉ một đánh giá / sản phẩm.',
        );
      }
    }

    const payload: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      reviewType: 'product',
      productId: new Types.ObjectId(createDto.productId),
      rating: createDto.rating,
      comment: createDto.comment?.trim() || undefined,
      isVisible: false,
    };
    if (orderIdObj) payload.orderId = orderIdObj;

    const review = await this.reviewRepository.create(payload as any);
    return {
      message:
        'Đã gửi đánh giá. Nội dung sẽ hiển thị sau khi được quản trị viên duyệt.',
      review,
    };
  }

  /** PDP — chỉ đánh giá sản phẩm đã duyệt */
  async getReviewsByProduct(productId: string) {
    const { reviews } = await this.getAllReviews({
      productId,
      page: '1',
      limit: '200',
      isVisible: 'true',
      type: 'product',
    } as QueryReviewDto);
    return reviews;
  }

  /** Trang chủ / footer — đánh giá trang web đã duyệt */
  async getVisibleSiteReviews() {
    const { reviews } = await this.getAllReviews({
      page: '1',
      limit: '100',
      isVisible: 'true',
      type: 'site',
    } as QueryReviewDto);
    return reviews;
  }

  /** Trang chi tiết sân — đánh giá đã duyệt */
  async getReviewsByCourt(courtId: string) {
    const { reviews } = await this.getAllReviews({
      page: '1',
      limit: '100',
      isVisible: 'true',
      type: 'court',
      courtId,
    } as QueryReviewDto);
    return reviews;
  }

  async getAllReviews(query: QueryReviewDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const type = (query.type || 'all').toLowerCase();

    const match: Record<string, unknown> = {};

    if (type === 'site') {
      match.reviewType = 'site';
    } else if (type === 'product') {
      match.$or = [
        { reviewType: 'product' },
        { reviewType: { $exists: false } },
      ];
    } else if (type === 'court') {
      match.reviewType = 'court';
    }

    if (query.productId) {
      match.productId = new Types.ObjectId(query.productId);
    }

    if (query.courtId) {
      match.courtId = new Types.ObjectId(query.courtId);
    }

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

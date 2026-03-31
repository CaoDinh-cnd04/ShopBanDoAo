import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  QueryReviewDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** Đánh giá trang web đã duyệt — công khai */
  @Get('site')
  async getSiteReviews() {
    return this.reviewsService.getVisibleSiteReviews();
  }

  /** Chi tiết sân — đánh giá đã duyệt */
  @Get('courts/:courtId')
  async getReviewsByCourt(@Param('courtId') courtId: string) {
    return this.reviewsService.getReviewsByCourt(courtId);
  }

  /** PDP: GET /api/reviews/products/:productId */
  @Get('products/:productId')
  async getReviewsByProduct(@Param('productId') productId: string) {
    return this.reviewsService.getReviewsByProduct(productId);
  }

  /** Admin: danh sách + lọc — GET /api/reviews/admin (tránh route @Get() rỗng trên controller khác) */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getAllReviewsForAdmin(@Query() queryDto: QueryReviewDto) {
    return this.reviewsService.getAllReviews(queryDto);
  }

  /** Frontend gửi POST /api/reviews/products (cùng body CreateReviewDto) */
  @Post('products')
  @UseGuards(JwtAuthGuard)
  async createReviewViaProductsPath(
    @Request() req: any,
    @Body() createDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(req.user.userId, createDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(@Request() req: any, @Body() createDto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.userId, createDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMyReview(@Request() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(id, req.user.userId, req.user.role);
  }

  // ADMIN ROUTES
  @Put(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateReviewVisibility(
    @Param('id') id: string,
    @Body() updateDto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReviewVisibility(id, updateDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteReviewByAdmin(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id, undefined, 'Admin');
  }
}

@Controller('api/admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('stats')
  async getReviewStats() {
    return this.reviewsService.getReviewStats();
  }

  /** Danh sách + lọc — alias cùng prefix /api/admin/reviews (gọi GET /api/admin/reviews/list) */
  @Get('list')
  async getAllReviewsAlias(@Query() queryDto: QueryReviewDto) {
    return this.reviewsService.getAllReviews(queryDto);
  }
}

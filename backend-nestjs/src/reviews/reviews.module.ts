import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';
import {
  ReviewsController,
  AdminReviewsController,
} from './reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
  ],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewRepository, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';
import {
  ReviewsController,
  AdminReviewsController,
} from './reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewRepository, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

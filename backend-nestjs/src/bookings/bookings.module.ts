import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { BookingRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
    PaymentsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingRepository, BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

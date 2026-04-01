import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Court, CourtSchema } from './schemas/court.schema';
import { CourtType, CourtTypeSchema } from './schemas/court-type.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { CourtRepository } from './courts.repository';
import { CourtTypeRepository } from './courts-type.repository';
import { CourtsService } from './courts.service';
import { CourtsController, AdminCourtsController } from './courts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: CourtType.name, schema: CourtTypeSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [CourtsController, AdminCourtsController],
  providers: [CourtRepository, CourtTypeRepository, CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}

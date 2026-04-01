import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { OrderEventsService } from './order-events.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
    NotificationsModule,
    MailModule,
  ],
  providers: [OrderEventsService],
  exports: [OrderEventsService],
})
export class OrderEventsModule {}

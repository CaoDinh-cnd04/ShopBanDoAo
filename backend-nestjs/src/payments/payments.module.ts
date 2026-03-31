import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { OrderEventsModule } from '../order-events/order-events.module';
import { VnpayReturnHandler } from './vnpay-return.handler';
import {
  VnpayController,
  VnpayReturnAliasController,
} from './vnpay.controller';
import { VnpayService } from './vnpay.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    OrderEventsModule,
  ],
  controllers: [VnpayController, VnpayReturnAliasController],
  providers: [VnpayService, VnpayReturnHandler],
  exports: [VnpayService],
})
export class PaymentsModule {}

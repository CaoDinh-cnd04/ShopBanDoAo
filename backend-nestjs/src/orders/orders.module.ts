import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OrderRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderSchedulerService } from './order-scheduler.service';
import { PaymentsModule } from '../payments/payments.module';
import { OrderEventsModule } from '../order-events/order-events.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ProductsModule,
    PaymentsModule,
    OrderEventsModule,
    ReviewsModule,
    VouchersModule,
  ],
  controllers: [OrdersController],
  providers: [OrderRepository, OrdersService, OrderSchedulerService],
  exports: [OrdersService],
})
export class OrdersModule {}

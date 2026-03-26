import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  controllers: [OrdersController],
  providers: [OrderRepository, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

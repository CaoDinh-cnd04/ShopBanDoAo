import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ default: 'Pending' }) // Pending, Paid, Failed
  paymentStatus: string;

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({ default: 'Pending' }) // Pending, Processing, Shipped, Delivered, Cancelled
  orderStatus: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  /** product | site | court */
  @Prop({ default: 'product' })
  reviewType: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Chỉ khi reviewType = product */
  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  productId?: Types.ObjectId;

  /** Gắn đơn hàng (đánh giá sản phẩm theo đơn) */
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  /** Đánh giá sân — sau khi đặt sân & cọc VNPAY */
  @Prop({ type: Types.ObjectId, ref: 'Court', required: false })
  courtId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: false })
  bookingId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;

  /** Chỉ hiển thị công khai sau khi admin duyệt */
  @Prop({ default: false })
  isVisible: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

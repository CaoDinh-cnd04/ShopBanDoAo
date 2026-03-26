import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Court', required: true }) // Giả định liên kết bảng Sân (Court)
  courtId: Types.ObjectId;

  @Prop({ required: true })
  bookingDate: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: 'Pending' }) // Pending, Confirmed, Cancelled, Completed
  bookingStatus: string;

  @Prop({ default: 'Unpaid' }) // Unpaid, Paid, Refunded
  paymentStatus: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

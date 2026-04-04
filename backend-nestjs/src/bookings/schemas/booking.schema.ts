import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  courtId: Types.ObjectId;

  /** Mã hiển thị — duy nhất */
  @Prop({ unique: true, sparse: true, trim: true })
  bookingCode?: string;

  @Prop({ required: true })
  bookingDate: Date;

  /** Các khung giờ đã chọn (mỗi khung 1 giờ hoặc theo bước slot) */
  @Prop({
    type: [{ startTime: { type: String }, endTime: { type: String } }],
    default: [],
  })
  slots: { startTime: string; endTime: string }[];

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  /** Tổng tiền thuê sân (toàn bộ ca) */
  @Prop({ required: true, min: 0 })
  totalAmount: number;

  /** Số tiền khách cọc qua VNPAY (bắt buộc để giữ chỗ) */
  @Prop({ required: true, min: 0 })
  depositAmount: number;

  /** Phần còn lại thanh toán tại sân (không COD online) */
  @Prop({ required: true, min: 0 })
  remainingAmount: number;

  /** Chỉ VNPAY cho luồng đặt sân mới */
  @Prop({ default: 'VNPAY' })
  paymentMethod: string;

  @Prop({ default: 'Pending' })
  bookingStatus: string;

  @Prop({ default: 'Unpaid' })
  paymentStatus: string;

  @Prop()
  vnpTransactionNo?: string;

  @Prop()
  vnpPayDate?: string;

  @Prop()
  vnpBankCode?: string;

  /** Thời điểm kết thúc ca cuối (VN) — dùng tự động Completed & hoàn thành sớm */
  @Prop({ type: Date })
  slotEndAt?: Date;

  @Prop()
  earlyCompleteReason?: string;

  @Prop({ type: Date })
  completedAt?: Date;

  /** 'auto' | 'admin_early' */
  @Prop()
  completionSource?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ bookingStatus: 1 });
BookingSchema.index({ slotEndAt: 1, bookingStatus: 1 });

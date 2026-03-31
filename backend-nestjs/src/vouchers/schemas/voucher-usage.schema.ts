import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoucherUsageDocument = VoucherUsage & Document;

/** Mỗi user chỉ được dùng mỗi voucher một lần (thanh toán đơn hàng). */
@Schema({ timestamps: true })
export class VoucherUsage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Voucher', required: true })
  voucherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, uppercase: true })
  voucherCode: string;
}

export const VoucherUsageSchema = SchemaFactory.createForClass(VoucherUsage);
VoucherUsageSchema.index({ userId: 1, voucherId: 1 }, { unique: true });

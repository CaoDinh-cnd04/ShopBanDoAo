import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoucherDocument = Voucher & Document;

@Schema({ timestamps: true })
export class Voucher {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ default: '' })
  voucherName: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  discountType: string; // 'percent', 'fixed'

  @Prop({ required: true, min: 0 })
  discountValue: number;

  @Prop({ default: null })
  minOrderValue: number;

  @Prop({ default: null })
  maxDiscountAmount: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, min: 0 })
  usageLimit: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);

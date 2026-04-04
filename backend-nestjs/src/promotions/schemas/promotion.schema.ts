import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PromotionDocument = Promotion & Document;

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  description: string;

  /** Phần trăm giảm giá (0–100) */
  @Prop({ required: true, min: 0, max: 100 })
  discountPercent: number;

  /** 'all' = tất cả sản phẩm, 'category' = theo danh mục */
  @Prop({ enum: ['all', 'category'], default: 'category' })
  targetType: string;

  /** Áp dụng cho các danh mục này (khi targetType = 'category') */
  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  targetCategoryIds: Types.ObjectId[];

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  /** Bật/tắt thủ công — kết hợp với startDate/endDate */
  @Prop({ default: true })
  isActive: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

PromotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ targetCategoryIds: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourtDocument = Court & Document;

@Schema({ timestamps: true })
export class Court {
  @Prop({ required: true, trim: true })
  courtName: string;

  /** Mã sân (unique, bất biến sau tạo) */
  @Prop({ unique: true, sparse: true, trim: true })
  courtCode?: string;

  /** Loại sân (string label — khớp CourtType.typeName) */
  @Prop({ required: true, trim: true })
  courtType: string;

  /** ID của CourtType (tham chiếu lỏng, không population bắt buộc) */
  @Prop()
  courtTypeId?: string;

  @Prop({ required: true, default: 0, min: 0 })
  pricePerHour: number;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop()
  description?: string;

  @Prop()
  facilities?: string;

  @Prop({ min: 0 })
  capacity?: number;

  @Prop({ default: '06:00' })
  openTime?: string;

  @Prop({ default: '22:00' })
  closeTime?: string;

  /** URL ảnh (từ /uploads/... hoặc external URL) */
  @Prop()
  imageUrl?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CourtSchema = SchemaFactory.createForClass(Court);

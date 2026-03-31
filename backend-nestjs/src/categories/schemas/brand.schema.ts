import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, trim: true })
  brandName: string;

  @Prop({ required: true, unique: true, trim: true })
  brandSlug: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

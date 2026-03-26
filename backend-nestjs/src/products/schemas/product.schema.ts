import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, unique: true })
  productSlug: string;

  @Prop({ required: true, min: 0 })
  defaultPrice: number;

  @Prop()
  shortDescription: string;

  @Prop()
  longDescription: string;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ unique: true, sparse: true })
  sku: string;

  @Prop()
  brand: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  categoryName: string;

  @Prop({ required: true, unique: true })
  categorySlug: string;

  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

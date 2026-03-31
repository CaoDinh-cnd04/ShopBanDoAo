import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ _id: true })
export class SubCategory {
  @Prop({ required: true, trim: true })
  subCategoryName: string;

  @Prop({ required: true, trim: true })
  subCategorySlug: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  categoryName: string;

  @Prop({ required: true, unique: true, trim: true })
  categorySlug: string;

  @Prop()
  description?: string;

  /** URL ảnh đại diện danh mục */
  @Prop()
  imageUrl?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  /**
   * Gợi ý cấu hình biến thể khi tạo sản phẩm (size+màu, cỡ giày+màu, …).
   * apparel | footwear | accessory | equipment | generic
   */
  @Prop({
    type: String,
    enum: ['apparel', 'footwear', 'accessory', 'equipment', 'generic'],
    default: 'generic',
  })
  variantProfile: string;

  @Prop({ type: [SubCategorySchema], default: [] })
  subCategories: SubCategory[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

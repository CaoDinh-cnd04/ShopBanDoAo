import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  imageUrl: string;

  /** Gắn ảnh với màu biến thể (khớp text màu trên PDP) — tuỳ chọn */
  @Prop({ trim: true })
  color?: string;
}
const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

/** Biến thể: size / màu / thuộc tính động — giá & tồn kho theo từng biến thể */
@Schema()
export class ProductVariant {
  @Prop()
  sku?: string;

  /** Thuộc tính động (size, color, …) — ưu tiên khi hiển thị */
  @Prop({ type: Object, default: {} })
  attributes?: Record<string, string>;

  @Prop()
  size?: string;

  @Prop()
  color?: string;

  /** Mã hex hiển thị swatch (vd: #2563EB) */
  @Prop()
  colorHex?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  stockQuantity: number;
}
const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, unique: true })
  productSlug: string;

  @Prop({ required: true, min: 0 })
  defaultPrice: number;

  /** Giá niêm yết (gạch ngang) — tuỳ chọn */
  @Prop({ min: 0 })
  originalPrice?: number;

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

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  /** Tồn kho khi không dùng biến thể (variants rỗng) */
  @Prop({ default: 0, min: 0 })
  stockQuantity: number;

  @Prop()
  material?: string;

  @Prop()
  origin?: string;

  @Prop()
  weight?: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ categoryId: 1, isActive: 1 });
ProductSchema.index({ brand: 1, isActive: 1 });
ProductSchema.index({ productName: 'text', shortDescription: 'text' });

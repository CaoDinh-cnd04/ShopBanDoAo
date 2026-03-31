import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
  IsArray,
  ValidateNested,
  Min,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class ProductVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  /** Thuộc tính động (vd: { size: 'M', color: 'Đỏ' }) */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;
}

export class CreateProductDto {
  @IsString() @IsNotEmpty() productName: string;
  @IsString() @IsNotEmpty() productSlug: string;
  @IsNumber() @IsNotEmpty() defaultPrice: number;
  @IsString() @IsOptional() shortDescription?: string;
  @IsString() @IsOptional() longDescription?: string;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsString() @IsOptional() sku?: string;
  @IsString() @IsOptional() brand?: string;
  @IsMongoId() @IsNotEmpty() categoryId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() productName?: string;
  @IsOptional() @IsString() productSlug?: string;
  @IsOptional() @IsNumber() defaultPrice?: number;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() longDescription?: string;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1')
      return true;
    if (value === false || value === 'false' || value === 0 || value === '0')
      return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsMongoId() categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

/** Express đôi khi parse ?brands=a&brands=b thành mảng — ép về CSV để @IsString() hợp lệ. */
function queryCsvTransform({ value }: { value: unknown }): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map(String).join(',');
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

export class QueryProductDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  /** Alias cho frontend (?category=) */
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value[0] : value))
  @IsMongoId()
  category?: string;
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value[0] : value))
  @IsMongoId()
  categoryId?: string;
  /** Nhiều danh mục: id1,id2,... (ưu tiên hơn category/categoryId khi có) */
  @IsOptional()
  @Transform(queryCsvTransform)
  @IsString()
  categories?: string;
  /** Lọc theo thương hiệu (khớp chính xác, không phân biệt hoa thường) */
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? String(value[0] ?? '') : value,
  )
  @IsString()
  brand?: string;
  /** Nhiều thương hiệu: name1,name2,... (ưu tiên hơn brand khi có) */
  @IsOptional()
  @Transform(queryCsvTransform)
  @IsString()
  brands?: string;
  /** Lọc theo defaultPrice (VND) */
  @IsOptional() @IsString() minPrice?: string;
  @IsOptional() @IsString() maxPrice?: string;
  @IsOptional() @IsString() isActive?: string;
  @IsOptional() @IsString() isFeatured?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: string;
  /** Frontend Products.jsx (?sort=) */
  @IsOptional() @IsString() sort?: string;
  /**
   * Admin: `true`/`1` = trả về cả SP ẩn (quản trị). Không gửi = giống cửa hàng (chỉ đang bán).
   * Tránh admin đăng nhập xem /products mà vẫn thấy SP đã ẩn như thể là lỗi hiển thị.
   */
  @IsOptional() @IsString() includeInactive?: string;
}

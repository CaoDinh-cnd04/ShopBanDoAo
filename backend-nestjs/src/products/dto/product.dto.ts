import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class CreateProductDto {
  @IsString() @IsNotEmpty() productName: string;
  @IsString() @IsNotEmpty() productSlug: string;
  @IsNumber() @IsNotEmpty() defaultPrice: number;
  @IsString() @IsOptional() shortDescription?: string;
  @IsString() @IsOptional() longDescription?: string;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsString() @IsOptional() sku?: string;
  @IsString() @IsOptional() brand?: string;
  @IsMongoId() @IsNotEmpty() categoryId: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() productName?: string;
  @IsOptional() @IsString() productSlug?: string;
  @IsOptional() @IsNumber() defaultPrice?: number;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() longDescription?: string;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsMongoId() categoryId?: string;
}

export class QueryProductDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsMongoId() categoryId?: string;
  @IsOptional() @IsString() isActive?: string;
  @IsOptional() @IsString() isFeatured?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: string;
}

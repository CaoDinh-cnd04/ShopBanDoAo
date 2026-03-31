import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';

const VARIANT_PROFILES = [
  'apparel',
  'footwear',
  'accessory',
  'equipment',
  'generic',
] as const;

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() categoryName: string;
  @IsString() @IsNotEmpty() categorySlug: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsNumber() @IsOptional() displayOrder?: number;
  @IsOptional() @IsIn(VARIANT_PROFILES) variantProfile?: (typeof VARIANT_PROFILES)[number];
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() categoryName?: string;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsIn(VARIANT_PROFILES) variantProfile?: (typeof VARIANT_PROFILES)[number];
}

export class CreateSubCategoryDto {
  @IsString() @IsNotEmpty() categoryId: string;
  @IsString() @IsNotEmpty() subCategoryName: string;
  @IsString() @IsNotEmpty() subCategorySlug: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() displayOrder?: number;
}

export class UpdateSubCategoryDto {
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() subCategoryName?: string;
  @IsString() @IsOptional() subCategorySlug?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() displayOrder?: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class CreateBrandDto {
  @IsString() @IsNotEmpty() brandName: string;
  @IsString() @IsNotEmpty() brandSlug: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() website?: string;
}

export class UpdateBrandDto {
  @IsString() @IsOptional() brandName?: string;
  @IsString() @IsOptional() brandSlug?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() website?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

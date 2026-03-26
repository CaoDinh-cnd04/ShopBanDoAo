import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() categoryName: string;
  @IsString() @IsNotEmpty() categorySlug: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() image?: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() categoryName?: string;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

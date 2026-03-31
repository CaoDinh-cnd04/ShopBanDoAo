import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsMongoId() @IsNotEmpty() productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
  @IsString() @IsOptional() comment?: string;
}

export class UpdateReviewDto {
  @IsOptional() @IsBoolean() isVisible?: boolean;
}

export class QueryReviewDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsMongoId() productId?: string;
  @IsOptional() @IsString() isVisible?: string;
  /** Đồng nghĩa isVisible (admin UI) */
  @IsOptional() @IsString() isApproved?: string;
  /** all | product | court — hiện chỉ có đánh giá sản phẩm; court trả về rỗng */
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() rating?: string;
}

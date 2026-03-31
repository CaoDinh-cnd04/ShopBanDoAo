import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  Min,
  Max,
  IsBoolean,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  /** product (mặc định) | site | court */
  @IsOptional()
  @IsIn(['product', 'site', 'court'])
  reviewType?: 'product' | 'site' | 'court';

  @ValidateIf((o: CreateReviewDto) => (o.reviewType || 'product') === 'product')
  @IsMongoId()
  @IsNotEmpty()
  productId?: string;

  /** Khi đánh giá từ đơn đã giao — server kiểm tra đơn thuộc user & trạng thái */
  @IsOptional() @IsMongoId() orderId?: string;

  @ValidateIf((o: CreateReviewDto) => o.reviewType === 'court')
  @IsMongoId()
  @IsNotEmpty()
  courtId?: string;

  @ValidateIf((o: CreateReviewDto) => o.reviewType === 'court')
  @IsMongoId()
  @IsNotEmpty()
  bookingId?: string;

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
  @IsOptional() @IsMongoId() courtId?: string;
  @IsOptional() @IsString() isVisible?: string;
  /** Đồng nghĩa isVisible (admin UI) */
  @IsOptional() @IsString() isApproved?: string;
  /** all | product | site | court */
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() rating?: string;
}

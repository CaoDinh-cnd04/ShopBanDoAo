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

export class CreateReviewDto {
  @IsMongoId() @IsNotEmpty() productId: string;
  @IsNumber() @Min(1) @Max(5) rating: number;
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
}

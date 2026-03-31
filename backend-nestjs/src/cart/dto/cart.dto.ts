import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsMongoId() @IsNotEmpty() productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsMongoId()
  variantId?: string;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsMongoId()
  variantId?: string;
}

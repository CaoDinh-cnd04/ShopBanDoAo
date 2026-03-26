import { IsNotEmpty, IsMongoId, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsMongoId() @IsNotEmpty() productId: string;
  @IsNumber() @Min(1) @IsNotEmpty() quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber() @Min(1) @IsNotEmpty() quantity: number;
}

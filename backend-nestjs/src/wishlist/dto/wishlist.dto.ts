import { IsNotEmpty, IsMongoId } from 'class-validator';

export class ToggleWishlistDto {
  @IsMongoId() @IsNotEmpty() productId: string;
}

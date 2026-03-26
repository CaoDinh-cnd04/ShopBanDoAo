import { IsString, IsNotEmpty, IsOptional, IsNumber, IsMongoId, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsMongoId() @IsNotEmpty() productId: string;
  @IsNumber() @IsNotEmpty() quantity: number;
  @IsNumber() @IsNotEmpty() price: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsString() @IsNotEmpty() paymentMethod: string;
  @IsString() @IsNotEmpty() shippingAddress: string;
  @IsNumber() @IsNotEmpty() totalAmount: number;
}

export class UpdateOrderStatusDto {
  @IsOptional() @IsString() orderStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
}

export class QueryOrderDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() orderStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
}

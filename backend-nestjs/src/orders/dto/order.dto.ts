import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { serializeShippingAddressInput } from '../shipping-address.util';

export class OrderItemDto {
  @Transform(({ value }) => (value != null ? String(value).trim() : value))
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? undefined : String(value).trim(),
  )
  @IsMongoId()
  variantId?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsString() @IsNotEmpty() paymentMethod: string;

  /** Chuỗi một dòng hoặc object địa chỉ từ checkout — lưu 6 phần cố định (không bỏ phần rỗng) */
  @Transform(({ value }) => serializeShippingAddressInput(value))
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  shippingAddress: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional() @IsString() shippingMethod?: string;

  @IsOptional() @IsString() note?: string;

  /** Gửi kèm khi giỏ có voucher — server kiểm tra lại + ghi nhận 1 lần/user/mã */
  @IsOptional() @IsString() voucherCode?: string;
}

export class UpdateOrderStatusDto {
  @IsOptional() @IsString() orderStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  // Frontend có thể gửi statusName, ánh xạ → orderStatus trong service
  @IsOptional() @IsString() statusName?: string;
}

export class QueryOrderDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() orderStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  /** Alias frontend AdminOrders (?status=) */
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}

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
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsString() @IsNotEmpty() paymentMethod: string;

  /** Chuỗi một dòng hoặc object địa chỉ từ checkout — lưu dạng text */
  @Transform(({ value }) => {
    if (value == null || value === '') return '';
    if (typeof value === 'object' && value !== null) {
      const o = value as Record<string, unknown>;
      const toPart = (v: unknown) => {
        if (v == null) return '';
        if (
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'boolean'
        ) {
          return String(v).trim();
        }
        return '';
      };
      const parts = [
        toPart(o.fullName),
        toPart(o.phone),
        toPart(o.address),
        toPart(o.district),
        toPart(o.city),
        toPart(o.note),
      ].filter(Boolean);
      return parts.join(' | ');
    }
    return String(value).trim();
  })
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

import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

function trimStr(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  return '';
}

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @Transform(({ obj }) => trimStr(obj?.phone ?? obj?.phoneNumber))
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @Transform(({ obj }) => trimStr(obj?.address ?? obj?.street))
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

/** Cập nhật một phần — gửi field cần đổi */
export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @Transform(({ obj }) => {
    const v = obj?.phone ?? obj?.phoneNumber;
    if (v === undefined || v === null) return undefined;
    return trimStr(v);
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @Transform(({ obj }) => {
    const v = obj?.address ?? obj?.street;
    if (v === undefined || v === null) return undefined;
    return trimStr(v);
  })
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

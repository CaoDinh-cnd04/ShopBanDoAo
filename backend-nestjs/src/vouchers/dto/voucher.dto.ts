import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateVoucherDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsIn(['percent', 'fixed']) discountType: string;
  @IsNumber() @IsNotEmpty() discountValue: number;
  @IsNumber() @IsOptional() minOrderValue?: number;
  @IsNumber() @IsOptional() maxDiscountAmount?: number;
  @IsDateString() @IsNotEmpty() startDate: string;
  @IsDateString() @IsNotEmpty() endDate: string;
  @IsNumber() @IsNotEmpty() usageLimit: number;
}

export class UpdateVoucherDto {
  @IsOptional() @IsString() @IsIn(['percent', 'fixed']) discountType?: string;
  @IsOptional() @IsNumber() discountValue?: number;
  @IsOptional() @IsNumber() minOrderValue?: number;
  @IsOptional() @IsNumber() maxDiscountAmount?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsNumber() usageLimit?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class QueryVoucherDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() isActive?: string;
}

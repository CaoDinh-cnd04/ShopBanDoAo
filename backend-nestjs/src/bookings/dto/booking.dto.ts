import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookingSlotDto {
  @IsString() @IsNotEmpty()
  startTime: string;

  @IsString() @IsNotEmpty()
  endTime: string;
}

export class CreateBookingDto {
  @IsMongoId() @IsNotEmpty()
  courtId: string;

  @IsDateString({}, { message: 'bookingDate phải là định dạng ISO8601' })
  @IsNotEmpty()
  bookingDate: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Chọn ít nhất một khung giờ' })
  @ValidateNested({ each: true })
  @Type(() => BookingSlotDto)
  slots: BookingSlotDto[];
}

export class UpdateBookingStatusDto {
  @IsOptional() @IsString() bookingStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsString() statusName?: string;
}

export class CompleteBookingEarlyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Lý do hoàn thành sớm cần ít nhất 5 ký tự' })
  reason: string;
}

export class AvailableSlotsQueryDto {
  @IsMongoId() @IsNotEmpty()
  courtId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class QueryBookingDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() bookingStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsMongoId() courtId?: string;
  @IsOptional() @IsMongoId() userId?: string;
  /** Alias frontend AdminBookings */
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}

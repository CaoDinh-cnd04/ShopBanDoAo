import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId() @IsNotEmpty() courtId: string;
  @IsDateString({}, { message: 'bookingDate phải là định dạng ISO8601' })
  @IsNotEmpty()
  bookingDate: string;
  @IsString() @IsNotEmpty() startTime: string;
  @IsString() @IsNotEmpty() endTime: string;
  @IsNumber() @IsNotEmpty() totalAmount: number;
}

export class UpdateBookingStatusDto {
  @IsOptional() @IsString() bookingStatus?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsString() statusName?: string;
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

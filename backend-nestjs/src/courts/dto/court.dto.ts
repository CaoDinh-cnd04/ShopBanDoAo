import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateCourtDto {
  @IsString() @IsNotEmpty() courtName: string;
  @IsString() @IsNotEmpty() courtType: string;
  @IsNumber() @Min(0) @IsNotEmpty() pricePerHour: number;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() image?: string;
}

export class UpdateCourtDto {
  @IsString() @IsOptional() courtName?: string;
  @IsString() @IsOptional() courtType?: string;
  @IsNumber() @Min(0) @IsOptional() pricePerHour?: number;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() image?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class QueryCourtDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() courtType?: string;
  @IsOptional() @IsString() isActive?: string;
}

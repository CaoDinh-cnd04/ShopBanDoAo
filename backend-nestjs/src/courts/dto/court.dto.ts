import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateCourtDto {
  @IsString() @IsNotEmpty() courtName: string;
  @IsString() @IsNotEmpty() courtType: string;
  @IsString() @IsOptional() courtTypeId?: string;
  @IsString() @IsOptional() courtCode?: string;
  @IsNumber() @Min(0) @IsOptional() pricePerHour?: number;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() facilities?: string;
  @IsNumber() @Min(0) @IsOptional() capacity?: number;
  @IsString() @IsOptional() openTime?: string;
  @IsString() @IsOptional() closeTime?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class UpdateCourtDto {
  @IsString() @IsOptional() courtName?: string;
  @IsString() @IsOptional() courtType?: string;
  @IsString() @IsOptional() courtTypeId?: string;
  @IsNumber() @Min(0) @IsOptional() pricePerHour?: number;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() facilities?: string;
  @IsNumber() @Min(0) @IsOptional() capacity?: number;
  @IsString() @IsOptional() openTime?: string;
  @IsString() @IsOptional() closeTime?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class QueryCourtDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() courtType?: string;
  @IsOptional() @IsString() isActive?: string;
}

export class CreateCourtTypeDto {
  @IsString() @IsNotEmpty() typeName: string;
  @IsString() @IsOptional() description?: string;
}

export class UpdateCourtTypeDto {
  @IsString() @IsOptional() typeName?: string;
  @IsString() @IsOptional() description?: string;
}

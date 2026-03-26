import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() phoneNumber: string;
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() ward: string;
  @IsString() @IsNotEmpty() district: string;
  @IsString() @IsNotEmpty() city: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsString() @IsOptional() fullName?: string;
  @IsString() @IsOptional() phoneNumber?: string;
  @IsString() @IsOptional() street?: string;
  @IsString() @IsOptional() ward?: string;
  @IsString() @IsOptional() district?: string;
  @IsString() @IsOptional() city?: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
}

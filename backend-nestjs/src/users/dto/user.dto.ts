import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class QueryUserDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() isActive?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() role?: string;
}

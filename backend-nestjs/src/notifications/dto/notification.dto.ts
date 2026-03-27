import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId() @IsNotEmpty() userId: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() message: string;
  @IsString() @IsOptional() type?: string;
}

export class QueryNotificationDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() isRead?: string;
}

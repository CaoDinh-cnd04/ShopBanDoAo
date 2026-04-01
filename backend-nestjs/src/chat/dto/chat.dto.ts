import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body: string;
}

export class QueryChatMessagesDto {
  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

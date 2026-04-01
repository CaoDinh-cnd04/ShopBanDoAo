import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ChatService } from './chat.service';
import { QueryChatMessagesDto, SendChatMessageDto } from './dto/chat.dto';

@Controller('api/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('User')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async sendMessage(
    @Request() req: { user: { userId: string } },
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendFromUser(req.user.userId, dto);
  }

  @Get('messages')
  async getMessages(
    @Request() req: { user: { userId: string } },
    @Query() query: QueryChatMessagesDto,
  ) {
    return this.chatService.getMyMessages(req.user.userId, query);
  }
}

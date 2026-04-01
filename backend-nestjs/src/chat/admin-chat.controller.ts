import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ChatService } from './chat.service';
import { QueryChatMessagesDto, SendChatMessageDto } from './dto/chat.dto';

@Controller('api/admin/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations() {
    return this.chatService.listConversations();
  }

  @Get('users/:userId/messages')
  getThread(
    @Param('userId') userId: string,
    @Query() query: QueryChatMessagesDto,
  ) {
    return this.chatService.getThreadForAdmin(userId, query);
  }

  @Post('users/:userId/messages')
  sendToUser(@Param('userId') userId: string, @Body() dto: SendChatMessageDto) {
    return this.chatService.sendFromAdmin(userId, dto);
  }
}

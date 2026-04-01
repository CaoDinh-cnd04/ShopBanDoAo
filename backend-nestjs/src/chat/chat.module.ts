import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { AdminChatController } from './admin-chat.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [ChatController, AdminChatController],
  providers: [ChatRepository, ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

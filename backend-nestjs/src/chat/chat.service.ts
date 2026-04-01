import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ChatRepository } from './chat.repository';
import { ChatGateway, ChatMessageSocketPayload } from './chat.gateway';
import { SendChatMessageDto, QueryChatMessagesDto } from './dto/chat.dto';
import { UsersService } from '../users/users.service';
import { ChatMessageDocument } from './schemas/chat-message.schema';

function mapDocToPayload(
  doc: ChatMessageDocument | Record<string, unknown>,
): ChatMessageSocketPayload {
  const plain =
    typeof (doc as { toObject?: () => Record<string, unknown> }).toObject ===
    'function'
      ? (doc as ChatMessageDocument).toObject()
      : (doc as Record<string, unknown>);
  const id = String(plain._id);
  const userId = String(plain.userId);
  const created = (plain.createdAt ?? new Date()) as Date;
  return {
    id,
    userId,
    senderRole: plain.senderRole as 'user' | 'admin',
    body: String(plain.body),
    createdAt:
      created instanceof Date
        ? created.toISOString()
        : new Date(created as string).toISOString(),
  };
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly chatGateway: ChatGateway,
    private readonly usersService: UsersService,
  ) {}

  async sendFromUser(senderId: string, dto: SendChatMessageDto) {
    const user = await this.usersService.getUserById(senderId);
    if (user.role === 'Admin') {
      throw new ForbiddenException('Admin dùng kênh /api/admin/chat');
    }
    const doc = await this.chatRepository.create({
      userId: new Types.ObjectId(senderId),
      senderRole: 'user',
      body: dto.body.trim(),
    });
    const payload = mapDocToPayload(doc);
    this.chatGateway.emitNewMessage(payload);
    return payload;
  }

  async sendFromAdmin(targetUserId: string, dto: SendChatMessageDto) {
    const target = await this.usersService.getUserById(targetUserId);
    if (target.role === 'Admin') {
      throw new BadRequestException('Không gửi tin tới tài khoản Admin');
    }
    const doc = await this.chatRepository.create({
      userId: new Types.ObjectId(targetUserId),
      senderRole: 'admin',
      body: dto.body.trim(),
    });
    const payload = mapDocToPayload(doc);
    this.chatGateway.emitNewMessage(payload);
    return payload;
  }

  async getMyMessages(userId: string, query: QueryChatMessagesDto) {
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const before = query.before ? new Date(query.before) : undefined;
    if (before && Number.isNaN(before.getTime())) {
      throw new BadRequestException('Tham số before không hợp lệ');
    }
    const rows = await this.chatRepository.findByUserId(userId, before, limit);
    const chronological = [...rows].reverse();
    return {
      messages: chronological.map((r) => mapDocToPayload(r as any)),
    };
  }

  async getThreadForAdmin(targetUserId: string, query: QueryChatMessagesDto) {
    const target = await this.usersService.getUserById(targetUserId);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const before = query.before ? new Date(query.before) : undefined;
    if (before && Number.isNaN(before.getTime())) {
      throw new BadRequestException('Tham số before không hợp lệ');
    }
    const rows = await this.chatRepository.findByUserId(
      targetUserId,
      before,
      limit,
    );
    const chronological = [...rows].reverse();
    return {
      user: {
        id: String(target._id),
        fullName: target.fullName,
        email: target.email,
      },
      messages: chronological.map((r) => mapDocToPayload(r as any)),
    };
  }

  async listConversations() {
    const summaries =
      await this.chatRepository.aggregateConversationSummaries();
    const out: {
      userId: string;
      lastMessageAt: string;
      lastBody: string;
      lastSenderRole: 'user' | 'admin';
      user: { fullName: string; email: string } | null;
    }[] = [];
    for (const s of summaries) {
      const uid = String(s._id);
      let user: { fullName: string; email: string } | null = null;
      try {
        const u = await this.usersService.getUserById(uid);
        user = { fullName: u.fullName, email: u.email };
      } catch {
        user = null;
      }
      out.push({
        userId: uid,
        lastMessageAt:
          s.lastMessageAt instanceof Date
            ? s.lastMessageAt.toISOString()
            : new Date(s.lastMessageAt as any).toISOString(),
        lastBody: s.lastBody,
        lastSenderRole: s.lastSenderRole,
        user,
      });
    }
    return { conversations: out };
  }
}

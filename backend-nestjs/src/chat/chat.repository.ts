import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatMessage,
  ChatMessageDocument,
} from './schemas/chat-message.schema';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(ChatMessage.name)
    private readonly model: Model<ChatMessageDocument>,
  ) {}

  async create(data: {
    userId: Types.ObjectId;
    senderRole: 'user' | 'admin';
    body: string;
  }): Promise<ChatMessageDocument> {
    const doc = new this.model(data);
    return doc.save();
  }

  async findByUserId(
    userId: string,
    before?: Date,
    limit = 50,
  ): Promise<ChatMessageDocument[]> {
    const q: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
    if (before) q.createdAt = { $lt: before };
    const rows = await this.model
      .find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return rows as unknown as ChatMessageDocument[];
  }

  async aggregateConversationSummaries(): Promise<
    {
      _id: Types.ObjectId;
      lastMessageAt: Date;
      lastBody: string;
      lastSenderRole: 'user' | 'admin';
    }[]
  > {
    return this.model
      .aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$userId',
            lastMessageAt: { $first: '$createdAt' },
            lastBody: { $first: '$body' },
            lastSenderRole: { $first: '$senderRole' },
          },
        },
        { $sort: { lastMessageAt: -1 } },
      ])
      .exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async findAllByUser(userId: string, match: any, skip: number, limit: number): Promise<NotificationDocument[]> {
    return this.notificationModel.find({ ...match, userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByUser(userId: string, match: any): Promise<number> {
    return this.notificationModel.countDocuments({ ...match, userId: new Types.ObjectId(userId) }).exec();
  }

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    const newNotif = new this.notificationModel(data);
    return newNotif.save();
  }

  async markAsRead(id: string, userId: string): Promise<NotificationDocument | null> {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true }
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    ).exec();
  }
}

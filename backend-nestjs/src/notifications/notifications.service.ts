import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationRepository } from './notifications.repository';
import { CreateNotificationDto, QueryNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private notificationRepository: NotificationRepository) {}

  async createNotification(createDto: CreateNotificationDto) {
    const payload = {
      ...createDto,
      userId: new Types.ObjectId(createDto.userId)
    };
    const notification = await this.notificationRepository.create(payload);
    return { message: 'Đã gửi thông báo', notification };
  }

  async getMyNotifications(userId: string, query: QueryNotificationDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.isRead !== undefined) match.isRead = query.isRead === 'true';

    const [notifications, total] = await Promise.all([
      this.notificationRepository.findAllByUser(userId, match, skip, limit),
      this.notificationRepository.countByUser(userId, match),
    ]);

    return {
      notifications,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationRepository.markAsRead(id, userId);
    if (!notification) throw new NotFoundException('Không tìm thấy thông báo');
    return { message: 'Đã đánh dấu đọc', notification };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    return { message: 'Đã đánh dấu đọc tất cả' };
  }
}

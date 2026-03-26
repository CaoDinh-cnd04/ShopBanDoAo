import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])],
  controllers: [NotificationsController],
  providers: [NotificationRepository, NotificationsService],
  exports: [NotificationsService], // Export dùng chung để module khác push notif được
})
export class NotificationsModule {}

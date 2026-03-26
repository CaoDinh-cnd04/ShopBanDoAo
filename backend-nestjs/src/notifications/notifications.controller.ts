import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, QueryNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req: any, @Query() query: QueryNotificationDto) {
    return this.notificationsService.getMyNotifications(req.user.userId, query);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Put(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.userId, id);
  }

  // Admin chủ động push (tương lai có thể move vào queues)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async pushNotification(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createDto);
  }
}

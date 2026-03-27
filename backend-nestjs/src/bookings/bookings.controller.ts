import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  QueryBookingDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // USER ROUTES cho chức năng đặt sân
  @Post('bookings')
  async createMyBooking(
    @Request() req: any,
    @Body() createDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(req.user.userId, createDto);
  }

  @Get('bookings/my-bookings')
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.userId);
  }

  @Get('bookings/:id')
  async getBookingById(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingById(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Put('bookings/:id/cancel')
  async cancelMyBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBookingByUser(req.user.userId, id);
  }

  // ADMIN ROUTES quản trị
  @Get('admin/bookings/stats')
  @Roles('Admin')
  async getBookingStats() {
    return this.bookingsService.getBookingStats();
  }

  @Get('admin/bookings')
  @Roles('Admin')
  async getAllBookingsByAdmin(@Query() queryDto: QueryBookingDto) {
    return this.bookingsService.getAllBookings(queryDto);
  }

  @Get('admin/bookings/:id')
  @Roles('Admin')
  async getBookingByIdAdmin(@Param('id') id: string) {
    return this.bookingsService.getBookingById(id);
  }

  @Put('admin/bookings/:id/status')
  @Roles('Admin')
  async updateBookingStatusByAdmin(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(id, updateDto);
  }
}

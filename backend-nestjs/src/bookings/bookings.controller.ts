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
  AvailableSlotsQueryDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Khung giờ trống — công khai (đặt trước :id) */
  @Get('bookings/available-slots')
  async getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.bookingsService.getAvailableSlots(query.courtId, query.date);
  }

  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  async createMyBooking(
    @Request() req: any,
    @Body() createDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(req.user.userId, createDto, req);
  }

  @Get('bookings/my-bookings')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.userId);
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  async getBookingById(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingById(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Put('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelMyBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBookingByUser(req.user.userId, id);
  }

  @Get('admin/bookings/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getBookingStats() {
    return this.bookingsService.getBookingStats();
  }

  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getAllBookingsByAdmin(@Query() queryDto: QueryBookingDto) {
    return this.bookingsService.getAllBookings(queryDto);
  }

  @Get('admin/bookings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getBookingByIdAdmin(@Param('id') id: string) {
    return this.bookingsService.getBookingByIdForAdmin(id);
  }

  @Put('admin/bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateBookingStatusByAdmin(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(id, updateDto);
  }
}

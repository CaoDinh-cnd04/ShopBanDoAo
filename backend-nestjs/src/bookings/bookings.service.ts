import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BookingRepository } from './bookings.repository';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  QueryBookingDto,
} from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private bookingRepository: BookingRepository) {}

  async createBooking(userId: string, createDto: CreateBookingDto) {
    const payload = {
      ...createDto,
      bookingDate: new Date(createDto.bookingDate),
      userId: new Types.ObjectId(userId),
      courtId: new Types.ObjectId(createDto.courtId),
    };
    const booking = await this.bookingRepository.create(payload);
    return { message: 'Đặt sân thành công', booking };
  }

  async getMyBookings(userId: string) {
    const bookings = await this.bookingRepository.findAll(
      { userId: new Types.ObjectId(userId) },
      0,
      100,
    );
    return { bookings };
  }

  async getAllBookings(query: QueryBookingDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.bookingStatus) match.bookingStatus = query.bookingStatus;
    if (query.paymentStatus) match.paymentStatus = query.paymentStatus;
    if (query.courtId) match.courtId = query.courtId;
    if (query.userId) match.userId = query.userId;

    const [bookings, total] = await Promise.all([
      this.bookingRepository.findAll(match, skip, limit),
      this.bookingRepository.count(match),
    ]);

    return {
      bookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  async getBookingById(id: string, userId?: string, role?: string) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking)
      throw new NotFoundException('Không tìm thấy thông tin đặt sân');

    // Nếu là user thường, chỉ xem được đơn của mình
    if (
      role !== 'Admin' &&
      booking.userId._id?.toString() !== userId &&
      booking.userId.toString() !== userId
    ) {
      throw new NotFoundException('Không tìm thấy thông tin lịch đặt sân này');
    }

    return booking;
  }

  async updateBookingStatus(id: string, updateDto: UpdateBookingStatusDto) {
    const payload: any = { ...updateDto };
    if (updateDto.statusName && !updateDto.bookingStatus) {
      payload.bookingStatus = updateDto.statusName;
      delete payload.statusName;
    }
    const booking = await this.bookingRepository.update(id, payload);
    if (!booking) throw new NotFoundException('Không tìm thấy đơn đặt sân');
    return { message: 'Cập nhật trạng thái sân thành công', booking };
  }

  async cancelBookingByUser(userId: string, bookingId: string) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Không tìm thấy lịch đặt sân');

    const ownerId = booking.userId?._id?.toString() || booking.userId?.toString();
    if (ownerId !== userId) throw new ForbiddenException('Bạn không có quyền hủy lịch này');

    const status = (booking.bookingStatus || '').toLowerCase();
    if (!['pending', 'chờ xác nhận'].includes(status)) {
      throw new BadRequestException('Chỉ có thể hủy lịch đang chờ xác nhận');
    }

    const updated = await this.bookingRepository.update(bookingId, {
      bookingStatus: 'cancelled',
    });
    return { message: 'Hủy lịch đặt sân thành công', booking: updated };
  }

  async getBookingStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      revenueAgg,
      thisMonthAgg,
    ] = await Promise.all([
      this.bookingRepository.count({}),
      this.bookingRepository.count({
        bookingStatus: { $in: ['Pending', 'Chờ xác nhận'] },
      }),
      this.bookingRepository.count({
        bookingStatus: { $in: ['Confirmed', 'Đã xác nhận'] },
      }),
      this.bookingRepository.count({
        bookingStatus: { $in: ['Cancelled', 'Đã hủy'] },
      }),
      this.bookingRepository.aggregate([
        { $match: { paymentStatus: { $in: ['Paid', 'Đã thanh toán'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.bookingRepository.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      overview: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: revenueAgg[0]?.total ?? 0,
        thisMonthBookings: thisMonthAgg[0]?.count ?? 0,
      },
    };
  }
}

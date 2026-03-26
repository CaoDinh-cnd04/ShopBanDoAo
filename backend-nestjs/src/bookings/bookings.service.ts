import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BookingRepository } from './bookings.repository';
import { CreateBookingDto, UpdateBookingStatusDto, QueryBookingDto } from './dto/booking.dto';

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
    const bookings = await this.bookingRepository.findAll({ userId: new Types.ObjectId(userId) }, 0, 100);
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
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    };
  }

  async getBookingById(id: string, userId?: string, role?: string) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) throw new NotFoundException('Không tìm thấy thông tin đặt sân');
    
    // Nếu là user thường, chỉ xem được đơn của mình
    if (role !== 'Admin' && booking.userId._id?.toString() !== userId && booking.userId.toString() !== userId) {
      throw new NotFoundException('Không tìm thấy thông tin lịch đặt sân này');
    }
    
    return booking;
  }

  async updateBookingStatus(id: string, updateDto: UpdateBookingStatusDto) {
    const booking = await this.bookingRepository.update(id, updateDto);
    if (!booking) throw new NotFoundException('Không tìm thấy đơn đặt sân');
    return { message: 'Cập nhật trạng thái sân thành công', booking };
  }
}

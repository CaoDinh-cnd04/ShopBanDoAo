import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookingRepository } from './bookings.repository';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  QueryBookingDto,
} from './dto/booking.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class BookingsService {
  constructor(
    private bookingRepository: BookingRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private extractUser(b: Record<string, unknown>): {
    fullName?: string;
    email?: string;
    phone?: string;
  } {
    const u = b.userId as Record<string, unknown> | Types.ObjectId | undefined;
    if (u && typeof u === 'object' && 'email' in u) {
      return {
        fullName: u.fullName as string | undefined,
        email: u.email as string | undefined,
        phone: (u.phone as string | undefined) ?? undefined,
      };
    }
    return {};
  }

  private extractCourt(b: Record<string, unknown>): {
    courtName?: string;
    courtType?: string;
    location?: string;
    address?: string;
  } {
    const c = b.courtId as Record<string, unknown> | Types.ObjectId | undefined;
    if (c && typeof c === 'object' && 'courtName' in c) {
      return {
        courtName: c.courtName as string | undefined,
        courtType: c.courtType as string | undefined,
        location: c.location as string | undefined,
        address: c.address as string | undefined,
      };
    }
    return {};
  }

  /** Danh sách admin — field khớp AdminBookings.jsx */
  private mapBookingForAdminList(b: Record<string, unknown>) {
    const u = this.extractUser(b);
    const c = this.extractCourt(b);
    const oid = b._id as Types.ObjectId;
    const bd = b.bookingDate as Date | undefined;
    const ts = bd ? new Date(bd).getTime() : 0;
    return {
      _id: oid,
      bookingId: oid,
      bookingCode: ts ? `BK${ts}` : `BK${String(oid).slice(-12)}`,
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      customerPhone: u.phone ?? '',
      courtName: c.courtName ?? '—',
      courtType: c.courtType ?? '',
      bookingDate: bd,
      timeSlotCount: 1,
      timeRange: `${String(b.startTime ?? '')} — ${String(b.endTime ?? '')}`,
      totalAmount: b.totalAmount,
      statusName: b.bookingStatus,
      bookingStatus: b.bookingStatus,
    };
  }

  private mapBookingForAdminDetail(b: Record<string, unknown>) {
    const u = this.extractUser(b);
    const c = this.extractCourt(b);
    const oid = b._id as Types.ObjectId;
    const bd = b.bookingDate as Date | undefined;
    const ts = bd ? new Date(bd).getTime() : 0;
    const total = Number(b.totalAmount) || 0;
    return {
      _id: oid,
      bookingId: oid,
      bookingCode: ts ? `BK${ts}` : `BK${String(oid).slice(-12)}`,
      statusName: b.bookingStatus,
      bookingStatus: b.bookingStatus,
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      customerPhone: u.phone ?? '',
      courtName: c.courtName ?? '—',
      courtTypeName: c.courtType ?? '',
      location: c.location || c.address || '',
      note: '',
      bookingDate: bd,
      timeSlots: [
        {
          bookingDetailId: '1',
          slotName: 'Ca đặt',
          startTime: b.startTime,
          endTime: b.endTime,
          price: total,
        },
      ],
      totalAmount: total,
      payments:
        String(b.paymentStatus || '')
          .toLowerCase()
          .includes('paid') ||
        String(b.paymentStatus || '').includes('Đã thanh toán')
          ? [
              {
                paymentMethodName: 'Thanh toán',
                amount: total,
              },
            ]
          : [],
    };
  }

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
    const statusVal = (query.status || query.bookingStatus || '').trim();
    if (statusVal) match.bookingStatus = statusVal;
    if (query.paymentStatus?.trim()) match.paymentStatus = query.paymentStatus.trim();
    if (query.courtId) match.courtId = query.courtId;
    if (query.userId) match.userId = query.userId;

    const start = query.startDate?.trim();
    const end = query.endDate?.trim();
    if (start || end) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (start) {
        const d = new Date(start);
        if (!Number.isNaN(d.getTime())) range.$gte = d;
      }
      if (end) {
        const d = new Date(end);
        if (!Number.isNaN(d.getTime())) {
          const endDay = new Date(d);
          endDay.setHours(23, 59, 59, 999);
          range.$lte = endDay;
        }
      }
      if (Object.keys(range).length) match.bookingDate = range;
    }

    const q = query.search?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      const or: Record<string, unknown>[] = [
        { bookingStatus: rx },
        { paymentStatus: rx },
        { startTime: rx },
        { endTime: rx },
      ];
      if (Types.ObjectId.isValid(q) && String(new Types.ObjectId(q)) === q) {
        or.push({ _id: new Types.ObjectId(q) });
      }
      const userIds = await this.userModel.distinct('_id', {
        $or: [{ email: rx }, { fullName: rx }, { phone: rx }],
      });
      if (userIds.length) {
        or.push({ userId: { $in: userIds } });
      }
      match.$or = or;
    }

    const [bookings, total] = await Promise.all([
      this.bookingRepository.findAll(match, skip, limit),
      this.bookingRepository.count(match),
    ]);

    return {
      bookings: bookings.map((b) =>
        this.mapBookingForAdminList(b.toObject ? b.toObject() : (b as any)),
      ),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  async getBookingByIdForAdmin(id: string) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking)
      throw new NotFoundException('Không tìm thấy thông tin đặt sân');
    const plain = booking.toObject ? booking.toObject() : (booking as any);
    return this.mapBookingForAdminDetail(plain);
  }

  async getBookingById(id: string, userId?: string, role?: string) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking)
      throw new NotFoundException('Không tìm thấy thông tin đặt sân');

    if (role === 'Admin') {
      return booking;
    }

    const plain = booking.toObject ? booking.toObject() : (booking as any);
    const uid = plain.userId;
    const ownerId =
      uid && typeof uid === 'object' && uid._id
        ? String(uid._id)
        : uid
          ? String(uid)
          : '';

    if (userId && ownerId && ownerId !== userId) {
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

    const ownerId =
      booking.userId?._id?.toString() || booking.userId?.toString();
    if (ownerId !== userId)
      throw new ForbiddenException('Bạn không có quyền hủy lịch này');

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

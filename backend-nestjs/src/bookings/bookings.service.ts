import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { BookingRepository } from './bookings.repository';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  QueryBookingDto,
  CompleteBookingEarlyDto,
} from './dto/booking.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { VnpayService } from '../payments/vnpay.service';
import { buildBookingVnpTxnRef } from '../payments/vnpay-booking.util';
import { OrderEventsService } from '../order-events/order-events.service';
import {
  computeSlotEndAt,
  computeSlotEndFromBookingLike,
} from './booking-slot.util';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Tránh String(object) → '[object Object]' (eslint no-base-to-string). */
function primitiveString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return '';
}

function normalizeTime(t: string): string {
  const p = String(t || '')
    .trim()
    .split(':');
  const h = Math.min(23, Math.max(0, Number(p[0]) || 0));
  const m = Math.min(59, Math.max(0, Number(p[1] ?? 0) || 0));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function slotKey(s: { startTime: string; endTime: string }): string {
  return `${normalizeTime(s.startTime)}-${normalizeTime(s.endTime)}`;
}

function parseMinutes(t: string): number {
  const [h, m] = normalizeTime(t).split(':').map(Number);
  return h * 60 + m;
}

/** Sinh các khung 1 giờ từ mở cửa đến đóng cửa (end là giờ bắt đầu ca cuối) */
function generateHourlySlots(
  openTime: string,
  closeTime: string,
): { startTime: string; endTime: string }[] {
  const openM = parseMinutes(openTime || '06:00');
  const closeM = parseMinutes(closeTime || '22:00');
  const out: { startTime: string; endTime: string }[] = [];
  for (let t = openM; t + 60 <= closeM; t += 60) {
    const sH = Math.floor(t / 60);
    const sM = t % 60;
    const eH = Math.floor((t + 60) / 60);
    const eM = (t + 60) % 60;
    out.push({
      startTime: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
      endTime: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
    });
  }
  return out;
}

function bookingSlotsFromDoc(b: {
  slots?: { startTime: string; endTime: string }[];
  startTime?: string;
  endTime?: string;
}): { startTime: string; endTime: string }[] {
  if (Array.isArray(b.slots) && b.slots.length > 0) {
    return b.slots.map((s) => ({
      startTime: normalizeTime(s.startTime),
      endTime: normalizeTime(s.endTime),
    }));
  }
  if (b.startTime && b.endTime) {
    return [
      {
        startTime: normalizeTime(b.startTime),
        endTime: normalizeTime(b.endTime),
      },
    ];
  }
  return [];
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private bookingRepository: BookingRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    private readonly config: ConfigService,
    private readonly vnpayService: VnpayService,
    private readonly orderEvents: OrderEventsService,
  ) {}

  private clientIp(req?: Request): string {
    if (!req) return '127.0.0.1';
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.trim()) {
      return xf.split(',')[0].trim();
    }
    const ip = req.ip || req.socket?.remoteAddress;
    if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
    return typeof ip === 'string' ? ip : '127.0.0.1';
  }

  private generateBookingCode(): string {
    const t = Date.now().toString(36).toUpperCase();
    const r = randomBytes(3).toString('hex').toUpperCase();
    return `BK-${t}-${r}`;
  }

  private computeDeposit(totalVnd: number): number {
    const pct = Math.min(
      100,
      Math.max(
        1,
        parseInt(
          this.config.get<string>('BOOKING_DEPOSIT_PERCENT') || '30',
          10,
        ),
      ),
    );
    const minDep = Math.max(
      0,
      parseInt(
        this.config.get<string>('BOOKING_DEPOSIT_MIN_VND') || '10000',
        10,
      ),
    );
    let dep = Math.round((totalVnd * pct) / 100);
    if (dep < minDep) dep = Math.min(totalVnd, minDep);
    if (dep > totalVnd) dep = totalVnd;
    return Math.max(1, dep);
  }

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

  private mapBookingForAdminList(b: Record<string, unknown>) {
    const u = this.extractUser(b);
    const c = this.extractCourt(b);
    const oid = b._id as Types.ObjectId;
    const bd = b.bookingDate as Date | undefined;
    const ts = bd ? new Date(bd).getTime() : 0;
    return {
      _id: oid,
      bookingId: oid,
      bookingCode:
        b.bookingCode ?? (ts ? `BK${ts}` : `BK${String(oid).slice(-12)}`),
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      customerPhone: u.phone ?? '',
      courtName: c.courtName ?? '—',
      courtType: c.courtType ?? '',
      bookingDate: bd,
      timeSlotCount: Array.isArray(b.slots) ? (b.slots as unknown[]).length : 1,
      timeRange: `${primitiveString(b.startTime)} — ${primitiveString(b.endTime)}`,
      totalAmount: b.totalAmount,
      depositAmount: b.depositAmount,
      remainingAmount: b.remainingAmount,
      paymentMethod: b.paymentMethod ?? 'VNPAY',
      statusName: b.bookingStatus,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      slotEndAt: b.slotEndAt ?? null,
    };
  }

  private async runBookingExpirySweep(): Promise<void> {
    try {
      await this.bookingRepository.markExpiredConfirmedBookings();
    } catch (e) {
      this.logger.error(
        `markExpiredConfirmedBookings: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  private mapBookingForAdminDetail(b: Record<string, unknown>) {
    const u = this.extractUser(b);
    const c = this.extractCourt(b);
    const oid = b._id as Types.ObjectId;
    const bd = b.bookingDate as Date | undefined;
    const ts = bd ? new Date(bd).getTime() : 0;
    const total = Number(b.totalAmount) || 0;
    const deposit = Number(b.depositAmount) || 0;
    const remNum = Number(b.remainingAmount);
    const remaining =
      Number.isFinite(remNum) && remNum >= 0
        ? remNum
        : Math.max(0, total - deposit);
    const slots = bookingSlotsFromDoc(
      b as { slots?: { startTime: string; endTime: string }[] },
    );
    const paySt = primitiveString(b.paymentStatus);
    const payments: { paymentMethodName: string; amount: number }[] = [];
    if (
      paySt === 'DepositPaid' ||
      paySt.toLowerCase().includes('paid') ||
      paySt.includes('Đã')
    ) {
      payments.push({
        paymentMethodName: 'VNPAY (cọc)',
        amount: deposit,
      });
    }

    return {
      _id: oid,
      bookingId: oid,
      bookingCode:
        b.bookingCode ?? (ts ? `BK${ts}` : `BK${String(oid).slice(-12)}`),
      statusName: b.bookingStatus,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      slotEndAt: b.slotEndAt ?? null,
      earlyCompleteReason: b.earlyCompleteReason ?? '',
      completedAt: b.completedAt ?? null,
      completionSource: b.completionSource ?? '',
      customerName: u.fullName ?? '',
      customerEmail: u.email ?? '',
      customerPhone: u.phone ?? '',
      courtName: c.courtName ?? '—',
      courtTypeName: c.courtType ?? '',
      location: c.location || c.address || '',
      note: '',
      bookingDate: bd,
      totalAmount: total,
      depositAmount: deposit,
      remainingAmount: remaining,
      paymentMethod: b.paymentMethod ?? 'VNPAY',
      timeSlots: slots.map((s, i) => ({
        bookingDetailId: String(i + 1),
        slotName: `Ca ${i + 1}`,
        startTime: s.startTime,
        endTime: s.endTime,
        price: total / Math.max(1, slots.length),
      })),
      payments,
    };
  }

  async getAvailableSlots(courtId: string, dateStr: string) {
    const court = await this.courtModel.findById(courtId).exec();
    if (!court) throw new NotFoundException('Không tìm thấy sân');

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const occupied = await this.bookingRepository.findOccupiedForCourtOnDate(
      courtId,
      dayStart,
      dayEnd,
    );

    const bookedKeys = new Set<string>();
    for (const ob of occupied) {
      for (const s of bookingSlotsFromDoc(ob)) {
        bookedKeys.add(slotKey(s));
      }
    }

    const openT = court.openTime || '06:00';
    const closeT = court.closeTime || '22:00';
    const template = generateHourlySlots(openT, closeT);

    const slots = template.map((s, i) => {
      const k = slotKey(s);
      return {
        id: `slot_${dateStr}_${i}_${k.replace(':', '')}`,
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: bookedKeys.has(k),
      };
    });

    return { slots, pricePerHour: court.pricePerHour ?? 0 };
  }

  async createBooking(
    userId: string,
    createDto: CreateBookingDto,
    req?: Request,
  ) {
    const court = await this.courtModel.findById(createDto.courtId).exec();
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    if (court.isActive === false) {
      throw new BadRequestException('Sân không còn hoạt động');
    }

    const dateStr = createDto.bookingDate.slice(0, 10);
    const { slots: available } = await this.getAvailableSlots(
      createDto.courtId,
      dateStr,
    );
    const allowed = new Set(
      available.filter((a) => !a.isBooked).map((a) => slotKey(a)),
    );

    const chosen = createDto.slots.map((s) => ({
      startTime: normalizeTime(s.startTime),
      endTime: normalizeTime(s.endTime),
    }));

    for (const s of chosen) {
      if (!allowed.has(slotKey(s))) {
        throw new BadRequestException(
          `Khung giờ ${s.startTime}–${s.endTime} không còn trống hoặc không hợp lệ`,
        );
      }
    }

    /** Kiểm tra lại ngay trước khi ghi DB — giảm đặt trùng khi hai người chọn cùng lúc */
    const { slots: availableNow } = await this.getAvailableSlots(
      createDto.courtId,
      dateStr,
    );
    const allowedNow = new Set(
      availableNow.filter((a) => !a.isBooked).map((a) => slotKey(a)),
    );
    for (const s of chosen) {
      if (!allowedNow.has(slotKey(s))) {
        throw new BadRequestException(
          `Khung giờ ${s.startTime}–${s.endTime} vừa được người khác đặt — vui lòng chọn khung khác`,
        );
      }
    }

    const sorted = [...chosen].sort(
      (a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime),
    );
    const pricePerHour = Number(court.pricePerHour) || 0;
    const totalAmount = Math.round(pricePerHour * sorted.length);
    if (totalAmount < 1) {
      throw new BadRequestException('Không tính được tổng tiền');
    }

    const depositAmount = this.computeDeposit(totalAmount);
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    const bookingCode = this.generateBookingCode();

    if (!this.vnpayService.isConfigured()) {
      throw new BadRequestException(
        'Chưa cấu hình VNPay (BOOKING chỉ thanh toán cọc qua VNPAY)',
      );
    }

    const slotEndAt = computeSlotEndAt(
      dateStr,
      sorted[sorted.length - 1].endTime,
    );
    const payload = {
      userId: new Types.ObjectId(userId),
      courtId: new Types.ObjectId(createDto.courtId),
      bookingCode,
      bookingDate: new Date(dateStr + 'T12:00:00.000Z'),
      slots: sorted,
      startTime: sorted[0].startTime,
      endTime: sorted[sorted.length - 1].endTime,
      slotEndAt,
      totalAmount,
      depositAmount,
      remainingAmount,
      paymentMethod: 'VNPAY',
      bookingStatus: 'AwaitingPayment',
      paymentStatus: 'Unpaid',
    };

    const booking = await this.bookingRepository.create(payload);

    void this.orderEvents
      .onBookingCreatedAwaitingPayment(booking)
      .catch((e) =>
        this.logger.error(
          `onBookingCreatedAwaitingPayment: ${e instanceof Error ? e.message : e}`,
        ),
      );

    const txnRef = buildBookingVnpTxnRef(String(booking._id));
    let paymentUrl: string | undefined;
    try {
      paymentUrl = this.vnpayService.buildPaymentUrl({
        orderId: txnRef,
        amountVnd: depositAmount,
        orderDescription: `Coc dat san ${bookingCode}`,
        ipAddr: this.clientIp(req),
      });
    } catch (e) {
      this.logger.error(e);
      await this.bookingRepository.delete(String(booking._id));
      throw e;
    }

    return {
      message: 'Tạo lịch đặt sân — chuyển đến VNPay để thanh toán cọc',
      booking,
      paymentUrl,
      depositAmount,
      remainingAmount,
      totalAmount,
    };
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
    await this.runBookingExpirySweep();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    const statusVal = (query.status || query.bookingStatus || '').trim();
    if (statusVal) match.bookingStatus = statusVal;
    if (query.paymentStatus?.trim())
      match.paymentStatus = query.paymentStatus.trim();
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
        { bookingCode: rx },
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
    await this.runBookingExpirySweep();
    const booking = await this.bookingRepository.findById(id);
    if (!booking)
      throw new NotFoundException('Không tìm thấy thông tin đặt sân');
    const plain = booking.toObject ? booking.toObject() : (booking as any);
    return this.mapBookingForAdminDetail(plain);
  }

  async getBookingById(id: string, userId?: string, role?: string) {
    await this.runBookingExpirySweep();
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
    await this.runBookingExpirySweep();
    const existing = await this.bookingRepository.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy đơn đặt sân');

    const payload: any = { ...updateDto };
    if (updateDto.statusName && !updateDto.bookingStatus) {
      payload.bookingStatus = updateDto.statusName;
      delete payload.statusName;
    }

    if (payload.bookingStatus != null && String(payload.bookingStatus).trim()) {
      const nextLower = String(payload.bookingStatus).trim().toLowerCase();
      if (
        nextLower === 'completed' ||
        nextLower === 'hoàn thành' ||
        nextLower === 'hoan thanh'
      ) {
        const prevLower = String(existing.bookingStatus || '')
          .trim()
          .toLowerCase();
        if (prevLower === 'confirmed') {
          const plainForEnd = existing.toObject
            ? existing.toObject()
            : existing;
          const slotEnd =
            existing.slotEndAt != null
              ? new Date(existing.slotEndAt)
              : computeSlotEndFromBookingLike(plainForEnd);
          if (new Date() < slotEnd) {
            throw new BadRequestException(
              'Ca chưa kết thúc — không chọn Hoàn thành trực tiếp. Dùng "Hoàn thành sớm" và nhập lý do, hoặc đợi hết giờ để hệ thống tự cập nhật.',
            );
          }
        }
      }
    }

    const prev = String(existing.bookingStatus || '').toLowerCase();
    const wasCancelled =
      prev === 'cancelled' || prev === 'đã hủy' || prev === 'da huy';

    const booking = await this.bookingRepository.update(id, payload);
    if (!booking) throw new NotFoundException('Không tìm thấy đơn đặt sân');

    const next = String(booking.bookingStatus || '').toLowerCase();
    const nowCancelled =
      next === 'cancelled' || next === 'đã hủy' || next === 'da huy';
    if (nowCancelled && !wasCancelled) {
      void this.orderEvents
        .onBookingCancelled(id, 'admin')
        .catch((e) =>
          this.logger.error(
            `onBookingCancelled(admin): ${e instanceof Error ? e.message : e}`,
          ),
        );
    }

    return { message: 'Cập nhật trạng thái sân thành công', booking };
  }

  /** Admin: đóng ca trước giờ kết thúc — bắt buộc lý do; mở slot cho đặt mới */
  async completeBookingEarlyAdmin(id: string, dto: CompleteBookingEarlyDto) {
    await this.runBookingExpirySweep();
    const existing = await this.bookingRepository.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy đơn đặt sân');

    const prevLower = String(existing.bookingStatus || '').toLowerCase();
    if (prevLower !== 'confirmed') {
      throw new BadRequestException(
        'Chỉ hoàn thành sớm khi lịch đang ở trạng thái Đã xác nhận (đã cọc).',
      );
    }
    const payLower = String(existing.paymentStatus || '').toLowerCase();
    if (payLower !== 'depositpaid') {
      throw new BadRequestException('Đơn chưa có cọc xác nhận (VNPay).');
    }

    const plainForEnd = existing.toObject ? existing.toObject() : existing;
    const slotEnd =
      existing.slotEndAt != null
        ? new Date(existing.slotEndAt)
        : computeSlotEndFromBookingLike(plainForEnd);
    const now = new Date();
    if (slotEnd <= now) {
      throw new BadRequestException(
        'Ca đã qua hoặc đang kết thúc — không cần hoàn thành sớm. Hệ thống sẽ tự cập nhật Hoàn thành.',
      );
    }

    const reason = dto.reason.trim();
    if (reason.length < 5) {
      throw new BadRequestException('Vui lòng nhập lý do (ít nhất 5 ký tự).');
    }

    const booking = await this.bookingRepository.update(id, {
      bookingStatus: 'Completed',
      earlyCompleteReason: reason,
      completedAt: now,
      completionSource: 'admin_early',
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn đặt sân');

    return {
      message:
        'Đã hoàn thành sớm — khung giờ đã mở cho khách đặt mới (nếu còn trống).',
      booking,
    };
  }

  async cancelBookingByUser(userId: string, bookingId: string) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Không tìm thấy lịch đặt sân');

    const ownerId =
      booking.userId?._id?.toString() || booking.userId?.toString();
    if (ownerId !== userId)
      throw new ForbiddenException('Bạn không có quyền hủy lịch này');

    const bStatus = (booking.bookingStatus || '').toLowerCase();
    const pStatus = (booking.paymentStatus || '').toLowerCase();
    const awaitingOnly = bStatus === 'awaitingpayment' || bStatus === 'pending';

    if (!awaitingOnly || pStatus !== 'unpaid') {
      throw new BadRequestException(
        'Chỉ hủy được khi chưa thanh toán cọc VNPAY',
      );
    }

    const updated = await this.bookingRepository.update(bookingId, {
      bookingStatus: 'Cancelled',
    });
    if (updated) {
      void this.orderEvents
        .onBookingCancelled(bookingId, 'user')
        .catch((e) =>
          this.logger.error(
            `onBookingCancelled(user): ${e instanceof Error ? e.message : e}`,
          ),
        );
    }
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
        bookingStatus: { $in: ['Pending', 'AwaitingPayment', 'Chờ xác nhận'] },
      }),
      this.bookingRepository.count({
        bookingStatus: { $in: ['Confirmed', 'Đã xác nhận'] },
      }),
      this.bookingRepository.count({
        bookingStatus: { $in: ['Cancelled', 'cancelled', 'Đã hủy'] },
      }),
      this.bookingRepository.aggregate([
        { $match: { paymentStatus: 'DepositPaid' } },
        { $group: { _id: null, total: { $sum: '$depositAmount' } } },
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

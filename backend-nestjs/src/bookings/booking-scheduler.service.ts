import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { BookingRepository } from './bookings.repository';
import { computeSlotEndFromBookingLike } from './booking-slot.util';

/**
 * Cron tasks cho đặt sân:
 *  1. Mỗi 5 phút — tự hoàn thành (Completed) đơn đã hết giờ
 *  2. Mỗi 15 phút — hủy đơn AwaitingPayment quá 30 phút (chưa thanh toán cọc)
 */
@Injectable()
export class BookingSchedulerService {
  private readonly logger = new Logger(BookingSchedulerService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly bookingRepository: BookingRepository,
  ) {}

  /**
   * Chạy mỗi 5 phút.
   * Đơn Confirmed + DepositPaid mà slotEndAt đã qua → Completed (giải phóng slot).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoCompleteExpiredBookings(): Promise<void> {
    try {
      await this.bookingRepository.markExpiredConfirmedBookings();
      this.logger.debug('autoCompleteExpiredBookings: sweep done');
    } catch (err) {
      this.logger.error(
        `autoCompleteExpiredBookings error: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /**
   * Chạy mỗi 15 phút.
   * Đơn AwaitingPayment quá 30 phút mà chưa thanh toán → Cancelled.
   * Giải phóng slot để người khác có thể đặt.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cancelAbandonedAwaitingPayment(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 phút trước
      const result = await this.bookingModel
        .updateMany(
          {
            bookingStatus: 'AwaitingPayment',
            paymentStatus: 'Unpaid',
            createdAt: { $lte: cutoff },
          },
          {
            $set: {
              bookingStatus: 'Cancelled',
              cancelledAt: new Date(),
              cancelReason: 'Hết thời gian thanh toán cọc (tự động hủy)',
            },
          },
        )
        .exec();

      if (result.modifiedCount > 0) {
        this.logger.log(
          `cancelAbandonedAwaitingPayment: hủy ${result.modifiedCount} đơn chưa thanh toán`,
        );
      }
    } catch (err) {
      this.logger.error(
        `cancelAbandonedAwaitingPayment error: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /**
   * Chạy khi server khởi động — dọn dẹp ngay lập tức không cần chờ cron tick.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.autoCompleteExpiredBookings().catch(() => null);
    await this.cancelAbandonedAwaitingPayment().catch(() => null);
    this.logger.log('BookingScheduler: bootstrap sweep done');
  }
}

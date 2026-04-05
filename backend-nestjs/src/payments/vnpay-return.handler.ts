import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  resolveFrontendBase,
  isProductionDeployment,
} from '../common/frontend-url.util';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { OrderEventsService } from '../order-events/order-events.service';
import { VnpayService } from './vnpay.service';
import { parseBookingIdFromVnpTxnRef } from './vnpay-booking.util';
import { computeSlotEndFromBookingLike } from '../bookings/booking-slot.util';

/**
 * Xử lý redirect từ VNPay Return URL (đơn hàng hoặc cọc đặt sân).
 */
@Injectable()
export class VnpayReturnHandler {
  private readonly logger = new Logger(VnpayReturnHandler.name);

  constructor(
    private readonly vnpay: VnpayService,
    private readonly config: ConfigService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly orderEvents: OrderEventsService,
  ) {}

  private frontendBase(): string {
    const raw =
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      this.config.get<string>('VNPAY_FRONTEND_URL')?.trim();
    return resolveFrontendBase(raw);
  }

  /** Trả về URL tuyệt đối để 302 redirect (Return URL). */
  async getRedirectUrl(query: Record<string, string>): Promise<string> {
    const base = this.frontendBase();
    if (isProductionDeployment() && base.includes('localhost')) {
      this.logger.error(
        `VNPay redirect base là localhost (${base}) — đặt FRONTEND_URL hoặc FRONTEND_PUBLIC_URL=https://ndsports.id.vn trên server (Render: NODE_ENV hoặc RENDER=true).`,
      );
    }
    const result = this.vnpay.verifyCallback(query);

    if (!result.valid) {
      this.logger.warn('VNPay return: chữ ký không hợp lệ');
      return `${base}/checkout?payment=failed&reason=signature`;
    }
    if (result.responseCode !== '00') {
      return `${base}/checkout?payment=failed&code=${encodeURIComponent(result.responseCode)}`;
    }

    const bookingId = parseBookingIdFromVnpTxnRef(result.orderId);
    if (bookingId && Types.ObjectId.isValid(bookingId)) {
      return this.redirectAfterBookingPayment(base, bookingId, result);
    }

    const order = await this.orderModel.findById(result.orderId).exec();
    if (!order) {
      return `${base}/checkout?payment=failed&reason=order`;
    }
    const expected = Math.round(Number(order.totalAmount));
    if (result.amountVnd !== expected) {
      this.logger.warn(
        `VNPay amount mismatch order=${expected} vnp=${result.amountVnd}`,
      );
      return `${base}/profile/orders/${encodeURIComponent(String(order._id))}?payment=failed&reason=amount`;
    }

    const updated = await this.orderModel
      .findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: { $ne: 'Paid' },
        },
        {
          $set: {
            paymentStatus: 'Paid',
            orderStatus: 'Processing',
            paymentMethod: 'VNPAY',
            vnpTransactionNo: result.transactionNo,
            vnpPayDate: result.payDate,
            vnpBankCode: result.bankCode,
          },
        },
        { new: true },
      )
      .exec();
    if (updated) {
      // Fire-and-forget — không block redirect (SMTP có thể chậm 3-10s)
      void this.orderEvents
        .onVnpayPaymentConfirmed(String(updated._id))
        .catch((e) =>
          this.logger.error(
            `onVnpayPaymentConfirmed: ${e instanceof Error ? e.message : e}`,
          ),
        );
    }

    const redirectId = updated ? String(updated._id) : String(order._id);
    return `${base}/profile/orders/${encodeURIComponent(redirectId)}?payment=success`;
  }

  private async redirectAfterBookingPayment(
    base: string,
    bookingId: string,
    result: {
      amountVnd: number;
      transactionNo: string;
      payDate: string;
      bankCode: string;
    },
  ): Promise<string> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      return `${base}/profile/bookings?payment=failed&reason=booking`;
    }
    const expected = Math.round(Number(booking.depositAmount));
    if (result.amountVnd !== expected) {
      this.logger.warn(
        `VNPay booking amount mismatch booking=${expected} vnp=${result.amountVnd}`,
      );
      return `${base}/profile/bookings/${encodeURIComponent(bookingId)}?payment=failed&reason=amount`;
    }

    const slotEndAt = computeSlotEndFromBookingLike(booking.toObject() as any);
    const updatedBooking = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          paymentStatus: { $ne: 'DepositPaid' },
        },
        {
          $set: {
            paymentStatus: 'DepositPaid',
            bookingStatus: 'Confirmed',
            slotEndAt,
            vnpTransactionNo: result.transactionNo,
            vnpPayDate: result.payDate,
            vnpBankCode: result.bankCode,
          },
        },
        { new: true },
      )
      .exec();

    if (updatedBooking) {
      // Fire-and-forget — không block redirect
      void this.orderEvents
        .onBookingDepositPaid(updatedBooking)
        .catch((e) =>
          this.logger.error(
            `onBookingDepositPaid: ${e instanceof Error ? e.message : e}`,
          ),
        );
    }

    return `${base}/profile/bookings/${encodeURIComponent(bookingId)}?payment=success`;
  }
}

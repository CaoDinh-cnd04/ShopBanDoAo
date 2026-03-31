import { Controller, Get, Post, Query, Res, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Response } from 'express';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { OrderEventsService } from '../order-events/order-events.service';
import { VnpayReturnHandler } from './vnpay-return.handler';
import { VnpayService } from './vnpay.service';
import { parseBookingIdFromVnpTxnRef } from './vnpay-booking.util';

/**
 * Callback VNPay (không JWT) — đăng ký đúng URL trên cổng VNPay:
 * - Return URL (cũ): .../api/payments/vnpay/return
 * - Return URL (production thường dùng): .../api/payment/vnpay-return
 * - IPN URL: .../api/payments/vnpay/ipn
 *
 * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
@Controller('api/payments')
export class VnpayController {
  private readonly logger = new Logger(VnpayController.name);

  constructor(
    private readonly vnpay: VnpayService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly orderEvents: OrderEventsService,
    private readonly vnpayReturnHandler: VnpayReturnHandler,
  ) {}

  @Get('vnpay/return')
  async vnpayReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.vnpayReturnHandler.getRedirectUrl(query);
    res.redirect(302, url);
  }

  /** IPN — VNPay gọi server-to-server; phản hồi JSON phẳng (TransformInterceptor đã bỏ qua bọc) */
  @Get('vnpay/ipn')
  async vnpayIpnGet(@Query() query: Record<string, string>) {
    return this.handleIpn(query);
  }

  @Post('vnpay/ipn')
  async vnpayIpnPost(@Query() query: Record<string, string>) {
    return this.handleIpn(query);
  }

  private async handleIpn(query: Record<string, string>) {
    const result = this.vnpay.verifyCallback(query);
    if (!result.valid) {
      return { RspCode: '97', Message: 'Fail checksum' };
    }
    if (result.responseCode !== '00') {
      return { RspCode: '97', Message: 'Confirm failed' };
    }

    const bookingId = parseBookingIdFromVnpTxnRef(result.orderId);
    if (bookingId && Types.ObjectId.isValid(bookingId)) {
      return this.handleBookingIpn(bookingId, result);
    }

    const order = await this.orderModel.findById(result.orderId).exec();
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }
    const expected = Math.round(Number(order.totalAmount));
    if (result.amountVnd !== expected) {
      return { RspCode: '04', Message: 'Invalid amount' };
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
      void this.orderEvents
        .onVnpayPaymentConfirmed(String(updated._id))
        .catch((e) =>
          this.logger.error(
            `onVnpayPaymentConfirmed IPN: ${e instanceof Error ? e.message : e}`,
          ),
        );
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  private async handleBookingIpn(
    bookingId: string,
    result: {
      amountVnd: number;
      transactionNo: string;
      payDate: string;
      bankCode: string;
    },
  ) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      return { RspCode: '01', Message: 'Booking not found' };
    }
    const expected = Math.round(Number(booking.depositAmount));
    if (result.amountVnd !== expected) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          paymentStatus: { $ne: 'DepositPaid' },
        },
        {
          $set: {
            paymentStatus: 'DepositPaid',
            bookingStatus: 'Confirmed',
            vnpTransactionNo: result.transactionNo,
            vnpPayDate: result.payDate,
            vnpBankCode: result.bankCode,
          },
        },
        { new: true },
      )
      .exec();

    return { RspCode: '00', Message: 'Confirm Success' };
  }
}

/** Alias route: `https://<domain>/api/payment/vnpay-return` (cùng hành vi với `api/payments/vnpay/return`). */
@Controller('api/payment')
export class VnpayReturnAliasController {
  constructor(private readonly vnpayReturnHandler: VnpayReturnHandler) {}

  @Get('vnpay-return')
  async vnpayReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.vnpayReturnHandler.getRedirectUrl(query);
    res.redirect(302, url);
  }
}

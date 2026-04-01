import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

/** Tích hợp VNPay v2 (redirect) — TMN + Hash Secret chỉ qua biến môi trường */
@Injectable()
export class VnpayService {
  constructor(private readonly config: ConfigService) {}

  private getTmnCode(): string {
    return (
      this.config.get<string>('VNPAY_TMN_CODE')?.trim() ||
      this.config.get<string>('VNP_TMN_CODE')?.trim() ||
      ''
    );
  }

  private getHashSecret(): string {
    return (
      this.config.get<string>('VNPAY_HASH_SECRET')?.trim() ||
      this.config.get<string>('VNP_HASH_SECRET')?.trim() ||
      ''
    );
  }

  private getPaymentBaseUrl(): string {
    const override = this.config.get<string>('VNPAY_PAYMENT_URL')?.trim();
    if (override) return override;
    const sandbox =
      this.config.get<string>('VNPAY_SANDBOX') === 'true' ||
      this.config.get<string>('VNPAY_SANDBOX') === '1';
    return sandbox
      ? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
      : 'https://pay.vnpayment.vn/vpcpay.html';
  }

  /** URL backend nhận redirect từ VNPay (đăng ký trên cổng VNPay) */
  getReturnUrl(): string {
    const u =
      this.config.get<string>('VNPAY_RETURN_URL')?.trim() ||
      this.config.get<string>('VNP_RETURN_URL')?.trim();
    if (!u) {
      throw new BadRequestException(
        'Chưa cấu hình VNPAY_RETURN_URL — phải là URL **API backend** (vd: https://xxx.onrender.com/api/payment/vnpay-return), không dùng domain chỉ có frontend tĩnh.',
      );
    }
    return u;
  }

  isConfigured(): boolean {
    return Boolean(this.getTmnCode() && this.getHashSecret());
  }

  /**
   * Tạo URL chuyển hướng sang cổng thanh toán VNPay.
   * vnp_Amount: VND * 100 (số nguyên)
   */
  buildPaymentUrl(input: {
    orderId: string;
    amountVnd: number;
    orderDescription: string;
    ipAddr: string;
  }): string {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Chưa cấu hình VNPAY_TMN_CODE / VNPAY_HASH_SECRET trên server',
      );
    }
    const tmn = this.getTmnCode();
    const secret = this.getHashSecret();
    const returnUrl = this.getReturnUrl();

    const amount = Math.round(input.amountVnd);
    if (amount < 1) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }
    const vnpAmount = amount * 100;

    const now = new Date();
    const createDate = this.formatVnYyyyMMddHHmmss(now);
    /** Bắt buộc v2.1.0 — thiếu thường gây lỗi «Sai chữ ký» trên sandbox */
    const expireDate = this.formatVnYyyyMMddHHmmss(
      new Date(now.getTime() + 15 * 60 * 1000),
    );

    const vnp: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmn,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: input.orderId,
      vnp_OrderInfo: this.clipOrderInfo(input.orderDescription),
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: this.normalizeIp(input.ipAddr),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const signData = this.buildSignDataVnpayPay(vnp);
    const secureHash = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const query: Record<string, string> = {};
    for (const [k, val] of Object.entries(vnp)) {
      query[k] = String(val);
    }
    query.vnp_SecureHash = secureHash;

    const base = this.getPaymentBaseUrl();
    return `${base}?${querystring.stringify(query)}`;
  }

  private clipOrderInfo(s: string): string {
    const t = s.trim() || 'Thanh toan don hang';
    return t.length > 250 ? t.slice(0, 247) + '...' : t;
  }

  /** Thời điểm theo múi giờ VN (VNPay: yyyyMMddHHmmss, GMT+7) */
  private formatVnYyyyMMddHHmmss(d: Date): string {
    const s = d.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const [datePart, timePart] = s.split(' ');
    const [y, m, day] = datePart.split('-');
    const [hh, mm, ss] = timePart.split(':');
    return `${y}${m}${day}${hh}${mm}${ss}`;
  }

  private normalizeIp(ip: string): string {
    const v = ip?.trim() || '127.0.0.1';
    if (v === '::1' || v === '::ffff:127.0.0.1') return '127.0.0.1';
    if (v.startsWith('::ffff:')) return v.replace('::ffff:', '');
    return v;
  }

  /**
   * Chuỗi ký lệnh pay: sort key A-Z, mỗi cặp `urlencode(key)=urlencode(value)` nối bằng &
   * (khớp mẫu PHP trong tài liệu chuyển đổi 2.1.0 + HMAC-SHA512).
   */
  private buildSignDataVnpayPay(
    params: Record<string, string | number>,
  ): string {
    const keys = Object.keys(params).sort();
    return keys
      .map((k) => {
        const val = String(params[k]);
        return `${this.phpUrlEncode(k)}=${this.phpUrlEncode(val)}`;
      })
      .join('&');
  }

  /** Gần tương đương PHP `urlencode` (khoảng trắng → +) — dùng cho chuỗi ký. */
  private phpUrlEncode(s: string): string {
    return encodeURIComponent(s).replace(/%20/g, '+');
  }

  /**
   * Xác thực query từ return/IPN; trả về dữ liệu đã kiểm tra chữ ký.
   */
  verifyCallback(query: Record<string, string>): {
    valid: boolean;
    orderId: string;
    responseCode: string;
    transactionNo: string;
    payDate: string;
    bankCode: string;
    amountVnd: number;
  } {
    const secret = this.getHashSecret();
    if (!secret) {
      return {
        valid: false,
        orderId: '',
        responseCode: '',
        transactionNo: '',
        payDate: '',
        bankCode: '',
        amountVnd: 0,
      };
    }

    const secureHash = query.vnp_SecureHash || query.vnp_securehash || '';
    const clone: Record<string, string> = { ...query };
    delete clone.vnp_SecureHash;
    delete clone.vnp_SecureHashType;

    const signRaw = this.buildSignDataFromQueryRaw(clone);
    const signPhp = this.buildSignDataFromQueryPhp(clone);
    const expectedRaw = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signRaw, 'utf-8'))
      .digest('hex');
    const expectedPhp = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signPhp, 'utf-8'))
      .digest('hex');

    const h = secureHash.toLowerCase();
    const valid =
      secureHash.length > 0 &&
      (h === expectedRaw.toLowerCase() || h === expectedPhp.toLowerCase());

    const amountRaw = parseInt(String(query.vnp_Amount || '0'), 10);
    const amountVnd = Math.floor(amountRaw / 100);

    return {
      valid,
      orderId: String(query.vnp_TxnRef || ''),
      responseCode: String(query.vnp_ResponseCode || ''),
      transactionNo: String(query.vnp_TransactionNo || ''),
      payDate: String(query.vnp_PayDate || ''),
      bankCode: String(query.vnp_BankCode || ''),
      amountVnd,
    };
  }

  /** Chuỗi ký callback (một số bản mẫu Node dùng key=value không encode). */
  private buildSignDataFromQueryRaw(query: Record<string, string>): string {
    const keys = Object.keys(query)
      .filter((k) => query[k] != null && query[k] !== '')
      .sort();
    return keys.map((k) => `${k}=${query[k]}`).join('&');
  }

  /** Chuỗi ký callback kiểu PHP (urlencode từng key/value) — khớp mẫu IPN trong tài liệu. */
  private buildSignDataFromQueryPhp(query: Record<string, string>): string {
    const keys = Object.keys(query)
      .filter((k) => query[k] != null && query[k] !== '')
      .sort();
    return keys
      .map((k) => `${this.phpUrlEncode(k)}=${this.phpUrlEncode(query[k])}`)
      .join('&');
  }
}

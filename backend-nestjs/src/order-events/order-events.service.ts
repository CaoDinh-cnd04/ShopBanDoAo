import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { resolveFrontendBase } from '../common/frontend-url.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';

const NOTIF_TYPE_ORDER = 'order';
const NOTIF_TYPE_BOOKING = 'booking';
const BRAND_NAME = 'ND Sports';
const DEFAULT_SITE = 'https://ndsports.id.vn';

@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Court.name) private readonly courtModel: Model<CourtDocument>,
  ) {}

  private fmtVnd(n: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(n);
  }

  /** URL gốc site: FRONTEND_URL (có thể nhiều origin cách nhau bởi dấu phẩy) hoặc mặc định. */
  private siteBase(): string {
    const raw = this.config.get<string>('FRONTEND_URL')?.trim();
    if (!raw) return DEFAULT_SITE;
    return resolveFrontendBase(raw, DEFAULT_SITE);
  }

  private siteHostLabel(): string {
    try {
      return new URL(this.siteBase()).hostname;
    } catch {
      return 'ndsports.id.vn';
    }
  }

  /**
   * Email thông báo cho admin: ưu tiên ADMIN_NOTIFY_EMAIL trong .env
   * (tránh gửi nhầm tới email user Admin trong DB như admin@domain-cũ không tồn tại).
   * Nếu không set .env → dùng email các user có role Admin.
   */
  private adminNotifyEmailsFromEnv(): string[] {
    const raw = this.config.get<string>('ADMIN_NOTIFY_EMAIL')?.trim();
    if (!raw) return [];
    return raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  }

  /**
   * Gộp ADMIN_NOTIFY_EMAIL + email các tài khoản Admin trong DB (không trùng),
   * để không bỏ sót khi chỉ cấu một nguồn.
   */
  private async resolveAdminMailTargets(): Promise<string[]> {
    const fromEnv = this.adminNotifyEmailsFromEnv();
    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('email')
      .lean();
    const fromDb = (admins.map((a) => a.email).filter(Boolean) as string[])
      .map((e) => e.trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of [...fromEnv, ...fromDb]) {
      const k = e.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
    return out;
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Bảng chi tiết 2 cột — tương thích client email. */
  private emailDetailTable(
    rows: Array<{ label: string; valueHtml: string }>,
  ): string {
    const trs = rows
      .map(
        (r) =>
          `<tr>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:36%;vertical-align:top;">${r.label}</td>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;">${r.valueHtml}</td>
          </tr>`,
      )
      .join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;border-collapse:collapse;">${trs}</table>`;
  }

  /**
   * Khung email thống nhất: header ND Sports, nội dung, CTA, footer pháp lý.
   */
  private wrapBranded(opts: {
    pageTitle: string;
    preheader?: string;
    headline: string;
    bodyHtml: string;
    cta?: { label: string; href: string };
  }): string {
    const host = this.siteHostLabel();
    const base = this.siteBase();
    const pre = this.escapeHtml(
      opts.preheader ?? opts.headline ?? opts.pageTitle,
    );
    const ctaBlock = opts.cta
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
          <tr>
            <td align="center">
              <a href="${this.escapeHtml(opts.cta.href)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;">${this.escapeHtml(opts.cta.label)}</a>
            </td>
          </tr>
        </table>`
      : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width"/>
  <title>${this.escapeHtml(opts.pageTitle)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${pre}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <tr>
            <td style="background:#0f766e;border-radius:14px 14px 0 0;padding:26px 24px 22px;text-align:center;">
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">${BRAND_NAME}</div>
              <div style="color:rgba(255,255,255,0.88);font-size:13px;margin-top:10px;letter-spacing:0.2px;">${this.escapeHtml(host)}</div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:24px 24px 8px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h1 style="margin:0;font-size:19px;color:#0f172a;font-weight:600;line-height:1.35;">${this.escapeHtml(opts.headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:8px 24px 28px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0;border-top:none;">
              <div style="color:#334155;font-size:15px;line-height:1.65;">${opts.bodyHtml}</div>
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 12px 8px;text-align:center;font-size:12px;color:#64748b;line-height:1.5;">
              <a href="${this.escapeHtml(base)}" style="color:#0f766e;font-weight:600;text-decoration:none;">${this.escapeHtml(host)}</a>
              <br/><span style="color:#94a3b8;">Thông báo tự động từ ${BRAND_NAME}. Vui lòng không trả lời trực tiếp email này.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Sau khi tạo đơn (COD hoặc VNPay trước khi thanh toán cổng).
   */
  async onOrderCreated(
    order: OrderDocument,
    opts: { paymentUrl?: string },
  ): Promise<void> {
    const orderId = String(order._id);
    const orderCode = order.orderCode ?? orderId;
    const userId = String(order.userId);
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      this.logger.warn(`onOrderCreated: không tìm thấy user ${userId}`);
    } else if (!user.email) {
      this.logger.warn(
        `onOrderCreated: user chưa có email — vẫn gửi thông báo web; bỏ qua email khách (${userId})`,
      );
    }

    const customerName = user?.fullName ?? 'Khách hàng';
    const total = Number(order.totalAmount) || 0;
    const payMethod = (order.paymentMethod || '').toUpperCase();
    const pendingVnpay = !!opts.paymentUrl || payMethod === 'VNPAY';
    const host = this.siteHostLabel();

    const titleCustomer = pendingVnpay
      ? `${BRAND_NAME} · Đơn đã tạo — chờ thanh toán VNPay`
      : `${BRAND_NAME} · Đặt hàng thành công`;
    const msgCustomer = pendingVnpay
      ? `Đơn ${orderCode} (${this.fmtVnd(total)}). Hoàn tất thanh toán VNPay. Shop chỉ xử lý sau khi thanh toán thành công. Chi tiết: ${host} → Đơn hàng.`
      : `Đơn ${orderCode} (${this.fmtVnd(total)}) đã được ghi nhận. Chúng tôi sẽ xác nhận sớm. Xem tại ${host}.`;

    try {
      await this.notifications.createNotification({
        userId,
        title: titleCustomer,
        message: msgCustomer,
        type: NOTIF_TYPE_ORDER,
      });
    } catch (e) {
      this.logger.error(
        `Thông báo web khách: ${e instanceof Error ? e.message : e}`,
      );
    }

    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('_id email')
      .lean();

    const adminTitleWeb = pendingVnpay
      ? `${BRAND_NAME} · Đơn mới — chờ thanh toán VNPay`
      : `${BRAND_NAME} · Đơn mới cần xác nhận`;
    const adminMsgWeb = pendingVnpay
      ? `${customerName} · ${orderCode} · ${this.fmtVnd(total)}. Khách chưa thanh toán — theo dõi trên ${host}.`
      : `${customerName} · ${orderCode} · ${this.fmtVnd(total)}. Mở Quản trị trên ${host} để xử lý.`;

    for (const admin of admins) {
      const aid = String(admin._id);
      try {
        await this.notifications.createNotification({
          userId: aid,
          title: adminTitleWeb,
          message: adminMsgWeb,
          type: NOTIF_TYPE_ORDER,
        });
      } catch (e) {
        this.logger.error(
          `Thông báo admin ${aid}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const ordersUrl = `${this.siteBase()}/profile/orders`;
    const adminOrdersUrl = `${this.siteBase()}/admin/orders`;

    if (user?.email) {
      const bodyCustomer = pendingVnpay
        ? `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
           <p>Đơn <strong>${this.escapeHtml(orderCode)}</strong> với tổng <strong>${this.fmtVnd(total)}</strong> đã được tạo. Vui lòng hoàn tất thanh toán trên cổng <strong>VNPay</strong>.</p>
           <p style="color:#64748b;font-size:14px;">Shop chỉ tiếp nhận và xử lý đơn sau khi thanh toán VNPay <strong>thành công</strong>. Bạn có thể thanh toán lại hoặc đổi sang thanh toán khi nhận hàng (COD) trong trang chi tiết đơn.</p>`
        : `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
           <p>Cảm ơn bạn đã tin tưởng <strong>${BRAND_NAME}</strong>. Đơn <strong>${this.escapeHtml(orderCode)}</strong> (${this.fmtVnd(total)}) đã được ghi nhận. Chúng tôi sẽ xác nhận và liên hệ giao hàng trong thời gian sớm nhất.</p>`;

      const rows = [
        { label: 'Mã đơn', valueHtml: this.escapeHtml(orderCode) },
        { label: 'Tổng cộng', valueHtml: this.fmtVnd(total) },
        {
          label: 'Thanh toán',
          valueHtml: this.escapeHtml(order.paymentMethod || '—'),
        },
      ];

      await this.mail.send({
        to: user.email,
        subject: pendingVnpay
          ? `[${BRAND_NAME}] ${orderCode} — chờ thanh toán VNPay`
          : `[${BRAND_NAME}] ${orderCode} — đặt hàng thành công`,
        html: this.wrapBranded({
          pageTitle: titleCustomer,
          preheader: msgCustomer,
          headline: pendingVnpay
            ? 'Chờ bạn thanh toán VNPay'
            : 'Cảm ơn bạn đã đặt hàng',
          bodyHtml: `${bodyCustomer}${this.emailDetailTable(rows)}`,
          cta: { label: 'Xem đơn hàng của tôi', href: ordersUrl },
        }),
      });
    }

    const custEmailDisplay = user?.email ?? '';
    const adminMailTargets = await this.resolveAdminMailTargets();
    for (const to of adminMailTargets) {
      const adminRows = [
        { label: 'Mã đơn', valueHtml: this.escapeHtml(orderCode) },
        {
          label: 'Khách hàng',
          valueHtml: `${this.escapeHtml(customerName)}${custEmailDisplay ? `<br/><span style="font-weight:400;color:#64748b;">${this.escapeHtml(custEmailDisplay)}</span>` : ''}`,
        },
        { label: 'Tổng cộng', valueHtml: this.fmtVnd(total) },
        {
          label: 'Thanh toán',
          valueHtml: this.escapeHtml(order.paymentMethod || '—'),
        },
      ];
      const adminHeadline = pendingVnpay
        ? 'Đơn mới — chờ thanh toán VNPay'
        : 'Có đơn cần xác nhận';
      const adminBodyExtra = pendingVnpay
        ? `<p style="color:#64748b;font-size:14px;">Khách chưa thanh toán VNPay — đơn chỉ được xử lý sau khi thanh toán thành công.</p>`
        : `<p>Vui lòng đăng nhập khu vực quản trị để xác nhận hoặc liên hệ khách nếu cần.</p>`;
      await this.mail.send({
        to,
        subject: pendingVnpay
          ? `[${BRAND_NAME} Admin] ${orderCode} — chờ VNPay (${this.fmtVnd(total)})`
          : `[${BRAND_NAME} Admin] Đơn mới ${orderCode} — ${this.fmtVnd(total)}`,
        html: this.wrapBranded({
          pageTitle: 'Đơn hàng mới',
          headline: adminHeadline,
          bodyHtml: `<p>Bạn có một đơn hàng mới trên <strong>${BRAND_NAME}</strong>.</p>${this.emailDetailTable(adminRows)}${adminBodyExtra}`,
          cta: { label: 'Mở quản trị đơn hàng', href: adminOrdersUrl },
        }),
      });
    }
  }

  /**
   * Khách đổi VNPay → COD: thông báo admin (web + email) như đơn COD mới.
   */
  async notifyAdminsOrderPendingReview(order: OrderDocument): Promise<void> {
    const orderCode = order.orderCode ?? String(order._id);
    const user = await this.userModel.findById(order.userId).lean();
    if (!user) return;
    const customerName = user.fullName ?? 'Khách hàng';
    const total = Number(order.totalAmount) || 0;
    const host = this.siteHostLabel();
    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('_id email')
      .lean();
    const adminOrdersUrl = `${this.siteBase()}/admin/orders`;

    for (const admin of admins) {
      const aid = String(admin._id);
      try {
        await this.notifications.createNotification({
          userId: aid,
          title: `${BRAND_NAME} · Đơn mới (COD) cần xác nhận`,
          message: `${customerName} · ${orderCode} · ${this.fmtVnd(total)}. Khách đổi từ VNPay sang COD. ${host}`,
          type: NOTIF_TYPE_ORDER,
        });
      } catch (e) {
        this.logger.error(
          `notifyAdminsOrderPendingReview web: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const custEmailDisplay = user.email ?? '';
    const adminMailTargets = await this.resolveAdminMailTargets();
    for (const to of adminMailTargets) {
      const adminRows = [
        { label: 'Mã đơn', valueHtml: this.escapeHtml(orderCode) },
        {
          label: 'Khách hàng',
          valueHtml: `${this.escapeHtml(customerName)}${custEmailDisplay ? `<br/><span style="font-weight:400;color:#64748b;">${this.escapeHtml(custEmailDisplay)}</span>` : ''}`,
        },
        { label: 'Tổng cộng', valueHtml: this.fmtVnd(total) },
        {
          label: 'Thanh toán',
          valueHtml: this.escapeHtml(order.paymentMethod || '—'),
        },
      ];
      await this.mail.send({
        to,
        subject: `[${BRAND_NAME} Admin] Đơn COD ${orderCode} — ${this.fmtVnd(total)}`,
        html: this.wrapBranded({
          pageTitle: 'Đơn COD cần xác nhận',
          headline: 'Khách đã chuyển sang thanh toán khi nhận hàng',
          bodyHtml: `<p>Đơn trước đó chọn VNPay nhưng khách đã <strong>đổi sang COD</strong>. Vui lòng xác nhận trên quản trị.</p>${this.emailDetailTable(adminRows)}`,
          cta: { label: 'Mở quản trị đơn hàng', href: adminOrdersUrl },
        }),
      });
    }
  }

  /**
   * Khi VNPay xác nhận thanh toán (chỉ gọi khi vừa chuyển trạng thái sang Paid).
   */
  async onVnpayPaymentConfirmed(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) return;
    const user = await this.userModel.findById(order.userId).lean();
    if (!user) {
      this.logger.warn(
        `onVnpayPaymentConfirmed: không tìm thấy user ${order.userId}`,
      );
      return;
    }
    if (!user.email) {
      this.logger.warn(
        `onVnpayPaymentConfirmed: user không có email — vẫn gửi thông báo web; bỏ qua email khách`,
      );
    }

    const orderCode = order.orderCode ?? orderId;
    const total = Number(order.totalAmount) || 0;
    const customerName = user.fullName ?? 'Khách hàng';
    const host = this.siteHostLabel();
    const ordersUrl = `${this.siteBase()}/profile/orders`;

    try {
      await this.notifications.createNotification({
        userId: String(order.userId),
        title: `${BRAND_NAME} · Thanh toán VNPay thành công`,
        message: `Đơn ${orderCode} (${this.fmtVnd(total)}) đã thanh toán. Cảm ơn bạn! Chi tiết: ${host} → Đơn hàng.`,
        type: NOTIF_TYPE_ORDER,
      });
    } catch (e) {
      this.logger.error(
        `Thông báo thanh toán: ${e instanceof Error ? e.message : e}`,
      );
    }

    const adminsWeb = await this.userModel
      .find({ role: 'Admin' })
      .select('_id')
      .lean();
    for (const a of adminsWeb) {
      try {
        await this.notifications.createNotification({
          userId: String(a._id),
          title: `${BRAND_NAME} · VNPay đã thanh toán`,
          message: `Đơn ${orderCode} (${this.fmtVnd(total)}) — vào Quản trị để xác nhận. ${host}`,
          type: NOTIF_TYPE_ORDER,
        });
      } catch (e) {
        this.logger.error(
          `Thông báo admin VNPay: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    if (user.email) {
      const rows = [
        { label: 'Mã đơn', valueHtml: this.escapeHtml(orderCode) },
        { label: 'Số tiền', valueHtml: this.fmtVnd(total) },
        { label: 'Phương thức', valueHtml: 'VNPay' },
      ];
      await this.mail.send({
        to: user.email,
        subject: `[${BRAND_NAME}] ${orderCode} — đã thanh toán thành công`,
        html: this.wrapBranded({
          pageTitle: 'Thanh toán thành công',
          headline: 'VNPay đã ghi nhận thanh toán',
          bodyHtml: `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
            <p>Giao dịch VNPay cho đơn <strong>${this.escapeHtml(orderCode)}</strong> đã thành công. Chúng tôi sẽ tiếp tục xử lý đơn và thông báo khi giao hàng.</p>${this.emailDetailTable(rows)}`,
          cta: { label: 'Xem chi tiết đơn hàng', href: ordersUrl },
        }),
      });
    }

    const adminOrdersUrl = `${this.siteBase()}/admin/orders`;
    const adminMailTargets = await this.resolveAdminMailTargets();
    for (const to of adminMailTargets) {
      await this.mail.send({
        to,
        subject: `[${BRAND_NAME} Admin] ${orderCode} — VNPay đã thanh toán`,
        html: this.wrapBranded({
          pageTitle: 'Thanh toán VNPay',
          headline: 'Đơn đã thanh toán',
          bodyHtml: `<p>Đơn <strong>${this.escapeHtml(orderCode)}</strong> (${this.fmtVnd(total)}) đã thanh toán qua <strong>VNPay</strong>. Có thể chuẩn bị xác nhận và giao hàng.</p>`,
          cta: { label: 'Mở quản trị đơn hàng', href: adminOrdersUrl },
        }),
      });
    }
  }

  /**
   * Đơn chuyển sang Hủy — khách tự hủy hoặc admin hủy (thông báo web + email).
   */
  async onOrderCancelled(
    orderId: string,
    source: 'user' | 'admin',
  ): Promise<void> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) return;

    const uid = String(order.userId);
    const user = await this.userModel.findById(uid).lean();
    const orderCode = order.orderCode ?? orderId;
    const total = Number(order.totalAmount) || 0;
    const customerName = user?.fullName ?? 'Khách hàng';
    const host = this.siteHostLabel();
    const ordersUrl = `${this.siteBase()}/profile/orders`;

    const customerTitle =
      source === 'user'
        ? `${BRAND_NAME} · Bạn đã hủy đơn`
        : `${BRAND_NAME} · Đơn đã được hủy`;
    const customerMsg =
      source === 'user'
        ? `Đơn ${orderCode} (${this.fmtVnd(total)}) đã hủy theo yêu cầu của bạn. Xem lại tại ${host}.`
        : `Đơn ${orderCode} (${this.fmtVnd(total)}) đã được cửa hàng hủy. Liên hệ hỗ trợ qua ${host} nếu cần.`;

    try {
      await this.notifications.createNotification({
        userId: uid,
        title: customerTitle,
        message: customerMsg,
        type: NOTIF_TYPE_ORDER,
      });
    } catch (e) {
      this.logger.error(
        `Thông báo hủy (khách): ${e instanceof Error ? e.message : e}`,
      );
    }

    if (user?.email) {
      const rows = [
        { label: 'Mã đơn', valueHtml: this.escapeHtml(orderCode) },
        { label: 'Tổng (lúc đặt)', valueHtml: this.fmtVnd(total) },
      ];
      const bodyHtml =
        source === 'user'
          ? `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
             <p>Đơn <strong>${this.escapeHtml(orderCode)}</strong> đã được <strong>hủy theo yêu cầu</strong> của bạn trên ${BRAND_NAME}.</p>${this.emailDetailTable(rows)}<p style="margin-top:16px;color:#64748b;font-size:14px;">Nếu bạn đã thanh toán, đội ngũ sẽ liên hệ theo chính sách hoàn tiền (nếu áp dụng).</p>`
          : `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
             <p>Đơn <strong>${this.escapeHtml(orderCode)}</strong> đã được <strong>cửa hàng hủy</strong>. Mọi thắc mắc vui lòng liên hệ qua website <strong>${this.escapeHtml(host)}</strong>.</p>${this.emailDetailTable(rows)}`;

      await this.mail.send({
        to: user.email,
        subject: `[${BRAND_NAME}] ${orderCode} — đơn đã hủy`,
        html: this.wrapBranded({
          pageTitle: 'Đơn đã hủy',
          headline:
            source === 'user' ? 'Đơn hàng đã được hủy' : 'Thông báo hủy đơn',
          bodyHtml,
          cta: { label: 'Xem đơn hàng', href: ordersUrl },
        }),
      });
    }

    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('_id email fullName')
      .lean();

    const adminTitle =
      source === 'user'
        ? `${BRAND_NAME} · Khách hủy đơn`
        : `${BRAND_NAME} · Đơn chuyển trạng thái Hủy`;
    const adminMsg =
      source === 'user'
        ? `${customerName} đã hủy đơn ${orderCode} (${this.fmtVnd(total)}). Kiểm tra trên ${host}.`
        : `Đơn ${orderCode} (${this.fmtVnd(total)}) đã chuyển sang Hủy. Xem ${host}.`;

    for (const admin of admins) {
      const aid = String(admin._id);
      try {
        await this.notifications.createNotification({
          userId: aid,
          title: adminTitle,
          message: adminMsg,
          type: NOTIF_TYPE_ORDER,
        });
      } catch (e) {
        this.logger.error(
          `Thông báo hủy (admin ${aid}): ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const customerEmailLower = user?.email?.trim().toLowerCase() ?? '';
    const adminOrdersUrl = `${this.siteBase()}/admin/orders`;
    const adminMailTargets = await this.resolveAdminMailTargets();
    for (const to of adminMailTargets) {
      if (
        customerEmailLower &&
        to.trim().toLowerCase() === customerEmailLower
      ) {
        continue;
      }
      const admRows = [
        { label: 'Mã đơn', valueHtml: this.escapeHtml(orderCode) },
        {
          label: 'Khách',
          valueHtml: `${this.escapeHtml(customerName)}${user?.email ? `<br/><span style="font-weight:400;color:#64748b;">${this.escapeHtml(user.email)}</span>` : ''}`,
        },
        { label: 'Tổng', valueHtml: this.fmtVnd(total) },
        {
          label: 'Nguồn',
          valueHtml:
            source === 'user'
              ? 'Khách tự hủy trên web'
              : 'Cập nhật từ quản trị',
        },
      ];
      await this.mail.send({
        to,
        subject: `[${BRAND_NAME} Admin] ${orderCode} — hủy (${source === 'user' ? 'khách' : 'hệ thống'})`,
        html: this.wrapBranded({
          pageTitle: 'Thông báo hủy đơn',
          headline:
            source === 'user' ? 'Khách đã hủy đơn' : 'Đơn đã được hủy',
          bodyHtml: `${this.emailDetailTable(admRows)}`,
          cta: { label: 'Mở quản trị đơn hàng', href: adminOrdersUrl },
        }),
      });
    }
  }

  private fmtBookingDate(d: Date | undefined): string {
    if (!d) return '—';
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(d));
    } catch {
      return String(d);
    }
  }

  private slotsSummary(
    slots: { startTime: string; endTime: string }[] | undefined,
  ): string {
    if (!Array.isArray(slots) || slots.length === 0) return '—';
    return slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ');
  }

  /** Đặt sân vừa tạo — chờ thanh toán cọc VNPay */
  async onBookingCreatedAwaitingPayment(
    booking: BookingDocument,
  ): Promise<void> {
    const bookingId = String(booking._id);
    const bookingCode = booking.bookingCode ?? bookingId;
    const user = await this.userModel.findById(booking.userId).lean();
    if (!user) {
      this.logger.warn(`onBookingCreated: không tìm thấy user ${booking.userId}`);
      return;
    }
    const court = await this.courtModel.findById(booking.courtId).lean();
    const courtName = court?.courtName ?? 'Sân';
    const uid = String(booking.userId);
    const host = this.siteHostLabel();
    const dep = Math.round(Number(booking.depositAmount)) || 0;
    const total = Math.round(Number(booking.totalAmount)) || 0;
    const dateStr = this.fmtBookingDate(booking.bookingDate);
    const slotsStr = this.slotsSummary(booking.slots);

    const titleUser = `${BRAND_NAME} · Đặt sân — chờ thanh toán cọc`;
    const msgUser = `Lịch ${bookingCode} · ${courtName} · ${dateStr} (${slotsStr}). Cọc ${this.fmtVnd(dep)} — hoàn tất VNPay trên ${host}.`;

    try {
      await this.notifications.createNotification({
        userId: uid,
        title: titleUser,
        message: msgUser,
        type: NOTIF_TYPE_BOOKING,
      });
    } catch (e) {
      this.logger.error(
        `Thông báo đặt sân (user): ${e instanceof Error ? e.message : e}`,
      );
    }

    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('_id')
      .lean();
    const adminTitle = `${BRAND_NAME} · Lịch đặt sân mới — chờ cọc VNPay`;
    const adminMsg = `${user.fullName ?? 'Khách'} · ${bookingCode} · ${courtName} · ${dateStr}. Cọc ${this.fmtVnd(dep)}. ${host}`;
    for (const admin of admins) {
      try {
        await this.notifications.createNotification({
          userId: String(admin._id),
          title: adminTitle,
          message: adminMsg,
          type: NOTIF_TYPE_BOOKING,
        });
      } catch (e) {
        this.logger.error(
          `Thông báo đặt sân (admin): ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const bookingsUrl = `${this.siteBase()}/profile/bookings`;
    const adminBookingsUrl = `${this.siteBase()}/admin/bookings`;
    const customerName = user.fullName ?? 'Khách hàng';

    if (user.email) {
      const rows = [
        { label: 'Mã lịch', valueHtml: this.escapeHtml(bookingCode) },
        { label: 'Sân', valueHtml: this.escapeHtml(courtName) },
        { label: 'Ngày', valueHtml: this.escapeHtml(dateStr) },
        { label: 'Khung giờ', valueHtml: this.escapeHtml(slotsStr) },
        { label: 'Tổng sân', valueHtml: this.fmtVnd(total) },
        { label: 'Cọc VNPay', valueHtml: this.fmtVnd(dep) },
      ];
      await this.mail.send({
        to: user.email,
        subject: `[${BRAND_NAME}] ${bookingCode} — chờ thanh toán cọc đặt sân`,
        html: this.wrapBranded({
          pageTitle: titleUser,
          preheader: msgUser,
          headline: 'Hoàn tất thanh toán cọc trên VNPay',
          bodyHtml: `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
            <p>Lịch đặt sân đã được tạo. Vui lòng thanh toán <strong>cọc</strong> trên cổng VNPay để giữ chỗ.</p>${this.emailDetailTable(rows)}`,
          cta: { label: 'Xem lịch đặt sân', href: bookingsUrl },
        }),
      });
    }

    const adminMailTargets = await this.resolveAdminMailTargets();
    const custEmail = user.email ?? '';
    for (const to of adminMailTargets) {
      await this.mail.send({
        to,
        subject: `[${BRAND_NAME} Admin] Đặt sân ${bookingCode} — chờ cọc (${this.fmtVnd(dep)})`,
        html: this.wrapBranded({
          pageTitle: 'Lịch đặt sân mới',
          headline: 'Chờ khách thanh toán cọc VNPay',
          bodyHtml: `<p>Có lịch đặt sân mới — <strong>${this.escapeHtml(courtName)}</strong>, ${this.escapeHtml(dateStr)}.</p>${this.emailDetailTable([
            {
              label: 'Khách',
              valueHtml: `${this.escapeHtml(customerName)}${custEmail ? `<br/><span style="color:#64748b;">${this.escapeHtml(custEmail)}</span>` : ''}`,
            },
            { label: 'Mã lịch', valueHtml: this.escapeHtml(bookingCode) },
            { label: 'Cọc', valueHtml: this.fmtVnd(dep) },
          ])}`,
          cta: { label: 'Quản trị đặt sân', href: adminBookingsUrl },
        }),
      });
    }
  }

  /** Cọc VNPay đã thanh toán — gọi khi findOneAndUpdate trả về bản ghi mới (tránh trùng IPN + Return). */
  async onBookingDepositPaid(booking: BookingDocument): Promise<void> {
    const bookingId = String(booking._id);
    const bookingCode = booking.bookingCode ?? bookingId;
    const user = await this.userModel.findById(booking.userId).lean();
    if (!user) return;
    const court = await this.courtModel.findById(booking.courtId).lean();
    const courtName = court?.courtName ?? 'Sân';
    const uid = String(booking.userId);
    const host = this.siteHostLabel();
    const dep = Math.round(Number(booking.depositAmount)) || 0;
    const total = Math.round(Number(booking.totalAmount)) || 0;
    const dateStr = this.fmtBookingDate(booking.bookingDate);
    const slotsStr = this.slotsSummary(booking.slots);

    const titleUser = `${BRAND_NAME} · Đặt sân đã xác nhận (cọc đã thanh toán)`;
    const msgUser = `${bookingCode} · ${courtName} · ${dateStr}. Cọc ${this.fmtVnd(dep)} đã thanh toán. ${host}`;

    try {
      await this.notifications.createNotification({
        userId: uid,
        title: titleUser,
        message: msgUser,
        type: NOTIF_TYPE_BOOKING,
      });
    } catch (e) {
      this.logger.error(
        `notify booking paid user: ${e instanceof Error ? e.message : e}`,
      );
    }

    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('_id')
      .lean();
    for (const admin of admins) {
      try {
        await this.notifications.createNotification({
          userId: String(admin._id),
          title: `${BRAND_NAME} · Cọc đặt sân đã thanh toán`,
          message: `${bookingCode} · ${courtName} · ${this.fmtVnd(dep)}. ${host}`,
          type: NOTIF_TYPE_BOOKING,
        });
      } catch (e) {
        this.logger.error(
          `notify booking paid admin: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const bookingsUrl = `${this.siteBase()}/profile/bookings/${encodeURIComponent(bookingId)}`;
    const adminBookingsUrl = `${this.siteBase()}/admin/bookings`;
    const customerName = user.fullName ?? 'Khách hàng';

    if (user.email) {
      const rows = [
        { label: 'Mã lịch', valueHtml: this.escapeHtml(bookingCode) },
        { label: 'Sân', valueHtml: this.escapeHtml(courtName) },
        { label: 'Ngày', valueHtml: this.escapeHtml(dateStr) },
        { label: 'Khung giờ', valueHtml: this.escapeHtml(slotsStr) },
        { label: 'Cọc đã trả', valueHtml: this.fmtVnd(dep) },
        { label: 'Còn lại tại sân', valueHtml: this.fmtVnd(Math.max(0, total - dep)) },
      ];
      await this.mail.send({
        to: user.email,
        subject: `[${BRAND_NAME}] ${bookingCode} — cọc đặt sân đã thanh toán`,
        html: this.wrapBranded({
          pageTitle: titleUser,
          preheader: msgUser,
          headline: 'Cảm ơn bạn — lịch đã được giữ',
          bodyHtml: `<p>Xin chào <strong>${this.escapeHtml(customerName)}</strong>,</p>
            <p>Chúng tôi đã ghi nhận <strong>cọc VNPay</strong> cho lịch đặt sân của bạn.</p>${this.emailDetailTable(rows)}`,
          cta: { label: 'Xem chi tiết lịch', href: bookingsUrl },
        }),
      });
    }

    const adminMailTargets = await this.resolveAdminMailTargets();
    const custEmail = user.email ?? '';
    for (const to of adminMailTargets) {
      await this.mail.send({
        to,
        subject: `[${BRAND_NAME} Admin] ${bookingCode} — cọc VNPay đã thanh toán`,
        html: this.wrapBranded({
          pageTitle: 'Cọc đặt sân',
          headline: 'Khách đã thanh toán cọc',
          bodyHtml: `${this.emailDetailTable([
            {
              label: 'Khách',
              valueHtml: `${this.escapeHtml(customerName)}${custEmail ? `<br/><span style="color:#64748b;">${this.escapeHtml(custEmail)}</span>` : ''}`,
            },
            { label: 'Sân', valueHtml: this.escapeHtml(courtName) },
            { label: 'Mã lịch', valueHtml: this.escapeHtml(bookingCode) },
            { label: 'Cọc', valueHtml: this.fmtVnd(dep) },
          ])}`,
          cta: { label: 'Quản trị đặt sân', href: adminBookingsUrl },
        }),
      });
    }
  }

  /** Hủy lịch đặt sân */
  async onBookingCancelled(
    bookingId: string,
    source: 'user' | 'admin',
  ): Promise<void> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) return;
    const bookingCode = booking.bookingCode ?? bookingId;
    const user = await this.userModel.findById(booking.userId).lean();
    const court = await this.courtModel.findById(booking.courtId).lean();
    const courtName = court?.courtName ?? 'Sân';
    const uid = String(booking.userId);
    const host = this.siteHostLabel();
    const dep = Math.round(Number(booking.depositAmount)) || 0;
    const dateStr = this.fmtBookingDate(booking.bookingDate);

    const customerTitle =
      source === 'user'
        ? `${BRAND_NAME} · Bạn đã hủy lịch đặt sân`
        : `${BRAND_NAME} · Lịch đặt sân đã hủy`;
    const customerMsg =
      source === 'user'
        ? `Lịch ${bookingCode} · ${courtName} · ${dateStr} đã hủy. ${host}`
        : `Lịch ${bookingCode} · ${courtName} đã được hủy từ phía cửa hàng. ${host}`;

    try {
      await this.notifications.createNotification({
        userId: uid,
        title: customerTitle,
        message: customerMsg,
        type: NOTIF_TYPE_BOOKING,
      });
    } catch (e) {
      this.logger.error(
        `booking cancel user notif: ${e instanceof Error ? e.message : e}`,
      );
    }

    const admins = await this.userModel
      .find({ role: 'Admin' })
      .select('_id')
      .lean();
    const adminTitle =
      source === 'user'
        ? `${BRAND_NAME} · Khách hủy lịch đặt sân`
        : `${BRAND_NAME} · Lịch đặt sân hủy (quản trị)`;
    const customerName = user?.fullName ?? 'Khách';
    const adminMsg =
      source === 'user'
        ? `${customerName} hủy ${bookingCode} · ${courtName}. ${host}`
        : `Lịch ${bookingCode} · ${courtName} chuyển hủy. ${host}`;

    for (const admin of admins) {
      try {
        await this.notifications.createNotification({
          userId: String(admin._id),
          title: adminTitle,
          message: adminMsg,
          type: NOTIF_TYPE_BOOKING,
        });
      } catch (e) {
        this.logger.error(
          `booking cancel admin notif: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const bookingsUrl = `${this.siteBase()}/profile/bookings`;
    const adminBookingsUrl = `${this.siteBase()}/admin/bookings`;

    if (user?.email) {
      await this.mail.send({
        to: user.email,
        subject: `[${BRAND_NAME}] ${bookingCode} — lịch đặt sân đã hủy`,
        html: this.wrapBranded({
          pageTitle: 'Lịch đã hủy',
          headline:
            source === 'user'
              ? 'Bạn đã hủy lịch đặt sân'
              : 'Thông báo hủy lịch đặt sân',
          bodyHtml: `<p>Xin chào <strong>${this.escapeHtml(user.fullName ?? 'Quý khách')}</strong>,</p>
            <p>Lịch <strong>${this.escapeHtml(bookingCode)}</strong> · ${this.escapeHtml(courtName)} · ${this.escapeHtml(dateStr)} đã được hủy.</p>
            <p style="color:#64748b;font-size:14px;">Nếu đã thanh toán cọc, đội ngũ sẽ xử lý theo chính sách hoàn tiền (nếu áp dụng).</p>`,
          cta: { label: 'Lịch đặt sân của tôi', href: bookingsUrl },
        }),
      });
    }

    const custEmailLower = user?.email?.trim().toLowerCase() ?? '';
    const adminMailTargets = await this.resolveAdminMailTargets();
    for (const to of adminMailTargets) {
      if (custEmailLower && to.trim().toLowerCase() === custEmailLower) {
        continue;
      }
      await this.mail.send({
        to,
        subject: `[${BRAND_NAME} Admin] ${bookingCode} — hủy lịch đặt sân (${source === 'user' ? 'khách' : 'HT'})`,
        html: this.wrapBranded({
          pageTitle: 'Hủy đặt sân',
          headline: source === 'user' ? 'Khách hủy lịch' : 'Lịch đã hủy',
          bodyHtml: this.emailDetailTable([
            { label: 'Mã', valueHtml: this.escapeHtml(bookingCode) },
            {
              label: 'Khách',
              valueHtml: `${this.escapeHtml(customerName)}${user?.email ? `<br/><span style="color:#64748b;">${this.escapeHtml(user.email)}</span>` : ''}`,
            },
            { label: 'Sân', valueHtml: this.escapeHtml(courtName) },
            { label: 'Cọc (tham chiếu)', valueHtml: this.fmtVnd(dep) },
          ]),
          cta: { label: 'Quản trị đặt sân', href: adminBookingsUrl },
        }),
      });
    }
  }
}

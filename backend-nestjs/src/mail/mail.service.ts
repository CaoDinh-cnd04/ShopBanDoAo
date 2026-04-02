import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/** Giới hạn log khi SMTP tắt — vẫn log vài lần đầu để dễ thấy trên Render */
let skippedMailNoSmtpCount = 0;

function strConfig(config: ConfigService, keys: string[]): string {
  for (const k of keys) {
    const v = config.get<string>(k);
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    const user = strConfig(this.config, [
      'SMTP_USER',
      'SMTP_USERNAME',
      'MAIL_USER',
      'EMAIL_USER',
    ]);
    const pass = strConfig(this.config, [
      'SMTP_PASS',
      'SMTP_PASSWORD',
      'MAIL_PASS',
      'MAIL_PASSWORD',
      'EMAIL_PASS',
      'EMAIL_PASSWORD',
    ]);
    const hostFromEnv = strConfig(this.config, [
      'SMTP_HOST',
      'MAIL_HOST',
      'EMAIL_HOST',
    ]);
    const host = hostFromEnv || (user && pass ? 'smtp.gmail.com' : '');
    const portRaw =
      this.config.get<string>('SMTP_PORT') ??
      this.config.get<number>('SMTP_PORT');
    let port =
      typeof portRaw === 'number' && Number.isFinite(portRaw)
        ? portRaw
        : parseInt(String(portRaw ?? '587').trim() || '587', 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      port = 587;
    }
    if (host && user && pass) {
      const secure =
        this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(
        `SMTP OK — ${host}:${port} (user=${user.replace(/(.{2}).+(@.+)/, '$1***$2')})`,
      );
    } else {
      this.transporter = null;
      this.logger.warn(
        `SMTP chưa đủ: host=${host ? 'ok' : 'thiếu'} user=${user ? 'ok' : 'thiếu'} pass=${pass ? 'ok' : 'thiếu'}. Cần SMTP_HOST (hoặc để trống + Gmail: EMAIL_USER+EMAIL_PASS), SMTP_USER/EMAIL_USER, SMTP_PASS/EMAIL_PASS. Trên Render thêm các biến này.`,
      );
    }
  }

  isEnabled(): boolean {
    return this.transporter != null;
  }

  async send(opts: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    if (!this.transporter) {
      skippedMailNoSmtpCount += 1;
      if (skippedMailNoSmtpCount <= 8) {
        this.logger.warn(
          `[mail ${skippedMailNoSmtpCount}] Bỏ qua gửi tới "${opts.to}" — ${opts.subject.slice(0, 60)}… (chưa cấu hình SMTP trên server).`,
        );
      }
      return;
    }
    const from =
      strConfig(this.config, [
        'MAIL_FROM',
        'SMTP_FROM',
        'SMTP_USER',
        'EMAIL_USER',
      ]) || 'noreply@localhost';
    try {
      const info = await this.transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text ?? opts.html.replace(/<[^>]+>/g, ' '),
        html: opts.html,
      });
      this.logger.log(
        `Đã gửi email: to=${opts.to} subject="${opts.subject.slice(0, 48)}…" id=${typeof info.messageId === 'string' ? info.messageId : 'ok'}`,
      );
    } catch (e) {
      this.logger.error(
        `Gửi email thất bại (${opts.to}): ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}

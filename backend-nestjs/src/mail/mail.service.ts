import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    /** Hỗ trợ EMAIL_USER / EMAIL_PASS (Gmail app password) nếu chưa đặt SMTP_* */
    const user =
      this.config.get<string>('SMTP_USER')?.trim() ||
      this.config.get<string>('EMAIL_USER')?.trim() ||
      '';
    const pass =
      this.config.get<string>('SMTP_PASS')?.trim() ||
      this.config.get<string>('EMAIL_PASS')?.trim() ||
      '';
    const hostFromEnv = this.config.get<string>('SMTP_HOST')?.trim();
    const host =
      hostFromEnv ||
      (user && pass ? 'smtp.gmail.com' : '');
    const port = parseInt(this.config.get<string>('SMTP_PORT') || '587', 10);
    if (host && user && pass) {
      const secure =
        this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured (${host}:${port})`);
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP không cấu hình — cần SMTP_HOST + SMTP_USER + SMTP_PASS, hoặc EMAIL_USER + EMAIL_PASS (Gmail: smtp.gmail.com mặc định).',
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
    if (!this.transporter) return;
    const from =
      this.config.get<string>('MAIL_FROM')?.trim() ||
      this.config.get<string>('SMTP_USER')?.trim() ||
      this.config.get<string>('EMAIL_USER')?.trim() ||
      'noreply@localhost';
    try {
      await this.transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text ?? opts.html.replace(/<[^>]+>/g, ' '),
        html: opts.html,
      });
    } catch (e) {
      this.logger.error(
        `Gửi email thất bại (${opts.to}): ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}

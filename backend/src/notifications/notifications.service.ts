import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

type EmailSendResult = {
  delivered: boolean;
  fallback: boolean;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: Transporter | null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      this.transporter = null;
      this.logger.warn(
        'SMTP is not configured. Emails will be logged only (fallback mode).',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<EmailSendResult> {
    if (!this.transporter) {
      this.logger.log(`Email queued to ${to} | Subject: ${subject}`);
      this.logger.debug(`Email body: ${body}`);
      return {
        delivered: false,
        fallback: true,
      };
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: body,
      });

      return {
        delivered: true,
        fallback: false,
      };
    } catch (error) {
      this.logger.error(`Email send failed to ${to}`, error as Error);
      return {
        delivered: false,
        fallback: true,
      };
    }
  }
}

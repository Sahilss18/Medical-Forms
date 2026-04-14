import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SMTP/provider integration can be plugged in here.
    // For now we log email dispatch so OTP/payment flows work in demo environments.
    this.logger.log(`Email queued to ${to} | Subject: ${subject}`);
    this.logger.debug(`Email body: ${body}`);
  }
}

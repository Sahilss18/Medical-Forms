import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { NotificationsService } from '../notifications/notifications.service';

type OtpEntry = {
  otp: string;
  expiresAt: number;
  attempts: number;
};

@Injectable()
export class PaymentsService {
  private readonly otpStore = new Map<string, OtpEntry>();
  private readonly otpVerifiedOrders = new Set<string>();

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    private notificationsService: NotificationsService,
  ) {}

  private buildOtpKey(orderId: string, email: string): string {
    return `${orderId}:${email.trim().toLowerCase()}`;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async resolveInstitutionEmail(
    userId: string,
  ): Promise<string | null> {
    const institution = await this.institutionRepository.findOne({
      where: { user_id: userId },
    });

    return institution?.contact_email || null;
  }

  async sendPaymentOtp(
    userId: string,
    orderId: string,
    email: string,
  ): Promise<{ expiresInSeconds: number }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required to send OTP');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { razorpay_order_id: orderId, user_id: userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment order not found');
    }

    const institutionEmail = await this.resolveInstitutionEmail(userId);
    if (
      institutionEmail &&
      institutionEmail.trim().toLowerCase() !== normalizedEmail
    ) {
      throw new BadRequestException(
        'OTP can be sent only to institution contact email',
      );
    }

    const otp = this.generateOtp();
    const expiresInSeconds = 300;
    const key = this.buildOtpKey(orderId, normalizedEmail);

    this.otpStore.set(key, {
      otp,
      expiresAt: Date.now() + expiresInSeconds * 1000,
      attempts: 0,
    });

    await this.notificationsService.sendEmail(
      normalizedEmail,
      'Payment OTP Verification',
      `Your OTP for payment is ${otp}. It is valid for 5 minutes.`,
    );

    return { expiresInSeconds };
  }

  async verifyPaymentOtp(
    userId: string,
    orderId: string,
    email: string,
    otp: string,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const key = this.buildOtpKey(orderId, normalizedEmail);

    const payment = await this.paymentsRepository.findOne({
      where: { razorpay_order_id: orderId, user_id: userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment order not found');
    }

    const entry = this.otpStore.get(key);
    if (!entry) {
      throw new BadRequestException('OTP not found. Please request OTP again.');
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(key);
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }

    if (entry.otp !== otp.trim()) {
      entry.attempts += 1;
      if (entry.attempts >= 5) {
        this.otpStore.delete(key);
        throw new BadRequestException(
          'Too many invalid OTP attempts. Request OTP again.',
        );
      }
      this.otpStore.set(key, entry);
      throw new BadRequestException('Invalid OTP');
    }

    this.otpVerifiedOrders.add(orderId);
    this.otpStore.delete(key);
  }

  private async sendPaymentSuccessEmail(payment: Payment): Promise<void> {
    try {
      const institutionEmail = await this.resolveInstitutionEmail(
        payment.user_id,
      );
      if (!institutionEmail) {
        return;
      }

      await this.notificationsService.sendEmail(
        institutionEmail,
        'Payment Successful - Medical Forms Portal',
        `Your payment for ${payment.form_code} was successful. Order ID: ${payment.order_id}. Payment ID: ${payment.razorpay_payment_id || 'N/A'}.`,
      );
    } catch (error) {
      // Do not fail payment flow if notification dispatch fails.
      console.error('Failed to send payment success email:', error);
    }
  }

  /**
   * Create a new payment order
   */
  async createOrder(
    userId: string,
    formCode: string,
    amount: number,
    applicationId?: string,
  ): Promise<Payment> {
    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, you would integrate with Razorpay API to create actual order
    const razorpayOrderId = `rzp_test_${Math.random().toString(36).substr(2, 16)}`;

    const payment = this.paymentsRepository.create({
      order_id: orderId,
      razorpay_order_id: razorpayOrderId,
      amount,
      currency: 'INR',
      form_code: formCode,
      status: 'pending',
      user_id: userId,
      application_id: applicationId,
    });

    return await this.paymentsRepository.save(payment);
  }

  /**
   * Verify payment signature from Razorpay
   */
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    // In production, verify using your Razorpay secret key
    // const secret = process.env.RAZORPAY_KEY_SECRET;
    // const generatedSignature = crypto
    //   .createHmac('sha256', secret)
    //   .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    //   .digest('hex');
    // return generatedSignature === razorpaySignature;

    // Keep parameters referenced in demo mode to satisfy strict linting.
    void `${razorpayOrderId}|${razorpayPaymentId}|${razorpaySignature}`;

    // For demo purposes, always return true
    return true;
  }

  /**
   * Update payment status after verification
   */
  async updatePaymentStatus(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    applicationId?: string,
  ): Promise<Payment> {
    console.log('Verifying payment for order:', razorpayOrderId);

    // Verify signature
    const isValid = this.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    if (!this.otpVerifiedOrders.has(razorpayOrderId)) {
      throw new BadRequestException(
        'OTP verification is required before payment',
      );
    }

    // Find payment by order ID
    const payment = await this.paymentsRepository.findOne({
      where: { razorpay_order_id: razorpayOrderId, user_id: userId },
    });

    console.log('Payment found:', payment ? `Yes (ID: ${payment.id})` : 'No');

    if (!payment) {
      // List all recent payments for debugging
      const recentPayments = await this.paymentsRepository.find({
        order: { created_at: 'DESC' },
        take: 5,
      });
      console.log(
        'Recent payments:',
        recentPayments.map((p) => ({
          id: p.id,
          razorpay_order_id: p.razorpay_order_id,
          status: p.status,
        })),
      );
      throw new Error(`Payment not found for order ID: ${razorpayOrderId}`);
    }

    // Update payment
    payment.razorpay_payment_id = razorpayPaymentId;
    payment.razorpay_signature = razorpaySignature;
    payment.status = 'success';

    if (applicationId) {
      payment.application_id = applicationId;
    }
    const updatedPayment = await this.paymentsRepository.save(payment);
    this.otpVerifiedOrders.delete(razorpayOrderId);
    await this.sendPaymentSuccessEmail(updatedPayment);

    return updatedPayment;
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string): Promise<Payment[]> {
    return await this.paymentsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      relations: ['application'],
    });
  }

  /**
   * Get payment by application ID
   */
  async getPaymentByApplicationId(
    applicationId: string,
  ): Promise<Payment | null> {
    return await this.paymentsRepository.findOne({
      where: { application_id: applicationId },
      relations: ['user'],
    });
  }

  /**
   * Get payment by payment ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['application', 'user'],
    });
  }

  /**
   * Mark payment as failed
   */
  async markPaymentFailed(orderId: string, reason?: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { order_id: orderId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = 'failed';
    if (reason) {
      payment.notes = reason;
    }

    return await this.paymentsRepository.save(payment);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

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

    // For demo purposes, always return true
    return true;
  }

  /**
   * Update payment status after verification
   */
  async updatePaymentStatus(
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

    // Find payment by order ID
    const payment = await this.paymentsRepository.findOne({
      where: { razorpay_order_id: razorpayOrderId },
    });

    console.log('Payment found:', payment ? `Yes (ID: ${payment.id})` : 'No');

    if (!payment) {
      // List all recent payments for debugging
      const recentPayments = await this.paymentsRepository.find({
        order: { created_at: 'DESC' as any },
        take: 5,
      });
      console.log('Recent payments:', recentPayments.map(p => ({
        id: p.id,
        razorpay_order_id: p.razorpay_order_id,
        status: p.status,
      })));
      throw new Error(`Payment not found for order ID: ${razorpayOrderId}`);
    }

    // Update payment
    payment.razorpay_payment_id = razorpayPaymentId;
    payment.razorpay_signature = razorpaySignature;
    payment.status = 'success';
    
    if (applicationId) {
      payment.application_id = applicationId;
    }

    return await this.paymentsRepository.save(payment);
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string): Promise<Payment[]> {
    return await this.paymentsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' as any },
      relations: ['application'],
    });
  }

  /**
   * Get payment by application ID
   */
  async getPaymentByApplicationId(applicationId: string): Promise<Payment | null> {
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
      where: { id: paymentId } as any,
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

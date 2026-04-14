import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = {
  user: {
    userId: string;
  };
};

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a payment order
   */
  @Post('create-order')
  async createOrder(
    @Request() req: AuthRequest,
    @Body() body: { formCode: string; amount: number; applicationId?: string },
  ) {
    const payment = await this.paymentsService.createOrder(
      req.user.userId,
      body.formCode,
      body.amount,
      body.applicationId,
    );

    return {
      id: payment.id,
      orderId: payment.razorpay_order_id,
      amount: Number(payment.amount),
      currency: payment.currency,
      formCode: payment.form_code,
      status: payment.status,
      applicationId: payment.application_id,
      createdAt: payment.created_at,
    };
  }

  /**
   * Verify payment after Razorpay callback
   */
  @Post('verify')
  async verifyPayment(
    @Request() req: AuthRequest,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      applicationId?: string;
    },
  ) {
    try {
      console.log('\n=== PAYMENT VERIFICATION REQUEST ===');
      console.log('Body:', JSON.stringify(body, null, 2));

      const payment = await this.paymentsService.updatePaymentStatus(
        req.user.userId,
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
        body.applicationId,
      );

      console.log('Payment verified successfully:', payment.id);
      console.log('=== VERIFICATION SUCCESS ===\n');

      return {
        success: true,
        message: 'Payment verified successfully',
        applicationId: payment.application_id,
        paymentId: payment.id,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Payment verification failed';
      const stack = error instanceof Error ? error.stack : undefined;

      console.error('\n=== PAYMENT VERIFICATION ERROR ===');
      console.error('Error:', message);
      console.error('Stack:', stack);
      console.error('=== END ERROR ===\n');

      return {
        success: false,
        message,
      };
    }
  }

  @Post('send-otp')
  async sendOtp(
    @Request() req: AuthRequest,
    @Body() body: { orderId: string; email: string },
  ) {
    const result = await this.paymentsService.sendPaymentOtp(
      req.user.userId,
      body.orderId,
      body.email,
    );

    return {
      success: true,
      message: result.delivered
        ? 'OTP sent successfully'
        : 'OTP generated. Email delivery fallback is active.',
      ...result,
    };
  }

  @Post('verify-otp')
  async verifyOtp(
    @Request() req: AuthRequest,
    @Body() body: { orderId: string; email: string; otp: string },
  ) {
    await this.paymentsService.verifyPaymentOtp(
      req.user.userId,
      body.orderId,
      body.email,
      body.otp,
    );

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Get payment history for current user
   */
  @Get('history')
  async getPaymentHistory(@Request() req: AuthRequest) {
    const payments = await this.paymentsService.getPaymentHistory(
      req.user.userId,
    );

    return payments.map((payment) => ({
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      formCode: payment.form_code,
      status: payment.status,
      applicationId: payment.application_id,
      createdAt: payment.created_at,
      paymentId: payment.razorpay_payment_id,
    }));
  }

  /**
   * Get payment details by application ID
   */
  @Get('application/:applicationId')
  async getPaymentByApplicationId(
    @Param('applicationId') applicationId: string,
  ) {
    const payment =
      await this.paymentsService.getPaymentByApplicationId(applicationId);

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    return {
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      formCode: payment.form_code,
      status: payment.status,
      applicationId: payment.application_id,
      createdAt: payment.created_at,
      paymentId: payment.razorpay_payment_id,
    };
  }
}

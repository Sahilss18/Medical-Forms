import { apiClient } from './api';
import {
  CreatePaymentOrderResponse,
  VerifyPaymentResponse,
  PaymentVerification,
} from '@/types/payment';

export const paymentService = {
  /**
   * Create a payment order
   */
  async createOrder(
    formCode: string,
    amount: number,
    applicationId?: string
  ): Promise<CreatePaymentOrderResponse> {
    try {
      const response = await apiClient.post('/payments/create-order', {
        formCode,
        amount,
        applicationId,
      });
      return { success: true, data: response.data as any };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create payment order',
      };
    }
  },

  /**
   * Verify payment after Razorpay callback
   */
  async verifyPayment(
    paymentData: PaymentVerification,
    applicationId?: string
  ): Promise<VerifyPaymentResponse> {
    try {
      const response = await apiClient.post<{
        success?: boolean;
        message?: string;
        applicationId?: string;
      }>('/payments/verify', {
        ...paymentData,
        applicationId,
      });

      const payload = (response.data || response) as {
        success?: boolean;
        message?: string;
        applicationId?: string;
      };

      return {
        success: response.success && payload.success !== false,
        message: payload.message || response.message || 'Payment verified successfully',
        applicationId: payload.applicationId || applicationId,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment verification failed',
      };
    }
  },

  async sendOtp(orderId: string, email: string): Promise<{ success: boolean; message?: string; expiresInSeconds?: number }> {
    try {
      const response = await apiClient.post<{ expiresInSeconds: number }>('/payments/send-otp', {
        orderId,
        email,
      });

      const payload = (response.data || response) as {
        expiresInSeconds?: number;
      };

      return {
        success: response.success,
        message: response.message,
        expiresInSeconds: payload.expiresInSeconds,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  },

  async verifyOtp(orderId: string, email: string, otp: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/payments/verify-otp', {
        orderId,
        email,
        otp,
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
      };
    }
  },

  /**
   * Get payment history for current user
   */
  async getPaymentHistory(): Promise<any> {
    try {
      const response = await apiClient.get('/payments/history');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch payment history',
      };
    }
  },

  /**
   * Get payment details by application ID
   */
  async getPaymentByApplicationId(applicationId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/payments/application/${applicationId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Payment not found',
      };
    }
  },
};

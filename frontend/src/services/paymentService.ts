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
      console.log('Calling verify API with:', { paymentData, applicationId });
      const response = await apiClient.post('/payments/verify', {
        ...paymentData,
        applicationId,
      });
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      const data = response?.data || response;
      console.log('Parsed data:', data);
      
      return {
        success: data?.success !== false,
        message: data?.message || 'Payment verified successfully',
        applicationId: data?.applicationId || applicationId,
      };
    } catch (error: any) {
      console.error('Verify API error:', error);
      console.error('Error response:', error.response);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment verification failed',
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

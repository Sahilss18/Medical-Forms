export interface PaymentOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  applicationId?: string;
  formCode: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreatePaymentOrderResponse {
  success: boolean;
  data?: PaymentOrder;
  message?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  applicationId?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: PaymentVerification) => void;
  modal?: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

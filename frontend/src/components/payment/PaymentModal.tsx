import React, { useEffect, useState } from 'react';
import { X, CreditCard, Shield, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { paymentService } from '@/services/paymentService';
import { getFormByCode } from '@/constants/forms';
import { PaymentVerification } from '@/types/payment';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formCode: string;
  amount: number;
  applicationId?: string;
  onSuccess: (paymentId: string, applicationId?: string) => void;
  userDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  formCode,
  amount,
  applicationId,
  onSuccess,
  userDetails,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const form = getFormByCode(formCode);
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_key';
  const isDemoMode = razorpayKey === 'rzp_test_dummy_key' || razorpayKey.includes('dummy');

  // Load Razorpay script only if not in demo mode
  useEffect(() => {
    if (isDemoMode) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isDemoMode]);

  const handlePayment = async () => {
    if (!isScriptLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment order
      const orderResponse = await paymentService.createOrder(formCode, amount, applicationId);

      console.log('Order creation response:', orderResponse);

      if (!orderResponse.success || !orderResponse.data) {
        toast.error(orderResponse.message || 'Failed to create payment order');
        setIsProcessing(false);
        return;
      }

      const order = orderResponse.data;
      console.log('Order details:', order);

      // DEMO MODE - Simulate payment without Razorpay
      if (isDemoMode) {
        console.log('Demo mode activated - simulating payment');
        toast.loading('Processing payment...', { duration: 2000 });
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create mock payment response
        const mockPaymentResponse: PaymentVerification = {
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature_' + Math.random().toString(36).substr(2, 9),
        };

        console.log('Mock payment response:', mockPaymentResponse);
        console.log('Demo payment successful - bypassing backend verification');

        // In demo mode, skip backend verification and directly call success
        toast.success('Payment successful!');
        onSuccess(mockPaymentResponse.razorpay_payment_id, applicationId);
        onClose();
        setIsProcessing(false);
        return;
      }

      // PRODUCTION MODE - Use actual Razorpay
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Medical Forms Portal',
        description: `Payment for ${form?.title || formCode}`,
        order_id: order.orderId,
        prefill: {
          name: userDetails?.name || '',
          email: userDetails?.email || '',
          contact: userDetails?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response: PaymentVerification) => {
          // Payment successful - verify on backend
          const verifyResponse = await paymentService.verifyPayment(response, applicationId);

          if (verifyResponse.success) {
            toast.success('Payment successful!');
            onSuccess(response.razorpay_payment_id, verifyResponse.applicationId);
            onClose();
          } else {
            toast.error(verifyResponse.message || 'Payment verification failed');
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error('Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Payment Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Form Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {form?.title || `Form ${formCode}`}
                  </h3>
                  <p className="text-sm text-gray-600">{form?.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 text-center">
              <p className="text-sm font-medium mb-2">Application Fee</p>
              <p className="text-4xl font-bold">{form?.fees || `₹${amount}`}</p>
              <p className="text-sm text-blue-100 mt-2">Inclusive of all taxes</p>
            </div>

            {/* Security Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secured by Razorpay Payment Gateway</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4 text-green-600" />
                <span>256-bit SSL Encrypted Transaction</span>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Payment is required to submit your application</li>
                  <li>Your application will be processed only after successful payment</li>
                  <li>Payment receipt will be sent to your registered email</li>
                  <li>Refunds are subject to government policy</li>
                </ul>
              </div>
            </div>

            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Demo Mode Active</p>
                  <p>
                    You're using demo mode. Payment will be simulated without actual transaction.
                    For production, configure a real Razorpay API key.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !isScriptLoaded}
              className="min-w-[150px]"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

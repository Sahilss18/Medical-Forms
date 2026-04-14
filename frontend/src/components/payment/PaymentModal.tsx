import React, { useEffect, useState } from 'react';
import { X, CreditCard, AlertCircle, ChevronLeft, MapPin, Wallet, Landmark, Smartphone } from 'lucide-react';
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
  const amountInRupees = Number.isFinite(amount) ? amount / 100 : 0;
  const displayAmount = `₹${amountInRupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
          color: '#ff6a00',
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#efe3cf]">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/35 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-[#f7f7f7] rounded-[28px] shadow-2xl max-w-md w-full border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5">
            <div className="w-9 h-9 rounded-xl bg-[#edeef2] flex items-center justify-center text-gray-600">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#edeef2] flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-5 space-y-4">
            <div className="rounded-2xl bg-white p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Shipping to</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eceff4] flex items-center justify-center text-gray-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{userDetails?.name || 'Applicant'}</p>
                  <p className="text-xs text-gray-500">{userDetails?.email || 'Registered email will receive receipt'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-3">Add Payment Method</p>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#ff6a00]" />
                </div>
                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#1f6feb]" />
                </div>
                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-gray-700" />
                </div>
                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#16a34a]" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-[#ffb170] to-[#ff6a00] p-4 text-white shadow-md">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-semibold tracking-wider">APPLICATION FEE</p>
                <p className="text-[10px] opacity-90">SECURE PAYMENT</p>
              </div>
              <p className="text-2xl font-semibold tracking-wide mb-3">{displayAmount}</p>
              <div className="flex items-center justify-between text-xs opacity-95">
                <p>{form?.code ? `Form ${form.code}` : `Form ${formCode}`}</p>
                <p>{applicationId ? `ID: ${applicationId.slice(0, 8)}` : 'New Application'}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-gray-100">
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span>Form</span>
                <span className="font-medium text-gray-900">{form?.title || `Form ${formCode}`}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700 mt-2">
                <span>Total Payment</span>
                <span className="font-semibold text-gray-900">{displayAmount}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important</p>
                <p>Payment is mandatory before submission. Receipt and status updates are sent via email/SMS.</p>
              </div>
            </div>

            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
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
          <div className="px-5 pb-5 pt-1 flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1 h-12 rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !isScriptLoaded}
              className="flex-1 h-12 rounded-xl bg-[#ff6a00] hover:bg-[#eb6200] text-white"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Order
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

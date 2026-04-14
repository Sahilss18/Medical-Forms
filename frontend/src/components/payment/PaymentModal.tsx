import React, { useEffect, useMemo, useState } from 'react';
import { X, CreditCard, AlertCircle, ChevronLeft, MapPin, Wallet, Landmark, Smartphone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { paymentService } from '@/services/paymentService';
import { getFormByCode } from '@/constants/forms';
import { PaymentOrder, PaymentVerification } from '@/types/payment';
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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpExpiryTs, setOtpExpiryTs] = useState<number | null>(null);
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);

  const form = getFormByCode(formCode);
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_key';
  const isDemoMode = razorpayKey === 'rzp_test_dummy_key' || razorpayKey.includes('dummy');
  const amountInRupees = Number.isFinite(amount) ? amount / 100 : 0;
  const displayAmount = `₹${amountInRupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const otpTimeLeft = useMemo(() => {
    if (!otpExpiryTs) return 0;
    const diff = Math.floor((otpExpiryTs - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }, [otpExpiryTs]);

  useEffect(() => {
    if (!isOpen) return;
    setInstitutionEmail(userDetails?.email || '');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpExpiryTs(null);
    setCurrentOrder(null);
  }, [isOpen, userDetails?.email]);

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

  const ensureOrder = async (): Promise<PaymentOrder | null> => {
    if (currentOrder) {
      return currentOrder;
    }

    const orderResponse = await paymentService.createOrder(formCode, amount, applicationId);
    if (!orderResponse.success || !orderResponse.data) {
      toast.error(orderResponse.message || 'Failed to create payment order');
      return null;
    }

    setCurrentOrder(orderResponse.data);
    return orderResponse.data;
  };

  const processPayment = async (order: PaymentOrder) => {
    if (!isScriptLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      if (isDemoMode) {
        toast.loading('Processing payment...', { duration: 2000 });
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const mockPaymentResponse: PaymentVerification = {
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: `demo_signature_${Math.random().toString(36).substr(2, 9)}`,
        };

        const verifyResponse = await paymentService.verifyPayment(
          mockPaymentResponse,
          applicationId,
        );

        if (verifyResponse.success) {
          toast.success('Payment successful!');
          onSuccess(mockPaymentResponse.razorpay_payment_id, verifyResponse.applicationId);
          onClose();
        } else {
          toast.error(verifyResponse.message || 'Payment verification failed');
        }

        setIsProcessing(false);
        return;
      }

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

  const handlePayment = async () => {
    if (!institutionEmail.trim()) {
      toast.error('Enter institution contact email to continue');
      return;
    }

    const order = await ensureOrder();
    if (!order) {
      return;
    }

    if (!otpSent) {
      setIsSendingOtp(true);
      const otpResponse = await paymentService.sendOtp(
        order.orderId,
        institutionEmail.trim(),
      );
      setIsSendingOtp(false);

      if (!otpResponse.success) {
        toast.error(otpResponse.message || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setOtpVerified(false);
      setOtp('');
      const ttlSeconds = otpResponse.expiresInSeconds || 300;
      setOtpExpiryTs(Date.now() + ttlSeconds * 1000);
      if (otpResponse.delivered === false && otpResponse.debugOtp) {
        toast.success(`OTP generated (email fallback): ${otpResponse.debugOtp}`);
      } else {
        toast.success('OTP sent to institution contact email');
      }
      return;
    }

    if (!otpVerified) {
      if (!otp.trim()) {
        toast.error('Enter OTP to verify');
        return;
      }

      setIsVerifyingOtp(true);
      const verifyOtpResponse = await paymentService.verifyOtp(
        order.orderId,
        institutionEmail.trim(),
        otp.trim(),
      );
      setIsVerifyingOtp(false);

      if (!verifyOtpResponse.success) {
        toast.error(verifyOtpResponse.message || 'OTP verification failed');
        return;
      }

      setOtpVerified(true);
      toast.success('OTP verified. You can complete payment now.');
      return;
    }

    await processPayment(order);
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

            <div className="rounded-2xl bg-white p-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-3">Email OTP Verification</p>
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={institutionEmail}
                    onChange={(e) => setInstitutionEmail(e.target.value)}
                    disabled={otpVerified || isProcessing || isSendingOtp || isVerifyingOtp}
                    placeholder="Institution contact email"
                    className="w-full h-11 rounded-xl border border-gray-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={otpVerified || isProcessing || isVerifyingOtp}
                      placeholder="Enter 6-digit OTP"
                      className="w-full h-11 rounded-xl border border-gray-300 px-3 text-sm tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{otpVerified ? 'OTP verified successfully' : 'Enter OTP sent to your email'}</span>
                      {!otpVerified && otpTimeLeft > 0 && <span>{`Expires in ${otpTimeLeft}s`}</span>}
                    </div>
                  </div>
                )}
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
                <p>Payment is mandatory before submission. OTP verification is required before payment.</p>
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
              disabled={isProcessing || isSendingOtp || isVerifyingOtp || !isScriptLoaded}
              className="flex-1 h-12 rounded-xl bg-[#ff6a00] hover:bg-[#eb6200] text-white"
            >
              {isProcessing || isSendingOtp || isVerifyingOtp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isSendingOtp ? 'Sending OTP...' : isVerifyingOtp ? 'Verifying OTP...' : 'Processing...'}
                </>
              ) : (
                <>
                  {!otpSent ? 'Send OTP' : !otpVerified ? 'Verify OTP' : 'Confirm Order'}
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

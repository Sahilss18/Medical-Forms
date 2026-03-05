import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { OTPVerification } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type OTPFormData = z.infer<typeof otpSchema>;

const OTPVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OTPFormData) => {
    try {
      setIsLoading(true);
      const payload: OTPVerification = {
        email: data.email,
        otp: data.otp,
      };
      const response = await authService.verifyOTP(payload);

      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        toast.success('Verification successful!');

        const roleRedirects = {
          applicant: '/applicant/dashboard',
          inspector: '/inspector/dashboard',
          officer: '/officer/dashboard',
          admin: '/admin/dashboard',
        };
        const roleKey = String(response.data.user.role || '').toLowerCase() as keyof typeof roleRedirects;
        navigate(roleRedirects[roleKey] || '/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
            Verify OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the OTP sent to your registered email
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              error={errors.email?.message}
              required
            />

            <Input
              {...register('otp')}
              type="text"
              label="OTP"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              error={errors.otp?.message}
              required
            />
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Verify OTP
            </Button>
          </div>

          <div className="text-sm text-center space-y-2">
            <p className="text-gray-600">Didn't receive the code?</p>
            <button
              type="button"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerificationPage;

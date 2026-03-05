import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data);

      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        toast.success('Login successful!');

        const roleRedirects: Record<string, string> = {
          APPLICANT: '/applicant/dashboard',
          INSPECTOR: '/inspector/dashboard',
          OFFICER: '/officer/dashboard',
          ADMIN: '/admin/dashboard',
          applicant: '/applicant/dashboard',
          inspector: '/inspector/dashboard',
          officer: '/officer/dashboard',
          admin: '/admin/dashboard',
        };
        navigate(roleRedirects[response.data.user.role]);
      }
    } catch (error: any) {
      toast.error(error?.message || error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float 8s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-slide-in { animation: slide-in 0.6s ease-out; }
      `}</style>

      <div className="min-h-screen flex">
        {/* Left Panel - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-40 right-20 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-300/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </div>

          {/* Medical Illustration */}
          <div className="relative z-10 w-full flex flex-col items-center justify-center p-12">
            <div className="mb-8 animate-slide-in">
              <h2 className="text-4xl font-bold text-white mb-3">Medical Institution</h2>
              <h3 className="text-3xl font-bold text-cyan-100">Recognition Portal</h3>
              <p className="text-blue-100 mt-4 text-lg">Streamlined certification & compliance management</p>
            </div>

            <svg viewBox="0 0 600 500" className="w-full max-w-lg" xmlns="http://www.w3.org/2000/svg">
              {/* Hospital Building */}
              <g className="animate-float">
                <rect x="180" y="180" width="240" height="180" fill="#FFFFFF" rx="8" />
                <rect x="180" y="180" width="240" height="40" fill="#3B82F6" rx="8" />
                <text x="300" y="205" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">MEDICAL CENTER</text>
                
                {/* Windows */}
                <rect x="210" y="240" width="40" height="40" fill="#DBEAFE" rx="4" />
                <rect x="280" y="240" width="40" height="40" fill="#DBEAFE" rx="4" />
                <rect x="350" y="240" width="40" height="40" fill="#DBEAFE" rx="4" />
                <rect x="210" y="300" width="40" height="40" fill="#DBEAFE" rx="4" />
                <rect x="280" y="300" width="40" height="40" fill="#DBEAFE" rx="4" />
                <rect x="350" y="300" width="40" height="40" fill="#DBEAFE" rx="4" />
                
                {/* Door */}
                <rect x="270" y="320" width="60" height="40" fill="#3B82F6" rx="4" />
                
                {/* Medical Cross on roof */}
                <circle cx="300" cy="160" r="20" fill="#EF4444" />
                <rect x="295" y="150" width="10" height="20" fill="white" />
                <rect x="290" y="155" width="20" height="10" fill="white" />
              </g>

              {/* Doctor Figure */}
              <g className="animate-float-delay">
                <circle cx="120" cy="280" r="20" fill="#FCD34D" />
                <rect x="105" y="300" width="30" height="50" fill="#FFFFFF" rx="4" />
                <rect x="100" y="310" width="40" height="30" fill="#3B82F6" rx="4" />
                <line x1="105" y1="315" x2="85" y2="330" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
                <line x1="135" y1="315" x2="155" y2="330" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
                {/* Clipboard */}
                <rect x="145" y="325" width="15" height="20" fill="#E5E7EB" rx="2" />
                <line x1="148" y1="330" x2="157" y2="330" stroke="#3B82F6" strokeWidth="1" />
                <line x1="148" y1="335" x2="157" y2="335" stroke="#3B82F6" strokeWidth="1" />
              </g>

              {/* Inspector with checklist */}
              <g className="animate-float" style={{ animationDelay: '1s' }}>
                <circle cx="480" cy="280" r="20" fill="#FCD34D" />
                <rect x="465" y="300" width="30" height="50" fill="#FFFFFF" rx="4" />
                <rect x="460" y="310" width="40" height="30" fill="#10B981" rx="4" />
                {/* Magnifying glass */}
                <circle cx="520" cy="290" r="15" fill="none" stroke="#3B82F6" strokeWidth="3" />
                <line x1="530" y1="300" x2="545" y2="315" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* Certificate Document with checkmark */}
              <g className="animate-float-delay" style={{ animationDelay: '1.5s' }}>
                <rect x="240" y="80" width="120" height="80" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="3" rx="6" />
                <rect x="240" y="80" width="120" height="20" fill="#3B82F6" />
                <line x1="260" y1="120" x2="340" y2="120" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round" />
                <line x1="260" y1="135" x2="320" y2="135" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round" />
                {/* Seal */}
                <circle cx="330" cy="145" r="12" fill="#EF4444" opacity="0.3" />
                <circle cx="330" cy="145" r="8" fill="#EF4444" />
                {/* Checkmark */}
                <polyline points="275,105 285,115 305,95" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Stethoscope */}
              <g className="animate-pulse-slow">
                <path d="M 80 200 Q 100 220 80 240" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                <circle cx="80" cy="200" r="8" fill="#3B82F6" />
                <circle cx="80" cy="240" r="12" fill="#3B82F6" />
              </g>

              {/* Floating approval stamps */}
              <g className="animate-float" style={{ animationDelay: '0.5s' }}>
                <circle cx="500" cy="150" r="25" fill="#10B981" opacity="0.9" />
                <text x="500" y="158" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">✓</text>
              </g>

              {/* Data/Analytics lines */}
              <g opacity="0.6">
                <polyline points="50,400 100,380 150,390 200,360" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="400" r="4" fill="#FFFFFF" />
                <circle cx="100" cy="380" r="4" fill="#FFFFFF" />
                <circle cx="150" cy="390" r="4" fill="#FFFFFF" />
                <circle cx="200" cy="360" r="4" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Feature Pills */}
            <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg">
              {[
                { icon: '🏥', text: 'Institution Licensing' },
                { icon: '🔍', text: 'Digital Inspections' },
                { icon: '📜', text: 'Certificate Issuance' },
                { icon: '📊', text: 'Compliance Tracking' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 animate-slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">MIR Portal</h2>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 animate-slide-in">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h3>
                <p className="text-gray-500">Sign in to access your portal dashboard</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                        errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                        errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">New to the portal?</span>
                </div>
              </div>

              {/* Register Link */}
              <Link
                to="/register"
                className="block w-full py-3.5 px-4 border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 font-semibold rounded-xl text-center transition-all duration-200"
              >
                Create an account
              </Link>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-semibold text-blue-800 mb-2">🔑 Demo Credentials</p>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>admin@gov.in</span>
                    <span className="text-gray-500">password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>applicant@test.com</span>
                    <span className="text-gray-500">password123</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-gray-500">
              © 2026 Government of India · Ministry of Health & Family Welfare
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

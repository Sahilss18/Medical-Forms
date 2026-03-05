import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['APPLICANT', 'INSPECTOR', 'OFFICER', 'ADMIN']),
  district: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'APPLICANT',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const { confirmPassword, ...registerData } = data;
      
      const response = await authService.register(registerData);

      if (response.success && response.data) {
        toast.success('Registration successful!');
        login(response.data.user, response.data.token);

        const roleRedirects: Record<string, string> = {
          APPLICANT: '/applicant/dashboard',
          INSPECTOR: '/inspector/dashboard',
          OFFICER: '/officer/dashboard',
          ADMIN: '/admin/dashboard',
        };
        navigate(roleRedirects[data.role]);
      }
    } catch (error: any) {
      toast.error(error?.message || error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'APPLICANT', label: 'Medical Institution', icon: '🏥', color: 'blue', desc: 'Apply for recognition' },
    { value: 'INSPECTOR', label: 'Inspector', icon: '🔍', color: 'green', desc: 'Conduct inspections' },
    { value: 'OFFICER', label: 'Licensing Officer', icon: '⚖️', color: 'purple', desc: 'Review applications' },
    { value: 'ADMIN', label: 'Administrator', icon: '🛡️', color: 'red', desc: 'System management' },
  ];

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
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes draw-line {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float 8s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-slide-in-left { animation: slide-in-left 0.6s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out; }
      `}</style>

      <div className="min-h-screen flex">
        {/* Left Panel - Registration Journey Illustration */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
          {/* Animated background */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-purple-300/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 w-full flex flex-col items-center justify-center p-12">
            <div className="mb-8 text-center animate-slide-in-left">
              <h2 className="text-4xl font-bold text-white mb-3">Join the Portal</h2>
              <p className="text-purple-100 text-lg">Start your digital healthcare compliance journey</p>
            </div>

            <svg viewBox="0 0 600 450" className="w-full max-w-lg mb-8" xmlns="http://www.w3.org/2000/svg">
              {/* Registration Flow Path */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#FFFFFF" />
                </marker>
              </defs>

              {/* Connection Lines */}
              <path d="M 100 100 Q 200 100 250 150" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5,5" opacity="0.4" markerEnd="url(#arrowhead)" />
              <path d="M 350 150 Q 400 150 450 200" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5,5" opacity="0.4" markerEnd="url(#arrowhead)" />
              <path d="M 450 280 Q 400 330 300 340" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5,5" opacity="0.4" markerEnd="url(#arrowhead)" />

              {/* Step 1: User Registration */}
              <g className="animate-float">
                <circle cx="100" cy="100" r="50" fill="#FFFFFF" opacity="0.95" />
                <circle cx="100" cy="100" r="40" fill="#8B5CF6" />
                <text x="100" y="110" textAnchor="middle" fill="white" fontSize="36">📝</text>
                <text x="100" y="170" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Register</text>
              </g>

              {/* Step 2: Role Selection */}
              <g className="animate-float-delay" style={{ animationDelay: '0.5s' }}>
                <circle cx="300" cy="150" r="50" fill="#FFFFFF" opacity="0.95" />
                <circle cx="300" cy="150" r="40" fill="#EC4899" />
                <g>
                  <text x="290" y="155" fontSize="18">👤</text>
                  <text x="305" y="155" fontSize="18">🏥</text>
                </g>
                <text x="300" y="220" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Select Role</text>
              </g>

              {/* Step 3: Document Upload */}
              <g className="animate-float" style={{ animationDelay: '1s' }}>
                <circle cx="500" cy="240" r="50" fill="#FFFFFF" opacity="0.95" />
                <circle cx="500" cy="240" r="40" fill="#6366F1" />
                <g>
                  <rect x="485" y="230" width="30" height="20" fill="white" rx="2" />
                  <line x1="490" y1="237" x2="510" y2="237" stroke="#6366F1" strokeWidth="2" />
                  <line x1="490" y1="243" x2="505" y2="243" stroke="#6366F1" strokeWidth="2" />
                </g>
                <text x="500" y="310" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Submit Docs</text>
              </g>

              {/* Step 4: Approval */}
              <g className="animate-float-delay" style={{ animationDelay: '1.5s' }}>
                <circle cx="300" cy="340" r="50" fill="#FFFFFF" opacity="0.95" />
                <circle cx="300" cy="340" r="40" fill="#10B981" />
                <text x="300" y="355" textAnchor="middle" fill="white" fontSize="36">✓</text>
                <text x="300" y="410" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Get Access</text>
              </g>

              {/* Role Icons Around */}
              <g className="animate-float">
                <circle cx="80" cy="300" r="30" fill="#FFFFFF" opacity="0.2" />
                <text x="80" y="310" textAnchor="middle" fontSize="28">🏥</text>
              </g>
              <g className="animate-float-delay">
                <circle cx="520" cy="120" r="30" fill="#FFFFFF" opacity="0.2" />
                <text x="520" y="130" textAnchor="middle" fontSize="28">🔍</text>
              </g>
              <g className="animate-float" style={{ animationDelay: '0.7s' }}>
                <circle cx="150" cy="380" r="30" fill="#FFFFFF" opacity="0.2" />
                <text x="150" y="390" textAnchor="middle" fontSize="28">⚖️</text>
              </g>

              {/* Floating Documents */}
              <g className="animate-float-delay">
                <rect x="50" y="200" width="60" height="80" fill="#FFFFFF" opacity="0.15" rx="4" />
              </g>
              <g className="animate-float" style={{ animationDelay: '1.3s' }}>
                <rect x="480" y="350" width="60" height="80" fill="#FFFFFF" opacity="0.15" rx="4" />
              </g>
            </svg>

            {/* Process Steps */}
            <div className="w-full max-w-lg space-y-4">
              {[
                { number: '01', title: 'Create Account', desc: 'Choose your role and fill details' },
                { number: '02', title: 'Complete Profile', desc: 'Add institution or personal info' },
                { number: '03', title: 'Start Application', desc: 'Submit documents for review' },
                { number: '04', title: 'Track Progress', desc: 'Monitor application status' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 text-white animate-slide-in-left" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{step.title}</h4>
                    <p className="text-purple-100 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-2xl mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            </div>

            {/* Registration Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 animate-slide-in-right">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h3>
                <p className="text-gray-500">Create your account to access the portal</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Name and Phone Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="Dr. John Doe"
                      className={`w-full px-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                        errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="9876543210"
                      className={`w-full px-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                        errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* Email */}
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
                        errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((role) => {
                      const isSelected = watch('role') === role.value;
                      return (
                        <label
                          key={role.value}
                          className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input type="radio" {...register('role')} value={role.value} className="sr-only" />
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{role.icon}</span>
                            <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                              {role.label}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{role.desc}</span>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
                </div>

                {/* Conditional District */}
                {(selectedRole === 'INSPECTOR' || selectedRole === 'OFFICER') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                    <input
                      {...register('district')}
                      type="text"
                      placeholder="e.g., Mumbai Suburban"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                    {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>}
                  </div>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars"
                        className={`w-full px-4 py-3 border-2 rounded-xl pr-10 text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                          errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          ) : (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm</label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat"
                        className={`w-full px-4 py-3 border-2 rounded-xl pr-10 text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                          errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showConfirmPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          ) : (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Already registered?</span>
                </div>
              </div>

              {/* Login Link */}
              <Link
                to="/login"
                className="block w-full py-3 px-4 border-2 border-gray-300 hover:border-indigo-600 text-gray-700 hover:text-indigo-600 font-semibold rounded-xl text-center transition-all duration-200"
              >
                Sign in to your account
              </Link>
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

export default RegisterPage;

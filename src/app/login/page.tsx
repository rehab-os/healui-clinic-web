'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setOtpSent,
  setOtpVerifying,
  loginStart,
  loginFailure,
} from '../../store/slices/auth.slice';
import ApiManager from '../../services/api';
import firebaseAuthService from '../../services/firebase-auth';
import { ConfirmationResult } from 'firebase/auth';
import { getDeviceInfo } from '../../utils/firebase-helper';
import { 
  Phone, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { otpSent, otpVerifying, loading, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      firebaseAuthService.cleanup();
    };
  }, []);

  const formatPhoneNumber = (value: string) => {
    // If trying to delete the +91 prefix, keep it
    if (value.length < 3) {
      return '+91';
    }
    
    // Remove all non-digits except the + at the beginning
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91
    if (!cleaned.startsWith('+91')) {
      const digits = cleaned.replace(/\D/g, '');
      if (digits.startsWith('91')) {
        return '+' + digits;
      }
      return '+91' + digits;
    }
    
    return cleaned;
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone) {
      setError('Phone number is required');
      return;
    }
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    
    try {
      dispatch(loginStart());
      
      // Initialize reCAPTCHA only when actually sending OTP
      firebaseAuthService.initializeRecaptcha();
      
      // Small delay to ensure reCAPTCHA is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send OTP via Firebase
      const confirmationResult = await firebaseAuthService.sendOTP(phone);
      setConfirmationResult(confirmationResult);
      
      dispatch(setOtpSent(true));
      dispatch(loginFailure());
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      dispatch(loginFailure());
      setError(error.message || 'Failed to send OTP. Please try again.');
      
      // Reset reCAPTCHA on certain errors
      if (error.message?.includes('too many attempts') || error.message?.includes('reCAPTCHA')) {
        firebaseAuthService.resetRecaptcha();
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedValue.length && index + i < 6; i++) {
        newOtp[index + i] = pastedValue[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex((val, i) => i >= index && !val);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      otpRefs.current[focusIndex]?.focus();
      
      // Auto-submit if all fields are filled
      if (newOtp.every(digit => digit)) {
        handleVerifyOTP(newOtp.join(''));
      }
      return;
    }

    // Regular input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all fields are filled
    if (newOtp.every(digit => digit)) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpString = otpValue || otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }
    
    if (!confirmationResult) {
      setError('Please request OTP first');
      return;
    }
    
    setError('');
    
    try {
      dispatch(setOtpVerifying(true));
      
      // Verify OTP with Firebase and get ID token
      const firebaseIdToken = await firebaseAuthService.verifyOTP(confirmationResult, otpString);
      
      // Send ID token to backend for verification and JWT generation
      const response = await ApiManager.login({ phone, firebaseIdToken });
      
      if (response.success) {
        // Login successful, redirect to dashboard
        router.push('/dashboard');
        return;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch(loginFailure());
      
      // Better error handling for mobile
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.message?.includes('fetch')) {
        // Network error - common on mobile when accessing localhost
        const { isMobile } = getDeviceInfo();
        if (isMobile) {
          errorMessage = 'Cannot connect to server. Please ensure you\'re using the correct network URL.';
        } else {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Login error:', error);
      setError(errorMessage);
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = () => {
    dispatch(setOtpSent(false));
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  // Show loading spinner if checking auth
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-healui-physio mx-auto" />
          <p className="mt-2 text-text-gray font-medium">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-healui-physio/5 via-white to-healui-primary/5 relative overflow-hidden">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
      {/* Background decoration - hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-healui-physio rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-healui-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-healui-accent rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="min-h-screen relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          {/* Desktop Background */}
          <div 
            className="hidden sm:block absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
            }}
          >
          </div>
          {/* Mobile Background - Physiotherapist working with patient */}
          <div 
            className="sm:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')`
            }}
          >
          </div>
        </div>
        
        {/* Overlay - Darker for mobile to improve readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/80 via-brand-black/60 to-brand-teal/90 sm:from-brand-black/70 sm:via-brand-black/50 sm:to-brand-teal/80"></div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Top Banner */}
          <div className="bg-black backdrop-blur-sm text-brand-white text-center py-2 sm:py-3 px-3 sm:px-4">
            <p className="text-xs sm:text-sm">
              Contact{' '}
              <a href="mailto:founders@healui.com" className="underline font-semibold">
                founders@healui.com
              </a>
              {' '}for your clinic
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm">
              {/* Logo Section */}
              <div className="text-center mb-4 sm:mb-8">
                <div className="relative w-32 h-20 sm:w-40 sm:h-28 mx-auto mb-3 sm:mb-6">
                  <Image
                    src="/healui-logo/Healui Logo Final-12.png"
                    alt="Healui Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-brand-white/90 text-base sm:text-lg font-medium mb-0.5 sm:mb-1 px-4">
                  Hello there, Movement Expert!
                </p>
                <p className="text-brand-white/70 text-xs sm:text-sm px-4">
                  Ready to make someone's day better?
                </p>
              </div>

              {/* Form Container */}
              <div className="bg-brand-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl">

                {/* Phone Number Form */}
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-5">
                    <div>
                      <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-brand-black/70 mb-1.5 sm:mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-black/40" />
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 sm:py-3.5 border border-brand-light-teal/60 rounded-xl focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all text-base bg-brand-white text-brand-black placeholder-brand-black/50"
                          placeholder="+91 98765 43210"
                          disabled={loading}
                          maxLength={13}
                          autoComplete="tel"
                          inputMode="tel"
                        />
                      </div>
                      {error && (
                        <div className="mt-1.5 sm:mt-2 flex items-center space-x-2 text-red-500 text-xs sm:text-sm">
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-teal hover:bg-brand-teal/90 text-brand-white py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Sending...
                        </span>
                      ) : (
                        'Get OTP'
                      )}
                    </button>

                    <p className="text-center text-xs text-brand-black/50">
                      By continuing, you agree to our{' '}
                      <a href="#" className="text-brand-teal underline">Terms</a>
                      {' '}and{' '}
                      <a href="#" className="text-brand-teal underline">Privacy Policy</a>
                    </p>
                  </form>
                ) : (
                  /* OTP Verification */
                  <div className="space-y-4 sm:space-y-5">
                    <button
                      onClick={handleResendOTP}
                      className="flex items-center space-x-2 text-brand-black/60 hover:text-brand-black transition-colors text-xs sm:text-sm"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Change phone number</span>
                    </button>

                    <div className="text-center py-2 sm:py-4">
                      <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-brand-teal mx-auto mb-2 sm:mb-3" />
                      <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-1 sm:mb-2">Enter Verification Code</h3>
                      <p className="text-xs sm:text-sm text-brand-black/60">
                        Code sent to <span className="font-medium text-brand-teal">{phone}</span>
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-center gap-1.5 sm:gap-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold border border-brand-light-teal/60 rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all bg-brand-white text-brand-black"
                            disabled={otpVerifying}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                      {error && (
                        <div className="flex items-center space-x-2 text-red-500 text-xs sm:text-sm">
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleVerifyOTP()}
                      disabled={otpVerifying || otp.some(digit => !digit)}
                      className="w-full bg-brand-teal hover:bg-brand-teal/90 text-brand-white py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-60"
                    >
                      {otpVerifying ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Verifying...
                        </span>
                      ) : (
                        'Verify & Login'
                      )}
                    </button>

                    <p className="text-center text-xs sm:text-sm text-brand-black/60">
                      Didn't receive the code?{' '}
                      <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="text-brand-teal hover:text-brand-teal/80 underline"
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" style={{ position: 'absolute', top: '-9999px' }}></div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes glitch {
          0% {
            text-shadow: 0.05em 0 0 rgba(16, 185, 129, 0.75), -0.05em -0.025em 0 rgba(8, 145, 178, 0.75),
              0.025em 0.05em 0 rgba(14, 165, 233, 0.75);
          }
          14% {
            text-shadow: 0.05em 0 0 rgba(16, 185, 129, 0.75), -0.05em -0.025em 0 rgba(8, 145, 178, 0.75),
              0.025em 0.05em 0 rgba(14, 165, 233, 0.75);
          }
          15% {
            text-shadow: -0.05em -0.025em 0 rgba(16, 185, 129, 0.75), 0.025em 0.025em 0 rgba(8, 145, 178, 0.75),
              -0.05em -0.05em 0 rgba(14, 165, 233, 0.75);
          }
          49% {
            text-shadow: -0.05em -0.025em 0 rgba(16, 185, 129, 0.75), 0.025em 0.025em 0 rgba(8, 145, 178, 0.75),
              -0.05em -0.05em 0 rgba(14, 165, 233, 0.75);
          }
          50% {
            text-shadow: 0.025em 0.05em 0 rgba(16, 185, 129, 0.75), 0.05em 0 0 rgba(8, 145, 178, 0.75),
              0 -0.05em 0 rgba(14, 165, 233, 0.75);
          }
          99% {
            text-shadow: 0.025em 0.05em 0 rgba(16, 185, 129, 0.75), 0.05em 0 0 rgba(8, 145, 178, 0.75),
              0 -0.05em 0 rgba(14, 165, 233, 0.75);
          }
          100% {
            text-shadow: -0.025em 0 0 rgba(16, 185, 129, 0.75), -0.025em -0.025em 0 rgba(8, 145, 178, 0.75),
              -0.025em -0.05em 0 rgba(14, 165, 233, 0.75);
          }
        }
      `}</style>
    </div>
  );
}
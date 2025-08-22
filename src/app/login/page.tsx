'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  
  const [phone, setPhone] = useState('');
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

  // Initialize Firebase reCAPTCHA
  useEffect(() => {
    firebaseAuthService.initializeRecaptcha();
    
    return () => {
      firebaseAuthService.cleanup();
    };
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Add +91 if not present and format
    if (digits.startsWith('91') && digits.length > 2) {
      return '+' + digits;
    } else if (!digits.startsWith('91') && digits.length > 0) {
      return '+91' + digits;
    }
    return digits ? '+91' + digits : '';
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
      setError(error.message || 'Invalid OTP. Please try again.');
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
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-healui-physio rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-healui-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-healui-accent rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl shadow-xl border border-border-color p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-physio rounded-full mb-4 shadow-physio">
                <span className="text-2xl">🏃</span>
              </div>
              <h1 className="text-3xl font-display font-bold gradient-text">
                Healui.ai
              </h1>
              <p className="text-text-gray mt-2 font-medium">Transforming physiotherapy care through AI</p>
            </div>

            {/* Phone Number Form */}
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-dark mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-text-light" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 text-lg bg-white"
                      placeholder="+91 98765 43210"
                      disabled={loading}
                      maxLength={13}
                    />
                  </div>
                  {error && (
                    <div className="mt-2 flex items-center space-x-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 px-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Sending OTP...
                    </span>
                  ) : (
                    'Get OTP'
                  )}
                </button>

                <p className="text-center text-sm text-text-light">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-healui-physio hover:text-healui-primary font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-healui-physio hover:text-healui-primary font-medium">Privacy Policy</a>
                </p>
              </form>
            ) : (
              /* OTP Verification */
              <div className="space-y-6">
                <button
                  onClick={handleResendOTP}
                  className="flex items-center space-x-2 text-text-gray hover:text-text-dark transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Change phone number</span>
                </button>

                <div className="bg-gradient-to-br from-healui-physio/10 to-healui-primary/10 rounded-lg p-6 text-center border border-healui-physio/20">
                  <ShieldCheck className="h-12 w-12 text-healui-physio mx-auto mb-4" />
                  <h2 className="text-lg font-display font-semibold text-text-dark mb-2">Enter verification code</h2>
                  <p className="text-sm text-text-gray">
                    We've sent a 6-digit code to {phone}
                  </p>
                </div>

                <div>
                  <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-semibold border-2 border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                        disabled={otpVerifying}
                      />
                    ))}
                  </div>
                  {error && (
                    <div className="mt-3 flex items-center justify-center space-x-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={otpVerifying || otp.some(digit => !digit)}
                  className="btn-primary w-full py-3 px-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpVerifying ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-text-gray">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="text-healui-physio hover:text-healui-primary font-medium"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Building2, 
  User, 
  Phone, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  Star
} from 'lucide-react';
import ApiManager from '../../services/api';
import firebaseAuthService from '../../services/firebase-auth';
import { ConfirmationResult } from 'firebase/auth';
import type { CreateOrganizationDto } from '../../lib/types';

// Testimonials data with Indian names and locations
const testimonials = [
  {
    name: "Dr. Priya Sharma",
    title: "Chief Physiotherapist",
    clinic: "Elite Physio Care, Gurgaon",
    rating: 5,
    text: "The AI diagnostic chatbot has transformed our initial assessments. It's like having a clinical expert guiding every evaluation."
  },
  {
    name: "Dr. Rajesh Gupta",
    title: "Rehabilitation Specialist",
    clinic: "Heal Zone Clinic, Noida",
    rating: 5,
    text: "Our treatment efficiency improved by 40% with AI-powered protocols. Patients recover faster with personalized exercise plans."
  },
  {
    name: "Dr. Anita Verma",
    title: "Sports Physiotherapist",
    clinic: "SportsCare Center, Delhi",
    rating: 5,
    text: "The red flag detection system has prevented critical conditions from being missed. It's a game-changer for patient safety."
  },
  {
    name: "Dr. Vikram Singh",
    title: "Director",
    clinic: "Wellness Physio Hub, Gurgaon",
    rating: 5,
    text: "Documentation time reduced by 75%. More time for patients, better outcomes. The ROI has been exceptional."
  }
];

// Testimonial Carousel Component
const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="mt-6 p-6 bg-white/10 rounded-lg backdrop-blur-sm transition-all duration-500">
      <div className="flex items-center mb-3">
        {[...Array(currentTestimonial.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
        ))}
      </div>
      <p className="text-sm italic mb-3 min-h-[3rem]">
        "{currentTestimonial.text}"
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white">
            - {currentTestimonial.name}
          </p>
          <p className="text-xs text-white/70">
            {currentTestimonial.title}, {currentTestimonial.clinic}
          </p>
        </div>
        <div className="flex space-x-1">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-yellow-400' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function GetStarted() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    admin_name: '',
    admin_phone: '+91'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      firebaseAuthService.cleanup();
    };
  }, []);

  const formatPhoneNumber = (value: string) => {
    if (value.length < 3) {
      return '+91';
    }
    
    const cleaned = value.replace(/[^\d+]/g, '');
    
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

  const handleInputChange = (field: string, value: string) => {
    if (field === 'admin_phone') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!formData.admin_name.trim()) {
      setError('Your name is required');
      return false;
    }
    if (!formData.admin_phone) {
      setError('Phone number is required');
      return false;
    }
    if (!validatePhone(formData.admin_phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return false;
    }
    return true;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedValue = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedValue.length && index + i < 6; i++) {
        newOtp[index + i] = pastedValue[i];
      }
      setOtp(newOtp);
      
      const nextEmptyIndex = newOtp.findIndex((val, i) => i >= index && !val);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      otpRefs.current[focusIndex]?.focus();
      
      if (newOtp.every(digit => digit)) {
        handleVerifyOTP(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit)) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      firebaseAuthService.initializeRecaptcha();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const confirmationResult = await firebaseAuthService.sendOTP(formData.admin_phone);
      setConfirmationResult(confirmationResult);
      
      setOtpSent(true);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP. Please try again.');
      
      if (error.message?.includes('too many attempts') || error.message?.includes('reCAPTCHA')) {
        firebaseAuthService.resetRecaptcha();
      }
    } finally {
      setLoading(false);
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
      setOtpVerifying(true);
      
      // Step 1: Verify OTP with Firebase and get ID token
      const firebaseIdToken = await firebaseAuthService.verifyOTP(confirmationResult, otpString);
      
      // Step 2: Create organization with verified phone
      const orgData: CreateOrganizationDto = {
        name: formData.name.trim(),
        admin_name: formData.admin_name.trim(),
        admin_phone: formData.admin_phone
      };
      
      const createOrgResponse = await ApiManager.createOrganization(orgData);
      
      if (!createOrgResponse.success) {
        // Handle specific organization creation errors
        if (createOrgResponse.message?.includes('already exists') || 
            createOrgResponse.message?.includes('duplicate')) {
          throw new Error('An organization with this name or phone already exists. Please try different details.');
        }
        throw new Error(createOrgResponse.message || 'Failed to create organization');
      }
      
      // Step 3: Login with the verified phone (get fresh token for login)
      try {
        const loginResponse = await ApiManager.login({ 
          phone: formData.admin_phone, 
          firebaseIdToken 
        });
        
        if (loginResponse.success) {
          router.push('/dashboard');
          return;
        } else {
          // If login fails but org was created, still redirect (they can login separately)
          console.warn('Organization created but login failed:', loginResponse.message);
          router.push('/login?message=Organization created successfully. Please login to continue.');
          return;
        }
      } catch (loginError: any) {
        // Organization was created successfully, but login failed
        console.warn('Login error after org creation:', loginError);
        router.push('/login?message=Organization created successfully. Please login to continue.');
        return;
      }
    } catch (error: any) {
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.message?.includes('auth/invalid-verification-code')) {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.message?.includes('auth/code-expired')) {
        errorMessage = 'OTP code has expired. Please request a new one.';
        // Reset to form to get new OTP
        setOtpSent(false);
        setConfirmationResult(null);
        return;
      } else if (error.message?.includes('already exists') || 
                 error.message?.includes('duplicate')) {
        errorMessage = error.message; // Use the specific duplicate error message
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('OTP verification error:', error);
      setError(errorMessage);
      
      // Only clear OTP if it's an OTP-related error
      if (errorMessage.includes('OTP') || errorMessage.includes('code')) {
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleBackToForm = () => {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setConfirmationResult(null);
  };

  const handleResendOTP = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Initialize reCAPTCHA and send OTP again
      firebaseAuthService.initializeRecaptcha();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const confirmationResult = await firebaseAuthService.sendOTP(formData.admin_phone);
      setConfirmationResult(confirmationResult);
      
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
      
      if (error.message?.includes('too many attempts') || error.message?.includes('reCAPTCHA')) {
        firebaseAuthService.resetRecaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal/5 via-white to-brand-teal/5 flex">
      {/* Left Side - Benefits & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-teal to-brand-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 bg-white rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="relative w-48 h-16 mb-4">
              <Image
                src="/healui-logo/Healui Logo Final-12.png"
                alt="Healui Logo"
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold mb-4">Transform Your Physiotherapy Practice</h2>
              <p className="text-white/80 text-lg mb-6">Join thousands of physiotherapists using AI-powered tools to deliver better patient outcomes.</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white/90">AI-powered diagnostic assistance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white/90">Automated clinical documentation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white/90">Personalized treatment protocols</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white/90">Real-time safety monitoring</span>
              </div>
            </div>
          </div>

          {/* Testimonials Carousel */}
          <TestimonialCarousel />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="lg:hidden">
            <div className="relative w-32 h-12">
              <Image
                src="/healui-logo/Healui Logo Final-12.png"
                alt="Healui Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">Already have an account?</span>
            <a 
              href="/login"
              className="text-brand-teal font-medium hover:text-brand-teal/80 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {!otpSent ? (
              /* Organization Creation Form */
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="lg:hidden mb-4">
                    <div className="relative w-32 h-12 mx-auto">
                      <Image
                        src="/healui-logo/Healui Logo Final-12.png"
                        alt="Healui Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Create Your Organization
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Start your free trial today
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="orgName"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all text-sm"
                          placeholder="ABC Clinic"
                          disabled={loading}
                          autoComplete="organization"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="adminName"
                          value={formData.admin_name}
                          onChange={(e) => handleInputChange('admin_name', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all text-sm"
                          placeholder="Dr. John Doe"
                          disabled={loading}
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          value={formData.admin_phone}
                          onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all text-sm"
                          placeholder="+91 98765 43210"
                          disabled={loading}
                          maxLength={13}
                          autoComplete="tel"
                          inputMode="tel"
                        />
                      </div>
                      {error && (
                        <div className="mt-2 flex items-center space-x-2 text-red-500 text-sm">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Sending OTP...
                      </>
                    ) : (
                      'Get OTP'
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-600">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-brand-teal hover:underline">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-brand-teal hover:underline">Privacy Policy</a>
                  </p>
                </form>
              </div>
            ) : (
              /* OTP Verification Step */
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="lg:hidden mb-4">
                    <div className="relative w-32 h-12 mx-auto">
                      <Image
                        src="/healui-logo/Healui Logo Final-12.png"
                        alt="Healui Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                  <ShieldCheck className="h-12 w-12 text-brand-teal mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Verify Your Phone
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Code sent to <span className="font-medium text-brand-teal">{formData.admin_phone}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleBackToForm}
                    className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors text-xs"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Change details</span>
                  </button>

                  {/* OTP Input */}
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-all"
                        disabled={otpVerifying}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center justify-center space-x-2 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleVerifyOTP()}
                    disabled={otpVerifying || otp.some(digit => !digit)}
                    className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center"
                  >
                    {otpVerifying ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Creating Organization...
                      </>
                    ) : (
                      'Create Organization & Login'
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendOTP}
                      disabled={loading || otpVerifying}
                      className="text-brand-teal hover:text-brand-teal/80 font-medium text-xs disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Resend verification code'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" style={{ position: 'absolute', top: '-9999px' }}></div>
    </div>
  );
}
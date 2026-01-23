'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Calendar, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import ApiManager from '../../services/api';
import AddressFields from '../molecule/AddressFields';
import type { PublicPatientRegistrationDto, PublicPatientRegistrationResponseDto, AddressData, Gender } from '../../lib/types';

interface PatientSelfRegistrationFormProps {
  clinicCode: string;
  clinicName: string;
  onSuccess: (result: PublicPatientRegistrationResponseDto) => void;
}

const PatientSelfRegistrationForm: React.FC<PatientSelfRegistrationFormProps> = ({
  clinicCode,
  clinicName,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddress, setShowAddress] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '' as Gender | '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [addressData, setAddressData] = useState<AddressData>({ country: 'India' });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Indian phone number';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean up form data
      const cleanedData: PublicPatientRegistrationDto = {
        clinic_code: clinicCode,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender as Gender,
        email: formData.email.trim() || undefined,
        address: Object.keys(addressData).length > 1 ? addressData : undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
      };

      const response = await ApiManager.publicPatientRegister(cleanedData);

      if (response.success && response.data) {
        onSuccess(response.data);
      } else {
        setErrors({ submit: response.message || 'Registration failed. Please try again.' });
      }
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message || error.message || 'Registration failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-xl">
      <div className="p-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/30 text-base ${
                errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.full_name}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/30 text-base ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="+91 98765 43210"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/30 text-base ${
                errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.date_of_birth && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.date_of_birth}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {[
              { value: 'M', label: 'Male' },
              { value: 'F', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('gender', option.value)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  formData.gender === option.value
                    ? 'border-[#1e5f79] bg-[#1e5f79]/10 text-[#1e5f79]'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.gender && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.gender}
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/30 text-base ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Address (Collapsible) */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowAddress(!showAddress)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-[#1e5f79] transition-colors"
          >
            <span>Address <span className="text-gray-400 text-xs">(Optional)</span></span>
            {showAddress ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {showAddress && (
            <div className="mt-3">
              <AddressFields
                value={addressData}
                onChange={setAddressData}
                required={false}
              />
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {errors.submit}
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="px-6 pb-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#1e5f79] text-white rounded-lg font-semibold text-base hover:bg-[#1e5f79]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </div>

      {/* Footer Note */}
      <div className="px-6 pb-6">
        <p className="text-xs text-gray-500 text-center">
          By registering, you agree to share your information with {clinicName} for healthcare purposes.
        </p>
      </div>
    </form>
  );
};

export default PatientSelfRegistrationForm;

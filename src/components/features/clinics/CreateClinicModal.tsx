'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import GoogleMapPicker from '../maps/GoogleMapPicker';
import WorkingHoursInput from '../shared/WorkingHoursInput';
import { WorkingHours, DaySchedule } from '@/lib/types';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  Bed,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface CreateClinicModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  total_beds: string;
  latitude: number | null;
  longitude: number | null;
  working_hours: WorkingHours;
}

// Helper function to create default working hours
const createDefaultWorkingHours = (): WorkingHours => {
  const generateId = () => `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const makeDay = (isOpen: boolean): DaySchedule => ({
    is_open: isOpen,
    phases: [{ id: generateId(), start_time: '09:00', end_time: '18:00' }]
  });

  return {
    monday: makeDay(true),
    tuesday: makeDay(true),
    wednesday: makeDay(true),
    thursday: makeDay(true),
    friday: makeDay(true),
    saturday: makeDay(true),
    sunday: makeDay(false)
  };
};

const CreateClinicModal: React.FC<CreateClinicModalProps> = ({ onClose, onSuccess }) => {
  const { userData } = useAppSelector(state => state.user);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    total_beds: '',
    latitude: null,
    longitude: null,
    working_hours: createDefaultWorkingHours()
  });

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Clinic name and contact' },
    { id: 2, title: 'Location', description: 'Select clinic location on map' },
    { id: 3, title: 'Working Hours', description: 'Set operating hours' }
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 text-sm";
  const inputErrorClass = "w-full px-3 py-2.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 text-sm";

  const formatPhoneNumber = (phone: string): string => {
    if (/^\+91[6-9]\d{9}$/.test(phone)) {
      return phone;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) {
      return '+' + digits;
    }
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return '+91' + digits;
    }
    if (digits.length === 11 && digits.startsWith('9')) {
      return '+' + digits;
    }
    return digits.length >= 10 ? '+91' + digits.slice(-10) : phone;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Clinic name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    if (step === 2) {
      if (!formData.latitude || !formData.longitude) {
        newErrors.location = 'Please select a location on the map';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
      city: prev.city || extractCityFromAddress(address || ''),
      state: prev.state || extractStateFromAddress(address || ''),
      pincode: prev.pincode || extractPincodeFromAddress(address || '')
    }));
    setSelectedAddress(address || '');
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const updateWorkingHours = (newWorkingHours: WorkingHours) => {
    setFormData(prev => ({
      ...prev,
      working_hours: newWorkingHours
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !userData?.organization?.id) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
        total_beds: formData.total_beds ? parseInt(formData.total_beds) : undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        working_hours: formData.working_hours,
        city: formData.city || extractCityFromAddress(selectedAddress),
        state: formData.state || extractStateFromAddress(selectedAddress),
        pincode: formData.pincode || extractPincodeFromAddress(selectedAddress)
      };

      const response = await ApiManager.createClinic(userData.organization.id, submitData);

      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Failed to create clinic' });
      }
    } catch (error: any) {
      console.error('Create clinic error:', error);
      setErrors({ submit: error.response?.data?.message || error.message || 'Failed to create clinic' });
    } finally {
      setLoading(false);
    }
  };

  const extractCityFromAddress = (address: string): string => {
    const parts = address.split(',');
    return parts.length > 2 ? parts[parts.length - 3].trim() : '';
  };

  const extractStateFromAddress = (address: string): string => {
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim().split(' ')[0] : '';
  };

  const extractPincodeFromAddress = (address: string): string => {
    const pincodeMatch = address.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border-0 sm:border border-gray-200">
        {/* Header — clean white, matches other forms */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add New Clinic</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                    ${currentStep >= step.id
                      ? 'bg-brand-teal text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-2.5 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-px mx-3 sm:mx-4 ${
                    currentStep > step.id ? 'bg-brand-teal' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-5 py-5 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? inputErrorClass : inputClass}
                  placeholder="Enter clinic name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Clinic Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`pl-10 ${errors.phone ? inputErrorClass : inputClass}`}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? inputErrorClass : inputClass}`}
                      placeholder="clinic@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5">
                <div className="flex items-start">
                  <User className="h-4 w-4 text-teal-600 mt-0.5 mr-2.5" />
                  <div>
                    <h4 className="text-sm font-medium text-teal-900 mb-0.5">
                      Default Clinic Administration
                    </h4>
                    <p className="text-xs text-teal-700">
                      The organization owner will automatically become the admin of this clinic.
                      You can assign additional administrators later from the clinic management page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="inline h-4 w-4 mr-1.5" />
                  Select Clinic Location *
                </label>
                <GoogleMapPicker
                  onLocationSelect={handleLocationSelect}
                  initialLat={formData.latitude || 28.6139}
                  initialLng={formData.longitude || 77.2090}
                  height="450px"
                />
                {errors.location && (
                  <p className="mt-2 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>

              {selectedAddress && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5">
                  <h4 className="font-medium text-teal-900 text-sm mb-1">Selected Address:</h4>
                  <p className="text-sm text-teal-700">{selectedAddress}</p>
                  <div className="mt-1.5 text-xs text-teal-600">
                    Coordinates: {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                  </div>
                </div>
              )}

              {/* Optional Address Override */}
              <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Address Details (Optional - auto-filled from map)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={inputClass}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={inputClass}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className={inputClass}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      className={inputClass}
                      placeholder="Complete address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Beds (Optional)</label>
                    <div className="relative">
                      <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.total_beds}
                        onChange={(e) => handleInputChange('total_beds', e.target.value)}
                        className={`pl-10 ${inputClass}`}
                        placeholder="Number of beds"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Working Hours */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <WorkingHoursInput
                value={formData.working_hours}
                onChange={updateWorkingHours}
              />
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-xs text-teal-700">
                  You can add facilities and equipment details later from the clinic management page.
                </p>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={currentStep === 1 ? onClose : handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex items-center space-x-3">
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-teal rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-teal rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Clinic'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClinicModal;

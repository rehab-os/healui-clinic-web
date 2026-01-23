'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';
import LeafletMapPicker from './LeafletMapPicker';
import WorkingHoursInput from './WorkingHoursInput';
import { WorkingHours, DaySchedule } from '../../lib/types';
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
  
  const defaultPhase = {
    id: generateId(),
    start_time: '09:00',
    end_time: '18:00'
  };

  const businessDay: DaySchedule = {
    is_open: true,
    phases: [defaultPhase]
  };

  const closedDay: DaySchedule = {
    is_open: false,
    phases: []
  };

  return {
    monday: businessDay,
    tuesday: businessDay,
    wednesday: businessDay,
    thursday: businessDay,
    friday: businessDay,
    saturday: businessDay,
    sunday: closedDay
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

  const formatPhoneNumber = (phone: string): string => {
    // If already properly formatted, return as is
    if (/^\+91[6-9]\d{9}$/.test(phone)) {
      return phone;
    }
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If it starts with 91 and is 12 digits, add + prefix
    if (digits.startsWith('91') && digits.length === 12) {
      return '+' + digits;
    }
    
    // If it's a 10-digit number starting with 6-9, add +91
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return '+91' + digits;
    }
    
    // If it's 11 digits starting with 9 (probably missing +)
    if (digits.length === 11 && digits.startsWith('9')) {
      return '+' + digits;
    }
    
    // Return the formatted version or original if can't format
    return digits.length >= 10 ? '+91' + digits.slice(-10) : phone;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Clinic name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      
      // Validate phone format - should be +91XXXXXXXXXX
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
    // Format phone numbers automatically
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
      // Auto-populate address fields if not manually filled
      city: prev.city || extractCityFromAddress(address || ''),
      state: prev.state || extractStateFromAddress(address || ''),
      pincode: prev.pincode || extractPincodeFromAddress(address || '')
    }));
    setSelectedAddress(address || '');
    
    // Clear location error if exists
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
      // Ensure phone number is properly formatted
      const submitData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
        total_beds: formData.total_beds ? parseInt(formData.total_beds) : undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        working_hours: formData.working_hours,
        // Extract city, state, pincode from address if not provided
        city: formData.city || extractCityFromAddress(selectedAddress),
        state: formData.state || extractStateFromAddress(selectedAddress),
        pincode: formData.pincode || extractPincodeFromAddress(selectedAddress)
      };

      console.log('Submitting clinic data:', submitData);

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

  // Helper functions to extract address components
  const extractCityFromAddress = (address: string): string => {
    // Simple extraction - in a real app, you'd use Google Places API details
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border-color">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color bg-gradient-physio">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">Create New Clinic 🏥</h2>
                <p className="text-white/90 font-medium">Add a new clinic location to your organization</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${currentStep >= step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-px mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter clinic name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="clinic@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Default Clinic Administration
                    </h4>
                    <p className="text-sm text-blue-700">
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
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Select Clinic Location *
                </label>
                <LeafletMapPicker
                  onLocationSelect={handleLocationSelect}
                  initialLat={formData.latitude || 28.6139}
                  initialLng={formData.longitude || 77.2090}
                  height="450px"
                />
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>

              {selectedAddress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Address:</h4>
                  <p className="text-sm text-blue-700">{selectedAddress}</p>
                  <div className="mt-2 text-xs text-blue-600">
                    Coordinates: {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                  </div>
                </div>
              )}

              {/* Optional Address Override */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Address Details (Optional - auto-filled from map)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Complete address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Beds (Optional)</label>
                    <div className="relative">
                      <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.total_beds}
                        onChange={(e) => handleInputChange('total_beds', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="space-y-6">
              <WorkingHoursInput
                value={formData.working_hours}
                onChange={updateWorkingHours}
              />
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 You can add facilities and equipment details later from the clinic management page.
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
        <div className="px-6 py-4 border-t border-border-color bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={currentStep === 1 ? onClose : handleBack}
              className="btn-secondary px-6 py-2.5"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <div className="flex items-center space-x-3">
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="btn-primary px-6 py-2.5"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
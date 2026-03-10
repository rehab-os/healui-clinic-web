'use client';

import React, { useState } from 'react';
import { X, Phone, Mail, Calendar, Users, Loader2, AlertCircle, ChevronDown, MapPin } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import { CreatePatientDto, Gender, AddressData, PatientIntakeStatus } from '@/lib/types';
import AddressFields from './AddressFields';

interface QuickIntakeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const QuickIntakeModal: React.FC<QuickIntakeModalProps> = ({ onClose, onSuccess }) => {
  const { userData, currentClinic } = useAppSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'M' as Gender,
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [addressData, setAddressData] = useState<AddressData>({ country: 'India' });
  const [showEmail, setShowEmail] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Patient name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('QuickIntake - Form data:', formData);
    console.log('QuickIntake - Current clinic:', currentClinic);
    console.log('QuickIntake - Address data:', addressData);
    
    const isValid = validateForm();
    console.log('QuickIntake - Form validation result:', isValid);
    console.log('QuickIntake - Current errors after validation:', errors);
    
    if (!isValid || !currentClinic?.id) {
      console.log('QuickIntake - Validation failed or no clinic');
      return;
    }

    setLoading(true);
    try {
      // Clean up empty string fields to undefined
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          typeof value === 'string' && value.trim() === '' ? undefined : value
        ])
      );

      const patientData: CreatePatientDto = {
        ...cleanedFormData,
        address: Object.keys(addressData).length > 1 ? addressData : undefined, // Only send if more than just country
        clinic_id: currentClinic.id,
        intake_status: PatientIntakeStatus.BASIC_INTAKE_COMPLETE, // Set status for Quick Intake completion
      };

      console.log('QuickIntake - Sending patient data:', patientData);
      const response = await ApiManager.createPatient(patientData);
      console.log('QuickIntake - Response:', response);
      
      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Failed to create patient' });
      }
    } catch (error: any) {
      console.error('QuickIntake - Error details:', error);
      console.error('QuickIntake - Error response:', error.response?.data);
      setErrors({ 
        submit: error.response?.data?.message || error.message || 'Failed to create patient'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-border-color">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border-color flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Patient</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto max-h-[65vh]">
          <div className="space-y-3">
            {/* Name & Phone - always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                    errors.full_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Full name *"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Phone number *"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                      errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Date of birth *"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 py-1">
                  {([
                    { value: 'M', label: 'Male' },
                    { value: 'F', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('gender', option.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.gender === option.value
                          ? 'bg-[#1e5f79] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Optional expandable sections */}
            <div className="pt-2 space-y-1">
              {/* Email toggle */}
              <button
                type="button"
                onClick={() => setShowEmail(!showEmail)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showEmail ? 'rotate-180' : ''}`} />
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
              {showEmail && (
                <div className="pl-5">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="patient@example.com"
                    autoFocus
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Address toggle */}
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showAddress ? 'rotate-180' : ''}`} />
                <MapPin className="h-3.5 w-3.5" />
                Address
              </button>
              {showAddress && (
                <div className="pl-5">
                  <AddressFields
                    value={addressData}
                    onChange={setAddressData}
                    required={false}
                    compact
                  />
                </div>
              )}

              {/* Emergency Contact toggle */}
              <button
                type="button"
                onClick={() => setShowEmergency(!showEmergency)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showEmergency ? 'rotate-180' : ''}`} />
                <Users className="h-3.5 w-3.5" />
                Emergency Contact
              </button>
              {showEmergency && (
                <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]"
                    placeholder="Contact person name"
                  />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]"
                      placeholder="Contact phone"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border-color flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Patient'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickIntakeModal;
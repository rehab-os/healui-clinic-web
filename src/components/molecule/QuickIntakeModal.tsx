'use client';

import React, { useState } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, Users, Loader2, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';
import { CreatePatientDto, Gender, AddressData, PatientIntakeStatus } from '../../lib/types';
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
      <div className="glass rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border-color">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color bg-gradient-to-r from-[#1e5f79] to-[#2a7a9b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">Quick Patient Intake</h2>
                <p className="text-white/90 text-sm">Register a new patient with essential details</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-[#1e5f79]" />
                Patient Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                      errors.full_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter patient's full name"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="patient@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                        errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                      }`}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                      errors.gender ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <AddressFields
                    value={addressData}
                    onChange={setAddressData}
                    required={false}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#1e5f79]" />
                Emergency Contact (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Quick Intake:</strong> This creates a basic patient record. 
                Medical history and detailed assessment can be added later by the treating physiotherapist.
              </p>
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
        <div className="px-6 py-4 border-t border-border-color bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#1e5f79]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
    </div>
  );
};

export default QuickIntakeModal;
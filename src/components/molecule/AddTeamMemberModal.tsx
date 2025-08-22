'use client';

import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';
import {
  X,
  UserPlus,
  Phone,
  Mail,
  User,
  Stethoscope,
  Users,
  Building2,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface AddTeamMemberModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  phone: string;
  email: string;
  full_name: string;
  role: 'physiotherapist' | 'receptionist';
  clinic_ids: string[];
  admin_clinic_ids: string[];
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ onClose, onSuccess }) => {
  const { userData, currentClinic } = useAppSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    email: '',
    full_name: '',
    role: 'physiotherapist',
    clinic_ids: currentClinic ? [currentClinic.id] : [],
    admin_clinic_ids: []
  });

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Validate phone format - should be +91XXXXXXXXXX
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.clinic_ids.length === 0) {
      newErrors.clinic_ids = 'Select at least one clinic';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    // Format phone numbers automatically
    if (field === 'phone' && typeof value === 'string') {
      value = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClinicToggle = (clinicId: string) => {
    setFormData(prev => ({
      ...prev,
      clinic_ids: prev.clinic_ids.includes(clinicId)
        ? prev.clinic_ids.filter(id => id !== clinicId)
        : [...prev.clinic_ids, clinicId]
    }));
  };

  const handleAdminToggle = (clinicId: string) => {
    setFormData(prev => ({
      ...prev,
      admin_clinic_ids: prev.admin_clinic_ids.includes(clinicId)
        ? prev.admin_clinic_ids.filter(id => id !== clinicId)
        : [...prev.admin_clinic_ids, clinicId]
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm() || !userData?.organization?.id) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
      };

      console.log('Submitting team member data:', submitData);

      const response = await ApiManager.addTeamMember(userData.organization.id, submitData);
      
      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Failed to add team member' });
      }
    } catch (error: any) {
      console.error('Add team member error:', error);
      setErrors({ submit: error.response?.data?.message || error.message || 'Failed to add team member' });
    } finally {
      setLoading(false);
    }
  };

  const availableClinics = userData?.organization?.clinics || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Add Team Member</h2>
                <p className="text-blue-100">Invite a new physiotherapist or receptionist</p>
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

        {/* Form Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-text-dark mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio ${
                        errors.full_name ? 'border-red-300' : 'border-border-color'
                      }`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value as any)}
                    className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio"
                  >
                    <option value="physiotherapist">Physiotherapist</option>
                    <option value="receptionist">Receptionist/Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-text-dark mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio ${
                        errors.phone ? 'border-red-300' : 'border-border-color'
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
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio ${
                        errors.email ? 'border-red-300' : 'border-border-color'
                      }`}
                      placeholder="john@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Clinic Assignment */}
            <div>
              <h3 className="text-lg font-medium text-text-dark mb-4">Clinic Assignment</h3>
              {userData?.organization?.is_owner && availableClinics.length > 1 ? (
                <div className="space-y-3">
                  <p className="text-sm text-text-gray mb-3">
                    Select which clinics this member will work at:
                  </p>
                  {availableClinics.map((clinic) => (
                    <div key={clinic.id} className="flex items-center justify-between p-3 border border-border-color rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`clinic-${clinic.id}`}
                            checked={formData.clinic_ids.includes(clinic.id)}
                            onChange={() => handleClinicToggle(clinic.id)}
                            className="h-4 w-4 text-healui-primary border-border-color rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`clinic-${clinic.id}`} className="ml-3 flex items-center">
                            <Building2 className="h-4 w-4 text-text-light mr-2" />
                            <span className="text-sm font-medium text-text-dark">{clinic.name}</span>
                          </label>
                        </div>
                      </div>
                      {formData.clinic_ids.includes(clinic.id) && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`admin-${clinic.id}`}
                            checked={formData.admin_clinic_ids.includes(clinic.id)}
                            onChange={() => handleAdminToggle(clinic.id)}
                            className="h-4 w-4 text-red-600 border-border-color rounded focus:ring-red-500"
                          />
                          <label htmlFor={`admin-${clinic.id}`} className="ml-2 flex items-center">
                            <Shield className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-red-600">Clinic Admin</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                  {errors.clinic_ids && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.clinic_ids}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-healui-primary/10 border border-healui-primary/30 rounded-lg">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-healui-primary mr-2" />
                    <div>
                      <p className="text-sm font-medium text-healui-primary">
                        {currentClinic ? currentClinic.name : 'All Organization Clinics'}
                      </p>
                      <p className="text-xs text-healui-physio">
                        {currentClinic 
                          ? 'Member will be added to current clinic' 
                          : 'Member will be added to all clinics in organization'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Information Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">What happens next?</h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>The team member will receive login credentials via SMS/Email</li>
                      <li>They can login and complete their profile</li>
                      {formData.role === 'physiotherapist' && (
                        <>
                          <li>Physiotherapists will complete education, techniques, and specialization details</li>
                          <li>Machine handling capabilities can be added later</li>
                        </>
                      )}
                      <li>Admin can update roles and permissions anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
        <div className="px-6 py-4 border-t border-border-color bg-bg-light">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Adding Member...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;
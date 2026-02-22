'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import { CheckPhoneResponse } from '@/lib/types';
import {
  X,
  UserPlus,
  Phone,
  Mail,
  User,
  Building2,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  Search,
  UserCheck,
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

type LookupState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

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

  // Phone lookup state
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [foundUser, setFoundUser] = useState<CheckPhoneResponse['user'] | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const formatPhoneNumber = (phone: string): string => {
    if (/^\+91[6-9]\d{9}$/.test(phone)) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return '+' + digits;
    if (digits.length === 10 && /^[6-9]/.test(digits)) return '+91' + digits;
    if (digits.length === 11 && digits.startsWith('9')) return '+' + digits;
    return digits.length >= 10 ? '+91' + digits.slice(-10) : phone;
  };

  const isValidPhone = (phone: string): boolean => {
    return /^\+91[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
  };

  const doPhoneLookup = useCallback(async (phone: string) => {
    if (!userData?.organization?.id) return;

    const formatted = formatPhoneNumber(phone);
    if (!isValidPhone(formatted)) return;

    setLookupState('loading');
    setFoundUser(null);

    try {
      const response = await ApiManager.checkTeamPhone(userData.organization.id, formatted);
      if (response.success && response.data) {
        const data = response.data as CheckPhoneResponse;
        if (data.exists && data.user) {
          setFoundUser(data.user);
          setLookupState('found');
        } else {
          setLookupState('not_found');
        }
      } else {
        setLookupState('not_found');
      }
    } catch {
      setLookupState('error');
    }
  }, [userData?.organization?.id]);

  // Debounced phone lookup
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const formatted = formatPhoneNumber(formData.phone);
    if (!isValidPhone(formatted)) {
      setLookupState('idle');
      setFoundUser(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      doPhoneLookup(formData.phone);
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [formData.phone, doPhoneLookup]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)';
    }

    // Only require name/email for new users
    if (lookupState === 'not_found') {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    if (formData.clinic_ids.length === 0) {
      newErrors.clinic_ids = 'Select at least one clinic';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    if (field === 'phone' && typeof value === 'string') {
      value = formatPhoneNumber(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClinicToggle = (clinicId: string) => {
    // Don't allow toggling clinics the user is already assigned to
    if (foundUser?.clinic_assignments?.some(a => a.clinic_id === clinicId)) return;

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
    if (lookupState !== 'found' && lookupState !== 'not_found') return;

    setLoading(true);
    try {
      // Filter out clinics the user is already assigned to
      const newClinicIds = formData.clinic_ids.filter(id => !existingClinicIds.includes(id));
      const newAdminClinicIds = formData.admin_clinic_ids.filter(id => !existingClinicIds.includes(id));

      const submitData: Record<string, unknown> = {
        phone: formatPhoneNumber(formData.phone),
        role: formData.role,
        clinic_ids: newClinicIds,
        admin_clinic_ids: newAdminClinicIds,
      };

      // Only include name/email for new users
      if (lookupState === 'not_found') {
        if (formData.full_name.trim()) submitData.full_name = formData.full_name;
        if (formData.email.trim()) submitData.email = formData.email;
      }

      const response = await ApiManager.addTeamMember(
        userData.organization.id,
        submitData as any
      );

      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Failed to add team member' });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || error.message || 'Failed to add team member' });
    } finally {
      setLoading(false);
    }
  };

  const availableClinics = userData?.organization?.clinics || [];
  const existingClinicIds = foundUser?.clinic_assignments?.map(a => a.clinic_id) || [];
  const newClinicIds = formData.clinic_ids.filter(id => !existingClinicIds.includes(id));
  const isExistingUserInAllClinics = lookupState === 'found' && availableClinics.length > 0 && availableClinics.every(c => existingClinicIds.includes(c.id));
  const hasNewClinicsSelected = lookupState === 'not_found' || newClinicIds.length > 0;
  const isReadyToSubmit = (lookupState === 'found' || lookupState === 'not_found') && hasNewClinicsSelected;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color bg-gradient-to-r from-brand-teal to-teal-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Add Team Member</h2>
                <p className="text-teal-100 text-sm">Enter phone number to get started</p>
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
          <div className="space-y-5">

            {/* Phone + Role — always visible */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-text-dark mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal ${
                      errors.phone ? 'border-red-300' : 'border-border-color'
                    }`}
                    placeholder="+91 98765 43210"
                    autoFocus
                  />
                  {/* Lookup status icon */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {lookupState === 'loading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-teal" />
                    )}
                    {lookupState === 'found' && (
                      <CheckCircle className="h-4 w-4 text-brand-teal" />
                    )}
                    {lookupState === 'not_found' && (
                      <Search className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-dark mb-1.5">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal bg-white"
                >
                  <option value="physiotherapist">Physiotherapist</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
            </div>

            {/* Lookup result — Existing User Found */}
            {lookupState === 'found' && foundUser && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <CheckCircle className="h-3.5 w-3.5 text-brand-teal" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Existing member</span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-teal/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-brand-teal">
                        {(foundUser.full_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {foundUser.full_name || 'No name set'}
                      </p>
                      {foundUser.email && (
                        <p className="text-xs text-gray-500 truncate">{foundUser.email}</p>
                      )}
                    </div>
                  </div>
                  {foundUser.clinic_assignments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">Already in</p>
                      <div className="flex flex-wrap gap-1.5">
                        {foundUser.clinic_assignments.map((a) => (
                          <span
                            key={a.clinic_id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
                          >
                            <Building2 className="h-3 w-3 text-gray-400" />
                            {a.clinic_name}
                            <span className="text-gray-400">&middot;</span>
                            <span className="text-gray-400 capitalize">{a.role}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lookup result — New User */}
            {lookupState === 'not_found' && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600">
                    New user — fill in their details below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                        placeholder="Dr. Sharma"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Used until they set up their own profile
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal ${
                          errors.email ? 'border-red-300' : 'border-border-color'
                        }`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Clinic Assignment — shown after lookup resolves */}
            {(lookupState === 'found' || lookupState === 'not_found') && (
              <div>
                <h3 className="text-sm font-medium text-text-dark mb-3">Clinic Assignment</h3>
                {isExistingUserInAllClinics && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                    <p className="text-sm text-amber-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                      This member is already assigned to all your clinics.
                    </p>
                  </div>
                )}
                {userData?.organization?.is_owner && availableClinics.length > 1 ? (
                  <div className="space-y-2">
                    {availableClinics.map((clinic) => {
                      const isAlreadyAssigned = existingClinicIds.includes(clinic.id);
                      const isSelected = formData.clinic_ids.includes(clinic.id);

                      return (
                        <div
                          key={clinic.id}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            isAlreadyAssigned
                              ? 'bg-gray-50 border-gray-200 opacity-60'
                              : 'border-border-color hover:border-brand-teal/30'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`clinic-${clinic.id}`}
                              checked={isSelected || isAlreadyAssigned}
                              disabled={isAlreadyAssigned}
                              onChange={() => handleClinicToggle(clinic.id)}
                              className="h-4 w-4 text-brand-teal border-border-color rounded focus:ring-brand-teal"
                            />
                            <label
                              htmlFor={`clinic-${clinic.id}`}
                              className={`flex items-center text-sm ${
                                isAlreadyAssigned ? 'text-gray-400' : 'font-medium text-text-dark'
                              }`}
                            >
                              <Building2 className="h-4 w-4 text-text-light mr-2" />
                              {clinic.name}
                              {isAlreadyAssigned && (
                                <span className="ml-2 text-xs text-gray-400">(already assigned)</span>
                              )}
                            </label>
                          </div>
                          {(isSelected && !isAlreadyAssigned) && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`admin-${clinic.id}`}
                                checked={formData.admin_clinic_ids.includes(clinic.id)}
                                onChange={() => handleAdminToggle(clinic.id)}
                                className="h-4 w-4 text-red-600 border-border-color rounded focus:ring-red-500"
                              />
                              <label htmlFor={`admin-${clinic.id}`} className="ml-2 flex items-center">
                                <Shield className="h-3.5 w-3.5 text-red-500 mr-1" />
                                <span className="text-xs text-red-600">Admin</span>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {errors.clinic_ids && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        {errors.clinic_ids}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-lg">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-brand-teal mr-2" />
                      <div>
                        <p className="text-sm font-medium text-brand-teal">
                          {currentClinic ? currentClinic.name : 'All Organization Clinics'}
                        </p>
                        <p className="text-xs text-teal-600">
                          {currentClinic
                            ? 'Member will be added to current clinic'
                            : 'Member will be added to all clinics'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              disabled={loading || !isReadyToSubmit}
              className="btn-primary px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {lookupState === 'found' ? 'Add to Clinic' : 'Add Team Member'}
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

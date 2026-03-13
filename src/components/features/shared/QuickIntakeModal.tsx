'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Phone, Mail, Calendar, Users, Loader2, AlertCircle, ChevronDown, MapPin, Mic, Square } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import { CreatePatientDto, Gender, AddressData, PatientIntakeStatus } from '@/lib/types';
import AddressFields from './AddressFields';
import useVoiceCapture from '@/hooks/useVoiceCapture';
import VoiceWaveform from '../voice/VoiceWaveform';

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

  // Track which fields were just auto-filled for green flash animation
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onFieldsExtracted = useCallback((fields: Record<string, any>) => {
    if (!fields) return;

    const newFlash = new Set<string>();

    setFormData(prev => {
      const updated = { ...prev };
      if (fields.full_name) { updated.full_name = fields.full_name; newFlash.add('full_name'); }
      if (fields.phone) { updated.phone = fields.phone; newFlash.add('phone'); }
      if (fields.email) { updated.email = fields.email; newFlash.add('email'); }
      if (fields.date_of_birth) { updated.date_of_birth = fields.date_of_birth; newFlash.add('date_of_birth'); }
      if (fields.gender) { updated.gender = fields.gender as Gender; newFlash.add('gender'); }
      if (fields.emergency_contact_name) { updated.emergency_contact_name = fields.emergency_contact_name; newFlash.add('emergency_contact_name'); }
      if (fields.emergency_contact_phone) { updated.emergency_contact_phone = fields.emergency_contact_phone; newFlash.add('emergency_contact_phone'); }
      return updated;
    });

    // Auto-expand optional sections if voice filled them
    if (fields.email) setShowEmail(true);
    if (fields.emergency_contact_name || fields.emergency_contact_phone) setShowEmergency(true);

    if (fields.address) {
      setShowAddress(true);
      setAddressData(prev => ({ ...prev, ...fields.address }));
      newFlash.add('address');
    }

    // Trigger green flash
    if (newFlash.size > 0) {
      setFlashFields(prev => new Set([...prev, ...newFlash]));
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setFlashFields(new Set());
      }, 1500);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const [voiceTranscript, setVoiceTranscript] = useState('');

  const voice = useVoiceCapture({
    sessionType: 'INTAKE',
    clinicId: currentClinic?.id || '',
    onFieldsExtracted,
    onTranscriptUpdate: (transcript: string) => setVoiceTranscript(transcript),
  });

  const handleMicClick = async () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      setVoiceTranscript('');
      await voice.startListening();
    }
  };

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

  /** Returns extra Tailwind classes when a field was just voice-filled */
  const flashClass = (field: string) =>
    flashFields.has(field) ? 'ring-2 ring-green-400 bg-green-50 transition-all duration-300' : 'transition-all duration-300';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-border-color">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border-color flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Patient</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMicClick}
              disabled={voice.isProcessing}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                voice.isListening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
              }`}
              title={voice.isListening ? 'Stop recording' : 'Voice intake'}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto max-h-[65vh]">
          <div className="space-y-3">
            {/* Voice status panel with waveform */}
            {(voice.isListening || voice.isProcessing || voiceTranscript) && (
              <div className="p-3 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50/50 to-gray-50 space-y-2">
                {voice.isListening && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-xs font-medium text-gray-500">Listening</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => voice.stopListening()}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <Square className="h-2.5 w-2.5 fill-current" />
                        Stop
                      </button>
                    </div>
                    <VoiceWaveform
                      volumeLevel={voice.volumeLevel}
                      isActive={voice.isListening}
                    />
                  </div>
                )}
                {!voice.isListening && voice.isProcessing && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                    <span className="text-xs font-medium text-teal-700">Processing audio...</span>
                  </div>
                )}
                {voiceTranscript && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{voiceTranscript}</p>
                )}
                {voice.error && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {voice.error}
                  </p>
                )}
              </div>
            )}

            {/* Name & Phone - always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${
                    errors.full_name ? 'border-red-300' : 'border-gray-300'
                  } ${flashClass('full_name')}`}
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
                    } ${flashClass('phone')}`}
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
                    } ${flashClass('date_of_birth')}`}
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
                <div className={`flex items-center gap-2 py-1 rounded-lg ${flashClass('gender')}`}>
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
                    } ${flashClass('email')}`}
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
                <div className={`pl-5 ${flashClass('address')} rounded-lg`}>
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
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${flashClass('emergency_contact_name')}`}
                    placeholder="Contact person name"
                  />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] ${flashClass('emergency_contact_phone')}`}
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

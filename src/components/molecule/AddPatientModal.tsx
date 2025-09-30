import React, { useState } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, Heart, AlertCircle, Shield } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';
import type { CreatePatientDto } from '../../lib/types';

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ onClose, onSuccess }) => {
  const { currentClinic } = useAppSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'M',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    insurance_provider: '',
    insurance_policy_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentClinic?.id) {
      setError('No clinic selected');
      return;
    }

    try {
      setLoading(true);
      console.log('Current clinic:', currentClinic); // Debug log
      const patientData: CreatePatientDto = {
        ...formData,
        clinic_id: currentClinic.id,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : undefined,
        current_medications: formData.current_medications ? formData.current_medications.split(',').map(m => m.trim()).filter(Boolean) : undefined,
      };
      console.log('Patient data being sent:', patientData); // Debug log

      const response = await ApiManager.createPatient(patientData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to create patient');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-brand-white rounded-t-xl sm:rounded-xl w-full max-w-lg sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-brand-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-black">Add New Patient</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-teal/10 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5 text-brand-black/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 text-red-600 rounded-lg flex items-start border border-red-200">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-3 sm:mb-4 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-teal" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    rows={2}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-3 sm:mb-4 flex items-center">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-teal" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-3 sm:mb-4 flex items-center">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-teal" />
                Medical Information
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Medical History
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    rows={3}
                    placeholder="Any relevant medical history"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="Comma separated list (e.g., Penicillin, Peanuts)"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Current Medications
                  </label>
                  <input
                    type="text"
                    value={formData.current_medications}
                    onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="Comma separated list"
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-3 sm:mb-4 flex items-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-teal" />
                Insurance Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="Insurance company name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_policy_number}
                    onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="Policy number"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
          >
            {loading ? 'Creating...' : 'Create Patient'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
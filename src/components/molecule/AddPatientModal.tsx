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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border-color">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-text-dark">Add New Patient 👥</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-healui-physio/10 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5 text-text-light" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center border border-red-200">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-healui-physio" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    rows={2}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-healui-physio" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-healui-physio" />
                Medical Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Medical History
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    rows={3}
                    placeholder="Any relevant medical history"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="Comma separated list (e.g., Penicillin, Peanuts)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Current Medications
                  </label>
                  <input
                    type="text"
                    value={formData.current_medications}
                    onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="Comma separated list"
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div>
              <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-healui-physio" />
                Insurance Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="Insurance company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_policy_number}
                    onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                    placeholder="Policy number"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-color flex items-center justify-end space-x-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6 py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Patient'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
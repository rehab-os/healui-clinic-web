import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, Heart, AlertCircle, Shield, Stethoscope, Plus, Trash2, Activity, Briefcase, Users } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';
import type { 
  UpdatePatientDto, 
  PatientResponseDto,
  PreviousSurgeryDto,
  PastIllnessDto,
  PastInvestigationDto,
  ActivityLevel,
  PatientStatus
} from '../../lib/types';

interface EditPatientModalProps {
  patient: PatientResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: patient.full_name || '',
    phone: patient.phone || '',
    email: patient.email || '',
    date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : '',
    gender: patient.gender || 'M',
    address: patient.address || '',
    emergency_contact_name: patient.emergency_contact_name || '',
    emergency_contact_phone: patient.emergency_contact_phone || '',
    medical_history: patient.medical_history || '',
    chronic_conditions: patient.chronic_conditions?.join(', ') || '',
    occupation: patient.occupation || '',
    activity_level: patient.activity_level || '' as ActivityLevel | '',
    family_history: patient.family_history || '',
    allergies: patient.allergies?.join(', ') || '',
    current_medications: patient.current_medications?.join(', ') || '',
    insurance_provider: patient.insurance_provider || '',
    insurance_policy_number: patient.insurance_policy_number || '',
    status: patient.status || 'ACTIVE' as PatientStatus,
  });

  // Medical history state
  const [previousSurgeries, setPreviousSurgeries] = useState<PreviousSurgeryDto[]>(
    patient.previous_surgeries || []
  );
  const [pastIllnesses, setPastIllnesses] = useState<PastIllnessDto[]>(
    patient.past_illnesses || []
  );
  const [pastInvestigations, setPastInvestigations] = useState<PastInvestigationDto[]>(
    patient.past_investigations || []
  );

  // Helper function to clean optional string fields
  const cleanOptionalField = (value: string | undefined): string | undefined => {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const patientData: UpdatePatientDto = {
        ...formData,
        chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(c => c.trim()).filter(Boolean) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : undefined,
        current_medications: formData.current_medications ? formData.current_medications.split(',').map(m => m.trim()).filter(Boolean) : undefined,
        previous_surgeries: previousSurgeries.filter(s => s.procedure.trim()).length > 0 
          ? previousSurgeries.filter(s => s.procedure.trim()).map(s => {
              const cleaned = {
                procedure: s.procedure,
                ...(cleanOptionalField(s.date) && { date: cleanOptionalField(s.date) }),
                ...(cleanOptionalField(s.body_part) && { body_part: cleanOptionalField(s.body_part) })
              };
              return cleaned;
            })
          : undefined,
        past_illnesses: pastIllnesses.filter(i => i.illness.trim() && i.treatment.trim()).length > 0 
          ? pastIllnesses.filter(i => i.illness.trim() && i.treatment.trim()).map(i => {
              const cleaned = {
                illness: i.illness,
                treatment: i.treatment,
                resolved: i.resolved,
                ...(cleanOptionalField(i.date) && { date: cleanOptionalField(i.date) })
              };
              return cleaned;
            })
          : undefined,
        past_investigations: pastInvestigations.filter(inv => inv.type.trim() && inv.findings.trim()).length > 0 
          ? pastInvestigations.filter(inv => inv.type.trim() && inv.findings.trim()).map(inv => {
              const cleaned = {
                type: inv.type,
                findings: inv.findings,
                ...(cleanOptionalField(inv.date) && { date: cleanOptionalField(inv.date) }),
                ...(cleanOptionalField(inv.body_part) && { body_part: cleanOptionalField(inv.body_part) })
              };
              return cleaned;
            })
          : undefined,
        activity_level: formData.activity_level || undefined,
      };

      // Debug logging
      console.log('Raw previous surgeries:', previousSurgeries);
      console.log('Raw past investigations:', pastInvestigations);
      console.log('Processed patient data:', JSON.stringify(patientData, null, 2));

      const response = await ApiManager.updatePatient(patient.id, patientData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to update patient');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for dynamic arrays
  const addPreviousSurgery = () => {
    setPreviousSurgeries([...previousSurgeries, { procedure: '', date: '', body_part: '' }]);
  };

  const removePreviousSurgery = (index: number) => {
    setPreviousSurgeries(previousSurgeries.filter((_, i) => i !== index));
  };

  const updatePreviousSurgery = (index: number, field: keyof PreviousSurgeryDto, value: string) => {
    const updated = [...previousSurgeries];
    updated[index] = { ...updated[index], [field]: value };
    setPreviousSurgeries(updated);
  };

  const addPastIllness = () => {
    setPastIllnesses([...pastIllnesses, { illness: '', date: '', treatment: '', resolved: false }]);
  };

  const removePastIllness = (index: number) => {
    setPastIllnesses(pastIllnesses.filter((_, i) => i !== index));
  };

  const updatePastIllness = (index: number, field: keyof PastIllnessDto, value: string | boolean) => {
    const updated = [...pastIllnesses];
    updated[index] = { ...updated[index], [field]: value };
    setPastIllnesses(updated);
  };

  const addPastInvestigation = () => {
    setPastInvestigations([...pastInvestigations, { type: '', date: '', findings: '', body_part: '' }]);
  };

  const removePastInvestigation = (index: number) => {
    setPastInvestigations(pastInvestigations.filter((_, i) => i !== index));
  };

  const updatePastInvestigation = (index: number, field: keyof PastInvestigationDto, value: string) => {
    const updated = [...pastInvestigations];
    updated[index] = { ...updated[index], [field]: value };
    setPastInvestigations(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-brand-white rounded-t-xl sm:rounded-xl w-full max-w-lg sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-brand-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-black">Edit Patient - {patient.patient_code}</h2>
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

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PatientStatus })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DISCHARGED">Discharged</option>
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
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.chronic_conditions}
                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    placeholder="Comma separated list (e.g., Diabetes, Hypertension)"
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
                    placeholder="Comma separated list"
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

            {/* Additional Medical History */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-3 sm:mb-4 flex items-center">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-teal" />
                Detailed Medical History
              </h3>
              
              {/* Previous Surgeries */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-brand-black">
                    Previous Surgeries
                  </label>
                  <button
                    type="button"
                    onClick={addPreviousSurgery}
                    className="flex items-center text-xs text-brand-teal hover:text-brand-teal/80 font-medium"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Surgery
                  </button>
                </div>
                {previousSurgeries.map((surgery, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Procedure *"
                        value={surgery.procedure}
                        onChange={(e) => updatePreviousSurgery(index, 'procedure', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={surgery.date || ''}
                        onChange={(e) => updatePreviousSurgery(index, 'date', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                        title="Date is optional"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Body part"
                          value={surgery.body_part}
                          onChange={(e) => updatePreviousSurgery(index, 'body_part', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removePreviousSurgery(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Past Illnesses */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-brand-black">
                    Past Illnesses
                  </label>
                  <button
                    type="button"
                    onClick={addPastIllness}
                    className="flex items-center text-xs text-brand-teal hover:text-brand-teal/80 font-medium"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Illness
                  </button>
                </div>
                {pastIllnesses.map((illness, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Illness *"
                        value={illness.illness}
                        onChange={(e) => updatePastIllness(index, 'illness', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={illness.date || ''}
                        onChange={(e) => updatePastIllness(index, 'date', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                        title="Date is optional"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Treatment received *"
                        value={illness.treatment}
                        onChange={(e) => updatePastIllness(index, 'treatment', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={illness.resolved}
                          onChange={(e) => updatePastIllness(index, 'resolved', e.target.checked)}
                          className="mr-1"
                        />
                        Resolved
                      </label>
                      <button
                        type="button"
                        onClick={() => removePastIllness(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Past Investigations */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-brand-black">
                    Past Investigations
                  </label>
                  <button
                    type="button"
                    onClick={addPastInvestigation}
                    className="flex items-center text-xs text-brand-teal hover:text-brand-teal/80 font-medium"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Investigation
                  </button>
                </div>
                {pastInvestigations.map((investigation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Type (X-Ray, MRI, etc.) *"
                        value={investigation.type}
                        onChange={(e) => updatePastInvestigation(index, 'type', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={investigation.date || ''}
                        onChange={(e) => updatePastInvestigation(index, 'date', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                        title="Date is optional"
                      />
                      <input
                        type="text"
                        placeholder="Body part (optional)"
                        value={investigation.body_part || ''}
                        onChange={(e) => updatePastInvestigation(index, 'body_part', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Findings summary *"
                        value={investigation.findings}
                        onChange={(e) => updatePastInvestigation(index, 'findings', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePastInvestigation(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifestyle Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-brand-black mb-3 sm:mb-4 flex items-center">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-teal" />
                Lifestyle Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Activity Level
                  </label>
                  <select
                    value={formData.activity_level}
                    onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as ActivityLevel })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                  >
                    <option value="">Select activity level</option>
                    <option value="SEDENTARY">Sedentary</option>
                    <option value="LIGHT">Light</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ATHLETIC">Athletic</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-brand-black mb-1 sm:mb-1.5">
                    Family History
                  </label>
                  <textarea
                    value={formData.family_history}
                    onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-brand-white text-sm sm:text-base"
                    rows={2}
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
            {loading ? 'Updating...' : 'Update Patient'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;
'use client';

import React, { useState } from 'react';
import { X, Heart, Activity, Briefcase, Shield, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import ApiManager from '../../services/api';
import type { 
  UpdatePatientDto, 
  PatientResponseDto,
  PreviousSurgeryDto,
  PastIllnessDto,
  PastInvestigationDto,
  ActivityLevel
} from '../../lib/types';

interface ClinicalAssessmentModalProps {
  patient: PatientResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}

const ClinicalAssessmentModal: React.FC<ClinicalAssessmentModalProps> = ({ 
  patient, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data with existing patient data
  const [formData, setFormData] = useState({
    medical_history: patient.medical_history || '',
    chronic_conditions: patient.chronic_conditions?.join(', ') || '',
    occupation: patient.occupation || '',
    activity_level: patient.activity_level || '' as ActivityLevel | '',
    family_history: patient.family_history || '',
    allergies: patient.allergies?.join(', ') || '',
    current_medications: patient.current_medications?.join(', ') || '',
    insurance_provider: patient.insurance_provider || '',
    insurance_policy_number: patient.insurance_policy_number || '',
  });

  // Medical history arrays
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
      
      // Clean up empty string fields to undefined
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          typeof value === 'string' && value.trim() === '' ? undefined : value
        ])
      );

      const assessmentData: UpdatePatientDto = {
        ...cleanedFormData,
        chronic_conditions: formData.chronic_conditions ? 
          formData.chronic_conditions.split(',').map(c => c.trim()).filter(Boolean) : undefined,
        allergies: formData.allergies ? 
          formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : undefined,
        current_medications: formData.current_medications ? 
          formData.current_medications.split(',').map(m => m.trim()).filter(Boolean) : undefined,
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

      console.log('Clinical Assessment - Sending data:', assessmentData);
      const response = await ApiManager.updatePatient(patient.id, assessmentData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to update clinical assessment');
      }
    } catch (err: any) {
      console.error('Clinical Assessment Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save clinical assessment');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic array helper functions
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#1e5f79] to-[#2a7a9b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Patient Medical History</h2>
                <p className="text-white/90 text-sm">Complete medical history for {patient.full_name}</p>
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
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-start border border-red-200">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Medical Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-[#1e5f79]" />
              Medical Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical History
                </label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                  rows={3}
                  placeholder="Any relevant medical history"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.chronic_conditions}
                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                    placeholder="Comma separated (e.g., Diabetes, Hypertension)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                    placeholder="Comma separated (e.g., Penicillin, Peanuts)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <input
                  type="text"
                  value={formData.current_medications}
                  onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                  placeholder="Comma separated list"
                />
              </div>
            </div>
          </div>

          {/* Detailed Medical History */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#1e5f79]" />
              Detailed Medical History
            </h3>
            
            {/* Previous Surgeries */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Previous Surgeries
                </label>
                <button
                  type="button"
                  onClick={addPreviousSurgery}
                  className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium"
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
                      placeholder="Date"
                      value={surgery.date || ''}
                      onChange={(e) => updatePreviousSurgery(index, 'date', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded text-sm"
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Past Illnesses
                </label>
                <button
                  type="button"
                  onClick={addPastIllness}
                  className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium"
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
                      placeholder="Date"
                      value={illness.date || ''}
                      onChange={(e) => updatePastIllness(index, 'date', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded text-sm"
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Past Investigations
                </label>
                <button
                  type="button"
                  onClick={addPastInvestigation}
                  className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium"
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
                      placeholder="Date"
                      value={investigation.date || ''}
                      onChange={(e) => updatePastInvestigation(index, 'date', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded text-sm"
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-[#1e5f79]" />
              Lifestyle Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                  placeholder="Patient's occupation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as ActivityLevel })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                >
                  <option value="">Select activity level</option>
                  <option value="SEDENTARY">Sedentary</option>
                  <option value="LIGHT">Light</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ATHLETIC">Athletic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family History
              </label>
              <textarea
                value={formData.family_history}
                onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                rows={2}
                placeholder="Relevant family medical history"
              />
            </div>
          </div>

          {/* Insurance Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-[#1e5f79]" />
              Insurance Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={formData.insurance_provider}
                  onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                  placeholder="Insurance company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={formData.insurance_policy_number}
                  onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200"
                  placeholder="Policy number"
                />
              </div>
            </div>
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Patient:</span> {patient.full_name} ({patient.patient_code})
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#1e5f79]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving Medical History...
                </>
              ) : (
                'Save Medical History'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalAssessmentModal;
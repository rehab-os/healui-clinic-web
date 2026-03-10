'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Loader2, ChevronDown, Stethoscope, Dumbbell, Shield } from 'lucide-react';
import ChipInput from '@/components/ui/chip-input';
import ApiManager from '@/services/api/api.service';
import type { 
  UpdatePatientDto, 
  PatientResponseDto,
  PreviousSurgeryDto,
  PastIllnessDto,
  PastInvestigationDto,
  ActivityLevel
} from '@/lib/types';

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
    occupation: patient.occupation || '',
    activity_level: patient.activity_level || '' as ActivityLevel | '',
    family_history: patient.family_history || '',
    insurance_provider: patient.insurance_provider || '',
    insurance_policy_number: patient.insurance_policy_number || '',
  });

  // Chip-based array fields
  const [chronicConditions, setChronicConditions] = useState<string[]>(
    patient.chronic_conditions || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    patient.allergies || []
  );
  const [currentMedications, setCurrentMedications] = useState<string[]>(
    patient.current_medications || []
  );

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
        chronic_conditions: chronicConditions.length > 0 ? chronicConditions : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        current_medications: currentMedications.length > 0 ? currentMedications : undefined,
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

  const [showSurgeries, setShowSurgeries] = useState(previousSurgeries.length > 0);
  const [showIllnesses, setShowIllnesses] = useState(pastIllnesses.length > 0);
  const [showInvestigations, setShowInvestigations] = useState(pastInvestigations.length > 0);
  const [showInsurance, setShowInsurance] = useState(
    !!(formData.insurance_provider || formData.insurance_policy_number)
  );

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200";
  const inlineInputClass = "px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]";

  const activityOptions = [
    { value: 'SEDENTARY', label: 'Sedentary' },
    { value: 'LIGHT', label: 'Light' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ATHLETIC', label: 'Athletic' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
            <p className="text-xs text-gray-500">{patient.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Core medical fields - always visible */}
            <div className="space-y-3">
              <textarea
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                className={inputClass}
                rows={2}
                placeholder="Medical history"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ChipInput
                  value={chronicConditions}
                  onChange={setChronicConditions}
                  placeholder="Chronic conditions"
                />
                <ChipInput
                  value={allergies}
                  onChange={setAllergies}
                  placeholder="Allergies"
                />
              </div>

              <ChipInput
                value={currentMedications}
                onChange={setCurrentMedications}
                placeholder="Current medications"
              />
            </div>

            {/* Lifestyle - always visible */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className={inputClass}
                  placeholder="Occupation"
                />
                <textarea
                  value={formData.family_history}
                  onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                  className={inputClass}
                  rows={1}
                  placeholder="Family history"
                />
              </div>

              {/* Activity Level - Pills */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 shrink-0">Activity</span>
                <div className="flex gap-1.5 flex-wrap">
                  {activityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, activity_level: option.value as ActivityLevel })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        formData.activity_level === option.value
                          ? 'bg-[#1e5f79] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Expandable detailed sections */}
            <div className="pt-2 space-y-1 border-t border-gray-100">
              {/* Previous Surgeries */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSurgeries(!showSurgeries)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1.5 w-full"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showSurgeries ? 'rotate-180' : ''}`} />
                  <Stethoscope className="h-3.5 w-3.5" />
                  Previous Surgeries
                  {previousSurgeries.length > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{previousSurgeries.length}</span>
                  )}
                </button>
                {showSurgeries && (
                  <div className="pl-5 space-y-2 pb-2">
                    {previousSurgeries.map((surgery, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Procedure *"
                          value={surgery.procedure}
                          onChange={(e) => updatePreviousSurgery(index, 'procedure', e.target.value)}
                          className={`flex-1 ${inlineInputClass}`}
                        />
                        <input
                          type="date"
                          value={surgery.date || ''}
                          onChange={(e) => updatePreviousSurgery(index, 'date', e.target.value)}
                          className={`w-36 ${inlineInputClass}`}
                        />
                        <input
                          type="text"
                          placeholder="Body part"
                          value={surgery.body_part}
                          onChange={(e) => updatePreviousSurgery(index, 'body_part', e.target.value)}
                          className={`w-28 ${inlineInputClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => removePreviousSurgery(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPreviousSurgery}
                      className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium py-1"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add surgery
                    </button>
                  </div>
                )}
              </div>

              {/* Past Illnesses */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowIllnesses(!showIllnesses)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1.5 w-full"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showIllnesses ? 'rotate-180' : ''}`} />
                  <Dumbbell className="h-3.5 w-3.5" />
                  Past Illnesses
                  {pastIllnesses.length > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{pastIllnesses.length}</span>
                  )}
                </button>
                {showIllnesses && (
                  <div className="pl-5 space-y-2 pb-2">
                    {pastIllnesses.map((illness, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Illness *"
                            value={illness.illness}
                            onChange={(e) => updatePastIllness(index, 'illness', e.target.value)}
                            className={`flex-1 ${inlineInputClass}`}
                          />
                          <input
                            type="date"
                            value={illness.date || ''}
                            onChange={(e) => updatePastIllness(index, 'date', e.target.value)}
                            className={`w-36 ${inlineInputClass}`}
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Treatment received *"
                            value={illness.treatment}
                            onChange={(e) => updatePastIllness(index, 'treatment', e.target.value)}
                            className={`flex-1 ${inlineInputClass}`}
                          />
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none shrink-0">
                            <input
                              type="checkbox"
                              checked={illness.resolved}
                              onChange={(e) => updatePastIllness(index, 'resolved', e.target.checked)}
                              className="rounded border-gray-300 text-[#1e5f79] focus:ring-[#1e5f79]"
                            />
                            Resolved
                          </label>
                          <button
                            type="button"
                            onClick={() => removePastIllness(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPastIllness}
                      className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium py-1"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add illness
                    </button>
                  </div>
                )}
              </div>

              {/* Past Investigations */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowInvestigations(!showInvestigations)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1.5 w-full"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showInvestigations ? 'rotate-180' : ''}`} />
                  <Stethoscope className="h-3.5 w-3.5" />
                  Past Investigations
                  {pastInvestigations.length > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{pastInvestigations.length}</span>
                  )}
                </button>
                {showInvestigations && (
                  <div className="pl-5 space-y-2 pb-2">
                    {pastInvestigations.map((investigation, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Type (X-Ray, MRI, etc.) *"
                            value={investigation.type}
                            onChange={(e) => updatePastInvestigation(index, 'type', e.target.value)}
                            className={`flex-1 ${inlineInputClass}`}
                          />
                          <input
                            type="date"
                            value={investigation.date || ''}
                            onChange={(e) => updatePastInvestigation(index, 'date', e.target.value)}
                            className={`w-36 ${inlineInputClass}`}
                          />
                          <input
                            type="text"
                            placeholder="Body part"
                            value={investigation.body_part || ''}
                            onChange={(e) => updatePastInvestigation(index, 'body_part', e.target.value)}
                            className={`w-28 ${inlineInputClass}`}
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Findings summary *"
                            value={investigation.findings}
                            onChange={(e) => updatePastInvestigation(index, 'findings', e.target.value)}
                            className={`flex-1 ${inlineInputClass}`}
                          />
                          <button
                            type="button"
                            onClick={() => removePastInvestigation(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPastInvestigation}
                      className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium py-1"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add investigation
                    </button>
                  </div>
                )}
              </div>

              {/* Insurance */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowInsurance(!showInsurance)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1.5 w-full"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showInsurance ? 'rotate-180' : ''}`} />
                  <Shield className="h-3.5 w-3.5" />
                  Insurance
                </button>
                {showInsurance && (
                  <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                    <input
                      type="text"
                      value={formData.insurance_provider}
                      onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                      className={inputClass}
                      placeholder="Insurance provider"
                    />
                    <input
                      type="text"
                      value={formData.insurance_policy_number}
                      onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                      className={inputClass}
                      placeholder="Policy number"
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalAssessmentModal;
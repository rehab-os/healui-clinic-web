import React, { useState } from 'react';
import { X, Phone, Mail, Calendar, ChevronDown, AlertCircle, Shield, Stethoscope, Plus, Trash2, Dumbbell, Users, MapPin, Briefcase } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import ChipInput from '@/components/ui/chip-input';
import ConditionSelector from '../conditions/ConditionSelector';
import AddressFields from '../shared/AddressFields';
import type {
  CreatePatientDto,
  Neo4jConditionResponseDto,
  CreatePatientConditionDto,
  PreviousSurgeryDto,
  PastIllnessDto,
  PastInvestigationDto,
  ActivityLevel,
  AddressData
} from '@/lib/types';

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
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    occupation: '',
    activity_level: '' as ActivityLevel | '',
    family_history: '',
    insurance_provider: '',
    insurance_policy_number: '',
    referral_source: '',
    corporate_company: '',
  });

  // Chip-based array fields
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);

  const [addressData, setAddressData] = useState<AddressData>({ country: 'India' });

  // Medical history arrays
  const [previousSurgeries, setPreviousSurgeries] = useState<PreviousSurgeryDto[]>([]);
  const [pastIllnesses, setPastIllnesses] = useState<PastIllnessDto[]>([]);
  const [pastInvestigations, setPastInvestigations] = useState<PastInvestigationDto[]>([]);

  // Multi-condition state
  const [selectedConditions, setSelectedConditions] = useState<Neo4jConditionResponseDto[]>([]);
  const [conditionDescription, setConditionDescription] = useState('');

  // Expandable section toggles
  const [showEmail, setShowEmail] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showLifestyle, setShowLifestyle] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);

  // Helper function to clean optional string fields
  const cleanOptionalField = (value: string | undefined): string | undefined => {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentClinic?.id) {
      setError('No clinic selected');
      return;
    }

    try {
      setLoading(true);
      const patientData: CreatePatientDto = {
        ...formData,
        address: Object.keys(addressData).length > 1 ? addressData : undefined,
        clinic_id: currentClinic.id,
        chronic_conditions: chronicConditions.length > 0 ? chronicConditions : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        current_medications: currentMedications.length > 0 ? currentMedications : undefined,
        previous_surgeries: previousSurgeries.filter(s => s.procedure.trim()).length > 0
          ? previousSurgeries.filter(s => s.procedure.trim()).map(s => ({
              procedure: s.procedure,
              ...(cleanOptionalField(s.date) && { date: cleanOptionalField(s.date) }),
              ...(cleanOptionalField(s.body_part) && { body_part: cleanOptionalField(s.body_part) })
            }))
          : undefined,
        past_illnesses: pastIllnesses.filter(i => i.illness.trim() && i.treatment.trim()).length > 0
          ? pastIllnesses.filter(i => i.illness.trim() && i.treatment.trim()).map(i => ({
              illness: i.illness,
              treatment: i.treatment,
              resolved: i.resolved,
              ...(cleanOptionalField(i.date) && { date: cleanOptionalField(i.date) })
            }))
          : undefined,
        past_investigations: pastInvestigations.filter(inv => inv.type.trim() && inv.findings.trim()).length > 0
          ? pastInvestigations.filter(inv => inv.type.trim() && inv.findings.trim()).map(inv => ({
              type: inv.type,
              findings: inv.findings,
              ...(cleanOptionalField(inv.date) && { date: cleanOptionalField(inv.date) }),
              ...(cleanOptionalField(inv.body_part) && { body_part: cleanOptionalField(inv.body_part) })
            }))
          : undefined,
        activity_level: formData.activity_level || undefined,
        referral_source: formData.referral_source || undefined,
        corporate_company: formData.corporate_company || undefined,
      };

      const response = await ApiManager.createPatient(patientData);

      if (response.success) {
        const patientId = response.data?.id;

        if (selectedConditions.length > 0 && patientId) {
          try {
            const conditionPromises = selectedConditions.map(async (condition) => {
              const conditionData: CreatePatientConditionDto = {
                neo4j_condition_id: condition.condition_id,
                condition_name: condition.condition_name,
                body_region: condition.body_region,
                chief_complaint: conditionDescription || undefined
              };
              return ApiManager.createPatientCondition(patientId, conditionData);
            });
            await Promise.all(conditionPromises);
          } catch (err) {
            console.error('Error adding conditions to patient:', err);
          }
        }

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

  // Dynamic array helpers
  const addPreviousSurgery = () => setPreviousSurgeries([...previousSurgeries, { procedure: '', date: '', body_part: '' }]);
  const removePreviousSurgery = (index: number) => setPreviousSurgeries(previousSurgeries.filter((_, i) => i !== index));
  const updatePreviousSurgery = (index: number, field: keyof PreviousSurgeryDto, value: string) => {
    const updated = [...previousSurgeries];
    updated[index] = { ...updated[index], [field]: value };
    setPreviousSurgeries(updated);
  };

  const addPastIllness = () => setPastIllnesses([...pastIllnesses, { illness: '', date: '', treatment: '', resolved: false }]);
  const removePastIllness = (index: number) => setPastIllnesses(pastIllnesses.filter((_, i) => i !== index));
  const updatePastIllness = (index: number, field: keyof PastIllnessDto, value: string | boolean) => {
    const updated = [...pastIllnesses];
    updated[index] = { ...updated[index], [field]: value };
    setPastIllnesses(updated);
  };

  const addPastInvestigation = () => setPastInvestigations([...pastInvestigations, { type: '', date: '', findings: '', body_part: '' }]);
  const removePastInvestigation = (index: number) => setPastInvestigations(pastInvestigations.filter((_, i) => i !== index));
  const updatePastInvestigation = (index: number, field: keyof PastInvestigationDto, value: string) => {
    const updated = [...pastInvestigations];
    updated[index] = { ...updated[index], [field]: value };
    setPastInvestigations(updated);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all duration-200 text-sm";
  const inlineInputClass = "px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]";

  const activityOptions = [
    { value: 'SEDENTARY', label: 'Sedentary' },
    { value: 'LIGHT', label: 'Light' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ATHLETIC', label: 'Athletic' },
  ] as const;

  const ToggleButton = ({ open, onClick, icon: Icon, label, count }: {
    open: boolean; onClick: () => void; icon: React.ElementType; label: string; count?: number;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1.5 w-full"
    >
      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      <Icon className="h-3.5 w-3.5" />
      {label}
      {count !== undefined && count > 0 && (
        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Patient</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-sm border border-red-200">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Core fields - always visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={inputClass}
                placeholder="Full name *"
              />
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`${inputClass} pl-10`}
                  placeholder="Phone number *"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className={`${inputClass} pl-10`}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-center gap-2 py-1">
                {([
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: option.value })}
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
            </div>

            {/* Expandable optional sections */}
            <div className="pt-2 space-y-1 border-t border-gray-100">
              {/* Email */}
              <div>
                <ToggleButton open={showEmail} onClick={() => setShowEmail(!showEmail)} icon={Mail} label="Email" />
                {showEmail && (
                  <div className="pl-5 pb-2">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass}
                      placeholder="patient@example.com"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <ToggleButton open={showAddress} onClick={() => setShowAddress(!showAddress)} icon={MapPin} label="Address" />
                {showAddress && (
                  <div className="pl-5 pb-2">
                    <AddressFields value={addressData} onChange={setAddressData} required={false} compact />
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <ToggleButton open={showEmergency} onClick={() => setShowEmergency(!showEmergency)} icon={Users} label="Emergency Contact" />
                {showEmergency && (
                  <div className="pl-5 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className={inputClass}
                      placeholder="Contact person name"
                    />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        className={`${inputClass} pl-10`}
                        placeholder="Contact phone"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Medical Info */}
              <div>
                <ToggleButton
                  open={showMedical}
                  onClick={() => setShowMedical(!showMedical)}
                  icon={Stethoscope}
                  label="Medical Info"
                  count={chronicConditions.length + allergies.length + currentMedications.length}
                />
                {showMedical && (
                  <div className="pl-5 pb-2 space-y-3">
                    <textarea
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                      className={inputClass}
                      rows={2}
                      placeholder="Medical history"
                    />
                    <ChipInput value={chronicConditions} onChange={setChronicConditions} placeholder="Chronic conditions" />
                    <ChipInput value={allergies} onChange={setAllergies} placeholder="Allergies" />
                    <ChipInput value={currentMedications} onChange={setCurrentMedications} placeholder="Current medications" />
                  </div>
                )}
              </div>

              {/* Detailed History */}
              <div>
                <ToggleButton
                  open={showDetailedHistory}
                  onClick={() => setShowDetailedHistory(!showDetailedHistory)}
                  icon={Dumbbell}
                  label="Past History"
                  count={previousSurgeries.length + pastIllnesses.length + pastInvestigations.length}
                />
                {showDetailedHistory && (
                  <div className="pl-5 pb-2 space-y-4">
                    {/* Surgeries */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Surgeries</span>
                        <button type="button" onClick={addPreviousSurgery} className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium">
                          <Plus className="h-3 w-3 mr-0.5" /> Add
                        </button>
                      </div>
                      {previousSurgeries.map((surgery, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input type="text" placeholder="Procedure *" value={surgery.procedure} onChange={(e) => updatePreviousSurgery(index, 'procedure', e.target.value)} className={`flex-1 ${inlineInputClass}`} />
                          <input type="date" value={surgery.date || ''} onChange={(e) => updatePreviousSurgery(index, 'date', e.target.value)} className={`w-36 ${inlineInputClass}`} />
                          <input type="text" placeholder="Body part" value={surgery.body_part} onChange={(e) => updatePreviousSurgery(index, 'body_part', e.target.value)} className={`w-28 ${inlineInputClass}`} />
                          <button type="button" onClick={() => removePreviousSurgery(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Illnesses */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Illnesses</span>
                        <button type="button" onClick={addPastIllness} className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium">
                          <Plus className="h-3 w-3 mr-0.5" /> Add
                        </button>
                      </div>
                      {pastIllnesses.map((illness, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex gap-2 items-center">
                            <input type="text" placeholder="Illness *" value={illness.illness} onChange={(e) => updatePastIllness(index, 'illness', e.target.value)} className={`flex-1 ${inlineInputClass}`} />
                            <input type="date" value={illness.date || ''} onChange={(e) => updatePastIllness(index, 'date', e.target.value)} className={`w-36 ${inlineInputClass}`} />
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="text" placeholder="Treatment *" value={illness.treatment} onChange={(e) => updatePastIllness(index, 'treatment', e.target.value)} className={`flex-1 ${inlineInputClass}`} />
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none shrink-0">
                              <input type="checkbox" checked={illness.resolved} onChange={(e) => updatePastIllness(index, 'resolved', e.target.checked)} className="rounded border-gray-300 text-[#1e5f79] focus:ring-[#1e5f79]" />
                              Resolved
                            </label>
                            <button type="button" onClick={() => removePastIllness(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Investigations */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Investigations</span>
                        <button type="button" onClick={addPastInvestigation} className="flex items-center text-xs text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium">
                          <Plus className="h-3 w-3 mr-0.5" /> Add
                        </button>
                      </div>
                      {pastInvestigations.map((inv, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex gap-2 items-center">
                            <input type="text" placeholder="Type (X-Ray, MRI) *" value={inv.type} onChange={(e) => updatePastInvestigation(index, 'type', e.target.value)} className={`flex-1 ${inlineInputClass}`} />
                            <input type="date" value={inv.date || ''} onChange={(e) => updatePastInvestigation(index, 'date', e.target.value)} className={`w-36 ${inlineInputClass}`} />
                            <input type="text" placeholder="Body part" value={inv.body_part || ''} onChange={(e) => updatePastInvestigation(index, 'body_part', e.target.value)} className={`w-28 ${inlineInputClass}`} />
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="text" placeholder="Findings *" value={inv.findings} onChange={(e) => updatePastInvestigation(index, 'findings', e.target.value)} className={`flex-1 ${inlineInputClass}`} />
                            <button type="button" onClick={() => removePastInvestigation(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lifestyle */}
              <div>
                <ToggleButton open={showLifestyle} onClick={() => setShowLifestyle(!showLifestyle)} icon={Briefcase} label="Lifestyle" />
                {showLifestyle && (
                  <div className="pl-5 pb-2 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className={inputClass} placeholder="Occupation" />
                      <input type="text" value={formData.referral_source} onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })} className={inputClass} placeholder="Referral source" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" value={formData.corporate_company} onChange={(e) => setFormData({ ...formData, corporate_company: e.target.value })} className={inputClass} placeholder="Corporate company" />
                      <textarea value={formData.family_history} onChange={(e) => setFormData({ ...formData, family_history: e.target.value })} className={inputClass} rows={1} placeholder="Family history" />
                    </div>
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
                )}
              </div>

              {/* Conditions */}
              <div>
                <ToggleButton
                  open={showConditions}
                  onClick={() => setShowConditions(!showConditions)}
                  icon={Stethoscope}
                  label="Initial Conditions"
                  count={selectedConditions.length}
                />
                {showConditions && (
                  <div className="pl-5 pb-2 space-y-3">
                    <ConditionSelector
                      selectedConditions={selectedConditions}
                      onConditionsChange={setSelectedConditions}
                      multiple={true}
                      showSearch={true}
                      showBodyRegionFilter={true}
                      placeholder="Search conditions..."
                    />
                    {selectedConditions.length > 0 && (
                      <textarea
                        value={conditionDescription}
                        onChange={(e) => setConditionDescription(e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="Chief complaint (optional)"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Insurance */}
              <div>
                <ToggleButton open={showInsurance} onClick={() => setShowInsurance(!showInsurance)} icon={Shield} label="Insurance" />
                {showInsurance && (
                  <div className="pl-5 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={formData.insurance_provider} onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })} className={inputClass} placeholder="Insurance provider" />
                    <input type="text" value={formData.insurance_policy_number} onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })} className={inputClass} placeholder="Policy number" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

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
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full inline-block" />
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

export default AddPatientModal;

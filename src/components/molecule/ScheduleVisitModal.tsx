import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, AlertCircle, CheckCircle, Video, Users, Stethoscope, Plus, Trash2, Settings } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';
import ConditionSelector from './ConditionSelector';
import type { 
  CreateVisitDto, 
  PhysiotherapistAvailabilityDto, 
  VisitMode,
  PatientConditionResponseDto,
  ChiefComplaintDto,
  TreatmentFocus,
  CreateVisitConditionDto,
  Neo4jConditionResponseDto,
  CreatePatientConditionDto,
  ConditionType
} from '../../lib/types';

interface Patient {
  id: string;
  full_name: string;
  patient_code: string;
}

interface Physiotherapist {
  id: string;
  name: string;
  is_admin: boolean;
}

interface ScheduleVisitModalProps {
  patient: Patient;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ patient, onClose, onSuccess }) => {
  const { currentClinic } = useAppSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [availablePhysiotherapists, setAvailablePhysiotherapists] = useState<Physiotherapist[]>([]);
  
  // Multi-condition support
  const [patientConditions, setPatientConditions] = useState<PatientConditionResponseDto[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [useMultiCondition, setUseMultiCondition] = useState(false);
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaintDto[]>([]);
  
  // Add new condition support
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [selectedNewConditions, setSelectedNewConditions] = useState<Neo4jConditionResponseDto[]>([]);
  const [newConditionType, setNewConditionType] = useState<ConditionType>('ACUTE');
  const [newConditionDescription, setNewConditionDescription] = useState('');
  const [addingNewConditions, setAddingNewConditions] = useState(false);
  const [formData, setFormData] = useState({
    visit_type: 'INITIAL_CONSULTATION',
    visit_mode: 'WALK_IN' as VisitMode,
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    physiotherapist_id: '',
    chief_complaint: '',
  });

  const visitTypes = [
    { value: 'INITIAL_CONSULTATION', label: 'Initial Consultation' },
    { value: 'FOLLOW_UP', label: 'Follow-up' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'EMERGENCY', label: 'Emergency' },
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  // Load patient conditions on mount
  useEffect(() => {
    loadPatientConditions();
  }, [patient.id]);

  useEffect(() => {
    if (formData.scheduled_date && formData.scheduled_time && currentClinic?.id) {
      checkAvailability();
    }
  }, [formData.scheduled_date, formData.scheduled_time, formData.duration_minutes]);

  // Load patient's existing conditions
  const loadPatientConditions = async () => {
    setLoadingConditions(true);
    try {
      const response = await ApiManager.getPatientConditions(patient.id);
      if (response.success) {
        const activeConditions = (response.data || []).filter(
          (condition: PatientConditionResponseDto) => condition.status === 'ACTIVE'
        );
        setPatientConditions(activeConditions);
        
        // Debug: Log patient conditions structure
        console.log('🔍 Loaded patient conditions:', activeConditions);
        activeConditions.forEach((condition, index) => {
          console.log(`📝 Condition ${index + 1}:`, {
            id: condition.id,
            neo4j_condition_id: condition.neo4j_condition_id,
            condition_name: condition.condition_name
          });
        });
        
        // If patient has conditions, suggest using multi-condition mode
        if (activeConditions.length > 0) {
          setUseMultiCondition(true);
        }
      }
    } catch (err) {
      console.error('Failed to load patient conditions:', err);
    } finally {
      setLoadingConditions(false);
    }
  };

  const checkAvailability = async () => {
    if (!currentClinic?.id || !formData.scheduled_date || !formData.scheduled_time) return;

    try {
      setCheckingAvailability(true);
      const availabilityData: PhysiotherapistAvailabilityDto = {
        clinic_id: currentClinic.id,
        date: formData.scheduled_date,
        time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
      };

      const response = await ApiManager.getAvailablePhysiotherapists(availabilityData);
      if (response.success) {
        setAvailablePhysiotherapists(response.data || []);
        // Auto-select first available physiotherapist if only one available
        if (response.data && response.data.length === 1) {
          setFormData(prev => ({ ...prev, physiotherapist_id: response.data[0].id }));
        } else if (response.data && response.data.length === 0) {
          setFormData(prev => ({ ...prev, physiotherapist_id: '' }));
        }
      }
    } catch (err: any) {
      console.error('Failed to check availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Add chief complaint for condition
  const addChiefComplaint = (conditionId: string) => {
    const condition = patientConditions.find(c => c.id === conditionId);
    if (!condition) return;

    // Debug: Log the condition data
    console.log('🔍 Adding chief complaint for condition:', {
      id: condition.id,
      neo4j_condition_id: condition.neo4j_condition_id,
      condition_name: condition.condition_name
    });

    // Safety check: ensure we have a Neo4j condition ID
    if (!condition.neo4j_condition_id) {
      console.error('❌ Patient condition missing neo4j_condition_id:', condition);
      alert(`Error: Patient condition "${condition.condition_name}" is missing Neo4j condition ID. Please contact support.`);
      return;
    }

    const newComplaint: ChiefComplaintDto = {
      condition_id: condition.neo4j_condition_id, // Use Neo4j condition ID, not patient condition UUID
      condition_name: condition.condition_name,
      complaint: '',
      severity: 5,
      treatment_focus: 'PRIMARY'
    };

    setChiefComplaints(prev => [...prev, newComplaint]);
  };

  // Update chief complaint
  const updateChiefComplaint = (index: number, updates: Partial<ChiefComplaintDto>) => {
    setChiefComplaints(prev => prev.map((complaint, i) => 
      i === index ? { ...complaint, ...updates } : complaint
    ));
  };

  // Remove chief complaint
  const removeChiefComplaint = (index: number) => {
    setChiefComplaints(prev => prev.filter((_, i) => i !== index));
  };

  // Add new conditions to patient
  const handleAddNewConditions = async () => {
    if (selectedNewConditions.length === 0) return;

    setAddingNewConditions(true);

    try {
      const addPromises = selectedNewConditions.map(async (condition) => {
        const createData: CreatePatientConditionDto = {
          neo4j_condition_id: condition.condition_id,
          description: newConditionDescription || condition.description,
          condition_type: newConditionType,
          onset_date: undefined // Can be added later
        };

        return ApiManager.createPatientCondition(patient.id, createData);
      });

      const results = await Promise.all(addPromises);
      
      // Check if all requests succeeded
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to add ${failed.length} condition(s)`);
      }

      // Reload patient conditions and auto-add to chief complaints
      await loadPatientConditions();
      
      // Auto-add newly created conditions to chief complaints if in multi-condition mode
      if (useMultiCondition) {
        const newComplaints = selectedNewConditions.map(condition => ({
          condition_id: condition.condition_id,
          condition_name: condition.condition_name,
          complaint: '',
          severity: 5,
          treatment_focus: 'PRIMARY' as TreatmentFocus
        }));
        setChiefComplaints(prev => [...prev, ...newComplaints]);
      } else {
        // Auto-populate single chief complaint with first condition
        const firstCondition = selectedNewConditions[0];
        setFormData(prev => ({
          ...prev,
          chief_complaint: `New assessment for ${firstCondition.condition_name}`
        }));
      }

      // Reset form
      setSelectedNewConditions([]);
      setNewConditionDescription('');
      setNewConditionType('ACUTE');
      setShowAddCondition(false);
    } catch (err: any) {
      console.error('Error adding new conditions:', err);
      setError(err.message || 'Failed to add new conditions');
    } finally {
      setAddingNewConditions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentClinic?.id) {
      setError('No clinic selected');
      return;
    }

    if (!formData.physiotherapist_id) {
      setError('Please select a physiotherapist');
      return;
    }

    try {
      setLoading(true);
      
      // Filter out any chief complaints with invalid condition IDs (UUIDs instead of Neo4j IDs)
      const validComplaints = chiefComplaints.filter(complaint => {
        const isValidNeo4jId = !complaint.condition_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        if (!isValidNeo4jId) {
          console.warn('⚠️ Filtering out complaint with invalid condition_id (UUID):', complaint);
        }
        return isValidNeo4jId;
      });

      if (validComplaints.length !== chiefComplaints.length) {
        console.log(`🧹 Filtered out ${chiefComplaints.length - validComplaints.length} invalid complaints`);
        setChiefComplaints(validComplaints); // Update state to remove invalid complaints
      }

      // Debug: Log chief complaints data
      console.log('🔍 Chief complaints being sent:', validComplaints);
      validComplaints.forEach((complaint, index) => {
        console.log(`📋 Complaint ${index + 1}:`, {
          condition_id: complaint.condition_id,
          condition_name: complaint.condition_name,
          complaint: complaint.complaint,
          treatment_focus: complaint.treatment_focus
        });
      });

      // Prepare visit data with backward compatibility
      const visitData: CreateVisitDto = {
        patient_id: patient.id,
        clinic_id: currentClinic.id,
        physiotherapist_id: formData.physiotherapist_id,
        visit_type: formData.visit_type as any,
        visit_mode: formData.visit_mode,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
        chief_complaint: formData.chief_complaint || undefined,
        chief_complaints: useMultiCondition && validComplaints.length > 0 ? validComplaints : undefined,
      };

      const response = await ApiManager.createVisit(visitData);
      
      if (response.success) {
        const visitId = response.data?.id;
        
        // Visit-conditions are automatically created by the backend when chief_complaints are provided
        console.log(`✅ Visit created successfully with ${validComplaints.length} chief complaints`);
        
        onSuccess();
      } else {
        setError(response.message || 'Failed to schedule visit');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="glass rounded-lg sm:rounded-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border-color">
        {/* Mobile-Responsive Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border-color flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-display font-bold text-text-dark truncate">Schedule Visit 📅</h2>
            <p className="text-xs sm:text-sm text-text-light font-medium truncate">for {patient.full_name} ({patient.patient_code})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-healui-physio/10 rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-text-light" />
          </button>
        </div>

        {/* Mobile-Responsive Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-6">
          {error && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 text-red-600 rounded-lg flex items-center border border-red-200">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">{error}</span>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Visit Type */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5 sm:mb-2">
                Visit Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.visit_type}
                onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                className="w-full px-3 py-2 sm:py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white text-sm sm:text-base"
              >
                {visitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visit Mode */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5 sm:mb-2">
                Visit Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visit_mode: 'WALK_IN' as VisitMode })}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 border rounded-lg transition-all duration-200 ${
                    formData.visit_mode === 'WALK_IN'
                      ? 'border-healui-physio bg-healui-physio/10 text-healui-physio'
                      : 'border-border-color hover:border-healui-physio/50'
                  }`}
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium text-xs sm:text-sm">Walk-in</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visit_mode: 'ONLINE' as VisitMode })}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 border rounded-lg transition-all duration-200 ${
                    formData.visit_mode === 'ONLINE'
                      ? 'border-healui-physio bg-healui-physio/10 text-healui-physio'
                      : 'border-border-color hover:border-healui-physio/50'
                  }`}
                >
                  <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium text-xs sm:text-sm">Online</span>
                </button>
              </div>
              {formData.visit_mode === 'ONLINE' && (
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-light">
                  A video call link will be generated for this appointment
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5 sm:mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5 sm:mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white text-sm sm:text-base"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5 sm:mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 sm:py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white text-sm sm:text-base"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* Available Physiotherapists */}
            {formData.scheduled_date && formData.scheduled_time && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5 sm:mb-2">
                  Available Physiotherapists <span className="text-red-500">*</span>
                </label>
                {checkingAvailability ? (
                  <div className="flex items-center justify-center p-3 sm:p-4 border border-border-color rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-healui-physio mr-2"></div>
                    <span className="text-text-gray font-medium text-xs sm:text-sm">Checking availability...</span>
                  </div>
                ) : availablePhysiotherapists.length === 0 ? (
                  <div className="p-3 sm:p-4 border border-red-300 rounded-lg bg-red-50">
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">No physiotherapists available at this time</span>
                    </div>
                    <p className="text-xs sm:text-sm text-red-500 mt-1 font-medium">
                      Please select a different date or time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {availablePhysiotherapists.map((physio) => (
                      <label key={physio.id} className="flex items-center p-2.5 sm:p-3 border border-border-color rounded-lg hover:bg-healui-physio/5 cursor-pointer transition-all duration-200">
                        <input
                          type="radio"
                          name="physiotherapist"
                          value={physio.id}
                          checked={formData.physiotherapist_id === physio.id}
                          onChange={(e) => setFormData({ ...formData, physiotherapist_id: e.target.value })}
                          className="mr-2 sm:mr-3 text-healui-physio focus:ring-healui-physio/20"
                        />
                        <div className="flex items-center flex-1 min-w-0">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-text-light flex-shrink-0" />
                          <span className="font-medium text-text-dark text-xs sm:text-sm truncate">{physio.name}</span>
                          {physio.is_admin && (
                            <span className="ml-1.5 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-healui-primary/20 text-healui-primary border border-healui-primary/30 flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-healui-physio flex-shrink-0" />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chief Complaint Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-medium text-text-dark">
                  Chief Complaint
                </label>
                {patientConditions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseMultiCondition(!useMultiCondition)}
                    className="text-xs sm:text-sm text-healui-physio hover:text-healui-physio/80 font-medium transition-colors"
                  >
                    {useMultiCondition ? 'Use Simple Mode' : 'Use Condition-Based'}
                  </button>
                )}
              </div>

              {!useMultiCondition ? (
                /* Single Chief Complaint (Legacy Mode) */
                <textarea
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                  className="w-full px-3 py-2 sm:py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white text-sm sm:text-base"
                  rows={3}
                  placeholder="Describe the main reason for this visit..."
                />
              ) : (
                /* Multi-Condition Chief Complaints */
                <div className="space-y-3">
                  {loadingConditions ? (
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      Loading patient conditions...
                    </div>
                  ) : patientConditions.length === 0 ? (
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      No active conditions found for this patient. You can add conditions in the patient details page.
                    </div>
                  ) : (
                    <>
                      {/* Existing Chief Complaints */}
                      {chiefComplaints.map((complaint, index) => (
                        <div key={index} className="p-3 border border-border-color rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-healui-physio" />
                              <span className="font-medium text-sm text-text-dark">
                                {complaint.condition_name}
                              </span>
                              <select
                                value={complaint.treatment_focus}
                                onChange={(e) => updateChiefComplaint(index, { 
                                  treatment_focus: e.target.value as TreatmentFocus 
                                })}
                                className="text-xs px-2 py-1 border border-border-color rounded bg-white"
                              >
                                <option value="PRIMARY">Primary</option>
                                <option value="SECONDARY">Secondary</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeChiefComplaint(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <textarea
                            value={complaint.complaint}
                            onChange={(e) => updateChiefComplaint(index, { complaint: e.target.value })}
                            className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white text-sm"
                            rows={2}
                            placeholder={`Describe complaints related to ${complaint.condition_name}...`}
                          />
                          
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-text-dark mb-1">
                              Severity (1-10)
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={complaint.severity || 5}
                              onChange={(e) => updateChiefComplaint(index, { 
                                severity: parseInt(e.target.value) 
                              })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Mild</span>
                              <span className="font-medium">{complaint.severity || 5}</span>
                              <span>Severe</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Condition Button */}
                      {patientConditions.filter(condition => 
                        !chiefComplaints.some(complaint => complaint.condition_id === condition.id)
                      ).length > 0 && (
                        <div className="border-2 border-dashed border-border-color rounded-lg p-3">
                          <p className="text-sm text-gray-600 mb-2">Add conditions to treat in this visit:</p>
                          <div className="flex flex-wrap gap-2">
                            {patientConditions
                              .filter(condition => 
                                !chiefComplaints.some(complaint => complaint.condition_id === condition.id)
                              )
                              .map(condition => (
                                <button
                                  key={condition.id}
                                  type="button"
                                  onClick={() => addChiefComplaint(condition.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-border-color rounded-lg hover:bg-healui-physio/5 hover:border-healui-physio transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  {condition.condition_name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {chiefComplaints.length === 0 && (
                        <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          Please select at least one condition to treat in this visit.
                        </div>
                      )}
                    </>
                  )}
                  {/* Add New Condition Section */}
                  <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-text-dark">
                      Add New Conditions to Patient
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCondition(!showAddCondition)}
                      className="text-xs sm:text-sm text-healui-physio hover:text-healui-physio/80 font-medium transition-colors flex items-center gap-1"
                    >
                      <Settings className="w-4 h-4" />
                      {showAddCondition ? 'Hide' : 'Add Conditions'}
                    </button>
                  </div>

                  {showAddCondition && (
                    <div className="space-y-4 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs text-gray-600">
                        Add new conditions to the patient's medical record. They will be available for future visits.
                      </p>
                      
                      <ConditionSelector
                        patientId={patient.id}
                        selectedConditions={selectedNewConditions}
                        onConditionsChange={setSelectedNewConditions}
                        multiple={true}
                        showSearch={true}
                        showBodyRegionFilter={true}
                        placeholder="Search for new conditions to add..."
                      />

                      {selectedNewConditions.length > 0 && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Condition Type
                            </label>
                            <select
                              value={newConditionType}
                              onChange={(e) => setNewConditionType(e.target.value as ConditionType)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio text-sm"
                            >
                              <option value="ACUTE">Acute</option>
                              <option value="CHRONIC">Chronic</option>
                              <option value="POST_SURGICAL">Post-Surgical</option>
                              <option value="CONGENITAL">Congenital</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Description (Optional)
                            </label>
                            <textarea
                              value={newConditionDescription}
                              onChange={(e) => setNewConditionDescription(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio text-sm"
                              rows={2}
                              placeholder="Add any patient-specific notes about these conditions..."
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNewConditions([]);
                                setNewConditionDescription('');
                                setNewConditionType('ACUTE');
                                setShowAddCondition(false);
                              }}
                              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddNewConditions}
                              disabled={addingNewConditions}
                              className="px-4 py-1.5 bg-healui-physio text-white rounded-md hover:bg-healui-physio/90 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              {addingNewConditions ? 'Adding...' : `Add ${selectedNewConditions.length} Condition(s)`}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Mobile-Responsive Footer */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border-color flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || availablePhysiotherapists.length === 0 || !formData.physiotherapist_id}
            className="btn-primary px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
          >
            {loading ? 'Scheduling...' : 'Schedule Visit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleVisitModal;
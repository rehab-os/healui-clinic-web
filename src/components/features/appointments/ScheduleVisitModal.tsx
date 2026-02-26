import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CalendarDays } from 'lucide-react';
import { parseISO, startOfDay } from 'date-fns';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import { Calendar } from '@/components/ui/calendar';
import type {
  CreateVisitDto,
  PhysiotherapistAvailabilityDto,
  VisitMode,
  PatientConditionResponseDto,
  ChiefComplaintDto,
  TreatmentFocus,
} from '@/lib/types';

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
  const [slideIn, setSlideIn] = useState(false);

  // Calendar open/close
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Conditions
  const [patientConditions, setPatientConditions] = useState<PatientConditionResponseDto[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    visit_type: 'INITIAL_CONSULTATION',
    visit_mode: 'WALK_IN' as VisitMode,
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    physiotherapist_id: '',
  });

  const calendarDate = formData.scheduled_date ? parseISO(formData.scheduled_date.split('T')[0]) : undefined;

  const visitTypes = [
    { value: 'INITIAL_CONSULTATION', label: 'Initial' },
    { value: 'FOLLOW_UP', label: 'Follow-up' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'EMERGENCY', label: 'Emergency' },
  ];

  const durations = [
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  // Slide in on mount
  useEffect(() => {
    requestAnimationFrame(() => setSlideIn(true));
  }, []);

  // Close calendar on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [calendarOpen]);

  // Load patient conditions
  useEffect(() => {
    const load = async () => {
      setLoadingConditions(true);
      try {
        const response = await ApiManager.getPatientConditions(patient.id);
        if (response.success) {
          const active = (response.data || []).filter(
            (c: PatientConditionResponseDto) => c.status === 'ACTIVE'
          );
          setPatientConditions(active);
        }
      } catch (err) {
        console.error('Failed to load conditions:', err);
      } finally {
        setLoadingConditions(false);
      }
    };
    load();
  }, [patient.id]);

  // Check availability when date/time change
  useEffect(() => {
    if (formData.scheduled_date && formData.scheduled_time && currentClinic?.id) {
      checkAvailability();
    }
  }, [formData.scheduled_date, formData.scheduled_time, formData.duration_minutes]);

  const checkAvailability = async () => {
    if (!currentClinic?.id || !formData.scheduled_date || !formData.scheduled_time) return;
    try {
      setCheckingAvailability(true);
      const data: PhysiotherapistAvailabilityDto = {
        clinic_id: currentClinic.id,
        date: formData.scheduled_date,
        time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
      };
      const response = await ApiManager.getAvailablePhysiotherapists(data);
      if (response.success) {
        setAvailablePhysiotherapists(response.data || []);
        if (response.data?.length === 1) {
          setFormData(prev => ({ ...prev, physiotherapist_id: response.data[0].id }));
        } else if (response.data?.length === 0) {
          setFormData(prev => ({ ...prev, physiotherapist_id: '' }));
        }
      }
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const toggleCondition = (conditionId: string) => {
    setSelectedConditionIds(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleClose = () => {
    setSlideIn(false);
    setTimeout(onClose, 250);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    if (!currentClinic?.id) { setError('No clinic selected'); return; }
    if (!formData.physiotherapist_id) { setError('Please select a physiotherapist'); return; }
    if (!formData.scheduled_date || !formData.scheduled_time) { setError('Please select date and time'); return; }

    try {
      setLoading(true);

      const chiefComplaints: ChiefComplaintDto[] = selectedConditionIds
        .map(pcId => {
          const condition = patientConditions.find(c => c.id === pcId);
          if (!condition?.condition_id) return null;
          if (condition.condition_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return null;
          return {
            condition_id: condition.condition_id,
            condition_name: condition.condition_name,
            complaint: '',
            severity: 5,
            treatment_focus: 'PRIMARY' as TreatmentFocus,
            patient_condition_id: condition.id,
          };
        })
        .filter(Boolean) as ChiefComplaintDto[];

      const visitData: CreateVisitDto = {
        patient_id: patient.id,
        clinic_id: currentClinic.id,
        physiotherapist_id: formData.physiotherapist_id,
        visit_type: formData.visit_type as any,
        visit_mode: formData.visit_mode,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
        chief_complaints: chiefComplaints.length > 0 ? chiefComplaints : undefined,
      };

      const response = await ApiManager.createVisit(visitData);
      if (response.success) {
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const iso = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, scheduled_date: iso }));
      setCalendarOpen(false);
    }
  };

  const formatSelectedDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-250 ${slideIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sliding panel */}
      <div
        className={`absolute inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-lg flex flex-col transform transition-transform duration-250 ease-out ${
          slideIn ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Schedule Visit</h2>
            <p className="text-sm text-gray-500 mt-0.5">{patient.full_name}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Visit Mode — toggle */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Visit Mode</label>
            <div className="inline-flex p-0.5 bg-gray-100 rounded-md">
              {(['WALK_IN', 'ONLINE'] as VisitMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visit_mode: mode }))}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                    formData.visit_mode === mode
                      ? 'bg-white text-brand-teal shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  {mode === 'WALK_IN' ? 'In-Clinic' : 'Online'}
                </button>
              ))}
            </div>
          </div>

          {/* Visit Type — tag buttons */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Visit Type</label>
            <div className="flex flex-wrap gap-1.5">
              {visitTypes.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visit_type: t.value }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    formData.visit_type === t.value
                      ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration — preset buttons */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Duration</label>
            <div className="flex gap-2">
              {durations.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration_minutes: d.value }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                    formData.duration_minutes === d.value
                      ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date — click-to-expand calendar */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Date</label>
            <div ref={calendarRef} className="relative">
              <button
                type="button"
                onClick={() => setCalendarOpen(!calendarOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-left transition-colors ${
                  calendarOpen
                    ? 'border-brand-teal ring-1 ring-brand-teal/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  {calendarDate ? (
                    <span className="text-sm text-gray-800 font-medium">{formatSelectedDate(calendarDate)}</span>
                  ) : (
                    <span className="text-sm text-gray-400">Select a date...</span>
                  )}
                </div>
              </button>

              {calendarOpen && (
                <div className="absolute z-50 mt-1.5 left-0 right-0 bg-white rounded-md border border-gray-200 shadow-md">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < startOfDay(new Date())}
                    defaultMonth={calendarDate || new Date()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Time — select */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Time</label>
            <select
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal bg-white"
            >
              <option value="">Select time</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Available Physiotherapists */}
          {formData.scheduled_date && formData.scheduled_time && (
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Physiotherapist</label>
              {checkingAvailability ? (
                <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                  <div className="w-3.5 h-3.5 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                  Checking availability...
                </div>
              ) : availablePhysiotherapists.length === 0 ? (
                <p className="text-xs text-red-600 py-2">No physiotherapists available at this time. Try a different slot.</p>
              ) : (
                <div className="space-y-1">
                  {availablePhysiotherapists.map(physio => (
                    <label
                      key={physio.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        formData.physiotherapist_id === physio.id
                          ? 'bg-brand-teal/5 border border-brand-teal'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="physiotherapist"
                        value={physio.id}
                        checked={formData.physiotherapist_id === physio.id}
                        onChange={e => setFormData(prev => ({ ...prev, physiotherapist_id: e.target.value }))}
                        className="text-brand-teal focus:ring-brand-teal"
                      />
                      <span className="text-sm text-gray-800 font-medium">{physio.name}</span>
                      {physio.is_admin && (
                        <span className="text-[10px] text-gray-400 font-medium">Admin</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conditions — clickable tags */}
          {!loadingConditions && patientConditions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Conditions</label>
              <div className="flex flex-wrap gap-1.5">
                {patientConditions
                  .filter(c => c.condition_id)
                  .map(condition => {
                    const isSelected = selectedConditionIds.includes(condition.id);
                    return (
                      <button
                        key={condition.id}
                        type="button"
                        onClick={() => toggleCondition(condition.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                          isSelected
                            ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {condition.condition_name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.physiotherapist_id || !formData.scheduled_date || !formData.scheduled_time}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-teal-700 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Scheduling...' : 'Schedule Visit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleVisitModal;

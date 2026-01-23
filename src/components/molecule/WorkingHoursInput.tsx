'use client';

import React from 'react';
import { Plus, X, Clock, Calendar } from 'lucide-react';
import { WorkingHours, DaySchedule, TimePhase } from '../../lib/types';

interface WorkingHoursInputProps {
  value: WorkingHours;
  onChange: (value: WorkingHours) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DEFAULT_PHASE: Omit<TimePhase, 'id'> = {
  start_time: '09:00',
  end_time: '17:00'
};

// Predefined service options
const SERVICE_OPTIONS = [
  'Consultation',
  'Physiotherapy',
  'Assessment',
  'Rehabilitation',
  'Manual Therapy',
  'Exercise Therapy',
  'Electrotherapy',
  'Hydrotherapy',
  'Sports Therapy',
  'Occupational Therapy',
  'Acupuncture',
  'Dry Needling'
];

const WorkingHoursInput: React.FC<WorkingHoursInputProps> = ({ value, onChange }) => {
  const generateId = () => `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleDayToggle = (day: string, isOpen: boolean) => {
    const currentDay = value[day as keyof WorkingHours] || { is_open: false, phases: [] };
    
    const updatedDay: DaySchedule = {
      is_open: isOpen,
      phases: isOpen && currentDay.phases.length === 0 
        ? [{ ...DEFAULT_PHASE, id: generateId() }] 
        : currentDay.phases
    };

    onChange({
      ...value,
      [day]: updatedDay
    });
  };

  const handleAddPhase = (day: string) => {
    const currentDay = value[day as keyof WorkingHours];
    if (!currentDay || !currentDay.is_open) return;

    const newPhase: TimePhase = {
      ...DEFAULT_PHASE,
      id: generateId()
    };

    onChange({
      ...value,
      [day]: {
        ...currentDay,
        phases: [...currentDay.phases, newPhase]
      }
    });
  };

  const handleRemovePhase = (day: string, phaseId: string) => {
    const currentDay = value[day as keyof WorkingHours];
    if (!currentDay) return;

    onChange({
      ...value,
      [day]: {
        ...currentDay,
        phases: currentDay.phases.filter(p => p.id !== phaseId)
      }
    });
  };

  const handlePhaseUpdate = (day: string, phaseId: string, updates: Partial<TimePhase>) => {
    const currentDay = value[day as keyof WorkingHours];
    if (!currentDay) return;

    onChange({
      ...value,
      [day]: {
        ...currentDay,
        phases: currentDay.phases.map(phase =>
          phase.id === phaseId ? { ...phase, ...updates } : phase
        )
      }
    });
  };

  const copyFromPreviousDay = (day: string) => {
    const dayIndex = DAYS.indexOf(day as typeof DAYS[number]);
    if (dayIndex <= 0) return;

    const previousDay = DAYS[dayIndex - 1];
    const previousDaySchedule = value[previousDay];
    
    if (previousDaySchedule && previousDaySchedule.is_open) {
      const copiedSchedule: DaySchedule = {
        is_open: true,
        phases: previousDaySchedule.phases.map(phase => ({
          ...phase,
          id: generateId() // Generate new IDs for copied phases
        }))
      };

      onChange({
        ...value,
        [day]: copiedSchedule
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-brand-teal" />
        <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>
      </div>

      <div className="space-y-4">
        {DAYS.map((day) => {
          const daySchedule = value[day] || { is_open: false, phases: [] };
          const dayIndex = DAYS.indexOf(day);
          const previousDay = dayIndex > 0 ? DAYS[dayIndex - 1] : null;
          const hasPreviousDay = previousDay && value[previousDay]?.is_open;

          return (
            <DayScheduleInput
              key={day}
              day={day}
              schedule={daySchedule}
              onToggleDay={(isOpen) => handleDayToggle(day, isOpen)}
              onAddPhase={() => handleAddPhase(day)}
              onRemovePhase={(phaseId) => handleRemovePhase(day, phaseId)}
              onUpdatePhase={(phaseId, updates) => handlePhaseUpdate(day, phaseId, updates)}
              onCopyFromPrevious={hasPreviousDay ? () => copyFromPreviousDay(day) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

interface DayScheduleInputProps {
  day: string;
  schedule: DaySchedule;
  onToggleDay: (isOpen: boolean) => void;
  onAddPhase: () => void;
  onRemovePhase: (phaseId: string) => void;
  onUpdatePhase: (phaseId: string, updates: Partial<TimePhase>) => void;
  onCopyFromPrevious?: () => void;
}

// Helper function to check if two time slots overlap
const checkTimeOverlap = (phase1: TimePhase, phase2: TimePhase): boolean => {
  if (!phase1.start_time || !phase1.end_time || !phase2.start_time || !phase2.end_time) {
    return false;
  }

  const start1 = new Date(`1970-01-01T${phase1.start_time}:00`);
  const end1 = new Date(`1970-01-01T${phase1.end_time}:00`);
  const start2 = new Date(`1970-01-01T${phase2.start_time}:00`);
  const end2 = new Date(`1970-01-01T${phase2.end_time}:00`);

  return start1 < end2 && start2 < end1;
};

// Helper function to find overlapping phases for a given phase
const findOverlappingPhases = (currentPhase: TimePhase, allPhases: TimePhase[]): TimePhase[] => {
  return allPhases.filter(phase => 
    phase.id !== currentPhase.id && checkTimeOverlap(currentPhase, phase)
  );
};

const DayScheduleInput: React.FC<DayScheduleInputProps> = ({
  day,
  schedule,
  onToggleDay,
  onAddPhase,
  onRemovePhase,
  onUpdatePhase,
  onCopyFromPrevious
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Day Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={schedule.is_open}
              onChange={(e) => onToggleDay(e.target.checked)}
              className="h-4 w-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
            />
            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
              {day}
            </span>
          </label>
          
          {onCopyFromPrevious && !schedule.is_open && (
            <button
              onClick={onCopyFromPrevious}
              className="text-xs text-brand-teal hover:text-brand-teal/80 flex items-center space-x-1"
            >
              <Calendar className="h-3 w-3" />
              <span>Copy from previous</span>
            </button>
          )}
        </div>

        {schedule.is_open && (
          <button
            onClick={onAddPhase}
            className="flex items-center space-x-1 text-sm text-brand-teal hover:text-brand-teal/80"
          >
            <Plus className="h-4 w-4" />
            <span>Add Time Slot</span>
          </button>
        )}
      </div>

      {/* Time Slots */}
      {schedule.is_open && (
        <div className="space-y-3">
          {schedule.phases.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Click "Add Time Slot" to set working hours for this day
            </div>
          )}
          
          {schedule.phases.map((phase, index) => {
            const overlappingPhases = findOverlappingPhases(phase, schedule.phases);
            return (
              <PhaseInput
                key={phase.id}
                phase={phase}
                index={index}
                onUpdate={(updates) => onUpdatePhase(phase.id, updates)}
                onRemove={() => onRemovePhase(phase.id)}
                canRemove={schedule.phases.length > 1}
                hasOverlap={overlappingPhases.length > 0}
                overlappingPhases={overlappingPhases}
              />
            );
          })}
        </div>
      )}

      {!schedule.is_open && (
        <div className="text-sm text-gray-500 italic py-2">
          Clinic is closed on {day}
        </div>
      )}
    </div>
  );
};

interface PhaseInputProps {
  phase: TimePhase;
  index: number;
  onUpdate: (updates: Partial<TimePhase>) => void;
  onRemove: () => void;
  canRemove: boolean;
  hasOverlap: boolean;
  overlappingPhases: TimePhase[];
}

const PhaseInput: React.FC<PhaseInputProps> = ({
  phase,
  index,
  onUpdate,
  onRemove,
  canRemove,
  hasOverlap,
  overlappingPhases
}) => {
  const validateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return true;
    
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    return start < end;
  };

  const isTimeRangeValid = validateTimeRange(phase.start_time, phase.end_time);

  const handleServiceToggle = (service: string) => {
    const currentServices = phase.services || [];
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    onUpdate({ services: updatedServices.length > 0 ? updatedServices : undefined });
  };

  return (
    <div className={`p-3 rounded-lg border ${
      !isTimeRangeValid || hasOverlap 
        ? 'border-red-200 bg-red-50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        {/* Start Time */}
        <div className="flex items-center space-x-1">
          <input
            type="time"
            value={phase.start_time}
            onChange={(e) => onUpdate({ start_time: e.target.value })}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
          />
        </div>
        
        <span className="text-gray-500 text-sm">to</span>
        
        {/* End Time */}
        <div className="flex items-center space-x-1">
          <input
            type="time"
            value={phase.end_time}
            onChange={(e) => onUpdate({ end_time: e.target.value })}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
          />
        </div>
        
        {/* Remove Button */}
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
            title="Remove time slot"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isTimeRangeValid && (
        <div className="mt-2 text-xs text-red-600">
          End time must be after start time
        </div>
      )}

      {hasOverlap && (
        <div className="mt-2 text-xs text-red-600">
          <div className="flex items-center space-x-1">
            <span>⚠️ Time slot overlaps with:</span>
          </div>
          <div className="mt-1 space-y-1">
            {overlappingPhases.map((overlappingPhase) => (
              <div key={overlappingPhase.id} className="text-red-500">
                • {overlappingPhase.start_time} - {overlappingPhase.end_time}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Services Available:</div>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((service) => {
            const isSelected = phase.services?.includes(service) || false;
            return (
              <button
                key={service}
                onClick={() => handleServiceToggle(service)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-brand-teal text-white border-brand-teal'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-teal hover:text-brand-teal'
                }`}
              >
                {service}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursInput;
'use client';

import React from 'react';
import { Plus, X, Clock, Calendar } from 'lucide-react';
import { WorkingHours, DaySchedule, TimePhase } from '@/lib/types';

interface WorkingHoursInputProps {
  value: WorkingHours;
  onChange: (value: WorkingHours) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DEFAULT_PHASE: Omit<TimePhase, 'id'> = {
  start_time: '09:00',
  end_time: '17:00'
};

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
          id: generateId()
        }))
      };

      onChange({
        ...value,
        [day]: copiedSchedule
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <Clock className="h-4 w-4 text-brand-teal" />
        <h3 className="text-sm font-semibold text-gray-900">Working Hours</h3>
      </div>

      <div className="space-y-2">
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
  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1, 3);

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${schedule.is_open ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.is_open}
              onChange={(e) => onToggleDay(e.target.checked)}
              className="h-3.5 w-3.5 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
            />
            <span className={`text-sm font-medium capitalize ${schedule.is_open ? 'text-gray-900' : 'text-gray-400'}`}>
              {day}
            </span>
          </label>

          {onCopyFromPrevious && !schedule.is_open && (
            <button
              onClick={onCopyFromPrevious}
              className="text-[10px] text-brand-teal hover:text-teal-700 flex items-center gap-0.5"
            >
              <Calendar className="h-2.5 w-2.5" />
              Copy prev
            </button>
          )}
        </div>

        {schedule.is_open && (
          <div className="flex items-center gap-2">
            {/* Inline time slots */}
            <div className="flex items-center gap-2 flex-wrap">
              {schedule.phases.map((phase, index) => {
                const overlaps = findOverlappingPhases(phase, schedule.phases);
                const hasOverlap = overlaps.length > 0;
                const isValid = !phase.start_time || !phase.end_time ||
                  new Date(`1970-01-01T${phase.start_time}:00`) < new Date(`1970-01-01T${phase.end_time}:00`);

                return (
                  <div
                    key={phase.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-sm ${
                      !isValid || hasOverlap
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <input
                      type="time"
                      value={phase.start_time}
                      onChange={(e) => onUpdatePhase(phase.id, { start_time: e.target.value })}
                      className="w-[5.5rem] px-1 py-0.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                    />
                    <span className="text-gray-400 text-[10px]">to</span>
                    <input
                      type="time"
                      value={phase.end_time}
                      onChange={(e) => onUpdatePhase(phase.id, { end_time: e.target.value })}
                      className="w-[5.5rem] px-1 py-0.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                    />
                    {schedule.phases.length > 1 && (
                      <button
                        onClick={() => onRemovePhase(phase.id)}
                        className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={onAddPhase}
              className="p-1 text-brand-teal hover:bg-brand-teal/10 rounded transition-colors"
              title="Add time slot"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!schedule.is_open && (
          <span className="text-xs text-gray-400">Closed</span>
        )}
      </div>
    </div>
  );
};

export default WorkingHoursInput;

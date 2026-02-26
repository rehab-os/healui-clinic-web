'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CalendarDays } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import { Calendar } from '@/components/ui/calendar';

interface Visit {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  visit_type: string;
  chief_complaint?: string;
  patient?: {
    id: string;
    full_name: string;
    phone: string;
  };
  physiotherapist?: {
    id: string;
    full_name: string;
  };
}

interface RescheduleVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: () => void;
}

const RescheduleVisitModal: React.FC<RescheduleVisitModalProps> = ({ visit, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(visit.scheduled_date);
  const [selectedTime, setSelectedTime] = useState(visit.scheduled_time);
  const [duration, setDuration] = useState(visit.duration_minutes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIn, setSlideIn] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Safely parse — selectedDate may be "2026-02-26" or full ISO "2026-02-26T00:00:00.000Z"
  const calendarDate = selectedDate ? parseISO(selectedDate.split('T')[0]) : undefined;

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

  const handleClose = () => {
    setSlideIn(false);
    setTimeout(onClose, 250);
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select date and time');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ApiManager.rescheduleVisit(visit.id, {
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        duration_minutes: duration
      });
      if (response.success) {
        onSuccess();
        handleClose();
      } else {
        setError(response.message || 'Failed to reschedule appointment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date.toISOString().split('T')[0]);
      setCalendarOpen(false);
    }
  };

  const formatSelectedDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const isChanged = selectedDate !== visit.scheduled_date || selectedTime !== visit.scheduled_time || duration !== visit.duration_minutes;

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
            <h2 className="text-base font-semibold text-gray-900">Reschedule Visit</h2>
            <p className="text-sm text-gray-500 mt-0.5">{visit.patient?.full_name}</p>
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

          {/* Current details — subtle reference */}
          <div className="p-3 bg-gray-50 rounded-md text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Current date</span>
              <span className="text-gray-700 font-medium">{format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>Current time</span>
              <span className="text-gray-700 font-medium">{visit.scheduled_time}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration</span>
              <span className="text-gray-700 font-medium">{visit.duration_minutes} min</span>
            </div>
          </div>

          {/* Date — click-to-expand calendar */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">New Date</label>
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
            <label className="text-sm font-medium text-gray-900 block mb-2">New Time</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal bg-white"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Duration — preset buttons */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Duration</label>
            <div className="flex gap-2">
              {durations.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                    duration === d.value
                      ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Physiotherapist note */}
          {visit.physiotherapist && isChanged && (
            <p className="text-xs text-gray-400">
              This appointment will remain with {visit.physiotherapist.full_name}.
            </p>
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
            onClick={handleReschedule}
            disabled={loading || !isChanged}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-teal-700 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Rescheduling...' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleVisitModal;

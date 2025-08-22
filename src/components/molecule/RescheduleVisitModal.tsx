'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Check, User, FileText, AlertCircle } from 'lucide-react';
import { format, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { useAppSelector } from '../../store/hooks';
import ApiManager from '../../services/api';

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

const RescheduleVisitModal: React.FC<RescheduleVisitModalProps> = ({ 
  visit, 
  onClose, 
  onSuccess 
}) => {
  const { currentClinic } = useAppSelector(state => state.user);
  const [selectedDate, setSelectedDate] = useState(visit.scheduled_date);
  const [selectedTime, setSelectedTime] = useState(visit.scheduled_time);
  const [duration, setDuration] = useState(visit.duration_minutes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Note: Physiotherapist cannot be changed during reschedule based on current API
  // const [availablePhysiotherapists, setAvailablePhysiotherapists] = useState<any[]>([]);
  // const [selectedPhysiotherapist, setSelectedPhysiotherapist] = useState(visit.physiotherapist?.id || '');

  // Generate time slots (9 AM to 6 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate next 30 days for date selection
  const generateDateOptions = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      // Skip Sundays (0 = Sunday)
      if (date.getDay() !== 0) {
        dates.push(format(date, 'yyyy-MM-dd'));
      }
    }
    return dates;
  };

  const dateOptions = generateDateOptions();

  // Note: Removed availability check since physiotherapist cannot be changed
  // The current physiotherapist will remain assigned to the visit

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
        onClose();
      } else {
        setError(response.message || 'Failed to reschedule appointment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM dd, yyyy');
  };

  const isDateTimeChanged = selectedDate !== visit.scheduled_date || selectedTime !== visit.scheduled_time || duration !== visit.duration_minutes;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
              <p className="text-sm text-gray-500">Update appointment date and time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Appointment Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              Current Appointment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Patient:</span>
                <p className="font-medium text-gray-900">{visit.patient?.full_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium text-gray-900">{visit.patient?.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Current Date:</span>
                <p className="font-medium text-gray-900">{formatDate(visit.scheduled_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">Current Time:</span>
                <p className="font-medium text-gray-900">{visit.scheduled_time}</p>
              </div>
              {visit.chief_complaint && (
                <div className="md:col-span-2">
                  <span className="text-gray-600">Chief Complaint:</span>
                  <p className="font-medium text-gray-900">{visit.chief_complaint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* New Date Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              Select New Date & Time
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dateOptions.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>

            {/* Note about physiotherapist */}
            {visit.physiotherapist && isDateTimeChanged && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-700 text-sm">
                  <strong>Note:</strong> This appointment will remain with <strong>{visit.physiotherapist.full_name}</strong>. 
                  To change the physiotherapist, please cancel this appointment and create a new one.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={loading || !isDateTimeChanged}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Rescheduling...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Reschedule Appointment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleVisitModal;
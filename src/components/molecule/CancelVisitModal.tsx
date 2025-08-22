'use client';

import React, { useState } from 'react';
import { X, AlertCircle, User, Calendar, Clock, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

interface CancelVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: () => void;
}

const CancelVisitModal: React.FC<CancelVisitModalProps> = ({ 
  visit, 
  onClose, 
  onSuccess 
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancellationReasons = [
    'Patient requested cancellation',
    'Patient illness',
    'Emergency situation',
    'Schedule conflict',
    'Weather conditions',
    'Transportation issues',
    'Doctor unavailable',
    'Clinic closure',
    'Other'
  ];

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Please select or provide a cancellation reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await ApiManager.cancelVisit(visit.id, {
        cancellation_reason: reason
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to cancel appointment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM dd, yyyy');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cancel Appointment</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
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
          {/* Appointment Info */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-red-600" />
              Appointment Details
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium text-gray-900">{visit.patient?.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium text-gray-900">{visit.patient?.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Date:
                </span>
                <span className="font-medium text-gray-900">{formatDate(visit.scheduled_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Time:
                </span>
                <span className="font-medium text-gray-900">{visit.scheduled_time}</span>
              </div>
              {visit.physiotherapist && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium text-gray-900">{visit.physiotherapist.full_name}</span>
                </div>
              )}
              {visit.chief_complaint && (
                <div className="pt-2 border-t border-red-100">
                  <span className="text-gray-600">Chief Complaint:</span>
                  <p className="font-medium text-gray-900 mt-1">{visit.chief_complaint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium text-sm">Important Notice</p>
              <p className="text-amber-700 text-sm mt-1">
                Cancelling this appointment will notify the patient and free up the time slot. 
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-2 mb-4">
              {cancellationReasons.map((reasonOption) => (
                <label
                  key={reasonOption}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    reason === reasonOption
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reasonOption}
                    checked={reason === reasonOption}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-3 text-sm text-gray-900">{reasonOption}</span>
                </label>
              ))}
            </div>

            {/* Custom reason input */}
            {reason === 'Other' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify
                </label>
                <textarea
                  value={reason === 'Other' ? '' : reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter custom cancellation reason..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
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
            Keep Appointment
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || !reason.trim()}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span>Cancel Appointment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelVisitModal;
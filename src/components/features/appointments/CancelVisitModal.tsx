'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ApiManager from '@/services/api/api.service';

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

const cancellationReasons = [
  'Patient requested',
  'Patient illness',
  'Emergency',
  'Schedule conflict',
  'Doctor unavailable',
  'Other',
];

const CancelVisitModal: React.FC<CancelVisitModalProps> = ({ visit, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIn, setSlideIn] = useState(false);

  // Slide in on mount
  useEffect(() => {
    requestAnimationFrame(() => setSlideIn(true));
  }, []);

  const handleClose = () => {
    setSlideIn(false);
    setTimeout(onClose, 250);
  };

  const handleCancel = async () => {
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ApiManager.cancelVisit(visit.id, {
        cancellation_reason: finalReason,
      });
      if (response.success) {
        onSuccess();
        handleClose();
      } else {
        setError(response.message || 'Failed to cancel appointment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const effectiveReason = reason === 'Other' ? customReason.trim() : reason;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-250 ${slideIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sliding panel */}
      <div
        className={`absolute inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-lg flex flex-col transform transition-transform duration-250 ease-out ${
          slideIn ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Cancel Visit</h2>
            <p className="text-sm text-gray-500 mt-0.5">{visit.patient?.full_name}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Visit details — subtle reference */}
          <div className="p-3 bg-gray-50 rounded-md text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Date</span>
              <span className="text-gray-700 font-medium">{format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>Time</span>
              <span className="text-gray-700 font-medium">{visit.scheduled_time}</span>
            </div>
            {visit.physiotherapist && (
              <div className="flex justify-between">
                <span>Physiotherapist</span>
                <span className="text-gray-700 font-medium">{visit.physiotherapist.full_name}</span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 border-l-2 border-amber-400 bg-amber-50 rounded-r-md">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              This will notify the patient and free up the time slot. This action cannot be undone.
            </p>
          </div>

          {/* Reason selection — tag buttons */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">
              Reason <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {cancellationReasons.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setReason(r); setError(null); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    reason === r
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          {reason === 'Other' && (
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Specify reason</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 resize-none"
              />
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
            Keep Visit
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || !effectiveReason}
            className="px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Cancelling...' : 'Cancel Visit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelVisitModal;

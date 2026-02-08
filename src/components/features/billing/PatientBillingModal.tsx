'use client';

import React, { useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import PatientBillingPanel from './PatientBillingPanel';

interface PatientBillingModalProps {
  patientId: string;
  patientName: string;
  clinicId: string;
  onClose: () => void;
}

const PatientBillingModal: React.FC<PatientBillingModalProps> = ({
  patientId,
  patientName,
  clinicId,
  onClose
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel from Right */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          className="w-screen max-w-md transform transition-transform duration-200 ease-out"
          style={{ animation: 'slideInRight 0.2s ease-out' }}
        >
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-xs">
                      {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">{patientName}</h2>
                    <p className="text-xs text-gray-500">Billing</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <PatientBillingPanel
                patientId={patientId}
                patientName={patientName}
                clinicId={clinicId}
                compact={false}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PatientBillingModal;

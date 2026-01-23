'use client';

import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface OutstandingPatient {
  patientId: string;
  patientName: string;
  clinicName?: string;
  amount: number;
  lastVisitDate: string;
  daysSinceVisit: number;
}

interface OutstandingListProps {
  patients: OutstandingPatient[];
  loading?: boolean;
  showClinic?: boolean;
  maxItems?: number;
  onRecordPayment?: (patientId: string) => void;
}

export default function OutstandingList({
  patients,
  loading = false,
  showClinic = false,
  maxItems = 10,
  onRecordPayment,
}: OutstandingListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-5 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No outstanding payments</p>
      </div>
    );
  }

  const displayedPatients = patients.slice(0, maxItems);
  const totalOutstanding = patients.reduce((sum, p) => sum + p.amount, 0);

  const getUrgencyColor = (days: number) => {
    if (days > 30) return 'text-red-600 bg-red-50';
    if (days > 14) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div>
      {/* Total Outstanding Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <span className="text-sm text-gray-500">Total Outstanding</span>
        <span className="text-lg font-bold text-red-600">
          ₹{totalOutstanding.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Patient List */}
      <div className="space-y-2">
        {displayedPatients.map((patient) => (
          <div
            key={patient.patientId}
            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/patients/${patient.patientId}`}
                  className="font-medium text-gray-900 hover:text-brand-teal truncate"
                >
                  {patient.patientName}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                {showClinic && patient.clinicName && (
                  <span>{patient.clinicName}</span>
                )}
                <span className={`px-1.5 py-0.5 rounded ${getUrgencyColor(patient.daysSinceVisit)}`}>
                  {patient.daysSinceVisit}d ago
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold text-gray-900">
                ₹{patient.amount.toLocaleString('en-IN')}
              </div>
            </div>

            {onRecordPayment && (
              <button
                onClick={() => onRecordPayment(patient.patientId)}
                className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {patients.length > maxItems && (
        <div className="text-center pt-3">
          <Link
            href="/dashboard/billing?tab=outstanding"
            className="text-sm text-brand-teal hover:underline"
          >
            View all {patients.length} outstanding
          </Link>
        </div>
      )}
    </div>
  );
}

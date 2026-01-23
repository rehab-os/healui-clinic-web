'use client';

import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SessionEndingPatient {
  patientId: string;
  patientName: string;
  patientCode?: string;
  sessionsLeft: number;
  packName: string;
  conditionName?: string;
}

interface SessionsEndingSoonProps {
  patients: SessionEndingPatient[];
  loading?: boolean;
  maxItems?: number;
}

export default function SessionsEndingSoon({
  patients,
  loading = false,
  maxItems = 5,
}: SessionsEndingSoonProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="w-28 h-4 bg-gray-200 rounded mb-1"></div>
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No sessions ending soon</p>
      </div>
    );
  }

  const displayedPatients = patients.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayedPatients.map((patient) => (
        <Link
          key={patient.patientId}
          href={`/dashboard/patients/${patient.patientId}`}
          className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg hover:border-yellow-200 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {patient.patientName}
              </span>
              {patient.patientCode && (
                <span className="text-xs text-gray-400">{patient.patientCode}</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {patient.packName}
              {patient.conditionName && ` • ${patient.conditionName}`}
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            patient.sessionsLeft === 1
              ? 'bg-red-100 text-red-600'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {patient.sessionsLeft} left
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-yellow-600" />
        </Link>
      ))}

      {patients.length > maxItems && (
        <div className="text-center pt-2">
          <Link
            href="/dashboard/billing?tab=session-packs"
            className="text-xs text-brand-teal hover:underline"
          >
            View all {patients.length} patients
          </Link>
        </div>
      )}
    </div>
  );
}

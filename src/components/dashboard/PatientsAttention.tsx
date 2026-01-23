'use client';

import React from 'react';
import { AlertTriangle, Clock, UserPlus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface LastSessionPatient {
  patientId: string;
  patientName: string;
  conditionName: string;
  sessionsUsed: number;
  totalSessions: number;
}

interface TreatmentGapPatient {
  patientId: string;
  patientName: string;
  conditionName: string;
  daysSinceVisit: number;
}

interface NewPatient {
  patientId: string;
  patientName: string;
  createdAt: string;
}

interface PatientsAttentionProps {
  lastSession: LastSessionPatient[];
  treatmentGap: TreatmentGapPatient[];
  newPatients: NewPatient[];
  loading?: boolean;
}

export default function PatientsAttention({
  lastSession = [],
  treatmentGap = [],
  newPatients = [],
  loading = false,
}: PatientsAttentionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-3 bg-gray-50 rounded-lg">
            <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-full h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalAttention = lastSession.length + treatmentGap.length + newPatients.length;

  if (totalAttention === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>All patients on track</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last Session - Most urgent */}
      {lastSession.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
              Final Session ({lastSession.length})
            </span>
          </div>
          <div className="space-y-2">
            {lastSession.slice(0, 3).map((patient) => (
              <Link
                key={patient.patientId}
                href={`/dashboard/patients/${patient.patientId}`}
                className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-100 rounded-lg hover:border-red-200 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {patient.patientName}
                  </div>
                  <div className="text-xs text-gray-500">{patient.conditionName}</div>
                </div>
                <div className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                  {patient.sessionsUsed}/{patient.totalSessions}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Gap */}
      {treatmentGap.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">
              Treatment Gap ({treatmentGap.length})
            </span>
          </div>
          <div className="space-y-2">
            {treatmentGap.slice(0, 3).map((patient) => (
              <Link
                key={patient.patientId}
                href={`/dashboard/patients/${patient.patientId}`}
                className="flex items-center gap-3 p-2.5 bg-orange-50 border border-orange-100 rounded-lg hover:border-orange-200 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {patient.patientName}
                  </div>
                  <div className="text-xs text-gray-500">{patient.conditionName}</div>
                </div>
                <div className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  {patient.daysSinceVisit}d ago
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New Patients */}
      {newPatients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              New Patients ({newPatients.length})
            </span>
          </div>
          <div className="space-y-2">
            {newPatients.slice(0, 3).map((patient) => (
              <Link
                key={patient.patientId}
                href={`/dashboard/patients/${patient.patientId}`}
                className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg hover:border-blue-200 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {patient.patientName}
                  </div>
                  <div className="text-xs text-gray-500">Awaiting assessment</div>
                </div>
                <div className="text-xs font-medium text-blue-600">New</div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

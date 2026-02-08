'use client';

import React from 'react';
import { Clock, CheckCircle, Play, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientCode?: string;
  physioName?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  visitType?: string;
  conditionName?: string;
  sessionNumber?: number;
  totalSessions?: number;
}

interface AppointmentListProps {
  appointments: Appointment[];
  showPhysio?: boolean;
  loading?: boolean;
  onStartSession?: (id: string) => void;
  maxItems?: number;
}

const statusConfig = {
  SCHEDULED: {
    icon: Clock,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    label: 'Scheduled',
  },
  IN_PROGRESS: {
    icon: Play,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    label: 'In Progress',
  },
  COMPLETED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    label: 'Done',
  },
  CANCELLED: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-100',
    label: 'Cancelled',
  },
  NO_SHOW: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-50',
    label: 'No Show',
  },
};

export default function AppointmentList({
  appointments,
  showPhysio = false,
  loading = false,
  onStartSession,
  maxItems = 10,
}: AppointmentListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
              <div className="w-24 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No appointments</p>
      </div>
    );
  }

  const displayedAppointments = appointments.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayedAppointments.map((apt) => {
        const status = statusConfig[apt.status] || statusConfig.SCHEDULED;
        const StatusIcon = status.icon;

        return (
          <div
            key={apt.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              apt.status === 'COMPLETED'
                ? 'bg-gray-50 border-gray-100'
                : apt.status === 'IN_PROGRESS'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white border-gray-200 hover:border-brand-teal/30'
            }`}
          >
            {/* Time */}
            <div className="w-16 text-sm font-medium text-gray-700">
              {apt.time}
            </div>

            {/* Patient Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/patients/${apt.id.split('-')[0]}`}
                  className="font-medium text-gray-900 hover:text-brand-teal truncate"
                >
                  {apt.patientName}
                </Link>
                {apt.patientCode && (
                  <span className="text-xs text-gray-400">{apt.patientCode}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {apt.conditionName && <span>{apt.conditionName}</span>}
                {apt.sessionNumber && apt.totalSessions && (
                  <span className="text-brand-teal font-medium">
                    Session {apt.sessionNumber}/{apt.totalSessions}
                  </span>
                )}
                {showPhysio && apt.physioName && (
                  <span className="text-gray-400">• {apt.physioName}</span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </div>

            {/* Action Button */}
            {apt.status === 'SCHEDULED' && onStartSession && (
              <button
                onClick={() => onStartSession(apt.id)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand-teal rounded-lg hover:bg-brand-teal/90 transition-colors"
              >
                Start
              </button>
            )}
          </div>
        );
      })}

      {appointments.length > maxItems && (
        <div className="text-center pt-2">
          <Link
            href="/dashboard/appointments"
            className="text-sm text-brand-teal hover:underline"
          >
            View all {appointments.length} appointments
          </Link>
        </div>
      )}
    </div>
  );
}

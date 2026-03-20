'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Crosshair,
  MoreVertical,
  CalendarPlus,
  IndianRupee,
  Stethoscope,
} from 'lucide-react';

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string;
  date_of_birth: Date;
  gender: string;
  status: string;
  intake_status: string;
}

interface PatientListItemProps {
  patient: Patient;
  onView: () => void;
  onSchedule: () => void;
  onClinicalAssessment: () => void;
  onBilling: () => void;
  onDx: () => void;
}

const calculateAge = (dob: Date) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getIntakeStatusInfo = (intakeStatus: string) => {
  switch (intakeStatus) {
    case 'CLINICAL_ASSESSMENT_COMPLETE':
      return { label: 'Ready', dotColor: 'bg-emerald-400', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' };
    case 'BASIC_INTAKE_COMPLETE':
      return { label: 'Assessment Pending', dotColor: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50' };
    case 'BASIC_INTAKE_PENDING':
      return { label: 'Intake Pending', dotColor: 'bg-orange-400', textColor: 'text-orange-700', bgColor: 'bg-orange-50' };
    default:
      return { label: 'Pending', dotColor: 'bg-gray-300', textColor: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
};

// ── Overflow menu as a proper sub-component ──────────────────────
// Each instance gets its own state + ref, fixing the shared-ref bug
// that caused desktop clicks to misfire.

interface OverflowMenuProps {
  onView: () => void;
  onClinicalAssessment: () => void;
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({ onView, onClinicalAssessment }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); }}
        className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 z-50 overflow-hidden">
          <div className="p-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onView(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4 text-gray-400" />
              View Profile
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onClinicalAssessment(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors"
            >
              <Stethoscope className="h-4 w-4 text-gray-400" />
              Clinical Intake
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────

const PatientListItem: React.FC<PatientListItemProps> = ({
  patient,
  onView,
  onSchedule,
  onClinicalAssessment,
  onBilling,
  onDx,
}) => {
  const isInactive = patient.status === 'INACTIVE';
  const statusInfo = getIntakeStatusInfo(patient.intake_status);
  const age = calculateAge(patient.date_of_birth);
  const genderShort = patient.gender === 'M' ? 'M' : patient.gender === 'F' ? 'F' : 'O';

  return (
    <div
      onClick={onView}
      className={`group cursor-pointer bg-white rounded-xl border border-gray-100 transition-shadow duration-150 hover:shadow-sm hover:border-gray-200 ${
        isInactive ? 'opacity-40 hover:opacity-60' : ''
      }`}
    >
      {/* Main row */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dotColor}`} />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-teal transition-colors duration-150">
              {patient.full_name}
            </span>
            <span className="text-[10px] text-gray-300 font-mono flex-shrink-0 hidden sm:inline tracking-wide">
              {patient.patient_code}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            {age}y &middot; {genderShort} &middot; {patient.phone}
          </div>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg flex-shrink-0 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
          {statusInfo.label}
        </span>

        {/* Desktop actions — Schedule + Billing as direct buttons */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDx(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-teal rounded-lg hover:bg-teal-700 transition-colors shadow-sm shadow-brand-teal/20"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Assess
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBilling(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <IndianRupee className="h-3.5 w-3.5" />
            Billing
          </button>
          {/* Overflow: Profile + Clinical Intake — own state/ref per instance */}
          <OverflowMenu onView={onView} onClinicalAssessment={onClinicalAssessment} />
        </div>
      </div>

      {/* Mobile action bar — icon-only Schedule + Billing */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-t border-gray-50">
        <button
          onClick={(e) => { e.stopPropagation(); onDx(); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-teal rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Assess
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSchedule(); }}
          className="inline-flex items-center justify-center p-1.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title="Schedule Visit"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onBilling(); }}
          className="inline-flex items-center justify-center p-1.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title="Billing"
        >
          <IndianRupee className="h-3.5 w-3.5" />
        </button>
        <div className="ml-auto">
          {/* Own instance of OverflowMenu — its own state + ref */}
          <OverflowMenu onView={onView} onClinicalAssessment={onClinicalAssessment} />
        </div>
      </div>
    </div>
  );
};

export default PatientListItem;

'use client';

import React, { useState } from 'react';
import {
  Crosshair,
  CreditCard,
  CalendarPlus,
  MoreVertical,
  Eye,
  FileText,
  Circle
} from 'lucide-react';

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  date_of_birth: Date;
  gender: string;
  status: string;
  phone?: string;
  email?: string;
}

interface PatientCardProps {
  patient: Patient;
  viewMode: 'grid' | 'list';
  onStartDiagnosis: () => void;
  onBilling: () => void;
  onSchedule: () => void;
  onView?: () => void;
  onHistory?: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  viewMode,
  onStartDiagnosis,
  onBilling,
  onSchedule,
  onView,
  onHistory,
}) => {
  const [showMenu, setShowMenu] = useState(false);

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getGenderDisplay = (gender: string) => {
    if (gender === 'M') return 'Male';
    if (gender === 'F') return 'Female';
    return 'Other';
  };

  // Grid View (Card)
  if (viewMode === 'grid') {
    return (
      <div className="group relative">
        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 rounded-2xl opacity-[0.015] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
          }}
        />

        <div className="relative bg-white rounded-2xl border-l-4 border-brand-teal shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
          {/* Card Content */}
          <div className="p-5">
            {/* Header: Avatar + Name + Menu */}
            <div className="flex items-start gap-3 mb-4">
              {/* Avatar with gradient */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-lg shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #1e5f79 0%, #c8eaeb 100%)'
                  }}
                >
                  {getInitials(patient.full_name)}
                </div>
                {/* Active status indicator */}
                {patient.status === 'ACTIVE' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>

              {/* Name + Metadata */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-xl text-brand-black truncate mb-0.5">
                  {patient.full_name}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {calculateAge(patient.date_of_birth)}y · {getGenderDisplay(patient.gender).charAt(0)} ·
                  <span className="font-mono text-xs ml-1">{patient.patient_code}</span>
                </p>
              </div>

              {/* Overflow Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      {onView && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onView();
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      )}
                      {onHistory && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onHistory();
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          History
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                patient.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <Circle className="w-2 h-2 fill-current" />
                {patient.status}
              </span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2 mb-3">
              {/* Billing Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBilling();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-semibold text-sm hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 group/btn"
              >
                <CreditCard className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span className="hidden sm:inline">Billing</span>
              </button>

              {/* Schedule Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSchedule();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group/btn"
              >
                <CalendarPlus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span className="hidden sm:inline">Schedule</span>
              </button>
            </div>

            {/* Primary CTA: Start Diagnosis */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartDiagnosis();
              }}
              className="w-full relative overflow-hidden group/cta"
            >
              {/* Gradient background */}
              <div
                className="absolute inset-0 opacity-100 group-hover/cta:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #1e5f79 0%, #2a7a9b 100%)'
                }}
              />

              {/* Shimmer effect on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover/cta:opacity-20 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />

              <div className="relative flex items-center justify-center gap-2 px-5 py-3.5 text-white font-bold text-sm rounded-xl">
                <Crosshair className="w-4 h-4 group-hover/cta:rotate-90 transition-transform duration-300" />
                Start Diagnosis
              </div>
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // List View (Table Row)
  return (
    <tr className="group hover:bg-gradient-to-r hover:from-brand-light-blue/20 hover:to-transparent transition-all duration-200 border-b border-gray-100 last:border-0">
      {/* Patient Info Column */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #1e5f79 0%, #c8eaeb 100%)'
              }}
            >
              {getInitials(patient.full_name)}
            </div>
            {patient.status === 'ACTIVE' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </div>

          {/* Name + Meta */}
          <div className="min-w-0">
            <div className="font-display font-bold text-base text-brand-black truncate">
              {patient.full_name}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {calculateAge(patient.date_of_birth)}y · {getGenderDisplay(patient.gender).charAt(0)} ·
              <span className="font-mono ml-1">{patient.patient_code}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Status Column */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          patient.status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Circle className="w-2 h-2 fill-current" />
          {patient.status}
        </span>
      </td>

      {/* Actions Column */}
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-2">
          {/* Billing */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBilling();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg font-semibold text-xs hover:bg-purple-100 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </button>

          {/* Schedule */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-semibold text-xs hover:bg-gray-100 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Schedule
          </button>

          {/* Start Diagnosis - Primary */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartDiagnosis();
            }}
            className="relative overflow-hidden group/cta"
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #1e5f79 0%, #2a7a9b 100%)'
              }}
            />
            <div className="relative inline-flex items-center gap-1.5 px-4 py-1.5 text-white font-bold text-xs rounded-lg">
              <Crosshair className="w-3.5 h-3.5 group-hover/cta:rotate-90 transition-transform duration-300" />
              Start Diagnosis
            </div>
          </button>

          {/* Overflow Menu */}
          {(onView || onHistory) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5">
                    {onView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onView();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    )}
                    {onHistory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onHistory();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        History
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PatientCard;

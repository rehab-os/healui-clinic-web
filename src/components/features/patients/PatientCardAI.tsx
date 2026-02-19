'use client';

import React from 'react';
import { Sparkles, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: Date;
  gender: string;
  active_conditions_count?: number;
}

interface PatientCardAIProps {
  patient: Patient;
  viewMode: 'grid' | 'list';
  onStartDiagnosis: () => void;
  onBilling: () => void;
  onSchedule: () => void;
}

const PatientCardAI: React.FC<PatientCardAIProps> = ({
  patient,
  viewMode,
  onStartDiagnosis,
  onBilling,
  onSchedule,
}) => {
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

  const getGenderLabel = (gender: string) => {
    return gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Other';
  };

  const getConditionStatus = (count?: number) => {
    if (!count || count === 0) {
      return {
        color: 'bg-green-50 text-green-700 ring-green-200/50',
        icon: false,
        label: 'No active conditions',
        show: false,
      };
    }
    if (count === 1) {
      return {
        color: 'bg-amber-50 text-amber-700 ring-amber-200/50',
        icon: true,
        label: '1 condition',
        show: true,
      };
    }
    return {
      color: 'bg-orange-50 text-orange-700 ring-orange-200/50',
      icon: true,
      label: `${count} conditions`,
      show: true,
    };
  };

  const conditionStatus = getConditionStatus(patient.active_conditions_count);

  // Grid View (Card) - Mobile Optimized
  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="group"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand-teal/10 hover:ring-brand-teal/20 sm:p-6">
          {/* Subtle hover glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-teal/0 to-healui-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-5" />

          <div className="relative z-10">
            {/* Header: Name + Status Badge */}
            <div className="mb-1 flex items-start justify-between gap-2 sm:mb-2">
              <h3 className="flex-1 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                {patient.full_name}
              </h3>

              {/* Active Conditions Badge - Only if active */}
              {conditionStatus.show && (
                <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${conditionStatus.color}`}>
                  {conditionStatus.icon && <AlertCircle className="h-3 w-3" />}
                  <span className="hidden sm:inline">{conditionStatus.label}</span>
                  <span className="sm:hidden">{patient.active_conditions_count}</span>
                </div>
              )}
            </div>

            {/* Meta: Age · Gender */}
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 sm:mb-4">
              <span>{calculateAge(patient.date_of_birth)}y</span>
              <span className="text-gray-300">·</span>
              <span>{getGenderLabel(patient.gender)}</span>
            </div>

            {/* Actions - All equal, subtle AI accent */}
            <div className="flex gap-2">
              {/* AI Diagnosis - Subtle teal accent */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartDiagnosis();
                }}
                className="group/ai flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-light-teal/30 px-3 py-2.5 text-xs font-medium text-gray-700 ring-1 ring-brand-teal/30 transition-all hover:bg-brand-light-teal/50 hover:ring-brand-teal/40 sm:gap-2 sm:text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-teal sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI Diagnosis</span>
                <span className="sm:hidden">AI Dx</span>
              </motion.button>

              {/* Billing - Purple accent */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onBilling();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-50/50 px-3 py-2.5 text-xs font-medium text-gray-700 ring-1 ring-purple-200/50 transition-all hover:bg-purple-100/50 hover:ring-purple-300/50 sm:gap-2 sm:text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CreditCard className="h-3.5 w-3.5 text-purple-600 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Billing</span>
                <span className="sm:hidden">Bill</span>
              </motion.button>

              {/* Schedule - Blue accent */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onSchedule();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50/50 px-3 py-2.5 text-xs font-medium text-gray-700 ring-1 ring-blue-200/50 transition-all hover:bg-blue-100/50 hover:ring-blue-300/50 sm:gap-2 sm:text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar className="h-3.5 w-3.5 text-blue-600 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Schedule</span>
                <span className="sm:hidden">Book</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // List View (Table Row) - Mobile Hidden
  return (
    <tr className="group hidden border-b border-gray-100 transition-colors hover:bg-gradient-to-r hover:from-brand-light-teal/30 hover:to-healui-primary/10 sm:table-row">
      {/* Patient Info */}
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 sm:text-base">
              {patient.full_name}
            </span>
            {/* Active Conditions Badge */}
            {conditionStatus.show && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${conditionStatus.color}`}>
                <AlertCircle className="h-3 w-3" />
                <span>{patient.active_conditions_count}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{calculateAge(patient.date_of_birth)}y</span>
            <span className="text-gray-300">·</span>
            <span>{getGenderLabel(patient.gender)}</span>
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-end gap-2">
          {/* AI Diagnosis - Subtle teal accent */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartDiagnosis();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-light-teal/30 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-brand-teal/30 transition-all hover:bg-brand-light-teal/50 hover:ring-brand-teal/40 hover:shadow-sm sm:gap-2 sm:px-4 sm:py-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-teal sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap text-xs font-medium sm:text-sm">AI Diagnosis</span>
          </button>

          {/* Billing - Purple accent */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBilling();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50/50 px-2 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-purple-200/50 transition-all hover:bg-purple-100/50 hover:ring-purple-300/50 hover:shadow-sm sm:px-3 sm:py-2"
          >
            <CreditCard className="h-3 w-3 text-purple-600 sm:h-3.5 sm:w-3.5" />
            <span className="hidden lg:inline">Billing</span>
          </button>

          {/* Schedule - Blue accent */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50/50 px-2 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-blue-200/50 transition-all hover:bg-blue-100/50 hover:ring-blue-300/50 hover:shadow-sm sm:px-3 sm:py-2"
          >
            <Calendar className="h-3 w-3 text-blue-600 sm:h-3.5 sm:w-3.5" />
            <span className="hidden lg:inline">Schedule</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default PatientCardAI;

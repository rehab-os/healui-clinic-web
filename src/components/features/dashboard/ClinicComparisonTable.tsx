'use client';

import React from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ClinicData {
  clinicId: string;
  clinicName: string;
  patients: number;
  revenueThisMonth: number;
  outstanding: number;
}

interface ClinicComparisonTableProps {
  clinics: ClinicData[];
  loading?: boolean;
}

export default function ClinicComparisonTable({
  clinics,
  loading = false,
}: ClinicComparisonTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!clinics || clinics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No clinics found</p>
      </div>
    );
  }

  // Sort by revenue
  const sortedClinics = [...clinics].sort((a, b) => b.revenueThisMonth - a.revenueThisMonth);

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
        <div className="col-span-5">Clinic</div>
        <div className="col-span-2 text-right">Patients</div>
        <div className="col-span-2 text-right">Revenue</div>
        <div className="col-span-2 text-right">Outstanding</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {sortedClinics.map((clinic, index) => (
          <div
            key={clinic.clinicId}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
          >
            {/* Clinic Name */}
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal/70 flex items-center justify-center text-white text-sm font-semibold">
                {index + 1}
              </div>
              <div>
                <div className="font-medium text-gray-900">{clinic.clinicName}</div>
              </div>
            </div>

            {/* Patients */}
            <div className="col-span-2 text-right">
              <span className="font-medium text-gray-700">{clinic.patients}</span>
            </div>

            {/* Revenue */}
            <div className="col-span-2 text-right">
              <span className="font-semibold text-green-600">
                ₹{clinic.revenueThisMonth.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Outstanding */}
            <div className="col-span-2 text-right">
              <span className={`font-medium ${clinic.outstanding > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {clinic.outstanding > 0 ? `₹${clinic.outstanding.toLocaleString('en-IN')}` : '-'}
              </span>
            </div>

            {/* Action */}
            <div className="col-span-1 text-right">
              <Link
                href={`/dashboard/clinics/${clinic.clinicId}`}
                className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded inline-flex transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

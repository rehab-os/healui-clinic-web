'use client';

import React, { useState } from 'react';
import PatientCard from './PatientCard';
import { List, Grid, Search, Filter } from 'lucide-react';

/**
 * Demo page showcasing the new Patient Card design
 * Matches the login page aesthetic with gradient backgrounds
 */

const DEMO_PATIENTS = [
  {
    id: '1',
    patient_code: 'PT-1234',
    full_name: 'John Doe',
    date_of_birth: new Date('1995-03-15'),
    gender: 'M',
    status: 'ACTIVE',
    phone: '+91 98765 43210',
    email: 'john@example.com',
  },
  {
    id: '2',
    patient_code: 'PT-1235',
    full_name: 'Sarah Williams',
    date_of_birth: new Date('1988-07-22'),
    gender: 'F',
    status: 'ACTIVE',
    phone: '+91 98765 43211',
    email: 'sarah@example.com',
  },
  {
    id: '3',
    patient_code: 'PT-1236',
    full_name: 'Michael Chen',
    date_of_birth: new Date('1992-11-08'),
    gender: 'M',
    status: 'INACTIVE',
    phone: '+91 98765 43212',
  },
  {
    id: '4',
    patient_code: 'PT-1237',
    full_name: 'Priya Sharma',
    date_of_birth: new Date('1990-05-30'),
    gender: 'F',
    status: 'ACTIVE',
    phone: '+91 98765 43213',
    email: 'priya@example.com',
  },
];

export default function PatientCardDemo() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background - matching login page */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, #eff8ff 0%, #ffffff 50%, #c8eaeb 100%)',
        }}
      />

      {/* Subtle animated blobs - matching login */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-blob"
          style={{ background: '#c8eaeb' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-blob animation-delay-2000"
          style={{ background: '#eff8ff' }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-blob animation-delay-4000"
          style={{ background: '#1e5f79', opacity: 0.1 }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-brand-black mb-2">
            Patients
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your patient records with ease
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all"
              />
            </div>

            {/* Filter */}
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-brand-teal'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-brand-teal'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Count */}
            <div className="text-sm font-medium text-gray-600">
              <span className="text-brand-teal font-bold">{DEMO_PATIENTS.length}</span> patients
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_PATIENTS.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                viewMode="grid"
                onStartDiagnosis={() => console.log('Start Diagnosis:', patient.full_name)}
                onBilling={() => console.log('Billing:', patient.full_name)}
                onSchedule={() => console.log('Schedule:', patient.full_name)}
                onView={() => console.log('View:', patient.full_name)}
                onHistory={() => console.log('History:', patient.full_name)}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEMO_PATIENTS.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    viewMode="list"
                    onStartDiagnosis={() => console.log('Start Diagnosis:', patient.full_name)}
                    onBilling={() => console.log('Billing:', patient.full_name)}
                    onSchedule={() => console.log('Schedule:', patient.full_name)}
                    onView={() => console.log('View:', patient.full_name)}
                    onHistory={() => console.log('History:', patient.full_name)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

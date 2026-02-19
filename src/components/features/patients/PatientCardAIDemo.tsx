'use client';

import React, { useState } from 'react';
import PatientCardAI from './PatientCardAI';
import { List, Grid, Search, Plus, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const DEMO_PATIENTS = [
  {
    id: '1',
    full_name: 'Sarah Mitchell',
    date_of_birth: new Date('1988-03-15'),
    gender: 'F',
    active_conditions_count: 2,
  },
  {
    id: '2',
    full_name: 'James Rodriguez',
    date_of_birth: new Date('1975-07-22'),
    gender: 'M',
    active_conditions_count: 1,
  },
  {
    id: '3',
    full_name: 'Priya Sharma',
    date_of_birth: new Date('1992-11-08'),
    gender: 'F',
    active_conditions_count: 0,
  },
  {
    id: '4',
    full_name: 'Michael Chen',
    date_of_birth: new Date('1985-05-30'),
    gender: 'M',
    active_conditions_count: 3,
  },
  {
    id: '5',
    full_name: 'Emma Thompson',
    date_of_birth: new Date('1990-12-12'),
    gender: 'F',
    active_conditions_count: 0,
  },
  {
    id: '6',
    full_name: 'David Kim',
    date_of_birth: new Date('1978-09-25'),
    gender: 'M',
    active_conditions_count: 1,
  },
];

export default function PatientCardAIDemo() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-light-teal/20">
      {/* Ambient background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-brand-teal/15 to-healui-primary/15 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-gradient-to-br from-healui-primary/10 to-brand-light-teal/10 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        {/* Header - Mobile Optimized */}
        <motion.div
          className="mb-6 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:mb-3 sm:text-4xl">
            Patients
          </h1>
          <p className="text-base text-gray-600 sm:text-lg">
            AI-powered diagnosis for modern healthcare
          </p>
        </motion.div>

        {/* Controls Bar - Mobile First */}
        <motion.div
          className="mb-6 overflow-hidden rounded-2xl bg-white/60 p-3 shadow-sm ring-1 ring-gray-200/50 backdrop-blur-xl sm:mb-8 sm:p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-3 sm:hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full rounded-xl border-0 bg-white/50 py-2.5 pl-10 pr-3 text-sm ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-2">
              {/* Add Patient */}
              <motion.button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-teal px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-teal/20 transition-all hover:bg-brand-teal/90"
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </motion.button>

              {/* Filter Button (Mobile) */}
              <button className="rounded-xl bg-white px-3 py-2.5 text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50">
                <Filter className="h-4 w-4" />
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-brand-teal shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-brand-teal shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Count Badge */}
              <div className="flex items-center rounded-xl bg-brand-light-teal/50 px-2.5 py-2 ring-1 ring-brand-teal/20">
                <span className="text-xs font-semibold text-gray-700">
                  {DEMO_PATIENTS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden items-center justify-between gap-4 sm:flex">
            {/* Search */}
            <div className="relative min-w-[250px] max-w-md flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full rounded-xl border-0 bg-white/50 py-3 pl-11 pr-4 text-sm ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Add Patient */}
              <motion.button
                className="flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-teal/20 transition-all hover:bg-brand-teal/90 hover:shadow-xl hover:shadow-brand-teal/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                <span>Add Patient</span>
              </motion.button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-brand-teal shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-brand-teal shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Count Badge */}
              <div className="flex items-center gap-2 rounded-xl bg-brand-light-teal/50 px-3 py-2 ring-1 ring-brand-teal/20">
                <span className="text-xs font-semibold text-gray-700">
                  {DEMO_PATIENTS.length} patients
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid View - Responsive */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DEMO_PATIENTS.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2 + index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <PatientCardAI
                  patient={patient}
                  viewMode="grid"
                  onStartDiagnosis={() => console.log('AI Diagnosis:', patient.full_name)}
                  onBilling={() => console.log('Billing:', patient.full_name)}
                  onSchedule={() => console.log('Schedule:', patient.full_name)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* List View - Desktop Only */}
        {viewMode === 'list' && (
          <>
            {/* Desktop Table */}
            <motion.div
              className="hidden overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-gray-200/50 backdrop-blur-xl sm:block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:px-6 sm:py-4">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 sm:px-6 sm:py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_PATIENTS.map((patient) => (
                    <PatientCardAI
                      key={patient.id}
                      patient={patient}
                      viewMode="list"
                      onStartDiagnosis={() => console.log('AI Diagnosis:', patient.full_name)}
                      onBilling={() => console.log('Billing:', patient.full_name)}
                      onSchedule={() => console.log('Schedule:', patient.full_name)}
                    />
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* Mobile: Show Grid View Instead */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {DEMO_PATIENTS.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2 + index * 0.05,
                  }}
                >
                  <PatientCardAI
                    patient={patient}
                    viewMode="grid"
                    onStartDiagnosis={() => console.log('AI Diagnosis:', patient.full_name)}
                    onBilling={() => console.log('Billing:', patient.full_name)}
                    onSchedule={() => console.log('Schedule:', patient.full_name)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

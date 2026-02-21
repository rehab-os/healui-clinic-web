'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface AppointmentPageShellProps {
  children: React.ReactNode
  loading?: boolean
  error?: string | null
}

/**
 * AppointmentPageShell - Main container for the appointment details page
 * Provides responsive grid layout, loading states, and error boundaries
 */
export default function AppointmentPageShell({
  children,
  loading = false,
  error = null
}: AppointmentPageShellProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light-blue flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto"></div>
          <p className="mt-4 text-gray-900 font-medium">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-light-blue flex items-center justify-center p-5">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Error Loading Appointment</h2>
          </div>
          <p className="text-gray-600 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-5 py-3.5 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light-blue">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-5">
        {children}
      </div>
    </div>
  )
}

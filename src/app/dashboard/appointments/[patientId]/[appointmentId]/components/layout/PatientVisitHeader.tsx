'use client'

import React from 'react'
import { ArrowLeft, Calendar, Clock, User, Video, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

interface PatientVisitHeaderProps {
  patient: {
    full_name: string
    date_of_birth: string
    gender: string
    phone?: string
    email?: string
  }
  appointment: {
    id: string
    scheduled_date: string
    scheduled_time: string
    status: string
    visit_type: string
    visit_mode: string
    visit_source?: 'CLINIC' | 'MARKETPLACE'
    chief_complaint?: string
    physiotherapist: {
      full_name: string
    }
  }
  onExportPDF?: () => void
  onShowFullProfile?: () => void
}

export default function PatientVisitHeader({
  patient,
  appointment,
  onExportPDF,
  onShowFullProfile
}: PatientVisitHeaderProps) {
  const router = useRouter()

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-teal-50 text-brand-teal border-brand-light-teal'
      case 'CHECKED_IN':
        return 'bg-teal-100 text-brand-teal border-brand-teal/30'
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'COMPLETED':
        return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'NO_SHOW':
        return 'bg-gray-50 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const formatVisitType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  return (
    <div className={`bg-white sticky top-0 z-40 shadow-sm border-b ${
      appointment.status === 'IN_PROGRESS' ? 'border-b-2 border-b-amber-400' : 'border-b-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Back Button + Patient Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-1.5 text-gray-600 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {patient.full_name}
                </h1>
                {patient.date_of_birth && (
                  <span className="text-sm text-gray-500">
                    {calculateAge(patient.date_of_birth)}y {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}
                  </span>
                )}
                {appointment.visit_source === 'MARKETPLACE' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Marketplace
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(appointment.scheduled_date), 'MMM dd, yyyy')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appointment.scheduled_time}
                </span>
                <span className="inline-flex items-center gap-1">
                  {appointment.visit_mode === 'ONLINE' ? <Video className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {formatVisitType(appointment.visit_type)}
                </span>
                {appointment.chief_complaint && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-amber-700 font-medium truncate max-w-[300px]" title={appointment.chief_complaint}>
                      {appointment.chief_complaint}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons + Status */}
          <div className="flex items-center gap-2 ml-3">
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="p-2 text-gray-500 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition-colors"
                title="Export Report"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {onShowFullProfile && (
              <button
                onClick={onShowFullProfile}
                className="p-2 text-gray-500 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition-colors"
                title="View Profile"
              >
                <User className="h-4 w-4" />
              </button>
            )}

            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(appointment.status)}`}>
              {appointment.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

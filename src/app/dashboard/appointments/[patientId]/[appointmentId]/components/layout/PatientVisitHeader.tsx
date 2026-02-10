'use client'

import React from 'react'
import { ArrowLeft, Calendar, Clock, User, Video, Phone, Mail } from 'lucide-react'
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
  onContactClick?: () => void
}

/**
 * PatientVisitHeader - Displays patient demographics and visit information
 * with status banner and metadata
 */
export default function PatientVisitHeader({
  patient,
  appointment,
  onContactClick
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
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CHECKED_IN':
        return 'bg-[#c8eaeb] text-[#1e5f79] border-[#1e5f79]/30'
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatVisitType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  return (
    <div className="bg-white border border-[#000000]/10 rounded-lg shadow-sm mb-3 overflow-hidden">
      {/* Main Header */}
      <div className="px-5 py-3.5">
        <div className="flex items-center justify-between">
          {/* Left: Back Button + Patient Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-1.5 text-[#000000] hover:text-[#1e5f79] hover:bg-[#eff8ff] rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-[#000000] truncate">
                  {patient.full_name}
                </h1>
                <span className="text-sm text-gray-600">
                  • {calculateAge(patient.date_of_birth)}y {patient.gender}
                </span>
                {appointment.visit_source === 'MARKETPLACE' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Marketplace
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(appointment.scheduled_date), 'MMM dd, yyyy')}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {appointment.scheduled_time}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  Dr. {appointment.physiotherapist.full_name}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status + Mode + Contact */}
          <div className="flex items-center gap-2 ml-3">
            {/* Visit Mode */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              appointment.visit_mode === 'ONLINE'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {appointment.visit_mode === 'ONLINE' ? (
                <>
                  <Video className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Virtual</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Walk-in</span>
                </>
              )}
            </span>

            {/* Visit Type - Hidden on mobile */}
            <span className="hidden md:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#c8eaeb] text-[#1e5f79]">
              {formatVisitType(appointment.visit_type)}
            </span>

            {/* Status */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
              {appointment.status.replace('_', ' ').toLowerCase()}
            </span>

            {/* Contact Button */}
            {onContactClick && (
              <button
                onClick={onContactClick}
                className="p-1.5 text-[#000000] hover:text-[#1e5f79] hover:bg-[#eff8ff] rounded-lg transition-colors"
                title="View Contact Details"
              >
                <Phone className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chief Complaint Section */}
      {appointment.chief_complaint && (
        <div className="px-5 py-3 bg-[#eff8ff] border-t border-[#000000]/10">
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Chief Complaint:
            </span>
            <p className="text-sm text-[#000000] flex-1">
              {appointment.chief_complaint}
            </p>
          </div>
        </div>
      )}

      {/* Visit Status Banner for IN_PROGRESS */}
      {appointment.status === 'IN_PROGRESS' && (
        <div className="px-5 py-2 bg-gradient-to-r from-[#1e5f79] to-[#1e5f79]/80 text-white">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Visit in Progress</span>
          </div>
        </div>
      )}
    </div>
  )
}

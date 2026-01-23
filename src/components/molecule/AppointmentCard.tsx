import React from 'react';
import {
  Clock, User, Stethoscope, FileText, Activity,
  Calendar, ChevronRight, Phone, Mail, XCircle, Video,
  Home, MapPin, Target, IndianRupee, UserCheck, Play,
  Receipt, CheckCircle, AlertCircle, Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ServiceLocation {
  id: string;
  location_name: string;
  base_address: string;
  base_pincode: string;
  service_pincodes: string[];
  zone_config: {
    green: {
      pincodes: string[];
      radius_km: number;
    };
    yellow: {
      pincodes: string[];
      radius_km: number;
      extra_charge: number;
    };
    red: {
      pincodes: string[];
      radius_km: number;
      extra_charge: number;
    };
  };
}

interface Visit {
  id: string;
  patient_id?: string; // Optional for marketplace visits
  clinic_id?: string; // Optional for marketplace visits
  physiotherapist_id: string;
  visit_type: string;
  visit_mode: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  chief_complaint?: string;
  video_link?: string;
  video_session_id?: string;
  // Timestamps for tracking
  check_in_time?: string;
  start_time?: string;
  end_time?: string;
  // Duration metrics
  wait_duration_minutes?: number;
  session_duration_minutes?: number;
  total_duration_minutes?: number;
  // Billing info
  billing?: {
    id: string;
    billing_type: string;
    status: string;
    charge_amount?: number;
    amount_paid: number;
    amount_owed: number;
  };
  // Marketplace-specific fields
  visit_source?: 'CLINIC' | 'MARKETPLACE';
  patient_user_id?: string;
  patient_address?: string;
  consultation_fee?: number;
  travel_fee?: number;
  total_amount?: number;
  // Service location for home visits
  service_location?: ServiceLocation;
  service_location_id?: string;
  // Zone information for the visit
  patient_zone?: 'green' | 'yellow' | 'red';
  zone_extra_charge?: number;
  // Patients
  patient?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth: string;
    gender: string;
    patient_code: string;
  };
  patientUser?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
  };
  physiotherapist?: {
    id: string;
    full_name: string;
  };
  note?: {
    id: string;
    note_type: string;
    is_signed: boolean;
  };
}

interface AppointmentCardProps {
  visit: Visit;
  isAdmin: boolean;
  onViewPatient: (patient: any) => void;
  onViewAppointment?: (patientId: string, appointmentId: string) => void;
  onCheckIn?: (visitId: string) => void;
  onStartVisit?: (visitId: string) => void;
  onCompleteVisit?: (visitId: string) => void;
  onBillVisit?: (visit: Visit) => void;
  onAddNote?: (visitId: string) => void;
  onReschedule?: (visitId: string) => void;
  onCancel?: (visitId: string) => void;
  onJoinVideoCall?: (visitId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  visit,
  isAdmin,
  onViewPatient,
  onViewAppointment,
  onCheckIn,
  onStartVisit,
  onCompleteVisit,
  onBillVisit,
  onAddNote,
  onReschedule,
  onCancel,
  onJoinVideoCall
}) => {
  const isOnlineVisit = visit.visit_mode === 'ONLINE';
  // Derive display status - show WAITING if checked in but not started
  const isWaiting = visit.status === 'SCHEDULED' && visit.check_in_time;
  const displayStatus = isWaiting ? 'WAITING' : visit.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-[#eff8ff] text-[#1e5f79]';
      case 'WAITING':
        return 'bg-orange-50 text-orange-700';
      case 'IN_PROGRESS':
        return 'bg-yellow-50 text-yellow-700';
      case 'COMPLETED':
        return 'bg-green-50 text-green-700';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700';
      case 'NO_SHOW':
        return 'bg-gray-50 text-[#000000]';
      default:
        return 'bg-gray-50 text-[#000000]';
    }
  };

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'INITIAL_CONSULTATION':
        return 'bg-[#c8eaeb] text-[#1e5f79]';
      case 'FOLLOW_UP':
        return 'bg-[#eff8ff] text-[#1e5f79]';
      case 'REVIEW':
        return 'bg-green-50 text-green-700';
      case 'EMERGENCY':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-[#000000]';
    }
  };

  const formatVisitType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getZoneColor = (zone: 'green' | 'yellow' | 'red' | undefined) => {
    switch (zone) {
      case 'green':
        return 'bg-green-100 text-green-700';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-700';
      case 'red':
        return 'bg-red-100 text-red-700';
      default:
        return '';
    }
  };

  const getZoneDotColor = (zone: 'green' | 'yellow' | 'red') => {
    switch (zone) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
    }
  };

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-700';
      case 'OWED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getBillingTypeLabel = (type: string) => {
    switch (type) {
      case 'SESSION_DEDUCT':
        return 'Pack';
      case 'CHARGED':
        return 'Charged';
      case 'COMPLIMENTARY':
        return 'Free';
      default:
        return type;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${
        isOnlineVisit 
          ? 'border-l-4 border-l-[#1e5f79]' 
          : ''
      }`}
      onClick={() => {
        if (onViewAppointment && (visit.patient_id || visit.patient_user_id)) {
          onViewAppointment(visit.patient_id || visit.patient_user_id!, visit.id);
        }
      }}
    >
      <div className="p-4">
        {/* Header with Avatar and Patient */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-[#1e5f79] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {(visit.patient?.full_name || visit.patientUser?.full_name || 'UK').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            
            {/* Patient Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-base font-semibold text-[#000000] truncate">
                  {visit.patient?.full_name || visit.patientUser?.full_name || 'Unknown Patient'}
                </h3>
                {visit.visit_mode === 'ONLINE' && (
                  <Video className="h-4 w-4 text-[#1e5f79]" />
                )}
                {visit.visit_mode === 'HOME' && (
                  <Home className="h-4 w-4 text-orange-600" />
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                  {visit.patient?.phone || visit.patientUser?.phone || 'No phone'}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {visit.scheduled_time} • {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
            {displayStatus.replace('_', ' ')}
          </span>
        </div>

        {/* Visit Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVisitTypeColor(visit.visit_type)}`}>
              {formatVisitType(visit.visit_type)}
            </span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-gray-400" />
              {visit.duration_minutes} min
            </span>
            {isAdmin && visit.physiotherapist && (
              <span className="flex items-center">
                <Stethoscope className="h-3 w-3 mr-1 text-gray-400" />
                {visit.physiotherapist.full_name}
              </span>
            )}
          </div>
          
          {visit.chief_complaint && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Chief Complaint:</span> {visit.chief_complaint}
            </div>
          )}
          
          <div className="flex items-center flex-wrap gap-2">
            {visit.visit_source === 'MARKETPLACE' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#c8eaeb] text-[#1e5f79]">
                Marketplace
              </span>
            )}
            {visit.total_amount && (
              <span className="text-sm font-medium text-green-600">
                ₹{visit.total_amount}
              </span>
            )}
            {visit.note && (
              <FileText className="h-3 w-3 text-[#1e5f79]" title="Has note" />
            )}

            {/* Billing Status Badge - Always show billing status */}
            {visit.billing ? (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBillingStatusColor(visit.billing.status)}`}>
                <Receipt className="h-3 w-3 mr-1" />
                {getBillingTypeLabel(visit.billing.billing_type)}
                {visit.billing.billing_type === 'CHARGED' && visit.billing.charge_amount && (
                  <span className="ml-1">₹{visit.billing.charge_amount}</span>
                )}
                {visit.billing.status === 'OWED' && visit.billing.amount_owed > 0 && (
                  <span className="ml-1">(Due: ₹{visit.billing.amount_owed})</span>
                )}
              </span>
            ) : visit.status === 'COMPLETED' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                <Receipt className="h-3 w-3 mr-1" />
                Not Billed
              </span>
            ) : visit.status === 'IN_PROGRESS' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <Receipt className="h-3 w-3 mr-1" />
                Bill Pending
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                <Receipt className="h-3 w-3 mr-1" />
                Scheduled
              </span>
            )}

          </div>

          {/* Compact Timing for Completed Visits */}
          {visit.status === 'COMPLETED' && (visit.session_duration_minutes || visit.wait_duration_minutes) && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <Timer className="h-3 w-3 text-gray-400" />
              {visit.wait_duration_minutes !== undefined && visit.wait_duration_minutes >= 0 && (
                <span className={visit.wait_duration_minutes > 15 ? 'text-orange-500' : ''}>
                  Wait: {visit.wait_duration_minutes}m
                </span>
              )}
              {visit.session_duration_minutes !== undefined && visit.session_duration_minutes > 0 && (
                <span className="text-green-600">
                  Session: {visit.session_duration_minutes}m
                </span>
              )}
              {visit.total_duration_minutes !== undefined && visit.total_duration_minutes > 0 && (
                <span>Total: {visit.total_duration_minutes}m</span>
              )}
            </div>
          )}

          {/* Home Visit Details */}
          {visit.visit_mode === 'HOME' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Home Visit</span>
              </div>
              
              {/* Service Location */}
              {visit.service_location && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <span className="font-medium text-gray-700">{visit.service_location.location_name}</span>
                      <p className="text-gray-500">{visit.service_location.base_address}</p>
                    </div>
                  </div>
                  
                  {/* Zone Summary */}
                  {visit.service_location.zone_config && (
                    <div className="flex items-center gap-2 ml-5">
                      <Target className="h-3 w-3 text-gray-500" />
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-600">Service Areas:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span className="text-gray-600">{visit.service_location.zone_config.green.pincodes.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                          <span className="text-gray-600">{visit.service_location.zone_config.yellow.pincodes.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <span className="text-gray-600">{visit.service_location.zone_config.red.pincodes.length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Patient Zone */}
              {visit.patient_zone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Patient Zone:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getZoneColor(visit.patient_zone)}`}>
                    {visit.patient_zone.charAt(0).toUpperCase() + visit.patient_zone.slice(1)}
                    {visit.zone_extra_charge && visit.zone_extra_charge > 0 && (
                      <span className="ml-1">(+₹{visit.zone_extra_charge})</span>
                    )}
                  </span>
                </div>
              )}
              
              {/* Patient Address */}
              {visit.patient_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                  <p className="text-xs text-gray-600 flex-1">
                    {visit.patient_address}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewPatient(visit.patient || visit.patientUser);
            }}
            className="text-sm text-[#1e5f79] hover:text-[#1e5f79]/80 font-medium"
          >
            View Patient
          </button>
          
          <div className="flex items-center space-x-2">
            {visit.status === 'SCHEDULED' && visit.visit_mode === 'ONLINE' && onJoinVideoCall && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinVideoCall(visit.id);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-[#1e5f79] rounded-md text-sm font-medium text-[#1e5f79] bg-white hover:bg-[#eff8ff]"
                title="Join Video Call"
              >
                <Video className="h-4 w-4 mr-1.5" />
                Join Call
              </button>
            )}
            
            {/* Check-In button - for SCHEDULED visits without check_in_time */}
            {visit.status === 'SCHEDULED' && !visit.check_in_time && onCheckIn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckIn(visit.id);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-orange-500 text-orange-600 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors"
                title="Patient Arrived - Check In"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Check In
              </button>
            )}

            {/* Start Visit button - only shows after check-in (when waiting) */}
            {visit.status === 'SCHEDULED' && visit.check_in_time && onStartVisit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVisit(visit.id);
                }}
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                title="Start Treatment"
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </button>
            )}

            {visit.status === 'IN_PROGRESS' && onCompleteVisit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteVisit(visit.id);
                }}
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                title="Complete Visit"
              >
                Complete
              </button>
            )}

            {/* Bill/Payment button - Always visible */}
            {onBillVisit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBillVisit(visit);
                }}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  visit.billing
                    ? visit.billing.status === 'PAID'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : visit.billing.status === 'OWED'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : visit.status === 'COMPLETED'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                }`}
                title={visit.billing ? `Billing: ${visit.billing.status}` : 'Bill Visit'}
              >
                <IndianRupee className="h-3.5 w-3.5 mr-1" />
                {visit.billing
                  ? visit.billing.status === 'PAID'
                    ? 'Paid'
                    : visit.billing.status === 'OWED'
                      ? `Due ₹${visit.billing.amount_owed}`
                      : 'Partial'
                  : visit.status === 'COMPLETED'
                    ? 'Bill Now!'
                    : 'Billing'
                }
              </button>
            )}
            
            {visit.status === 'SCHEDULED' && onReschedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(visit.id);
                }}
                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                title="Reschedule"
              >
                <Calendar className="h-4 w-4" />
              </button>
            )}

            {visit.status === 'SCHEDULED' && onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(visit.id);
                }}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                title="Cancel"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
            
            {visit.status === 'COMPLETED' && !visit.note && onAddNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNote(visit.id);
                }}
                className="p-2 text-[#1e5f79] hover:text-[#1e5f79]/80 hover:bg-[#eff8ff] rounded-lg transition-colors"
                title="Add Note"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
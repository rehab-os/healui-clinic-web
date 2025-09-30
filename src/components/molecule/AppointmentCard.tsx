import React from 'react';
import { 
  Clock, User, Stethoscope, FileText, Activity, 
  Calendar, ChevronRight, Phone, Mail, XCircle, Video
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  // Marketplace-specific fields
  visit_source?: 'CLINIC' | 'MARKETPLACE';
  patient_user_id?: string;
  patient_address?: string;
  consultation_fee?: number;
  travel_fee?: number;
  total_amount?: number;
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
  onStartVisit?: (visitId: string) => void;
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
  onStartVisit,
  onAddNote,
  onReschedule,
  onCancel,
  onJoinVideoCall
}) => {
  const isOnlineVisit = visit.visit_mode === 'ONLINE';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-[#eff8ff] text-[#1e5f79]';
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
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
            {visit.status.replace('_', ' ')}
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
          
          <div className="flex items-center space-x-2">
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
          </div>
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
            
            {visit.status === 'SCHEDULED' && onStartVisit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVisit(visit.id);
                }}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                title="Start Visit"
              >
                <Activity className="h-4 w-4" />
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
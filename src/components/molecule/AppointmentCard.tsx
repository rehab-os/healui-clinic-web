import React from 'react';
import { 
  Clock, User, Stethoscope, FileText, Activity, 
  Calendar, ChevronRight, Phone, Mail, XCircle, Video
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Visit {
  id: string;
  patient_id: string;
  clinic_id: string;
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
  patient?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth: string;
    gender: string;
    patient_code: string;
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
        return 'bg-healui-primary/20 text-healui-primary border-healui-primary/30';
      case 'IN_PROGRESS':
        return 'bg-healui-accent/20 text-healui-accent border-healui-accent/30';
      case 'COMPLETED':
        return 'bg-healui-physio/20 text-healui-physio border-healui-physio/30';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'INITIAL_CONSULTATION':
        return 'bg-healui-primary/20 text-healui-primary border border-healui-primary/30';
      case 'FOLLOW_UP':
        return 'bg-healui-physio/20 text-healui-physio border border-healui-physio/30';
      case 'REVIEW':
        return 'bg-healui-accent/20 text-healui-accent border border-healui-accent/30';
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatVisitType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div 
      className={`bg-white sm:rounded-lg border-b sm:border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
        isOnlineVisit 
          ? 'border-l-4 border-l-blue-500' 
          : ''
      }`}
      onClick={() => {
        if (onViewAppointment && visit.patient_id) {
          onViewAppointment(visit.patient_id, visit.id);
        }
      }}
    >
      {/* Ultra-Compact Mobile Design */}
      <div className="px-3 py-2 sm:p-3">
        {/* Main Row - Patient, Time, Status */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          {/* Patient Info - Non-clickable */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                {visit.patient?.full_name || 'Unknown Patient'}
              </h3>
              {visit.visit_mode === 'ONLINE' && (
                <Video className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPatient(visit.patient);
                }}
                className="text-healui-primary hover:text-healui-physio text-xs px-1 py-0.5 rounded hover:bg-healui-primary/10 transition-colors"
                title="View patient details"
              >
                <User className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-gray-600 mt-0.5">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-0.5" />
                {visit.scheduled_time} • {format(parseISO(visit.scheduled_date), 'MMM dd')}
              </span>
              {visit.patient?.phone && (
                <span className="hidden sm:inline text-xs">{visit.patient.phone}</span>
              )}
            </div>
          </div>
          
          {/* Status & Quick Action */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
              {visit.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Secondary Row - Visit Type, Doctor, Actions */}
        <div className="flex items-center justify-between mt-1">
          {/* Visit Type & Doctor */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-gray-600 flex-1 min-w-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVisitTypeColor(visit.visit_type)}`}>
              {formatVisitType(visit.visit_type)}
            </span>
            {isAdmin && visit.physiotherapist && (
              <span className="hidden sm:inline truncate">
                Dr. {visit.physiotherapist.full_name}
              </span>
            )}
            {visit.note && (
              <FileText className="h-3 w-3 text-healui-primary" title="Has note" />
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
            {visit.status === 'SCHEDULED' && visit.visit_mode === 'ONLINE' && onJoinVideoCall && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinVideoCall(visit.id);
                }}
                className="flex items-center px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                title="Join Video Call"
              >
                <Video className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Join</span>
              </button>
            )}

            {visit.status === 'SCHEDULED' && onStartVisit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVisit(visit.id);
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
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
                className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
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
                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
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
                className="p-1 text-healui-primary hover:bg-healui-primary/10 rounded transition-colors"
                title="Add Note"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Chief Complaint - Only on larger screens */}
        {visit.chief_complaint && (
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 line-clamp-1">{visit.chief_complaint}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
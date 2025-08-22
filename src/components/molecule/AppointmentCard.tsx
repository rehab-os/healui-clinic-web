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
    <div className={`card-base hover:shadow-physio transition-all duration-200 ${
      isOnlineVisit 
        ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent' 
        : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-healui-physio/5 rounded-lg p-2 -m-2 transition-all duration-200 flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewPatient(visit.patient);
          }}
          title="Click to view patient details"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-physio flex items-center justify-center text-white font-medium text-sm shadow-physio">
            {visit.patient?.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-healui-primary hover:text-healui-physio truncate">
              {visit.patient?.full_name || 'Unknown Patient'}
            </h3>
            <p className="text-xs text-text-light">{visit.patient?.patient_code}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
            {visit.status.replace('_', ' ')}
          </span>
          {visit.visit_mode === 'ONLINE' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-600 shadow-sm">
              <Video className="h-3 w-3 mr-1" />
              Online Video
            </span>
          )}
          {visit.note && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-healui-primary/20 text-healui-primary border border-healui-primary/30">
              <FileText className="h-3 w-3 mr-1" />
              Note
            </span>
          )}
        </div>
      </div>

      {/* Time and Type */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm text-text-gray">
          <Clock className="h-4 w-4 mr-1" />
          <span className="font-medium">{visit.scheduled_time}</span>
          <span className="mx-2">•</span>
          <span>{format(parseISO(visit.scheduled_date), 'MMM dd')}</span>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVisitTypeColor(visit.visit_type)}`}>
          {formatVisitType(visit.visit_type)}
        </span>
      </div>

      {/* Doctor (for admin view) */}
      {isAdmin && visit.physiotherapist && (
        <div className="flex items-center text-sm text-text-gray mb-3">
          <Stethoscope className="h-4 w-4 mr-1" />
          <span>Dr. {visit.physiotherapist.full_name}</span>
        </div>
      )}

      {/* Chief Complaint */}
      {visit.chief_complaint && (
        <div className="mb-3">
          <p className="text-sm text-text-gray line-clamp-2">{visit.chief_complaint}</p>
        </div>
      )}

      {/* Contact Info */}
      <div className="flex items-center space-x-4 text-xs text-text-light mb-3">
        {visit.patient?.phone && (
          <div className="flex items-center">
            <Phone className="h-3 w-3 mr-1" />
            <span>{visit.patient.phone}</span>
          </div>
        )}
        {visit.patient?.email && (
          <div className="flex items-center">
            <Mail className="h-3 w-3 mr-1" />
            <span className="truncate">{visit.patient.email}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border-color">
        <div className="text-xs text-text-light">
          Click patient name to view details
        </div>
        
        <div className="flex items-center space-x-2">
          {visit.status === 'SCHEDULED' && visit.visit_mode === 'ONLINE' && onJoinVideoCall && (
            <button
              onClick={() => onJoinVideoCall(visit.id)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm font-medium text-xs"
              title="Join Video Call"
            >
              <Video className="h-4 w-4" />
              <span>Join Call</span>
            </button>
          )}

          {visit.status === 'SCHEDULED' && onStartVisit && (
            <button
              onClick={() => onStartVisit(visit.id)}
              className="p-1.5 text-healui-physio hover:text-healui-primary hover:bg-healui-physio/10 rounded-lg transition-all duration-200"
              title="Start Visit"
            >
              <Activity className="h-4 w-4" />
            </button>
          )}
          
          {visit.status === 'COMPLETED' && !visit.note && onAddNote && (
            <button
              onClick={() => onAddNote(visit.id)}
              className="p-1.5 text-healui-primary hover:text-healui-physio hover:bg-healui-primary/10 rounded-lg transition-all duration-200"
              title="Add Note"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}
          
          {visit.status === 'SCHEDULED' && onReschedule && (
            <button
              onClick={() => onReschedule(visit.id)}
              className="p-1.5 text-healui-accent hover:text-healui-primary hover:bg-healui-accent/10 rounded-lg transition-all duration-200"
              title="Reschedule"
            >
              <Calendar className="h-4 w-4" />
            </button>
          )}

          {visit.status === 'SCHEDULED' && onCancel && (
            <button
              onClick={() => onCancel(visit.id)}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Cancel"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          
          <ChevronRight className="h-4 w-4 text-text-light" />
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
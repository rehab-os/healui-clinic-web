import React from 'react';
import {
  Clock, Stethoscope, FileText, Activity,
  Calendar, Phone, Video,
  Home, MapPin, Target, IndianRupee, UserCheck, Play,
  Receipt, Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ServiceLocation {
  id: string;
  location_name: string;
  base_address: string;
  base_pincode: string;
  service_pincodes: string[];
  zone_config: {
    green: { pincodes: string[]; radius_km: number };
    yellow: { pincodes: string[]; radius_km: number; extra_charge: number };
    red: { pincodes: string[]; radius_km: number; extra_charge: number };
  };
}

interface Visit {
  id: string;
  patient_id?: string;
  clinic_id?: string;
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
  check_in_time?: string;
  start_time?: string;
  end_time?: string;
  wait_duration_minutes?: number;
  session_duration_minutes?: number;
  total_duration_minutes?: number;
  billing?: {
    id: string;
    billing_type: string;
    status: string;
    charge_amount?: number;
    amount_paid: number;
    amount_owed: number;
  };
  visit_source?: 'CLINIC' | 'MARKETPLACE';
  patient_user_id?: string;
  patient_address?: string;
  consultation_fee?: number;
  travel_fee?: number;
  total_amount?: number;
  service_location?: ServiceLocation;
  service_location_id?: string;
  patient_zone?: 'green' | 'yellow' | 'red';
  zone_extra_charge?: number;
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
  const isWaiting = visit.status === 'SCHEDULED' && visit.check_in_time;
  const displayStatus = isWaiting ? 'WAITING' : visit.status;
  const patientName = visit.patient?.full_name || visit.patientUser?.full_name || 'Unknown Patient';

  const statusDot: Record<string, string> = {
    SCHEDULED: 'bg-gray-400',
    WAITING: 'bg-orange-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-400',
    NO_SHOW: 'bg-gray-300',
  };

  const visitTypeLabels: Record<string, string> = {
    INITIAL_CONSULTATION: 'Initial',
    FOLLOW_UP: 'Follow-up',
    REVIEW: 'Review',
    EMERGENCY: 'Emergency',
  };
  const formatVisitType = (type: string) => visitTypeLabels[type] || type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

  const getBillingLabel = () => {
    if (!visit.billing) {
      if (visit.status === 'COMPLETED') return { text: 'Not Billed', color: 'text-red-600' };
      if (visit.status === 'IN_PROGRESS') return { text: 'Pending', color: 'text-yellow-600' };
      return null;
    }
    if (visit.billing.status === 'PAID') return { text: 'Paid', color: 'text-green-600' };
    if (visit.billing.status === 'OWED') return { text: `Due ₹${visit.billing.amount_owed}`, color: 'text-red-600' };
    if (visit.billing.status === 'PARTIAL') return { text: 'Partial', color: 'text-yellow-600' };
    return { text: visit.billing.billing_type === 'COMPLIMENTARY' ? 'Free' : 'Billed', color: 'text-gray-600' };
  };

  const billing = getBillingLabel();

  return (
    <div
      className="bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
      onClick={() => {
        if (onViewAppointment && (visit.patient_id || visit.patient_user_id)) {
          onViewAppointment(visit.patient_id || visit.patient_user_id!, visit.id);
        }
      }}
    >
      <div className="px-4 py-3">
        {/* Row 1: Patient name + status dot + time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[displayStatus] || 'bg-gray-300'}`} />
            <h3 className="text-sm font-semibold text-gray-900 truncate">{patientName}</h3>
            {visit.visit_mode === 'ONLINE' && <Video className="h-3.5 w-3.5 text-brand-teal flex-shrink-0" />}
            {visit.visit_mode === 'HOME' && <Home className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-3">
            {(() => {
              const [h, m] = visit.scheduled_time.split(':').map(Number);
              const ampm = h >= 12 ? 'PM' : 'AM';
              const h12 = h % 12 || 12;
              return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
            })()} · {format(parseISO(visit.scheduled_date), 'MMM dd')}
          </span>
        </div>

        {/* Row 2: Meta — phone, type, duration, physio */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {visit.patient?.phone || visit.patientUser?.phone || '—'}
          </span>
          <span>{formatVisitType(visit.visit_type)}</span>
          <span>{visit.duration_minutes} min</span>
          {isAdmin && visit.physiotherapist && (
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              {visit.physiotherapist.full_name}
            </span>
          )}
          {visit.visit_source === 'MARKETPLACE' && (
            <span className="text-purple-600">Marketplace</span>
          )}
          {visit.note && <FileText className="h-3 w-3 text-brand-teal" title="Has note" />}
        </div>

        {/* Row 3: Billing + timing (for completed) */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
          {/* Status label */}
          <span className="text-gray-400 capitalize">{displayStatus.replace('_', ' ').toLowerCase()}</span>

          {billing && (
            <span className={`flex items-center gap-0.5 ${billing.color}`}>
              <Receipt className="h-3 w-3" />
              {billing.text}
            </span>
          )}
          {visit.total_amount && (
            <span className="text-green-600 font-medium">₹{visit.total_amount}</span>
          )}

          {/* Compact timing for completed */}
          {visit.status === 'COMPLETED' && (visit.session_duration_minutes || visit.wait_duration_minutes) && (
            <span className="flex items-center gap-2 text-gray-400">
              <Timer className="h-3 w-3" />
              {visit.wait_duration_minutes !== undefined && visit.wait_duration_minutes >= 0 && (
                <span className={visit.wait_duration_minutes > 15 ? 'text-orange-500' : ''}>
                  Wait {visit.wait_duration_minutes}m
                </span>
              )}
              {visit.session_duration_minutes !== undefined && visit.session_duration_minutes > 0 && (
                <span className="text-green-600">Session {visit.session_duration_minutes}m</span>
              )}
            </span>
          )}
        </div>

        {/* Home visit details */}
        {visit.visit_mode === 'HOME' && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md space-y-1 text-xs text-gray-600">
            {visit.service_location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="font-medium">{visit.service_location.location_name}</span>
                <span className="text-gray-400">·</span>
                <span>{visit.service_location.base_address}</span>
              </div>
            )}
            {visit.patient_zone && (
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-gray-400" />
                <span>
                  {visit.patient_zone.charAt(0).toUpperCase() + visit.patient_zone.slice(1)} zone
                  {visit.zone_extra_charge && visit.zone_extra_charge > 0 && ` (+₹${visit.zone_extra_charge})`}
                </span>
              </div>
            )}
            {visit.patient_address && (
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                <span>{visit.patient_address}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end pt-2 mt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {/* Video call */}
            {visit.status === 'SCHEDULED' && visit.visit_mode === 'ONLINE' && onJoinVideoCall && (
              <button
                onClick={(e) => { e.stopPropagation(); onJoinVideoCall(visit.id); }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-teal border border-brand-teal/30 rounded-md hover:bg-teal-50 transition-colors whitespace-nowrap"
              >
                <Video className="h-3 w-3" /> Join
              </button>
            )}

            {/* Check-In */}
            {visit.status === 'SCHEDULED' && !visit.check_in_time && onCheckIn && (
              <button
                onClick={(e) => { e.stopPropagation(); onCheckIn(visit.id); }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors whitespace-nowrap"
              >
                <UserCheck className="h-3 w-3" /> <span className="hidden sm:inline">Check In</span><span className="sm:hidden">In</span>
              </button>
            )}

            {/* Start */}
            {visit.status === 'SCHEDULED' && visit.check_in_time && onStartVisit && (
              <button
                onClick={(e) => { e.stopPropagation(); onStartVisit(visit.id); }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <Play className="h-3 w-3" /> Start
              </button>
            )}

            {/* Complete */}
            {visit.status === 'IN_PROGRESS' && onCompleteVisit && (
              <button
                onClick={(e) => { e.stopPropagation(); onCompleteVisit(visit.id); }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                Complete
              </button>
            )}

            {/* Billing */}
            {onBillVisit && (
              <button
                onClick={(e) => { e.stopPropagation(); onBillVisit(visit); }}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <IndianRupee className="h-3 w-3" /> <span className="hidden sm:inline">Billing</span><span className="sm:hidden">Bill</span>
              </button>
            )}

            {/* Reschedule */}
            {visit.status === 'SCHEDULED' && onReschedule && (
              <button
                onClick={(e) => { e.stopPropagation(); onReschedule(visit.id); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors sm:inline-flex sm:items-center sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-xs sm:font-medium sm:text-gray-500 sm:bg-gray-50"
                title="Reschedule"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> <span className="hidden sm:inline">Reschedule</span>
              </button>
            )}

            {/* Cancel */}
            {visit.status === 'SCHEDULED' && onCancel && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(visit.id); }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Cancel"
              >
                <span className="text-xs">✕</span>
              </button>
            )}

            {/* Add Note */}
            {visit.status === 'COMPLETED' && !visit.note && onAddNote && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddNote(visit.id); }}
                className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-teal-50 rounded-md transition-colors"
                title="Add Note"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;

'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User,
  MoreHorizontal,
  Eye,
  Edit3,
  XCircle
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Visit {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  visit_type: string;
  status: string;
  chief_complaint?: string;
  patient?: {
    id: string;
    full_name: string;
    phone: string;
  };
  physiotherapist?: {
    id: string;
    full_name: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Visit;
}

interface AppointmentCalendarProps {
  visits: Visit[];
  onSelectEvent?: (visit: Visit) => void;
  onReschedule?: (visit: Visit) => void;
  onCancel?: (visit: Visit) => void;
  onViewPatient?: (patient: any) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  visits,
  onSelectEvent,
  onReschedule,
  onCancel,
  onViewPatient
}) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Transform visits to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return visits.map(visit => {
      const [hours, minutes] = visit.scheduled_time.split(':').map(Number);
      const startDate = new Date(visit.scheduled_date);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + visit.duration_minutes);

      return {
        id: visit.id,
        title: visit.patient?.full_name || 'Unknown Patient',
        start: startDate,
        end: endDate,
        resource: visit
      };
    });
  }, [visits]);

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const visit = event.resource;
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';

    switch (visit.status) {
      case 'SCHEDULED':
        backgroundColor = '#3b82f6';
        borderColor = '#2563eb';
        break;
      case 'IN_PROGRESS':
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
        break;
      case 'COMPLETED':
        backgroundColor = '#10b981';
        borderColor = '#059669';
        break;
      case 'CANCELLED':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'NO_SHOW':
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px'
      }
    };
  };

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {label}
          </h2>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="flex items-center space-x-2">
        {['month', 'week', 'day'].map((viewType) => (
          <button
            key={viewType}
            onClick={() => {
              setView(viewType as any);
              onView(viewType);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              view === viewType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {viewType}
          </button>
        ))}
      </div>
    </div>
  );

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const visit = event.resource;
    return (
      <div className="flex items-center space-x-1 text-xs">
        <div className="flex-1 truncate">
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-xs opacity-90 truncate">
            {visit.visit_type?.replace('_', ' ')}
          </div>
        </div>
        <MoreHorizontal className="h-3 w-3 opacity-75 flex-shrink-0" />
      </div>
    );
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-toolbar {
          display: none;
        }
        .rbc-month-view, .rbc-time-view {
          border: none;
        }
        .rbc-time-header {
          border-bottom: 1px solid #e5e7eb;
        }
        .rbc-time-content {
          border-top: none;
        }
        .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid #e5e7eb;
        }
        .rbc-day-slot {
          border-right: 1px solid #e5e7eb;
        }
        .rbc-today {
          background-color: #fef3c7;
        }
        .rbc-current-time-indicator {
          background-color: #ef4444;
        }
        .rbc-event {
          border: none !important;
          border-radius: 6px;
          padding: 4px 8px;
        }
        .rbc-event:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        .rbc-month-view .rbc-event {
          border-radius: 4px;
          padding: 2px 4px;
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={view}
        onView={setView as any}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          event: EventComponent,
        }}
        onSelectEvent={handleSelectEvent}
        popup
        showMultiDayTimes
        step={15}
        timeslots={4}
        min={new Date(2023, 0, 1, 8, 0, 0)}
        max={new Date(2023, 0, 1, 19, 0, 0)}
      />

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Patient Info */}
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedEvent.resource.patient?.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedEvent.resource.patient?.full_name || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedEvent.resource.patient?.phone}
                    </p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Date</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {format(selectedEvent.start, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span>Time</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.resource.status)}`}>
                    {selectedEvent.resource.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Chief Complaint */}
                {selectedEvent.resource.chief_complaint && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Chief Complaint</p>
                    <p className="text-gray-900">{selectedEvent.resource.chief_complaint}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  {onViewPatient && (
                    <button
                      onClick={() => {
                        onViewPatient(selectedEvent.resource.patient);
                        setShowEventDetails(false);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Patient</span>
                    </button>
                  )}
                  
                  {selectedEvent.resource.status === 'SCHEDULED' && (
                    <>
                      {onReschedule && (
                        <button
                          onClick={() => {
                            onReschedule(selectedEvent.resource);
                            setShowEventDetails(false);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Reschedule</span>
                        </button>
                      )}
                      
                      {onCancel && (
                        <button
                          onClick={() => {
                            onCancel(selectedEvent.resource);
                            setShowEventDetails(false);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
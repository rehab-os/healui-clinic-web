'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  X,
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface Visit {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  visit_type: string;
  status: string;
  chief_complaint?: string;
  patient?: { id: string; full_name: string; phone: string };
  physiotherapist?: { id: string; full_name: string };
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

const statusColors: Record<string, { bg: string; border: string }> = {
  SCHEDULED: { bg: '#1e5f79', border: '#185266' },
  IN_PROGRESS: { bg: '#d97706', border: '#b45309' },
  COMPLETED: { bg: '#059669', border: '#047857' },
  CANCELLED: { bg: '#dc2626', border: '#b91c1c' },
  NO_SHOW: { bg: '#9ca3af', border: '#6b7280' },
};

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  visits,
  onReschedule,
  onCancel,
  onViewPatient,
}) => {
  const [view, setView] = useState<'week' | 'day'>('day');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && view === 'week') setView('day');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [view]);

  const events: CalendarEvent[] = useMemo(() => {
    return visits.map(visit => {
      const [hours, minutes] = visit.scheduled_time.split(':').map(Number);
      const startDate = new Date(visit.scheduled_date);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + visit.duration_minutes);
      return {
        id: visit.id,
        title: visit.patient?.full_name || 'Unknown',
        start: startDate,
        end: endDate,
        resource: visit,
      };
    });
  }, [visits]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors = statusColors[event.resource.status] || statusColors.SCHEDULED;
    return {
      style: {
        backgroundColor: colors.bg,
        border: 'none',
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '4px',
        color: 'white',
        fontSize: '11px',
        fontWeight: 500,
        padding: '2px 6px',
        opacity: 0.95,
      },
    };
  };

  const visibleCount = events.filter(e => {
    if (view === 'day') return format(e.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    const ws = startOfWeek(date);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return e.start >= ws && e.start <= we;
  }).length;

  const CustomToolbar = ({ onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1">
        <button onClick={() => onNavigate('PREV')} className="p-1.5 hover:bg-gray-100 rounded-md">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="text-center min-w-[120px]">
          <span className="text-sm font-semibold text-gray-900">
            {view === 'day' ? format(date, 'MMM d, yyyy') : format(date, 'MMM yyyy')}
          </span>
          <span className="text-xs text-gray-400 ml-2">{visibleCount} appts</span>
        </div>
        <button onClick={() => onNavigate('NEXT')} className="p-1.5 hover:bg-gray-100 rounded-md">
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          {(['day', 'week'] as const).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); onView(v); }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors capitalize ${
                view === v ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setDate(new Date()); onNavigate('TODAY'); }}
          className="px-2.5 py-1 text-xs font-medium text-brand-teal border border-brand-teal/30 rounded-md hover:bg-teal-50"
        >
          Today
        </button>
      </div>
    </div>
  );

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="truncate leading-tight">
      <span className="font-medium">{event.title}</span>
    </div>
  );

  return (
    <div>
      <style jsx global>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-toolbar { display: none; }
        .rbc-month-view, .rbc-time-view { border: none; }
        .rbc-time-header { border-bottom: 1px solid #e5e7eb; }
        .rbc-time-content { border-top: none; }
        .rbc-time-slot { border-top: 1px solid #f3f4f6; min-height: 20px; }
        .rbc-timeslot-group { border-bottom: 1px solid #e5e7eb; min-height: 40px; }
        .rbc-day-slot { border-right: 1px solid #f3f4f6; }
        .rbc-today { background-color: #f0fdfa; }
        .rbc-current-time-indicator { background-color: #0d9488; height: 2px; z-index: 3; }
        .rbc-event { border: none !important; cursor: pointer; min-height: 22px; display: flex; align-items: center; }
        .rbc-event:focus { outline: 2px solid #0d9488; outline-offset: 1px; }
        .rbc-time-header-content { border-left: none; }
        .rbc-time-view .rbc-header {
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px; font-weight: 600; color: #4b5563;
          padding: 8px 4px; background-color: #f9fafb;
        }
        .rbc-time-view .rbc-allday-cell { display: none; }
        .rbc-time-view .rbc-time-gutter {
          font-size: 10px; color: #9ca3af;
          background-color: #fafafa; border-right: 1px solid #e5e7eb;
        }
        .rbc-day-bg { background-color: #fff; }
        .rbc-day-bg.rbc-today { background-color: #f0fdfa; }
        @media (max-width: 640px) {
          .rbc-event { font-size: 10px; padding: 1px 4px; min-height: 24px; }
          .rbc-time-view .rbc-header { font-size: 10px; padding: 6px 2px; }
          .rbc-time-view .rbc-time-gutter { font-size: 9px; width: 42px; }
          .rbc-timeslot-group { min-height: 44px; }
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: isMobile ? 450 : 560 }}
        view={view}
        onView={(v) => setView(v as any)}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        components={{ toolbar: CustomToolbar, event: EventComponent }}
        onSelectEvent={(event) => setSelectedEvent(event as CalendarEvent)}
        showMultiDayTimes
        step={30}
        timeslots={2}
        min={new Date(2023, 0, 1, 8, 0, 0)}
        max={new Date(2023, 0, 1, 20, 0, 0)}
        dayLayoutAlgorithm="no-overlap"
        messages={{ noEventsInRange: 'No appointments', showMore: (n) => `+${n}` }}
      />

      {/* Event detail — sliding panel */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute inset-y-0 right-0 w-full sm:w-[360px] bg-white shadow-lg flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedEvent.resource.patient?.full_name || 'Unknown'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedEvent.resource.patient?.phone}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-md text-xs text-gray-500 space-y-1.5">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Date</span>
                  <span className="text-gray-700 font-medium">{format(selectedEvent.start, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Time</span>
                  <span className="text-gray-700 font-medium">{format(selectedEvent.start, 'HH:mm')} – {format(selectedEvent.end, 'HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-gray-700 font-medium capitalize">{selectedEvent.resource.status.replace('_', ' ').toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="text-gray-700 font-medium capitalize">{selectedEvent.resource.visit_type.replace('_', ' ').toLowerCase()}</span>
                </div>
                {selectedEvent.resource.physiotherapist && (
                  <div className="flex justify-between">
                    <span>Physiotherapist</span>
                    <span className="text-gray-700 font-medium">{selectedEvent.resource.physiotherapist.full_name}</span>
                  </div>
                )}
              </div>

              {selectedEvent.resource.chief_complaint && (
                <div>
                  <span className="text-xs text-gray-400">Chief complaint</span>
                  <p className="text-sm text-gray-700 mt-0.5">{selectedEvent.resource.chief_complaint}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
              {onViewPatient && (
                <button
                  onClick={() => { onViewPatient(selectedEvent.resource.patient); setSelectedEvent(null); }}
                  className="flex-1 py-2 text-xs font-medium text-brand-teal border border-brand-teal/30 rounded-md hover:bg-teal-50 transition-colors text-center"
                >
                  View Patient
                </button>
              )}
              {selectedEvent.resource.status === 'SCHEDULED' && onReschedule && (
                <button
                  onClick={() => { onReschedule(selectedEvent.resource); setSelectedEvent(null); }}
                  className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-center"
                >
                  Reschedule
                </button>
              )}
              {selectedEvent.resource.status === 'SCHEDULED' && onCancel && (
                <button
                  onClick={() => { onCancel(selectedEvent.resource); setSelectedEvent(null); }}
                  className="py-2 px-3 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;

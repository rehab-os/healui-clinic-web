'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import AppointmentCard from '../../../components/features/appointments/AppointmentCard';
import AppointmentCalendar from '../../../components/features/appointments/AppointmentCalendar';
import RescheduleVisitModal from '../../../components/features/appointments/RescheduleVisitModal';
import CancelVisitModal from '../../../components/features/appointments/CancelVisitModal';
import BillVisitModal from '../../../components/features/billing/BillVisitModal';
import PatientFeedbackModal, { PatientFeedback } from '../../../components/features/patients/PatientFeedbackModal';
import {
  Calendar,
  Search,
  AlertCircle,
  Loader2,
  CalendarDays,
  List,
  Filter,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, addDays, subDays } from 'date-fns';

interface BillingInfo {
  id: string;
  billing_type: string;
  status: string;
  charge_amount?: number;
  amount_paid: number;
  amount_owed: number;
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
  check_in_time?: string;
  start_time?: string;
  end_time?: string;
  wait_duration_minutes?: number;
  session_duration_minutes?: number;
  total_duration_minutes?: number;
  billing?: BillingInfo;
  visit_source?: 'CLINIC' | 'MARKETPLACE';
  patient_user_id?: string;
  patient_address?: string;
  consultation_fee?: number;
  travel_fee?: number;
  total_amount?: number;
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
}

interface VisitsData {
  visits: Visit[];
  total: number;
}

type FilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function AppointmentsPage() {
  const router = useRouter();
  const { currentClinic, userData, currentContext } = useAppSelector(state => state.user);
  const [visitsData, setVisitsData] = useState<VisitsData>({ visits: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modal states
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [visitToBill, setVisitToBill] = useState<Visit | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [visitToComplete, setVisitToComplete] = useState<Visit | null>(null);
  const [isCompletingVisit, setIsCompletingVisit] = useState(false);

  const isAdmin = userData?.organization?.is_owner || currentClinic?.is_admin;

  useEffect(() => {
    if (currentClinic?.id || currentContext === 'my-practice') {
      fetchVisits();
    }
  }, [currentClinic, currentContext, filterType, customDate, statusFilter, page]);

  const getDateRange = () => {
    const today = new Date();
    let dateFrom: string;
    let dateTo: string;

    switch (filterType) {
      case 'today':
        dateFrom = format(today, 'yyyy-MM-dd');
        dateTo = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        dateFrom = format(startOfWeek(today), 'yyyy-MM-dd');
        dateTo = format(endOfWeek(today), 'yyyy-MM-dd');
        break;
      case 'month':
        dateFrom = format(startOfMonth(today), 'yyyy-MM-dd');
        dateTo = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'custom':
        dateFrom = customDate;
        dateTo = customDate;
        break;
      case 'all':
      default:
        return {};
    }

    return { date_from: dateFrom, date_to: dateTo };
  };

  const fetchVisits = async () => {
    if (!currentClinic?.id && currentContext !== 'my-practice') return;

    try {
      setLoading(true);
      setError(null);
      const dateRange = getDateRange();

      let params: any = {
        ...dateRange,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        page,
        limit,
      };

      if (currentContext === 'my-practice') {
        if (!userData?.user_id) {
          setError('Unable to load appointments: User ID not found');
          setLoading(false);
          return;
        }
        params = { ...params, visit_source: 'MARKETPLACE', physiotherapist_id: userData.user_id };
      } else if (currentClinic?.id) {
        params = {
          ...params,
          clinic_id: currentClinic.id,
          ...(!isAdmin && userData?.user_id && { physiotherapist_id: userData.user_id }),
        };
      }

      const response = await ApiManager.getVisits(params);
      if (response.success) {
        setVisitsData(response.data || { visits: [], total: 0 });
      } else {
        setError(response.message || 'Failed to fetch appointments');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setPage(1); fetchVisits(); };

  const handleViewPatient = (patient: any) => {
    if (patient?.id) router.push(`/dashboard/patients/${patient.id}`);
  };

  const handleViewAppointment = (patientId: string, appointmentId: string) => {
    router.push(`/dashboard/appointments/${patientId}/${appointmentId}`);
  };

  const handleReschedule = (visit: Visit) => { setSelectedVisit(visit); setShowRescheduleModal(true); };
  const handleCancel = (visit: Visit) => { setSelectedVisit(visit); setShowCancelModal(true); };
  const handleModalSuccess = () => { fetchVisits(); };

  const updateVisitInList = (visitId: string, updates: Partial<Visit>) => {
    setVisitsData(prev => ({
      ...prev,
      visits: prev.visits.map(v => v.id === visitId ? { ...v, ...updates } : v)
    }));
  };

  const handleCheckIn = async (visitId: string) => {
    const checkInTime = new Date().toISOString();
    updateVisitInList(visitId, { check_in_time: checkInTime });
    try {
      const response = await ApiManager.checkInVisit(visitId, {});
      if (!response.success) updateVisitInList(visitId, { check_in_time: undefined });
    } catch { updateVisitInList(visitId, { check_in_time: undefined }); }
  };

  const handleStartVisit = async (visitId: string) => {
    const previousVisit = visitsData.visits.find(v => v.id === visitId);
    updateVisitInList(visitId, { status: 'IN_PROGRESS', start_time: new Date().toISOString() });
    try {
      const response = await ApiManager.startVisit(visitId, {});
      if (!response.success) {
        updateVisitInList(visitId, { status: previousVisit?.status || 'SCHEDULED', start_time: previousVisit?.start_time });
      }
    } catch {
      updateVisitInList(visitId, { status: previousVisit?.status || 'SCHEDULED', start_time: previousVisit?.start_time });
    }
  };

  const handleCompleteVisit = async (visitId: string) => {
    const visit = visitsData.visits.find(v => v.id === visitId);
    if (visit) { setVisitToComplete(visit); setShowFeedbackModal(true); }
  };

  const handleFeedbackSubmit = async (feedback: PatientFeedback) => {
    if (!visitToComplete) return;
    const visitId = visitToComplete.id;
    const previousVisit = visitsData.visits.find(v => v.id === visitId);
    updateVisitInList(visitId, { status: 'COMPLETED', end_time: new Date().toISOString() });
    setIsCompletingVisit(true);

    try {
      const response = await ApiManager.completeVisit(visitId, {
        rating: feedback.rating, comment: feedback.comment,
        signature: feedback.signature, skipped: feedback.skipped,
      });
      if (response.success) {
        if (response.data) updateVisitInList(visitId, response.data);
        setShowFeedbackModal(false);
        setVisitToBill({ ...visitToComplete, status: 'COMPLETED' });
        setShowBillModal(true);
        setVisitToComplete(null);
      } else {
        updateVisitInList(visitId, { status: previousVisit?.status || 'IN_PROGRESS', end_time: previousVisit?.end_time });
      }
    } catch {
      updateVisitInList(visitId, { status: previousVisit?.status || 'IN_PROGRESS', end_time: previousVisit?.end_time });
    } finally {
      setIsCompletingVisit(false);
    }
  };

  const handleBillVisit = (visit: Visit) => { setVisitToBill(visit); setShowBillModal(true); };

  const handleJoinVideoCall = (visitId: string) => { router.push(`/dashboard/video-call/${visitId}`); };

  if (!currentClinic && currentContext !== 'my-practice') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-md text-center p-8">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-900 mb-1">No Context Selected</h2>
          <p className="text-sm text-gray-500">Select a clinic or "My Practice" from the header to view appointments.</p>
        </div>
      </div>
    );
  }

  // Stats
  const scheduledCount = visitsData.visits.filter(v => v.status === 'SCHEDULED' && !v.check_in_time).length;
  const waitingCount = visitsData.visits.filter(v => v.status === 'SCHEDULED' && v.check_in_time).length;
  const inProgressCount = visitsData.visits.filter(v => v.status === 'IN_PROGRESS').length;
  const completedCount = visitsData.visits.filter(v => v.status === 'COMPLETED').length;
  const cancelledCount = visitsData.visits.filter(v => v.status === 'CANCELLED').length;
  const noShowCount = visitsData.visits.filter(v => v.status === 'NO_SHOW').length;

  // Billing
  const totalOwed = visitsData.visits.reduce((sum, v) => sum + (v.billing?.amount_owed || 0), 0);
  const unbilledCount = visitsData.visits.filter(v => v.status === 'COMPLETED' && !v.billing).length;

  const stats = [
    { label: 'Scheduled', value: scheduledCount, color: 'text-gray-900' },
    { label: 'Waiting', value: waitingCount, color: 'text-orange-600' },
    { label: 'In Progress', value: inProgressCount, color: 'text-yellow-600' },
    { label: 'Completed', value: completedCount, color: 'text-green-600' },
    { label: 'Cancelled', value: cancelledCount, color: 'text-red-500' },
    { label: 'No Show', value: noShowCount, color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile header */}
          <div className="flex sm:hidden items-center justify-between py-2.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Search className="h-4 w-4" />
              </button>
              {/* Date filters */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-0.5">
                {(['today', 'week', 'month', 'all'] as FilterType[]).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      filterType === filter ? 'bg-brand-teal text-white' : 'text-gray-600'
                    }`}
                  >
                    {filter === 'today' ? 'Today' : filter === 'week' ? 'Wk' : filter === 'month' ? 'Mo' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-400'}`}
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile search + filter (expandable) */}
          {showMobileSearch && (
            <div className="sm:hidden pb-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs"
              >
                <option value="all">All</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">Active</option>
                <option value="COMPLETED">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          {/* Desktop header */}
          <div className="hidden sm:flex items-center gap-3 py-2.5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal focus:bg-white"
              />
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-0.5">
              {(['today', 'week', 'month', 'all'] as FilterType[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    filterType === filter ? 'bg-brand-teal text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
            >
              <option value="all">All</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-400'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-400'}`}
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-gray-400">{visitsData.total} appts</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-3 sm:py-4 space-y-3">
        {/* Stats — grid that wraps on mobile */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-1 px-1">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`text-base sm:text-lg font-semibold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] sm:text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
        {(totalOwed > 0 || unbilledCount > 0) && (
          <div className="flex items-center gap-4 px-1 text-xs">
            {totalOwed > 0 && (
              <span className="text-orange-600 font-medium">₹{totalOwed.toLocaleString('en-IN')} outstanding</span>
            )}
            {unbilledCount > 0 && (
              <span className="text-red-500 font-medium">{unbilledCount} unbilled</span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-md p-8 flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-teal mb-2" />
            <span className="text-sm text-gray-500">Loading appointments...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-md p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Error</h3>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={fetchVisits} className="text-sm text-brand-teal hover:text-teal-700 font-medium">
              Try Again
            </button>
          </div>
        ) : visitsData.visits.length === 0 ? (
          <div className="bg-white rounded-md p-8 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No appointments</h3>
            <p className="text-xs text-gray-500">
              {filterType === 'all' ? 'No appointments yet.' : `No appointments for ${filterType === 'custom' ? 'selected date' : filterType}.`}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {visitsData.visits.map(visit => (
              <AppointmentCard
                key={visit.id}
                visit={visit}
                isAdmin={isAdmin}
                onViewPatient={handleViewPatient}
                onViewAppointment={handleViewAppointment}
                onCheckIn={handleCheckIn}
                onStartVisit={handleStartVisit}
                onCompleteVisit={handleCompleteVisit}
                onBillVisit={handleBillVisit}
                onAddNote={(visitId) => console.log('Add note:', visitId)}
                onReschedule={(visitId) => {
                  const v = visitsData.visits.find(v => v.id === visitId);
                  if (v) handleReschedule(v);
                }}
                onCancel={(visitId) => {
                  const v = visitsData.visits.find(v => v.id === visitId);
                  if (v) handleCancel(v);
                }}
                onJoinVideoCall={handleJoinVideoCall}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-md overflow-hidden p-2 sm:p-4">
            <AppointmentCalendar
              visits={visitsData.visits}
              onSelectEvent={(visit) => console.log('Selected visit:', visit)}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onViewPatient={handleViewPatient}
            />
          </div>
        )}

        {/* Pagination */}
        {visitsData.total > limit && (
          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-gray-500">
              {(page - 1) * limit + 1}–{Math.min(page * limit, visitsData.total)} of {visitsData.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(visitsData.total / limit)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showRescheduleModal && selectedVisit && (
          <RescheduleVisitModal
            visit={selectedVisit}
            onClose={() => { setShowRescheduleModal(false); setSelectedVisit(null); }}
            onSuccess={handleModalSuccess}
          />
        )}

        {showCancelModal && selectedVisit && (
          <CancelVisitModal
            visit={selectedVisit}
            onClose={() => { setShowCancelModal(false); setSelectedVisit(null); }}
            onSuccess={handleModalSuccess}
          />
        )}

        {showBillModal && visitToBill && currentClinic?.id && (
          <BillVisitModal
            visitId={visitToBill.id}
            clinicId={currentClinic.id}
            patientId={visitToBill.patient_id || visitToBill.patient?.id}
            patientName={visitToBill.patient?.full_name || visitToBill.patientUser?.full_name}
            onClose={() => { setShowBillModal(false); setVisitToBill(null); }}
            onSuccess={() => { setShowBillModal(false); setVisitToBill(null); fetchVisits(); }}
          />
        )}

        <PatientFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => { setShowFeedbackModal(false); setVisitToComplete(null); }}
          onSubmit={handleFeedbackSubmit}
          patientName={visitToComplete?.patient?.full_name || visitToComplete?.patientUser?.full_name}
          isSubmitting={isCompletingVisit}
        />
      </div>
    </div>
  );
}

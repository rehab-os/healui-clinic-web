'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AppointmentCard from '../../../components/molecule/AppointmentCard';
import AppointmentCalendar from '../../../components/molecule/AppointmentCalendar';
import RescheduleVisitModal from '../../../components/molecule/RescheduleVisitModal';
import CancelVisitModal from '../../../components/molecule/CancelVisitModal';
import BillVisitModal from '../../../components/molecule/BillVisitModal';
import PatientFeedbackModal, { PatientFeedback } from '../../../components/molecule/PatientFeedbackModal';
// Removed UI component imports - using standard JSX elements instead
import {
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  Phone,
  MapPin,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  CalendarCheck,
  UserPlus,
  Activity,
  CalendarX,
  Grid,
  List,
  Shield,
  Video,
  Loader2,
  UserCheck,
  Play
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, parseISO, addDays, subDays } from 'date-fns';

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
  // Timestamps for tracking
  check_in_time?: string;
  start_time?: string;
  end_time?: string;
  // Duration metrics
  wait_duration_minutes?: number;
  session_duration_minutes?: number;
  total_duration_minutes?: number;
  // Billing info
  billing?: BillingInfo;
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
}

interface VisitsData {
  visits: Visit[];
  total: number;
}

type FilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function AppointmentsPage() {
  const router = useRouter();
  const { currentClinic, userData, currentContext } = useAppSelector(state => state.user);
  const [visitsData, setVisitsData] = useState<VisitsData>({
    visits: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'calendar'>('grid'); // Default to grid for mobile-first
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
    // Fetch visits if we have a clinic selected OR we're in my-practice context
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
    // Check if we have either a clinic or we're in my-practice context
    if (!currentClinic?.id && currentContext !== 'my-practice') {
      console.warn('No current clinic selected and not in my-practice context');
      return;
    }

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
        // For marketplace context, include visit_source and physiotherapist_id
        console.log('🔍 My Practice Context - Current userData:', userData);
        console.log('🔍 userData.user_id:', userData?.user_id);

        if (!userData?.user_id) {
          console.error('❌ ERROR: userData.user_id is missing for marketplace context!');
          setError('Unable to load appointments: User ID not found');
          setLoading(false);
          return;
        }

        params = {
          ...params,
          visit_source: 'MARKETPLACE',
          physiotherapist_id: userData.user_id, // Filter by current user's marketplace appointments
        };
        console.log('✅ Fetching marketplace visits with params:', params);
      } else if (currentClinic?.id) {
        // For clinic context, include clinic_id and role-based filtering
        params = {
          ...params,
          clinic_id: currentClinic.id,
          ...(!isAdmin && userData?.user_id && { physiotherapist_id: userData.user_id }),
        };
        console.log('Fetching clinic visits with params:', params);
        console.log('Current clinic:', currentClinic);
      }

      const response = await ApiManager.getVisits(params);
      if (response.success) {
        // Backend already includes billing data with visits
        setVisitsData(response.data || { visits: [], total: 0 });
      } else {
        setError(response.message || 'Failed to fetch appointments');
      }
    } catch (error: any) {
      console.error('Failed to fetch visits:', error);
      setError(error.message || 'An error occurred while fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchVisits();
  };

  const handleViewPatient = (patient: any) => {
    if (patient?.id) {
      router.push(`/dashboard/patients/${patient.id}`);
    }
  };

  const handleViewAppointment = (patientId: string, appointmentId: string) => {
    router.push(`/dashboard/appointments/${patientId}/${appointmentId}`);
  };

  const handleReschedule = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowRescheduleModal(true);
  };

  const handleCancel = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowCancelModal(true);
  };

  const handleModalSuccess = () => {
    fetchVisits(); // Refresh the appointments list
  };

  // Helper to update a single visit in the list (optimistic update)
  const updateVisitInList = (visitId: string, updates: Partial<Visit>) => {
    setVisitsData(prev => ({
      ...prev,
      visits: prev.visits.map(v =>
        v.id === visitId ? { ...v, ...updates } : v
      )
    }));
  };

  const handleCheckIn = async (visitId: string) => {
    // Optimistic update - immediately show as checked in
    const checkInTime = new Date().toISOString();
    updateVisitInList(visitId, { check_in_time: checkInTime });

    try {
      const response = await ApiManager.checkInVisit(visitId, {});
      if (!response.success) {
        // Revert on failure
        updateVisitInList(visitId, { check_in_time: undefined });
        console.error('Failed to check in:', response.message);
      }
    } catch (error) {
      // Revert on error
      updateVisitInList(visitId, { check_in_time: undefined });
      console.error('Failed to check in visit:', error);
    }
  };

  const handleStartVisit = async (visitId: string) => {
    // Optimistic update - immediately show as in progress
    const previousVisit = visitsData.visits.find(v => v.id === visitId);
    const startTime = new Date().toISOString();
    updateVisitInList(visitId, { status: 'IN_PROGRESS', start_time: startTime });

    try {
      const response = await ApiManager.startVisit(visitId, {});
      if (!response.success) {
        // Revert on failure
        updateVisitInList(visitId, {
          status: previousVisit?.status || 'SCHEDULED',
          start_time: previousVisit?.start_time
        });
        console.error('Failed to start visit:', response.message);
      }
    } catch (error) {
      // Revert on error
      updateVisitInList(visitId, {
        status: previousVisit?.status || 'SCHEDULED',
        start_time: previousVisit?.start_time
      });
      console.error('Failed to start visit:', error);
    }
  };

  const handleCompleteVisit = async (visitId: string) => {
    // Show feedback modal instead of completing directly
    const visit = visitsData.visits.find(v => v.id === visitId);
    if (visit) {
      setVisitToComplete(visit);
      setShowFeedbackModal(true);
    }
  };

  const handleFeedbackSubmit = async (feedback: PatientFeedback) => {
    if (!visitToComplete) return;

    const visitId = visitToComplete.id;
    const previousVisit = visitsData.visits.find(v => v.id === visitId);

    // Optimistic update - immediately show as completed
    const endTime = new Date().toISOString();
    updateVisitInList(visitId, { status: 'COMPLETED', end_time: endTime });
    setIsCompletingVisit(true);

    try {
      const response = await ApiManager.completeVisit(visitId, {
        rating: feedback.rating,
        comment: feedback.comment,
        signature: feedback.signature,
        skipped: feedback.skipped,
      });

      if (response.success) {
        // Update with actual data from server (includes duration calculations)
        if (response.data) {
          updateVisitInList(visitId, response.data);
        }
        // Close feedback modal and open billing modal
        setShowFeedbackModal(false);
        setVisitToBill({ ...visitToComplete, status: 'COMPLETED' });
        setShowBillModal(true);
        setVisitToComplete(null);
      } else {
        // Revert on failure
        updateVisitInList(visitId, {
          status: previousVisit?.status || 'IN_PROGRESS',
          end_time: previousVisit?.end_time
        });
        console.error('Failed to complete visit:', response.message);
      }
    } catch (error) {
      // Revert on error
      updateVisitInList(visitId, {
        status: previousVisit?.status || 'IN_PROGRESS',
        end_time: previousVisit?.end_time
      });
      console.error('Failed to complete visit:', error);
    } finally {
      setIsCompletingVisit(false);
    }
  };

  const handleBillVisit = (visit: Visit) => {
    setVisitToBill(visit);
    setShowBillModal(true);
  };

  const handleJoinVideoCall = (visitId: string) => {
    router.push(`/dashboard/video-call/${visitId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'INITIAL_CONSULTATION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FOLLOW_UP':
        return 'bg-healui-physio/10 text-healui-physio border-healui-physio/20';
      case 'REVIEW':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'EMERGENCY':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatVisitType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    if (filterType === 'custom') {
      const currentDate = parseISO(customDate);
      const newDate = direction === 'next' 
        ? addDays(currentDate, 1) 
        : subDays(currentDate, 1);
      setCustomDate(format(newDate, 'yyyy-MM-dd'));
      setSelectedDate(newDate);
    }
  };

  if (!currentClinic && currentContext !== 'my-practice') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center p-6 sm:p-8">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Context Selected</h2>
          <p className="text-gray-600">
            Please select a clinic or "My Practice" from the header to view appointments.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const scheduledCount = visitsData.visits.filter(v => v.status === 'SCHEDULED' && !v.check_in_time).length;
  const waitingCount = visitsData.visits.filter(v => v.status === 'SCHEDULED' && v.check_in_time).length;
  const inProgressCount = visitsData.visits.filter(v => v.status === 'IN_PROGRESS').length;
  const completedCount = visitsData.visits.filter(v => v.status === 'COMPLETED').length;
  const cancelledCount = visitsData.visits.filter(v => v.status === 'CANCELLED').length;
  const noShowCount = visitsData.visits.filter(v => v.status === 'NO_SHOW').length;

  // Billing stats
  const billedPaidCount = visitsData.visits.filter(v => v.billing?.status === 'PAID').length;
  const billedOwedCount = visitsData.visits.filter(v => v.billing?.status === 'OWED' || v.billing?.status === 'PARTIAL').length;
  const unbilledCount = visitsData.visits.filter(v => v.status === 'COMPLETED' && !v.billing).length;
  const totalOwed = visitsData.visits.reduce((sum, v) => sum + (v.billing?.amount_owed || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header with Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-2.5">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal focus:bg-white"
              />
            </div>

            {/* Date Filter Tabs */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              {(['today', 'week', 'month', 'all'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                    filterType === filter
                      ? 'bg-[#1e5f79] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value="all">All</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Appointment Count */}
            <span className="text-sm text-gray-500 hidden sm:block">{visitsData.total} appointments</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="text-xl font-semibold text-[#1e5f79]">{scheduledCount}</p>
              </div>
              <Clock className="h-6 w-6 text-[#1e5f79]/20" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Waiting</p>
                <p className="text-xl font-semibold text-orange-600">{waitingCount}</p>
              </div>
              <UserCheck className="h-6 w-6 text-orange-600/20" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="text-xl font-semibold text-yellow-600">{inProgressCount}</p>
              </div>
              <Play className="h-6 w-6 text-yellow-600/20" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-xl font-semibold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600/20" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="text-xl font-semibold text-red-600">{cancelledCount}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-600/20" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">No Show</p>
                <p className="text-xl font-semibold text-gray-600">{noShowCount}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-gray-600/20" />
            </div>
          </div>
        </div>

        {/* Billing Summary Row */}
        {(billedPaidCount > 0 || billedOwedCount > 0 || unbilledCount > 0) && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Paid: <span className="font-semibold text-green-600">{billedPaidCount}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-600">Due: <span className="font-semibold text-orange-600">{billedOwedCount}</span></span>
                </div>
                {unbilledCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Not Billed: <span className="font-semibold text-red-600">{unbilledCount}</span></span>
                  </div>
                )}
              </div>
              {totalOwed > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Outstanding</p>
                  <p className="text-lg font-bold text-orange-600">₹{totalOwed.toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments List */}
        {loading ? (
          <div className="bg-white rounded-lg p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e5f79] mb-3" />
              <span className="text-sm text-gray-600">Loading appointments...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Appointments</h3>
            <p className="text-red-600 text-center text-sm mb-4">
              {error}
            </p>
            <button
              onClick={fetchVisits}
              className="bg-[#1e5f79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e5f79]/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : visitsData.visits.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 text-center text-sm">
              {filterType === 'all' ? 'No appointments scheduled yet.' : `No appointments for ${filterType === 'custom' ? 'selected date' : filterType}.`}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-4">
          {visitsData.visits.map((visit) => (
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
              onAddNote={(visitId) => {
                console.log('Add note:', visitId);
              }}
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
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4">
              <AppointmentCalendar
                visits={visitsData.visits}
                onSelectEvent={(visit) => console.log('Selected visit:', visit)}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onViewPatient={handleViewPatient}
              />
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient (Click to view details)
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chief Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitsData.visits.map((visit) => (
                    <tr key={visit.id} className={`hover:bg-gray-50 ${
                      visit.visit_mode === 'ONLINE' 
                        ? 'border-l-4 border-l-blue-500 bg-blue-50/30' 
                        : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {visit.scheduled_time}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="cursor-pointer hover:bg-blue-50 rounded-lg p-2 -m-2 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatient(visit.patient || visit.patientUser);
                          }}
                          title="Click to view patient details"
                        >
                          <div className="text-sm font-medium text-[#1e5f79] hover:text-[#1e5f79]/80">
                            {visit.patient?.full_name || visit.patientUser?.full_name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <span>{visit.patient?.phone || visit.patientUser?.phone || 'No phone'}</span>
                            {visit.visit_source === 'MARKETPLACE' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                Marketplace
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {visit.physiotherapist?.full_name || 'Not assigned'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getVisitTypeColor(visit.visit_type)}`}>
                            {formatVisitType(visit.visit_type)}
                          </span>
                          {visit.visit_mode === 'ONLINE' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1e5f79] text-white border-[#1e5f79]">
                              <Video className="h-3 w-3 mr-1" />
                              Online
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {visit.chief_complaint || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
                          {visit.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {visit.status === 'SCHEDULED' && visit.visit_mode === 'ONLINE' && (
                            <button
                              onClick={() => handleJoinVideoCall(visit.id)}
                              className="text-[#1e5f79] hover:text-[#1e5f79]/80 p-1.5 hover:bg-[#eff8ff] rounded-lg transition-colors"
                              title="Join Video Call"
                            >
                              <Video className="h-4 w-4" />
                            </button>
                          )}
                          {visit.status === 'SCHEDULED' && (
                            <>
                              <button
                                className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="Start Visit"
                              >
                                <Activity className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReschedule(visit)}
                                className="text-orange-600 hover:text-orange-900 p-1.5 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Reschedule"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(visit)}
                                className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {visit.status === 'COMPLETED' && !visit.note && (
                            <button
                              className="text-purple-600 hover:text-purple-900 p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Add Note"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          {visit.status === 'IN_PROGRESS' && (
                            <button
                              className="text-purple-600 hover:text-purple-900 p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Add Note"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          {visit.note && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <FileText className="h-3 w-3 mr-1" />
                              Note Added
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Pagination */}
        {visitsData.total > limit && (
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * limit, visitsData.total)}
              </span>{' '}
              of <span className="font-medium">{visitsData.total}</span> appointments
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(visitsData.total / limit)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClose={() => {
              setShowRescheduleModal(false);
              setSelectedVisit(null);
            }}
            onSuccess={handleModalSuccess}
          />
        )}

        {showCancelModal && selectedVisit && (
          <CancelVisitModal
            visit={selectedVisit}
            onClose={() => {
              setShowCancelModal(false);
              setSelectedVisit(null);
            }}
            onSuccess={handleModalSuccess}
          />
        )}

        {showBillModal && visitToBill && currentClinic?.id && (
          <BillVisitModal
            visitId={visitToBill.id}
            clinicId={currentClinic.id}
            patientId={visitToBill.patient_id || visitToBill.patient?.id}
            patientName={visitToBill.patient?.full_name || visitToBill.patientUser?.full_name}
            onClose={() => {
              setShowBillModal(false);
              setVisitToBill(null);
            }}
            onSuccess={() => {
              setShowBillModal(false);
              setVisitToBill(null);
              fetchVisits();
            }}
          />
        )}

        {/* Patient Feedback Modal */}
        <PatientFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setVisitToComplete(null);
          }}
          onSubmit={handleFeedbackSubmit}
          patientName={visitToComplete?.patient?.full_name || visitToComplete?.patientUser?.full_name}
          isSubmitting={isCompletingVisit}
        />
      </div>
    </div>
  );
}

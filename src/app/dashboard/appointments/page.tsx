'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AppointmentCard from '../../../components/molecule/AppointmentCard';
import AppointmentCalendar from '../../../components/molecule/AppointmentCalendar';
import RescheduleVisitModal from '../../../components/molecule/RescheduleVisitModal';
import CancelVisitModal from '../../../components/molecule/CancelVisitModal';
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
  Video
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, parseISO, addDays, subDays } from 'date-fns';

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
}

interface VisitsData {
  visits: Visit[];
  total: number;
}

type FilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function AppointmentsPage() {
  const router = useRouter();
  const { currentClinic, userData } = useAppSelector(state => state.user);
  const [visitsData, setVisitsData] = useState<VisitsData>({
    visits: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
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

  const isAdmin = userData?.organization?.is_owner || currentClinic?.is_admin;

  useEffect(() => {
    if (currentClinic?.id) {
      fetchVisits();
    }
  }, [currentClinic, filterType, customDate, statusFilter, page]);

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
    if (!currentClinic?.id) {
      console.warn('No current clinic selected for appointments');
      return;
    }
    
    try {
      setLoading(true);
      const dateRange = getDateRange();
      const params = {
        clinic_id: currentClinic.id,
        ...dateRange,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(!isAdmin && userData?.id && { physiotherapist_id: userData.id }),
        page,
        limit,
      };
      
      console.log('Fetching visits with params:', params);
      console.log('Current clinic:', currentClinic);
      
      const response = await ApiManager.getVisits(params);
      if (response.success) {
        setVisitsData(response.data || { visits: [], total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error);
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

  if (!currentClinic) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center p-6 sm:p-8">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Clinic Selected</h2>
          <p className="text-gray-600">
            Please select a clinic from the header to view appointments.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const scheduledCount = visitsData.visits.filter(v => v.status === 'SCHEDULED').length;
  const completedCount = visitsData.visits.filter(v => v.status === 'COMPLETED').length;
  const cancelledCount = visitsData.visits.filter(v => v.status === 'CANCELLED').length;
  const noShowCount = visitsData.visits.filter(v => v.status === 'NO_SHOW').length;

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-2 sm:py-4">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-healui-physio/10 text-healui-physio">
                {currentClinic?.name || 'All Clinics'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-0 sm:px-3 lg:px-6 py-0 sm:py-3 space-y-0 sm:space-y-3">
        {/* Concise Stats */}
        <div className="bg-white sm:rounded-lg sm:shadow-sm border-b sm:border border-gray-200">
          <div className="px-3 py-2 sm:p-3">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-600">Total:</span>
                <span className="font-bold text-gray-900">{visitsData.total}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-600">Scheduled:</span>
                <span className="font-bold text-blue-600">{scheduledCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-600">Completed:</span>
                <span className="font-bold text-green-600">{completedCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-600">Cancelled:</span>
                <span className="font-bold text-red-600">{cancelledCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-600">No Show:</span>
                <span className="font-bold text-gray-600">{noShowCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Filters & Search */}
        <div className="bg-white sm:rounded-lg sm:shadow-sm border-b sm:border border-gray-200">
          <div className="px-3 py-2 sm:p-3">
            <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-2">
              {/* Date Filter */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1">
                  {(['today', 'week', 'month', 'all', 'custom'] as FilterType[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterType(filter)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                        filterType === filter
                          ? 'bg-white text-healui-physio shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
                {/* Custom Date Picker */}
                {filterType === 'custom' && (
                  <div className="flex items-center gap-1 sm:gap-2 ml-2">
                    <button
                      onClick={() => handleDateNavigation('prev')}
                      className="p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value);
                        setSelectedDate(parseISO(e.target.value));
                      }}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio focus:border-transparent text-xs sm:text-sm"
                    />
                    <button
                      onClick={() => handleDateNavigation('next')}
                      className="p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio focus:border-transparent text-xs sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>

              {/* Search */}
              <div className="flex-1 flex gap-1 sm:gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patient name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-7 sm:pl-10 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-healui-physio text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-healui-primary transition-colors"
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </div>

              {/* Mobile-Optimized View Toggle - Larger icons, only List & Calendar on mobile */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-1.5 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-healui-physio' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 sm:p-1.5 rounded transition-all ${
                    viewMode === 'calendar' 
                      ? 'bg-white shadow-sm text-healui-physio' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Calendar View"
                >
                  <Calendar className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                {/* Table view only shown on desktop */}
                <button
                  onClick={() => setViewMode('table')}
                  className={`hidden sm:flex p-1.5 rounded transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white shadow-sm text-healui-physio' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Table View"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Responsive Appointments List */}
        {loading ? (
          <div className="bg-white sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 p-6 sm:p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healui-physio mr-3"></div>
              <span className="text-gray-600">Loading appointments...</span>
            </div>
          </div>
        ) : visitsData.visits.length === 0 ? (
          <div className="bg-white sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 p-6 sm:p-8 text-center">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              {filterType === 'all' ? 'No appointments scheduled yet.' : `No appointments for ${filterType === 'custom' ? 'selected date' : filterType}.`}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-0 sm:space-y-2"> {/* Enterprise mobile: single column list for optimal scanning */}
          {visitsData.visits.map((visit) => (
            <AppointmentCard
              key={visit.id}
              visit={visit}
              isAdmin={isAdmin}
              onViewPatient={handleViewPatient}
              onViewAppointment={handleViewAppointment}
              onStartVisit={(visitId) => {
                console.log('Start visit:', visitId);
              }}
              onAddNote={(visitId) => {
                console.log('Add note:', visitId);
              }}
              onReschedule={(visitId) => {
                const visit = visitsData.visits.find(v => v.id === visitId);
                if (visit) handleReschedule(visit);
              }}
              onCancel={(visitId) => {
                const visit = visitsData.visits.find(v => v.id === visitId);
                if (visit) handleCancel(visit);
              }}
              onJoinVideoCall={handleJoinVideoCall}
            />
          ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="bg-white sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 overflow-hidden">
            <div className="p-0 sm:p-4">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                            handleViewPatient(visit.patient);
                          }}
                          title="Click to view patient details"
                        >
                          <div className="text-sm font-medium text-healui-physio hover:text-healui-primary">
                            {visit.patient?.full_name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {visit.patient?.phone || 'No phone'}
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white border-blue-500">
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
                              className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
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

        {/* Smart Pagination */}
        {visitsData.total > limit && (
          <div className="bg-white sm:rounded-lg sm:shadow-sm border-t sm:border border-gray-200 p-3 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {visitsData.total} appointment{visitsData.total !== 1 ? 's' : ''} • Page {page} of {Math.ceil(visitsData.total / limit)}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-healui-physio bg-healui-physio/10 rounded-lg">
                  {page}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(visitsData.total / limit)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
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
      </div>
    </div>
  );
}

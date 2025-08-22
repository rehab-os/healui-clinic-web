'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AppointmentCard from '../../../components/molecule/AppointmentCard';
import AppointmentCalendar from '../../../components/molecule/AppointmentCalendar';
import RescheduleVisitModal from '../../../components/molecule/RescheduleVisitModal';
import CancelVisitModal from '../../../components/molecule/CancelVisitModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
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
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'calendar'>('table');
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Clinic Selected</h2>
            <p className="text-gray-600 text-center">
              Please select a clinic from the header to view appointments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const scheduledCount = visitsData.visits.filter(v => v.status === 'SCHEDULED').length;
  const completedCount = visitsData.visits.filter(v => v.status === 'COMPLETED').length;
  const cancelledCount = visitsData.visits.filter(v => v.status === 'CANCELLED').length;
  const noShowCount = visitsData.visits.filter(v => v.status === 'NO_SHOW').length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage all clinic appointments' : 'View your appointments'}
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{visitsData.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">No Show</p>
                <p className="text-2xl font-bold text-gray-600">{noShowCount}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <CalendarX className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['today', 'week', 'month', 'all', 'custom'] as FilterType[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDateNavigation('prev')}
                    className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setSelectedDate(parseISO(e.target.value));
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio focus:border-transparent"
                  />
                  <button
                    onClick={() => handleDateNavigation('next')}
                    className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search patient name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-healui-physio/10 text-healui-physio' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-healui-physio/10 text-healui-physio' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-healui-physio/10 text-healui-physio' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Calendar View"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healui-physio"></div>
        </div>
      ) : visitsData.visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 text-center">
              {filterType === 'all' ? 'No appointments scheduled yet.' : `No appointments for ${filterType === 'custom' ? 'selected date' : filterType}.`}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visitsData.visits.map((visit) => (
            <AppointmentCard
              key={visit.id}
              visit={visit}
              isAdmin={isAdmin}
              onViewPatient={handleViewPatient}
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
        <AppointmentCalendar
          visits={visitsData.visits}
          onSelectEvent={(visit) => console.log('Selected visit:', visit)}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          onViewPatient={handleViewPatient}
        />
      ) : viewMode === 'table' ? (
        <Card>
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
                        className="flex items-center cursor-pointer hover:bg-blue-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPatient(visit.patient);
                        }}
                        title="Click to view patient details"
                      >
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium">
                          {visit.patient?.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-healui-physio hover:text-healui-primary">
                            {visit.patient?.full_name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {visit.patient?.phone || 'No phone'}
                          </div>
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
                        <Badge variant="outline" className={`text-xs ${getVisitTypeColor(visit.visit_type)}`}>
                          {formatVisitType(visit.visit_type)}
                        </Badge>
                        {visit.visit_mode === 'ONLINE' && (
                          <Badge variant="outline" className="text-xs bg-blue-500 text-white border-blue-500">
                            <Video className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {visit.chief_complaint || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(visit.status)}`}>
                        {visit.status.replace('_', ' ')}
                      </Badge>
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
                          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                            <FileText className="h-3 w-3 mr-1" />
                            Note Added
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {/* Pagination */}
      {visitsData.total > limit && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {Math.ceil(visitsData.total / limit)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(visitsData.total / limit)}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
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
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AddPatientModal from '../../../components/molecule/AddPatientModal';
import PatientDetailsModal from '../../../components/molecule/PatientDetailsModal';
import ScheduleVisitModal from '../../../components/molecule/ScheduleVisitModal';
import { 
  UserPlus,
  Users,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit,
  CalendarPlus,
  Clock,
  Activity,
  AlertCircle,
  Heart,
  FileCheck,
  Shield,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth: Date;
  gender: string;
  address?: string;
  status: string;
  created_at: string;
  visits?: any[];
}

interface PatientsData {
  patients: Patient[];
  total: number;
}


export default function PatientsPage() {
  const { userData, currentClinic } = useAppSelector(state => state.user);
  const [patientsData, setPatientsData] = useState<PatientsData>({
    patients: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list for mobile
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'DISCHARGED'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 15; // Increased for better mobile experience

  useEffect(() => {
    if (currentClinic?.id) {
      fetchPatients();
    }
  }, [currentClinic, page, statusFilter]);

  const fetchPatients = async () => {
    if (!currentClinic?.id) return;
    
    try {
      setLoading(true);
      const params = {
        clinic_id: currentClinic.id,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        page,
        limit,
      };
      
      const response = await ApiManager.getPatients(params);
      if (response.success) {
        setPatientsData(response.data || { patients: [], total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = () => {
    setPage(1);
    fetchPatients();
  };

  const handleAddPatient = () => {
    setShowAddModal(true);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleScheduleVisit = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowScheduleModal(true);
  };

  const calculateAge = (dob: Date) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DISCHARGED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control - only allow receptionist/manager roles or clinic admins
  if (currentClinic && !currentClinic.is_admin && 
      currentClinic.role !== 'receptionist' && 
      currentClinic.role !== 'manager') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card-base text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-text-dark mb-2">Access Denied</h2>
          <p className="text-text-gray text-center">
            Only receptionists, managers, and clinic administrators can manage patients.
          </p>
        </div>
      </div>
    );
  }

  if (!currentClinic) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card-base text-center">
          <AlertCircle className="h-16 w-16 text-healui-physio/50 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-text-dark mb-2">No Clinic Selected</h2>
          <p className="text-text-gray">
            Please select a clinic from the header to manage patients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-healui-physio/10 text-healui-physio">
                {currentClinic?.name || 'All Clinics'}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              {loading && (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-healui-physio" />
              )}
              <button
                onClick={handleAddPatient}
                className="btn-primary inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 text-sm"
              >
                <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Patient</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">

        {/* Mobile-Optimized Search & Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-2 sm:p-3">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
              {/* Mobile-First Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-8 sm:pl-10 pr-16 sm:pr-20 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all"
                  />
                  <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setPage(1);
                          fetchPatients();
                        }}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSearch}
                      className="bg-healui-physio text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium hover:bg-healui-primary transition-colors"
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile-Friendly Filters */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20"
                >
                  <option value="all">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DISCHARGED">Discharged</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 sm:p-1.5 rounded transition-all ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-healui-physio' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 sm:p-1.5 rounded transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-healui-physio' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Patients List/Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-healui-physio mr-3" />
              <span className="text-gray-600">Loading patients...</span>
            </div>
          </div>
        ) : patientsData.patients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <UserPlus className="h-12 w-12 sm:h-16 sm:w-16 text-healui-physio/50 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters' 
                : 'Get started by adding your first patient'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleAddPatient}
                className="btn-primary inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 text-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Patient
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4' 
              : 'space-y-2'
            }>
              {patientsData.patients.map((patient) => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  viewMode={viewMode}
                  onView={() => handleViewPatient(patient)}
                  onSchedule={() => handleScheduleVisit(patient)}
                />
              ))}
            </div>

            {/* Smart Pagination */}
            {patientsData.total > limit && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {patientsData.total} patient{patientsData.total !== 1 ? 's' : ''} • Page {page} of {Math.ceil(patientsData.total / limit)}
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
                      disabled={page >= Math.ceil(patientsData.total / limit)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPatients();
          }}
        />
      )}

      {showDetailsModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPatient(null);
          }}
          onScheduleVisit={() => {
            setShowDetailsModal(false);
            setShowScheduleModal(true);
          }}
        />
      )}

      {showScheduleModal && selectedPatient && (
        <ScheduleVisitModal
          patient={selectedPatient}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            setShowScheduleModal(false);
            setSelectedPatient(null);
            fetchPatients();
          }}
        />
      )}
    </div>
  );
}

interface PatientCardProps {
  patient: Patient;
  viewMode: 'grid' | 'list';
  onView: () => void;
  onSchedule: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, viewMode, onView, onSchedule }) => {
  const [showMenu, setShowMenu] = useState(false);

  const calculateAge = (dob: Date) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'DISCHARGED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-3 w-3" />;
      case 'INACTIVE':
        return <Clock className="h-3 w-3" />;
      case 'DISCHARGED':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-physio flex items-center justify-center text-white font-semibold shadow-sm flex-shrink-0">
                <span className="text-sm sm:text-base">
                  {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              
              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {patient.full_name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                    {getStatusIcon(patient.status)}
                    <span className="ml-1 hidden sm:inline">{patient.status}</span>
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {patient.phone}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {calculateAge(patient.date_of_birth)}y, {patient.gender.charAt(0)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                    #{patient.patient_code}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={onView}
                className="p-2 text-gray-400 hover:text-healui-physio transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={onSchedule}
                className="p-2 text-healui-physio hover:text-healui-primary transition-colors"
                title="Schedule Visit"
              >
                <CalendarPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 rounded-full bg-gradient-physio flex items-center justify-center text-white font-semibold shadow-sm">
            {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
            {getStatusIcon(patient.status)}
            <span className="ml-1">{patient.status}</span>
          </span>
        </div>

        {/* Patient Info */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
            {patient.full_name}
          </h3>
          <p className="text-xs text-gray-500 font-medium">#{patient.patient_code}</p>
        </div>

        {/* Contact & Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-3 w-3 mr-2 text-gray-400" />
            <span className="text-xs">{patient.phone}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-3 w-3 mr-2 text-gray-400" />
            <span className="text-xs">{calculateAge(patient.date_of_birth)} years, {patient.gender}</span>
          </div>
          
          {patient.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-3 w-3 mr-2 text-gray-400" />
              <span className="truncate text-xs">{patient.email}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            onClick={onView}
            className="text-xs text-healui-physio hover:text-healui-primary font-medium"
          >
            View Details
          </button>
          <button
            onClick={onSchedule}
            className="p-1.5 text-healui-physio hover:text-healui-primary transition-colors rounded-lg hover:bg-healui-physio/10"
            title="Schedule Visit"
          >
            <CalendarPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AddPatientModal from '../../../components/molecule/AddPatientModal';
import EnhancedPatientDetailsModal from '../../../components/molecule/EnhancedPatientDetailsModal';
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
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  chronic_conditions?: string[];
  previous_surgeries?: Array<{
    procedure: string;
    date: string;
    body_part: string;
  }>;
  past_illnesses?: Array<{
    illness: string;
    date: string;
    treatment: string;
    resolved: boolean;
  }>;
  past_investigations?: Array<{
    type: string;
    date: string;
    findings: string;
    body_part?: string;
  }>;
  occupation?: string;
  activity_level?: string;
  family_history?: string;
  allergies?: string[];
  current_medications?: string[];
  insurance_provider?: string;
  insurance_policy_number?: string;
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
        return 'bg-brand-teal/10 text-brand-teal border-brand-teal/20';
      case 'INACTIVE':
        return 'bg-brand-black/10 text-brand-black/70 border-brand-black/20';
      case 'DISCHARGED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-brand-black/10 text-brand-black/70 border-brand-black/20';
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
          <h2 className="text-xl font-display font-semibold text-brand-black mb-2">Access Denied</h2>
          <p className="text-brand-black/60 text-center">
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
          <AlertCircle className="h-16 w-16 text-brand-teal/50 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-brand-black mb-2">No Clinic Selected</h2>
          <p className="text-brand-black/60">
            Please select a clinic from the header to manage patients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Page Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage patient records for {currentClinic?.name || 'All Clinics'}
              </p>
            </div>
            
            <button
              onClick={handleAddPatient}
              className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Patient
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                    fetchPatients();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCHARGED">Discharged</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'list' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>


        {/* Patient Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{patientsData.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-brand-teal/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-green-600">
                  {patientsData.patients.filter(p => p.status === 'ACTIVE').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-semibold text-gray-600">
                  {patientsData.patients.filter(p => p.status === 'INACTIVE').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-600/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Discharged</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {patientsData.patients.filter(p => p.status === 'DISCHARGED').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-blue-600/20" />
            </div>
          </div>
        </div>

        {/* Patients Table/Grid */}
        {loading ? (
          <div className="bg-white rounded-lg p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal mb-3" />
              <span className="text-sm text-gray-600">Loading patients...</span>
            </div>
          </div>
        ) : patientsData.patients.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters' 
                : 'Get started by adding your first patient'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleAddPatient}
                className="btn-primary inline-flex items-center px-4 py-2"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Patient
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age / Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientsData.patients.map((patient) => (
                    <PatientCard 
                      key={patient.id} 
                      patient={patient} 
                      viewMode={viewMode}
                      onView={() => handleViewPatient(patient)}
                      onSchedule={() => handleScheduleVisit(patient)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        )}

            {/* Pagination */}
            {patientsData.total > limit && (
              <div className="flex items-center justify-between py-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, patientsData.total)}
                  </span>{' '}
                  of <span className="font-medium">{patientsData.total}</span> patients
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
                    disabled={page >= Math.ceil(patientsData.total / limit)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
        <EnhancedPatientDetailsModal
          patient={selectedPatient}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPatient(null);
          }}
          onScheduleVisit={() => {
            setShowDetailsModal(false);
            setShowScheduleModal(true);
          }}
          onPatientUpdate={() => {
            fetchPatients(); // Refresh patient list after update
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
        return 'bg-brand-teal/10 text-brand-teal border-brand-teal/20';
      case 'INACTIVE':
        return 'bg-brand-black/10 text-brand-black/70 border-brand-black/20';
      case 'DISCHARGED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-brand-black/10 text-brand-black/70 border-brand-black/20';
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
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onView}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-brand-teal flex items-center justify-center text-white font-semibold flex-shrink-0">
              {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 hover:text-brand-teal">
                {patient.full_name}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{patient.phone}</div>
          {patient.email && (
            <div className="text-sm text-gray-500">{patient.email}</div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {calculateAge(patient.date_of_birth)} years
          </div>
          <div className="text-sm text-gray-500">{patient.gender}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
            {getStatusIcon(patient.status)}
            <span className="ml-1">{patient.status}</span>
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="text-brand-teal hover:text-brand-teal/80 mr-3"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            Schedule
          </button>
        </td>
      </tr>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onView}
    >
      <div className="p-5">
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-brand-teal flex items-center justify-center text-white font-semibold">
              {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {patient.full_name}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)} mt-1`}>
                {getStatusIcon(patient.status)}
                <span className="ml-1">{patient.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{patient.phone}</span>
          </div>
          
          {patient.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{calculateAge(patient.date_of_birth)} years, {patient.gender}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="text-sm text-brand-teal hover:text-brand-teal/80 font-medium"
          >
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <CalendarPlus className="h-4 w-4 mr-1.5" />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
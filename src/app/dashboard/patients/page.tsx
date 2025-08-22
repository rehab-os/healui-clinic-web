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
  Shield
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'DISCHARGED'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-dark">Patients 👥</h1>
          <p className="text-text-gray mt-1 text-lg">
            Manage patient records and appointments
          </p>
        </div>
        <button
          onClick={handleAddPatient}
          className="btn-primary inline-flex items-center px-6 py-3"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or patient code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-3 py-2.5 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio transition-all duration-200 bg-white"
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary px-6 py-2.5"
              >
                Search
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCHARGED">Discharged</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-base hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-healui-physio/20 rounded-lg">
              <Users className="h-6 w-6 text-healui-physio" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-light">Total Patients</p>
              <p className="text-2xl font-display font-bold text-text-dark">{patientsData.total}</p>
            </div>
          </div>
        </div>

        <div className="card-base hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-healui-physio/20 rounded-lg">
              <Activity className="h-6 w-6 text-healui-physio" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-light">Active Patients</p>
              <p className="text-2xl font-display font-bold text-text-dark">
                {patientsData.patients.filter(p => p.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-base hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-healui-primary/20 rounded-lg">
              <Calendar className="h-6 w-6 text-healui-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-light">Today's Visits</p>
              <p className="text-2xl font-display font-bold text-text-dark">0</p>
            </div>
          </div>
        </div>

        <div className="card-base hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-healui-secondary/20 rounded-lg">
              <FileCheck className="h-6 w-6 text-healui-secondary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-light">Pending Notes</p>
              <p className="text-2xl font-display font-bold text-text-dark">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healui-physio"></div>
        </div>
      ) : patientsData.patients.length === 0 ? (
        <div className="card-base text-center">
          <UserPlus className="h-16 w-16 text-healui-physio/50 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-text-dark mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No patients found' : 'No patients yet'}
          </h3>
          <p className="text-text-gray mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters' 
              : 'Get started by adding your first patient'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleAddPatient}
              className="btn-primary inline-flex items-center px-6 py-3"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Patient
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
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

          {/* Pagination */}
          {patientsData.total > limit && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(patientsData.total / limit)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(patientsData.total / limit)}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

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
        return 'bg-healui-physio/20 text-healui-physio border-healui-physio/30 border';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200 border';
      case 'DISCHARGED':
        return 'bg-healui-primary/20 text-healui-primary border-healui-primary/30 border';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 border';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="card-base hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="h-12 w-12 rounded-full bg-gradient-physio flex items-center justify-center text-white font-semibold shadow-sm">
              {patient.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-display font-semibold text-text-dark truncate">{patient.full_name}</h3>
                <span className="text-sm text-text-light font-medium">({patient.patient_code})</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-text-gray">
                <span className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {patient.phone}
                </span>
                {patient.email && (
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {patient.email}
                  </span>
                )}
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {calculateAge(patient.date_of_birth)} years, {patient.gender}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onView}
              className="p-2 text-text-gray hover:text-text-dark transition-colors"
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
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2">
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Patient
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 mr-2" />
                      View History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-physio flex items-center justify-center text-white font-semibold shadow-sm">
            {patient.full_name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
            {patient.status}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-display font-semibold text-text-dark mb-1">{patient.full_name}</h3>
          <p className="text-sm text-text-light font-medium">{patient.patient_code}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-text-gray">
            <Phone className="h-4 w-4 mr-2 text-text-light" />
            <span>{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center text-sm text-text-gray">
              <Mail className="h-4 w-4 mr-2 text-text-light" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-text-gray">
            <Clock className="h-4 w-4 mr-2 text-text-light" />
            <span>{calculateAge(patient.date_of_birth)} years, {patient.gender}</span>
          </div>
          {patient.address && (
            <div className="flex items-center text-sm text-text-gray">
              <MapPin className="h-4 w-4 mr-2 text-text-light" />
              <span className="truncate">{patient.address}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-color">
          <button
            onClick={onView}
            className="text-sm text-healui-physio hover:text-healui-primary font-medium"
          >
            View Details
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSchedule}
              className="p-2 text-healui-physio hover:text-healui-primary transition-colors"
              title="Schedule Visit"
            >
              <CalendarPlus className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 bottom-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2">
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Patient
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 mr-2" />
                      View History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
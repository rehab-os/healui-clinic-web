'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AddPatientModal from '../../../components/molecule/AddPatientModal';
import QuickIntakeModal from '../../../components/molecule/QuickIntakeModal';
import EnhancedPatientDetailsModal from '../../../components/molecule/EnhancedPatientDetailsModal';
import ScheduleVisitModal from '../../../components/molecule/ScheduleVisitModal';
import ClinicalAssessmentModal from '../../../components/molecule/ClinicalAssessmentModal';
import PatientBillingModal from '../../../components/molecule/PatientBillingModal';
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
  XCircle,
  Stethoscope,
  IndianRupee,
  Package
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
  intake_status: string;
  basic_intake_completed_at?: Date;
  basic_intake_completed_by?: string;
  clinical_assessment_completed_at?: Date;
  clinical_assessment_completed_by?: string;
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
  const [showQuickIntakeModal, setShowQuickIntakeModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
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

  const handleClinicalAssessment = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowAssessmentModal(true);
  };

  const handleBilling = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowBillingModal(true);
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
      {/* Compact Header with Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-2.5">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal focus:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                    fetchPatients();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Patient Count */}
            <span className="text-sm text-gray-500 hidden sm:block">{patientsData.total} patients</span>

            {/* Filters */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value="all">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCHARGED">Discharged</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowQuickIntakeModal(true)}
                className="bg-[#1e5f79] text-white inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
              >
                <UserPlus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Quick Intake</span>
              </button>

              <button
                onClick={handleAddPatient}
                className="bg-white text-gray-700 border border-gray-200 inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Full Registration</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

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
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      onClinicalAssessment={() => handleClinicalAssessment(patient)}
                      onBilling={() => handleBilling(patient)}
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
                onClinicalAssessment={() => handleClinicalAssessment(patient)}
                onBilling={() => handleBilling(patient)}
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
      </div>

      {/* Modals */}
      {showQuickIntakeModal && (
        <QuickIntakeModal
          onClose={() => setShowQuickIntakeModal(false)}
          onSuccess={() => {
            setShowQuickIntakeModal(false);
            fetchPatients();
          }}
        />
      )}

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
          onClinicalAssessment={() => {
            setShowDetailsModal(false);
            setShowAssessmentModal(true);
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

      {showAssessmentModal && selectedPatient && (
        <ClinicalAssessmentModal
          patient={selectedPatient}
          onClose={() => {
            setShowAssessmentModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            setShowAssessmentModal(false);
            setSelectedPatient(null);
            fetchPatients();
          }}
        />
      )}

      {showBillingModal && selectedPatient && currentClinic && (
        <PatientBillingModal
          patientId={selectedPatient.id}
          patientName={selectedPatient.full_name}
          clinicId={currentClinic.id}
          onClose={() => {
            setShowBillingModal(false);
            setSelectedPatient(null);
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
  onClinicalAssessment: () => void;
  onBilling: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, viewMode, onView, onSchedule, onClinicalAssessment, onBilling }) => {

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

  const getIntakeStatusInfo = (intakeStatus: string) => {
    switch (intakeStatus) {
      case 'CLINICAL_ASSESSMENT_COMPLETE':
        return {
          label: 'Ready for Treatment',
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'BASIC_INTAKE_COMPLETE':
        return {
          label: 'Assessment Pending',
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: <Clock className="h-3 w-3" />
        };
      case 'BASIC_INTAKE_PENDING':
        return {
          label: 'Intake Pending',
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
      default:
        return {
          label: 'Pending Setup',
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <Clock className="h-3 w-3" />
        };
    }
  };

  if (viewMode === 'list') {
    return (
      <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onView}>
        {/* Patient - Name + Age/Gender */}
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal font-semibold text-sm flex-shrink-0">
              {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {patient.full_name}
              </div>
              <div className="text-xs text-gray-500">
                {calculateAge(patient.date_of_birth)}y · {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'} · <span className="font-mono">{patient.patient_code}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-2.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            patient.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            patient.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600' :
            'bg-blue-100 text-blue-700'
          }`}>
            {patient.status}
          </span>
        </td>

        {/* Billing */}
        <td className="px-4 py-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBilling();
            }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 rounded text-xs font-medium text-purple-600 transition-colors"
          >
            <Package className="h-3.5 w-3.5" />
            Billing
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-brand-teal hover:bg-brand-teal/10 rounded transition-colors"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClinicalAssessment();
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <Stethoscope className="h-3.5 w-3.5 mr-1" />
              History
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSchedule();
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1" />
              Schedule
            </button>
          </div>
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
        {/* Header with Avatar and Name */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#1e5f79] to-[#2a7a9b] flex items-center justify-center text-white font-bold text-lg">
              {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {patient.full_name}
              </h3>
              <p className="text-sm text-gray-500">
                {calculateAge(patient.date_of_birth)} years • {patient.gender}
              </p>
            </div>
          </div>
        </div>

        {/* Intake Status */}
        <div className="mb-4">
          {(() => {
            const statusInfo = getIntakeStatusInfo(patient.intake_status);
            return (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                {statusInfo.icon}
                <span className="ml-2">{statusInfo.label}</span>
              </span>
            );
          })()}
        </div>

        {/* Patient Code */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-1">Patient ID</div>
          <div className="text-sm font-mono text-gray-900">{patient.patient_code}</div>
        </div>

        {/* Billing Quick Access */}
        <div
          className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onBilling();
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Billing & Packages</span>
            </div>
            <span className="text-xs text-purple-600 font-medium">
              Open →
            </span>
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
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClinicalAssessment();
              }}
              className="inline-flex items-center px-3 py-1.5 border border-[#1e5f79] rounded-md text-sm font-medium text-[#1e5f79] bg-white hover:bg-[#1e5f79]/5"
            >
              <Stethoscope className="h-4 w-4 mr-1.5" />
              History
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
    </div>
  );
}
"use client";

import ApiManager from "@/services/api/api.service";
import {
 AlertCircle,
 CalendarPlus,
 ChevronLeft,
 ChevronRight,
 Crosshair,
 Eye,
 FileText,
 IndianRupee,
 Loader2,
 MoreVertical,
 Plus,
 Search,
 Shield,
 Stethoscope,
 UserPlus,
 Users,
 XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ScheduleVisitModal from "../../../components/features/appointments/ScheduleVisitModal";
import ClinicalAssessmentModal from "../../../components/features/assessments/ClinicalAssessmentModal";
import PatientBillingModal from "../../../components/features/billing/PatientBillingModal";
import AddConditionWorkflow from "../../../components/features/conditions/AddConditionWorkflow";
import AddPatientModal from "../../../components/features/patients/AddPatientModal";
import EnhancedPatientDetailsModal from "../../../components/features/patients/EnhancedPatientDetailsModal";
import QuickIntakeModal from "../../../components/features/shared/QuickIntakeModal";
import { useAppSelector } from "../../../store/hooks";

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
 const router = useRouter();
 const { userData, currentClinic } = useAppSelector((state) => state.user);
 const [patientsData, setPatientsData] = useState<PatientsData>({
  patients: [],
  total: 0,
 });
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState<
  "all" | "ACTIVE" | "INACTIVE" | "DISCHARGED"
 >("all");
 const [showAddModal, setShowAddModal] = useState(false);
 const [showQuickIntakeModal, setShowQuickIntakeModal] = useState(false);
 const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
 const [showDetailsModal, setShowDetailsModal] = useState(false);
 const [showScheduleModal, setShowScheduleModal] = useState(false);
 const [showAssessmentModal, setShowAssessmentModal] = useState(false);
 const [showBillingModal, setShowBillingModal] = useState(false);
 const [showDxModal, setShowDxModal] = useState(false);
 const [page, setPage] = useState(1);
 const [showMobileSearch, setShowMobileSearch] = useState(false);
 const [showAddMenu, setShowAddMenu] = useState(false);
 const limit = 15;

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
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(searchTerm && { search: searchTerm }),
    page,
    limit,
   };

   const response = await ApiManager.getPatients(params);
   if (response.success) {
    setPatientsData(response.data || { patients: [], total: 0 });
   }
  } catch (error) {
   console.error("Failed to fetch patients:", error);
  } finally {
   setLoading(false);
  }
 };

 const handleSearch = () => {
  setPage(1);
  fetchPatients();
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

 const handleDx = (patient: Patient) => {
  setSelectedPatient(patient);
  setShowDxModal(true);
 };

 const totalPages = Math.ceil(patientsData.total / limit);

 // Access control
 if (
  currentClinic &&
  !currentClinic.is_admin &&
  currentClinic.role !== "receptionist" &&
  currentClinic.role !== "manager"
 ) {
  return (
   <div className='min-h-screen bg-gradient-to-b from-brand-teal/[0.04] to-white flex items-center justify-center p-4'>
    <div className='bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 max-w-md'>
     <div className='w-16 h-16 rounded-2xl bg-brand-teal/10 flex items-center justify-center mx-auto mb-5'>
      <Shield className='h-8 w-8 text-brand-teal' />
     </div>
     <h2 className='text-xl font-semibold text-gray-900 mb-2'>Access Denied</h2>
     <p className='text-gray-500 text-sm leading-relaxed'>
      Only receptionists, managers, and clinic administrators can manage
      patients.
     </p>
    </div>
   </div>
  );
 }

 if (!currentClinic) {
  return (
   <div className='min-h-screen bg-gradient-to-b from-brand-teal/[0.04] to-white flex items-center justify-center p-4'>
    <div className='bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 max-w-md'>
     <div className='w-16 h-16 rounded-2xl bg-brand-teal/10 flex items-center justify-center mx-auto mb-5'>
      <AlertCircle className='h-8 w-8 text-brand-teal' />
     </div>
     <h2 className='text-xl font-semibold text-gray-900 mb-2'>
      No Clinic Selected
     </h2>
     <p className='text-gray-500 text-sm leading-relaxed'>
      Please select a clinic from the header to manage patients.
     </p>
    </div>
   </div>
  );
 }

 return (
  <div className='min-h-screen bg-gradient-to-b from-brand-teal/[0.04] to-gray-50/80'>
   {/* ── Header bar ── */}
   <div className='bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30'>
    {/* Mobile header */}
    <div className='sm:hidden px-4 py-3 flex items-center justify-between'>
     <div className='flex items-center gap-2.5'>
      <div className='w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center'>
       <Users className='h-4 w-4 text-brand-teal' />
      </div>
      <div>
       <h1 className='text-base font-semibold text-gray-900 leading-none'>
        Patients
       </h1>
       {!loading && patientsData.total > 0 && (
        <span className='text-[11px] text-gray-400 mt-0.5 block'>
         {patientsData.total} registered
        </span>
       )}
      </div>
     </div>
     <div className='flex items-center gap-0.5'>
      <button
       onClick={() => {
        setShowMobileSearch(!showMobileSearch);
        setShowAddMenu(false);
       }}
       className={`p-2 rounded-xl transition-all duration-200 ${showMobileSearch ? "bg-brand-teal/10 text-brand-teal" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
      >
       <Search className='h-5 w-5' />
      </button>
      <button
       onClick={() => {
        setShowAddMenu(!showAddMenu);
        setShowMobileSearch(false);
       }}
       className='p-2 text-brand-teal hover:bg-brand-teal/10 rounded-xl transition-all duration-200'
      >
       <Plus className='h-5 w-5' />
      </button>
     </div>
    </div>

    {/* Mobile: expandable search + filter */}
    {showMobileSearch && (
     <div className='sm:hidden px-4 pb-3 space-y-2 border-t border-gray-100/60'>
      <div className='relative mt-2'>
       <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
       <input
        type='text'
        placeholder='Search by name or phone...'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        className='w-full pl-9 pr-8 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal focus:bg-white transition-all duration-200'
        autoFocus
       />
       {searchTerm && (
        <button
         onClick={() => {
          setSearchTerm("");
          setPage(1);
          fetchPatients();
         }}
         className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
        >
         <XCircle className='h-4 w-4' />
        </button>
       )}
      </div>
      <select
       value={statusFilter}
       onChange={(e) => {
        setStatusFilter(e.target.value as any);
        setPage(1);
       }}
       className='w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 appearance-none'
      >
       <option value='all'>All Patients</option>
       <option value='ACTIVE'>Active</option>
       <option value='INACTIVE'>Inactive</option>
       <option value='DISCHARGED'>Discharged</option>
      </select>
     </div>
    )}

    {/* Mobile: add menu dropdown */}
    {showAddMenu && (
     <div className='sm:hidden px-4 pb-3 border-t border-gray-100/60'>
      <div className='mt-2 space-y-0.5'>
       <button
        onClick={() => {
         setShowAddMenu(false);
         setShowQuickIntakeModal(true);
        }}
        className='w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-800 hover:bg-brand-teal/[0.06] rounded-xl transition-colors'
       >
        <div className='w-7 h-7 rounded-lg bg-brand-teal/10 flex items-center justify-center flex-shrink-0'>
         <UserPlus className='h-3.5 w-3.5 text-brand-teal' />
        </div>
        Quick Intake
       </button>
       <button
        onClick={() => {
         setShowAddMenu(false);
         setShowAddModal(true);
        }}
        className='w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-xl transition-colors'
       >
        <div className='w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0'>
         <FileText className='h-3.5 w-3.5 text-gray-500' />
        </div>
        Full Registration
       </button>
      </div>
     </div>
    )}

    {/* Desktop header */}
    <div className='hidden sm:block'>
     <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='flex items-center gap-3 py-3'>
       {/* Title cluster */}
       <div className='flex items-center gap-3 mr-4'>
        <div className='w-9 h-9 rounded-xl bg-brand-teal/10 flex items-center justify-center'>
         <Users className='h-[18px] w-[18px] text-brand-teal' />
        </div>
        <div>
         <h1 className='text-lg font-semibold text-gray-900 leading-none'>
          Patients
         </h1>
         {!loading && patientsData.total > 0 && (
          <span className='text-xs text-gray-400 mt-0.5 block'>
           {patientsData.total} registered
          </span>
         )}
        </div>
       </div>

       {/* Search */}
       <div className='relative flex-1 max-w-sm'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        <input
         type='text'
         placeholder='Search by name or phone...'
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         onKeyPress={(e) => e.key === "Enter" && handleSearch()}
         className='w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal focus:bg-white transition-all duration-200'
        />
        {searchTerm && (
         <button
          onClick={() => {
           setSearchTerm("");
           setPage(1);
           fetchPatients();
          }}
          className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
         >
          <XCircle className='h-4 w-4' />
         </button>
        )}
       </div>

       {/* Filter pills */}
       <div className='flex items-center gap-1.5'>
        {(["all", "ACTIVE", "INACTIVE", "DISCHARGED"] as const).map(
         (filter) => (
          <button
           key={filter}
           onClick={() => {
            setStatusFilter(filter);
            setPage(1);
           }}
           className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            statusFilter === filter
             ? "bg-brand-teal text-white shadow-sm"
             : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
           }`}
          >
           {filter === "all"
            ? "All"
            : filter.charAt(0) + filter.slice(1).toLowerCase()}
          </button>
         ),
        )}
       </div>

       {/* Action buttons */}
       <div className='flex items-center gap-2 ml-auto'>
        <button
         onClick={() => setShowQuickIntakeModal(true)}
         className='bg-brand-teal text-white inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl hover:bg-teal-700 transition-all duration-200 shadow-sm shadow-brand-teal/20 hover:shadow-md hover:shadow-brand-teal/25'
        >
         <UserPlus className='h-4 w-4 mr-1.5' />
         Quick Intake
        </button>
        <button
         onClick={() => setShowAddModal(true)}
         className='bg-white text-gray-600 border border-gray-200 inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200'
        >
         <FileText className='h-4 w-4 mr-1.5' />
         Full Registration
        </button>
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* ── Content ── */}
   <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5'>
    {loading ? (
     <div className='bg-white rounded-2xl p-12 shadow-sm border border-gray-100'>
      <div className='flex flex-col items-center justify-center'>
       <div className='w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center mb-4'>
        <Loader2 className='h-6 w-6 animate-spin text-brand-teal' />
       </div>
       <span className='text-sm text-gray-500'>Loading patients...</span>
      </div>
     </div>
    ) : patientsData.patients.length === 0 ? (
     <div className='bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100'>
      <div className='w-16 h-16 rounded-2xl bg-brand-teal/10 flex items-center justify-center mx-auto mb-5'>
       <UserPlus className='h-8 w-8 text-brand-teal' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
       {searchTerm || statusFilter !== "all"
        ? "No patients found"
        : "No patients yet"}
      </h3>
      <p className='text-gray-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed'>
       {searchTerm || statusFilter !== "all"
        ? "Try adjusting your search terms or filters"
        : "Get started by registering your first patient to this clinic"}
      </p>
      {!searchTerm && statusFilter === "all" && (
       <button
        onClick={() => setShowAddModal(true)}
        className='bg-brand-teal text-white inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl hover:bg-teal-700 transition-all duration-200 shadow-sm shadow-brand-teal/20'
       >
        <UserPlus className='h-4 w-4 mr-2' />
        Add Your First Patient
       </button>
      )}
     </div>
    ) : (
     <div className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100'>
      <div className='overflow-x-auto'>
       <table className='min-w-full'>
        <thead>
         <tr className='border-b border-gray-100'>
          <th className='px-5 py-3 text-left text-[11px] font-semibold text-brand-teal/60 uppercase tracking-wider'>
           Patient
          </th>
          <th className='px-5 py-3 text-left text-[11px] font-semibold text-brand-teal/60 uppercase tracking-wider hidden sm:table-cell'>
           Contact
          </th>
          <th className='px-5 py-3 text-left text-[11px] font-semibold text-brand-teal/60 uppercase tracking-wider hidden md:table-cell'>
           Status
          </th>
          <th className='w-12 px-3 py-3'></th>
         </tr>
        </thead>
        <tbody>
         {patientsData.patients.map((patient, idx) => (
          <PatientRow
           key={patient.id}
           patient={patient}
           isLast={idx === patientsData.patients.length - 1}
           onView={() => handleViewPatient(patient)}
           onSchedule={() => handleScheduleVisit(patient)}
           onClinicalAssessment={() => handleClinicalAssessment(patient)}
           onBilling={() => handleBilling(patient)}
           onDx={() => handleDx(patient)}
          />
         ))}
        </tbody>
       </table>
      </div>

      {/* Pagination — inside the card */}
      {patientsData.total > limit && (
       <div className='flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40'>
        <span className='text-xs text-gray-400'>
         {(page - 1) * limit + 1}–{Math.min(page * limit, patientsData.total)}{" "}
         of {patientsData.total}
        </span>
        <div className='flex items-center gap-1'>
         <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className='p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all'
         >
          <ChevronLeft className='h-4 w-4' />
         </button>
         <span className='text-xs font-medium text-gray-600 px-2'>
          {page} / {totalPages}
         </span>
         <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages}
          className='p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all'
         >
          <ChevronRight className='h-4 w-4' />
         </button>
        </div>
       </div>
      )}
     </div>
    )}
   </div>

   {/* ── Modals ── */}
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
      fetchPatients();
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

   <AddConditionWorkflow
    isOpen={showDxModal}
    onClose={() => {
     setShowDxModal(false);
     setSelectedPatient(null);
    }}
    patientId={selectedPatient?.id || ""}
    patientName={selectedPatient?.full_name}
    onComplete={(result) => {
     console.log("Dx completed:", result);
     setShowDxModal(false);
     setSelectedPatient(null);
     fetchPatients();
    }}
   />
  </div>
 );
}

/* ─────────────────────────────────────────────────────
   Patient Row
   ───────────────────────────────────────────────────── */

interface PatientRowProps {
 patient: Patient;
 isLast: boolean;
 onView: () => void;
 onSchedule: () => void;
 onClinicalAssessment: () => void;
 onBilling: () => void;
 onDx: () => void;
}

const PatientRow: React.FC<PatientRowProps> = ({
 patient,
 isLast,
 onView,
 onSchedule,
 onClinicalAssessment,
 onBilling,
 onDx,
}) => {
 const [showMenu, setShowMenu] = useState(false);
 const menuRef = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
  if (!showMenu) return;
  const handleClick = (e: MouseEvent) => {
   if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
    setShowMenu(false);
   }
  };
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
 }, [showMenu]);

 const calculateAge = (dob: Date) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
   monthDiff < 0 ||
   (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
   age--;
  }
  return age;
 };

 const getIntakeStatusInfo = (intakeStatus: string) => {
  switch (intakeStatus) {
   case "CLINICAL_ASSESSMENT_COMPLETE":
    return {
     label: "Ready",
     dotColor: "bg-emerald-400",
     textColor: "text-emerald-700",
     bgColor: "bg-emerald-50",
    };
   case "BASIC_INTAKE_COMPLETE":
    return {
     label: "Assessment Pending",
     dotColor: "bg-amber-400",
     textColor: "text-amber-700",
     bgColor: "bg-amber-50",
    };
   case "BASIC_INTAKE_PENDING":
    return {
     label: "Intake Pending",
     dotColor: "bg-orange-400",
     textColor: "text-orange-700",
     bgColor: "bg-orange-50",
    };
   default:
    return {
     label: "Pending",
     dotColor: "bg-gray-300",
     textColor: "text-gray-500",
     bgColor: "bg-gray-50",
    };
  }
 };

 const isInactive = patient.status === "INACTIVE";
 const isDischarged = patient.status === "DISCHARGED";
 const statusInfo = getIntakeStatusInfo(patient.intake_status);
 const age = calculateAge(patient.date_of_birth);
 const genderLabel =
  patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Other";
 const genderShort =
  patient.gender === "M" ? "M" : patient.gender === "F" ? "F" : "O";
 const initials = patient.full_name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

 return (
  <tr
   className={`group cursor-pointer transition-all duration-150 ${
    isInactive
     ? "opacity-40 hover:opacity-60"
     : isDischarged
       ? "hover:bg-brand-teal/[0.02]"
       : "hover:bg-brand-teal/[0.03]"
   } ${!isLast ? "border-b border-gray-50" : ""}`}
   onClick={onView}
  >
   {/* Patient — avatar + name + code */}
   <td className='px-5 py-3.5'>
    <div className='flex items-center gap-3'>
     <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm shadow-brand-teal/20'>
      {initials}
     </div>
     <div className='min-w-0'>
      <div className='flex items-center gap-2'>
       <span className='text-sm font-semibold text-gray-900 truncate group-hover:text-brand-teal transition-colors duration-150'>
        {patient.full_name}
       </span>
       <span className='text-[10px] text-gray-300 font-mono flex-shrink-0 hidden sm:inline tracking-wide'>
        {patient.patient_code}
       </span>
      </div>
      <div className='mt-0.5 flex items-center gap-1.5 text-xs text-gray-400'>
       <span>
        {age}y &middot; {genderShort}
       </span>
       <span className='sm:hidden text-gray-200'>&middot;</span>
       <span className='sm:hidden text-gray-500'>{patient.phone}</span>
      </div>
     </div>
    </div>
   </td>

   {/* Contact — hidden on mobile */}
   <td className='px-5 py-3.5 hidden sm:table-cell'>
    <span className='text-sm text-gray-600'>{patient.phone}</span>
    <span className='block text-xs text-gray-300 mt-0.5'>
     {genderLabel} &middot; {age} yrs
    </span>
   </td>

   {/* Status — hidden on mobile + tablet */}
   <td className='px-5 py-3.5 hidden md:table-cell'>
    <span
     className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg ${statusInfo.bgColor} ${statusInfo.textColor}`}
    >
     <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
     {statusInfo.label}
    </span>
   </td>

   {/* Actions */}
   <td className='px-3 py-3.5 text-right'>
    <div className='relative' ref={menuRef}>
     <button
      onClick={(e) => {
       e.stopPropagation();
       setShowMenu(!showMenu);
      }}
      className='p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100'
     >
      <MoreVertical className='h-4 w-4' />
     </button>
     {showMenu && (
      <>
       <div
        className='fixed inset-0 z-10'
        onClick={(e) => {
         e.stopPropagation();
         setShowMenu(false);
        }}
       />
       <div className='absolute right-0 top-8 w-52 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 z-20 overflow-hidden'>
        <div className='p-1.5'>
         <button
          onClick={(e) => {
           e.stopPropagation();
           setShowMenu(false);
           onView();
          }}
          className='w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors'
         >
          <Eye className='h-4 w-4 text-gray-400' />
          View Profile
         </button>
         <button
          onClick={(e) => {
           e.stopPropagation();
           setShowMenu(false);
           onDx();
          }}
          className='w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors'
         >
          <Crosshair className='h-4 w-4 text-brand-teal' />
          Start Assessment
         </button>
         <button
          onClick={(e) => {
           e.stopPropagation();
           setShowMenu(false);
           onSchedule();
          }}
          className='w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors'
         >
          <CalendarPlus className='h-4 w-4 text-gray-400' />
          Schedule Visit
         </button>
         <button
          onClick={(e) => {
           e.stopPropagation();
           setShowMenu(false);
           onBilling();
          }}
          className='w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors'
         >
          <IndianRupee className='h-4 w-4 text-gray-400' />
          Billing
         </button>
         <button
          onClick={(e) => {
           e.stopPropagation();
           setShowMenu(false);
           onClinicalAssessment();
          }}
          className='w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-brand-teal/[0.05] rounded-lg transition-colors'
         >
          <Stethoscope className='h-4 w-4 text-gray-400' />
          Clinical Intake
         </button>
        </div>
       </div>
      </>
     )}
    </div>
   </td>
  </tr>
 );
};

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '../../../../../store/hooks';
import ApiManager from '../../../../../services/api';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, MapPin, Heart, Shield, 
  FileText, Clock, Activity, AlertCircle, Plus, Save, Edit3, 
  CheckCircle, Stethoscope, Pill, Brain, Target, ClipboardList,
  CalendarPlus, Eye, Edit, Trash2, Sparkles, Video, MoreVertical, PenTool, Info, XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SmartNoteInput from '../../../../../components/notes/SmartNoteInput';
import NutritionSuggestions from '../../../../../components/nutrition/NutritionSuggestions';
import TreatmentProtocolModal from '../../../../../components/molecule/TreatmentProtocolModal';
import {
  SlidePopup,
  SlidePopupContent,
  SlidePopupHeader,
  SlidePopupTitle,
  SlidePopupDescription,
  SlidePopupBody,
  SlidePopupFooter,
  SlidePopupClose
} from '../../../../../components/ui/slide-popup';

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string[];
  current_medications?: string[];
  insurance_provider?: string;
  insurance_policy_number?: string;
  status: string;
  created_at: string;
}

interface Visit {
  id: string;
  patient_id: string;
  visit_type: string;
  visit_mode: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  chief_complaint?: string;
  duration_minutes: number;
  physiotherapist: {
    id: string;
    full_name: string;
  };
  note?: Note;
}

interface Note {
  id: string;
  note_type: 'SOAP' | 'DAP' | 'PROGRESS';
  note_data: any;
  additional_notes?: string;
  treatment_codes?: string[];
  treatment_details?: {
    modalities?: string[];
    exercises?: string[];
    manual_therapy?: string[];
    education?: string[];
  };
  goals?: {
    short_term?: string[];
    long_term?: string[];
  };
  is_signed: boolean;
  signed_by?: string;
  signed_at?: string;
  created_at: string;
}

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentClinic, userData } = useAppSelector(state => state.user);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Visit | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'with_notes' | 'without_notes'>('all');
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [showSmartNotePopup, setShowSmartNotePopup] = useState(false);
  const [showManualNotePopup, setShowManualNotePopup] = useState(false);
  const [showTreatmentProtocol, setShowTreatmentProtocol] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showVisitNotes, setShowVisitNotes] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteType, setNoteType] = useState<'SOAP' | 'DAP' | 'PROGRESS'>('SOAP');
  const [noteData, setNoteData] = useState({
    soap: { subjective: '', objective: '', assessment: '', plan: '' },
    dap: { data: '', assessment: '', plan: '' },
    progress: { progress: '', interventions: '', response: '', plan: '' }
  });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [nutritionData, setNutritionData] = useState<any>(null);

  useEffect(() => {
    if (params.patientId && params.appointmentId && currentClinic?.id) {
      fetchPatientData();
      fetchAppointmentData();
      fetchPatientVisits();
    }
  }, [params.patientId, params.appointmentId, currentClinic?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  const fetchPatientData = async () => {
    try {
      const response = await ApiManager.getPatient(params.patientId as string);
      if (response.success && response.data) {
        setPatient(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient:', error);
    }
  };

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getVisit(params.appointmentId as string);
      if (response.success && response.data) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientVisits = async () => {
    try {
      setTimelineLoading(true);
      const response = await ApiManager.getPatientVisits(params.patientId as string, { 
        limit: 100 
      });
      if (response.success && response.data) {
        setPatientVisits(response.data.visits || []);
      }
    } catch (error) {
      console.error('Failed to fetch patient visits:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleCreateNote = async () => {
    const visitForNote = selectedVisit || appointment;
    if (!visitForNote) {
      alert('No appointment selected');
      return;
    }

    const currentNoteData = noteType === 'SOAP' ? noteData.soap : 
                           noteType === 'DAP' ? noteData.dap : 
                           noteData.progress;
    
    const hasContent = Object.values(currentNoteData).some(value => value.trim() !== '');
    
    if (!hasContent && !additionalNotes.trim()) {
      alert('Please provide some note content before saving');
      return;
    }

    try {
      setIsCreatingNote(true);
      const notePayload = {
        visit_id: visitForNote.id,
        note_type: noteType,
        note_data: currentNoteData,
        additional_notes: additionalNotes,
        treatment_codes: [],
        treatment_details: {
          modalities: [],
          exercises: [],
          manual_therapy: [],
          education: []
        },
        goals: {
          short_term: [],
          long_term: []
        }
      };

      console.log('Creating note with payload:', notePayload);
      const response = await ApiManager.createNote(notePayload);
      
      if (response.success) {
        alert('Note saved successfully!');
        await fetchAppointmentData();
        await fetchPatientVisits(); // Refresh the timeline
        resetNoteForm();
        setShowManualNotePopup(false);
        setSelectedVisit(null);
      } else {
        console.error('Failed to create note:', response);
        alert('Failed to save note. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to save note. Please check your connection and try again.');
    } finally {
      setIsCreatingNote(false);
    }
  };

  const resetNoteForm = () => {
    setNoteData({
      soap: { subjective: '', objective: '', assessment: '', plan: '' },
      dap: { data: '', assessment: '', plan: '' },
      progress: { progress: '', interventions: '', response: '', plan: '' }
    });
    setAdditionalNotes('');
  };

  const handleJoinVideoCall = (visitId: string) => {
    router.push(`/dashboard/video-call/${visitId}`);
  };

  const calculateAge = (dob: string) => {
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
      case 'SCHEDULED':
        return 'bg-healui-primary/20 text-healui-primary border-healui-primary/30';
      case 'IN_PROGRESS':
        return 'bg-healui-secondary/20 text-healui-secondary border-healui-secondary/30';
      case 'COMPLETED':
        return 'bg-healui-physio/20 text-healui-physio border-healui-physio/30';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatVisitType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const renderNoteContent = (note: Note) => {
    if (note.note_type === 'SOAP') {
      const data = note.note_data as any;
      return (
        <div className="space-y-2">
          {data.subjective && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">S</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.subjective}</p>
            </div>
          )}
          {data.objective && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">O</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.objective}</p>
            </div>
          )}
          {data.assessment && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">A</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.assessment}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">P</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.plan}</p>
            </div>
          )}
        </div>
      );
    } else if (note.note_type === 'DAP') {
      const data = note.note_data as any;
      return (
        <div className="space-y-2">
          {data.data && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">D</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.data}</p>
            </div>
          )}
          {data.assessment && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">A</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.assessment}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">P</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.plan}</p>
            </div>
          )}
        </div>
      );
    } else if (note.note_type === 'PROGRESS') {
      const data = note.note_data as any;
      return (
        <div className="space-y-2">
          {data.progress && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Progress</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.progress}</p>
            </div>
          )}
          {data.interventions && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Interventions</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.interventions}</p>
            </div>
          )}
          {data.response && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Response</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.response}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Plan</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.plan}</p>
            </div>
          )}
        </div>
      );
    }
    return <p className="text-xs text-gray-600">Note content available</p>;
  };

  // Filter visits based on timeline filter
  const getFilteredVisits = () => {
    switch (timelineFilter) {
      case 'with_notes':
        return patientVisits.filter(visit => visit.note);
      case 'without_notes':
        return patientVisits.filter(visit => !visit.note);
      default:
        return patientVisits;
    }
  };

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-healui-primary/20 text-healui-primary';
      case 'IN_PROGRESS':
        return 'bg-healui-secondary/20 text-healui-secondary';
      case 'COMPLETED':
        return 'bg-healui-physio/20 text-healui-physio';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !patient || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healui-physio mx-auto"></div>
          <p className="mt-4 text-text-gray font-medium">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Concise Professional Header - iPad Responsive */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Back Button + Patient Info */}
            <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                    {patient.full_name}
                  </h1>
                  <span className="hidden md:inline text-sm text-gray-500">
                    • {calculateAge(patient.date_of_birth)}y {patient.gender}
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 text-xs md:text-sm text-gray-600 mt-0.5">
                  <span className="inline-flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(parseISO(appointment.scheduled_date), 'MMM dd, yyyy')}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline-flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {appointment.scheduled_time}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline-flex items-center">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    Dr. {appointment.physiotherapist.full_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section - Status + Actions */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Visit Mode */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                appointment.visit_mode === 'ONLINE' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {appointment.visit_mode === 'ONLINE' ? (
                  <><Video className="h-3 w-3 mr-0.5" /><span className="hidden sm:inline">Virtual</span></>
                ) : (
                  <><User className="h-3 w-3 mr-0.5" /><span className="hidden sm:inline">Walk-in</span></>
                )}
              </span>
              
              {/* Visit Type - Hidden on mobile */}
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-healui-physio/10 text-healui-physio">
                {formatVisitType(appointment.visit_type)}
              </span>
              
              {/* Status */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                {appointment.status.replace('_', ' ').toLowerCase()}
              </span>
              
              {/* Note Indicator */}
              {appointment.note && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700" title="Has note">
                  <FileText className="h-3 w-3" />
                </span>
              )}
              
              {/* Contact Info Button */}
              <button
                onClick={() => setShowContactDetails(true)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="View Contact Details"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Chief Complaint - Full width below */}
          {appointment.chief_complaint && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-start space-x-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Chief Complaint:</span>
                <p className="text-sm md:text-base text-gray-800 flex-1">{appointment.chief_complaint}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Menu - Mobile optimized */}
      <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-30">
        <div className="flex flex-col space-y-3 items-end">
          {appointment.status === 'SCHEDULED' && appointment.visit_mode === 'ONLINE' && (
            <button
              onClick={() => handleJoinVideoCall(appointment.id)}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Video className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-2">Join Call</span>
            </button>
          )}
          
          <div className="flex flex-row space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowTreatmentProtocol(true)}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-white text-gray-700 text-xs sm:text-sm font-medium rounded-full hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
            >
              <Target className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-2">Protocol</span>
            </button>
            
            {!appointment.note && (
              <>
                <button
                  onClick={() => setShowSmartNotePopup(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-white text-gray-700 text-xs sm:text-sm font-medium rounded-full hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
                >
                  <Sparkles className="h-4 w-4 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">AI Note</span>
                </button>
                <button
                  onClick={() => setShowManualNotePopup(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-healui-physio text-white text-xs sm:text-sm font-medium rounded-full hover:bg-healui-primary transition-all shadow-lg"
                >
                  <PenTool className="h-4 w-4 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Add Note</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
          
          {/* Left Sidebar - Patient Details - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block lg:col-span-3">
            {/* Professional Medical Information */}
            <div className="bg-white border border-gray-200 rounded p-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-100">
                Medical Summary
              </h3>
              
              <div className="space-y-3">
                {/* Allergies */}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-800 mb-1">Allergies</h4>
                    <div className="text-xs text-gray-700 leading-relaxed">
                      {patient.allergies.slice(0, 3).join(', ')}
                      {patient.allergies.length > 3 && (
                        <span className="text-gray-500"> (+{patient.allergies.length - 3} more)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Medications */}
                {patient.current_medications && patient.current_medications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-800 mb-1">Current Medications</h4>
                    <div className="text-xs text-gray-700 leading-relaxed">
                      {patient.current_medications.slice(0, 3).join(', ')}
                      {patient.current_medications.length > 3 && (
                        <span className="text-gray-500"> (+{patient.current_medications.length - 3} more)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical History */}
                {patient.medical_history && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-800 mb-1">Medical History</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {patient.medical_history.length > 120 ? 
                        patient.medical_history.substring(0, 120) + '...' : 
                        patient.medical_history
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Nutrition & Diet Recommendations */}
            <div className="bg-white border border-gray-200 rounded p-3 mt-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-100">
                Nutrition & Diet Recommendations
              </h3>
              <NutritionSuggestions 
                patientData={{
                  age: calculateAge(patient.date_of_birth),
                  gender: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
                  allergies: patient.allergies,
                  currentMedications: patient.current_medications,
                  medicalHistory: patient.medical_history,
                  chiefComplaints: appointment.chief_complaint ? [appointment.chief_complaint] : [],
                  recentNotes: patientVisits
                    .filter(visit => visit.note)
                    .slice(0, 5)
                    .map(visit => JSON.stringify(visit.note?.note_data)),
                  visitHistory: patientVisits.slice(0, 10)
                }}
                className="nutrition-professional"
                onDataChange={setNutritionData}
              />
            </div>
          </div>

          {/* Main Content - Timeline */}
          <div className="lg:col-span-9">
            
            {/* Mobile Medical Summary */}
            <div className="lg:hidden bg-white border border-gray-200 rounded p-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Medical Summary
              </h3>
              
              <div className="space-y-2">
                {/* Allergies - Text format */}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-800 mb-1">Allergies</h4>
                    <div className="text-xs text-gray-700">
                      {patient.allergies.slice(0, 2).join(', ')}
                      {patient.allergies.length > 2 && (
                        <span className="text-gray-500"> (+{patient.allergies.length - 2} more)</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Medications - Text format */}
                {patient.current_medications && patient.current_medications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-800 mb-1">Current Medications</h4>
                    <div className="text-xs text-gray-700">
                      {patient.current_medications.slice(0, 2).join(', ')}
                      {patient.current_medications.length > 2 && (
                        <span className="text-gray-500"> (+{patient.current_medications.length - 2} more)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Nutrition Recommendations */}
            <div className="lg:hidden bg-white border border-gray-200 rounded p-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Nutrition Recommendations
              </h3>
              <NutritionSuggestions 
                patientData={{
                  age: calculateAge(patient.date_of_birth),
                  gender: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
                  allergies: patient.allergies,
                  currentMedications: patient.current_medications,
                  medicalHistory: patient.medical_history,
                  chiefComplaints: appointment.chief_complaint ? [appointment.chief_complaint] : [],
                  recentNotes: patientVisits
                    .filter(visit => visit.note)
                    .slice(0, 5)
                    .map(visit => JSON.stringify(visit.note?.note_data)),
                  visitHistory: patientVisits.slice(0, 10)
                }}
                className="nutrition-mobile"
                onDataChange={setNutritionData}
              />
            </div>

            {/* Patient Visit Timeline */}
            <div className="bg-white rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Visit Timeline</h3>
                  <p className="text-xs text-gray-500 mt-1">{getFilteredVisits().length} of {patientVisits.length} appointments</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Notes Toggle */}
                  <button
                    onClick={() => setShowVisitNotes(!showVisitNotes)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      showVisitNotes
                        ? 'bg-healui-physio text-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span className="hidden sm:inline">Show Notes</span>
                    <span className="sm:hidden">Notes</span>
                  </button>
                  
                  {/* Timeline Filters */}
                  <div className="flex bg-gray-50 rounded-lg p-0.5">
                    <button
                      onClick={() => setTimelineFilter('all')}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                        timelineFilter === 'all'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTimelineFilter('with_notes')}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                        timelineFilter === 'with_notes'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span className="hidden sm:inline">Documented</span>
                      <span className="sm:hidden">Noted</span>
                    </button>
                    <button
                      onClick={() => setTimelineFilter('without_notes')}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                        timelineFilter === 'without_notes'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pending
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Content */}
              <div className="space-y-1">
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healui-physio mr-3"></div>
                    <span className="text-gray-600">Loading timeline...</span>
                  </div>
                ) : getFilteredVisits().length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {timelineFilter === 'with_notes' && 'No visits with notes found'}
                      {timelineFilter === 'without_notes' && 'No visits without notes found'}
                      {timelineFilter === 'all' && 'No visits found'}
                    </p>
                  </div>
                ) : (
                  getFilteredVisits().map((visit) => (
                    <div 
                      key={visit.id} 
                      className={`border-l-2 transition-all duration-200 hover:bg-gray-50 ${
                        visit.id === appointment?.id
                          ? 'border-l-healui-primary bg-healui-primary/5'
                          : visit.visit_mode === 'ONLINE' 
                            ? 'border-l-blue-500'
                            : 'border-l-gray-300'
                      }`}
                    >
                      <div className="px-3 py-2 border-b border-gray-100">
                        {/* Mobile-responsive timeline card layout */}
                        <div className="space-y-1">
                          {/* First line - Date, time, and actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Date and time - prominent on first line */}
                              <div className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                                {format(parseISO(visit.scheduled_date), 'MMM dd')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {visit.scheduled_time}
                              </div>
                              
                              {/* Status and mode icons */}
                              <div className="flex items-center gap-1.5 ml-auto">
                                {visit.status === 'SCHEDULED' && <Clock className="h-4 w-4 text-blue-500" title="Scheduled" />}
                                {visit.status === 'IN_PROGRESS' && <Activity className="h-4 w-4 text-yellow-500 animate-pulse" title="In Progress" />}
                                {visit.status === 'COMPLETED' && <CheckCircle className="h-4 w-4 text-green-500" title="Completed" />}
                                {visit.status === 'CANCELLED' && <XCircle className="h-4 w-4 text-red-500" title="Cancelled" />}
                                {visit.status === 'NO_SHOW' && <AlertCircle className="h-4 w-4 text-gray-400" title="No Show" />}
                                {visit.visit_mode === 'ONLINE' && <Video className="h-4 w-4 text-blue-600" title="Virtual" />}
                                {visit.note && <FileText className="h-4 w-4 text-green-600" title={`${visit.note.note_type} note`} />}
                                {visit.id === appointment?.id && (
                                  <div className="h-1.5 w-1.5 bg-healui-primary rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === visit.id ? null : visit.id);
                                }}
                                className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {openDropdownId === visit.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                                  {visit.status === 'SCHEDULED' && visit.visit_mode === 'ONLINE' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinVideoCall(visit.id);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                      <Video className="h-4 w-4 mr-2" />
                                      Join Call
                                    </button>
                                  )}
                                  {!visit.note && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedVisit(visit);
                                          setShowSmartNotePopup(true);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                      >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Smart Note
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedVisit(visit);
                                          setShowManualNotePopup(true);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                      >
                                        <PenTool className="h-4 w-4 mr-2" />
                                        Manual Note
                                      </button>
                                    </>
                                  )}
                                  {visit.note && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Note
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Second line - Visit type and doctor */}
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{formatVisitType(visit.visit_type)}</span>
                              <span>•</span>
                              <span>Dr. {visit.physiotherapist.full_name}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expandable section - chief complaint and notes */}
                        {(visit.chief_complaint || (visit.note && showVisitNotes)) && (
                          <div className="mt-2">
                            {/* Chief complaint - always show if exists */}
                            {visit.chief_complaint && (
                              <div className="text-sm text-gray-600 mb-2">
                                {visit.chief_complaint}
                              </div>
                            )}
                            
                            {/* Clinical notes - only show if toggle is on */}
                            {visit.note && showVisitNotes && (
                              <div className="mt-2 p-3 bg-gray-50 rounded border-l-2 border-l-green-500">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-700 text-xs">Clinical Note ({visit.note.note_type})</h5>
                                  {visit.note.is_signed && (
                                    <div className="flex items-center text-xs text-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      <span>Signed</span>
                                    </div>
                                  )}
                                </div>
                                {renderNoteContent(visit.note)}
                                {visit.note.additional_notes && (
                                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                                    <h6 className="font-medium text-gray-700 text-xs mb-1">Additional Notes</h6>
                                    <p className="text-xs text-gray-600">{visit.note.additional_notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Smart Note Popup */}
            <SlidePopup open={showSmartNotePopup} onOpenChange={(open) => {
              setShowSmartNotePopup(open);
              if (!open) {
                setSelectedVisit(null);
                resetNoteForm();
              }
            }}>
              <SlidePopupContent 
                mobileTitle="Create Smart Note"
                mobileDescription="Choose your input method and let AI create structured clinical notes"
              >
                <SlidePopupBody>
                  {selectedVisit && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Selected Visit</h4>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            {formatVisitType(selectedVisit.visit_type)} on {format(parseISO(selectedVisit.scheduled_date), 'MMM dd, yyyy')} at {selectedVisit.scheduled_time}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <SmartNoteInput
                    visitId={selectedVisit?.id || appointment.id}
                    onNoteCreated={() => {
                      setShowSmartNotePopup(false);
                      setSelectedVisit(null);
                      fetchAppointmentData();
                      fetchPatientVisits();
                    }}
                    onCancel={() => {
                      setShowSmartNotePopup(false);
                      setSelectedVisit(null);
                      resetNoteForm();
                    }}
                  />
                </SlidePopupBody>
              </SlidePopupContent>
            </SlidePopup>

            {/* Manual Note Popup */}
            <SlidePopup open={showManualNotePopup} onOpenChange={(open) => {
              setShowManualNotePopup(open);
              if (!open) {
                setSelectedVisit(null);
                resetNoteForm();
              }
            }}>
              <SlidePopupContent mobileTitle="Create Manual Note">
                <SlidePopupBody>
                  {selectedVisit && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <PenTool className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-emerald-900 text-sm">Selected Visit</h4>
                          <p className="text-xs text-emerald-700">
                            {formatVisitType(selectedVisit.visit_type)} • {format(parseISO(selectedVisit.scheduled_date), 'MMM dd, yyyy')} • {selectedVisit.scheduled_time}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Note Type Selection */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['SOAP', 'DAP', 'PROGRESS'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNoteType(type)}
                          className={`p-2 border rounded-lg text-xs font-medium transition-colors ${
                            noteType === type
                              ? 'border-healui-physio bg-healui-physio/10 text-healui-physio'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="space-y-3">
                    {noteType === 'SOAP' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                          <textarea
                            value={noteData.soap.subjective}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              soap: { ...noteData.soap, subjective: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Patient's symptoms, pain levels..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                          <textarea
                            value={noteData.soap.objective}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              soap: { ...noteData.soap, objective: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Clinical findings, measurements..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                          <textarea
                            value={noteData.soap.assessment}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              soap: { ...noteData.soap, assessment: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Clinical judgment, diagnosis..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                          <textarea
                            value={noteData.soap.plan}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              soap: { ...noteData.soap, plan: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Treatment plan, next steps..."
                          />
                        </div>
                      </div>
                    )}

                    {noteType === 'DAP' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                          <textarea
                            value={noteData.dap.data}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              dap: { ...noteData.dap, data: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Objective data, measurements..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                          <textarea
                            value={noteData.dap.assessment}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              dap: { ...noteData.dap, assessment: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Clinical assessment..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                          <textarea
                            value={noteData.dap.plan}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              dap: { ...noteData.dap, plan: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Treatment plan..."
                          />
                        </div>
                      </div>
                    )}

                    {noteType === 'PROGRESS' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                          <textarea
                            value={noteData.progress.progress}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              progress: { ...noteData.progress, progress: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Patient's progress..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Interventions</label>
                          <textarea
                            value={noteData.progress.interventions}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              progress: { ...noteData.progress, interventions: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Treatments provided..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                          <textarea
                            value={noteData.progress.response}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              progress: { ...noteData.progress, response: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Patient's response..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                          <textarea
                            value={noteData.progress.plan}
                            onChange={(e) => setNoteData({
                              ...noteData,
                              progress: { ...noteData.progress, plan: e.target.value }
                            })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Future treatment plan..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    <div className="border-t border-gray-200 pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Any additional observations, recommendations, or notes..."
                      />
                    </div>
                  </div>
                </SlidePopupBody>
                <SlidePopupFooter>
                  <button
                    onClick={() => {
                      setShowManualNotePopup(false);
                      setSelectedVisit(null);
                      resetNoteForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    disabled={isCreatingNote}
                    className="inline-flex items-center px-6 py-2 bg-healui-physio text-white rounded-lg hover:bg-healui-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-healui-physio transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isCreatingNote ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Note
                      </>
                    )}
                  </button>
                </SlidePopupFooter>
              </SlidePopupContent>
            </SlidePopup>

            {/* Treatment Protocol Modal */}
            <TreatmentProtocolModal
              isOpen={showTreatmentProtocol}
              onClose={() => setShowTreatmentProtocol(false)}
              visitId={params.appointmentId as string}
              patient={patient}
              visitHistory={patientVisits}
              currentComplaint={appointment?.chief_complaint || ''}
              nutritionData={nutritionData}
            />
            
            {/* Contact Details Popup - Centered and Mobile Responsive */}
            <SlidePopup open={showContactDetails} onOpenChange={setShowContactDetails}>
              <SlidePopupContent className="max-w-sm sm:max-w-md mx-auto" mobileTitle="Contact Information">
                <SlidePopupBody className="p-4">
                  <div className="space-y-3">
                    {/* Primary Contact */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">Primary Contact</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Phone</span>
                          <span className="text-sm text-gray-900 font-medium">{patient.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Email</span>
                          <span className="text-sm text-gray-900">{patient.email || 'Not provided'}</span>
                        </div>
                        {patient.address && (
                          <div className="flex items-start justify-between">
                            <span className="text-xs text-gray-500">Address</span>
                            <span className="text-sm text-gray-900 text-right max-w-48">{patient.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Emergency Contact */}
                    {patient.emergency_contact_name && (
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">Emergency Contact</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Name</span>
                            <span className="text-sm text-gray-900">{patient.emergency_contact_name}</span>
                          </div>
                          {patient.emergency_contact_phone && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Phone</span>
                              <span className="text-sm text-gray-900">{patient.emergency_contact_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Insurance Information */}
                    {patient.insurance_provider && (
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">Insurance</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Provider</span>
                            <span className="text-sm text-gray-900">{patient.insurance_provider}</span>
                          </div>
                          {patient.insurance_policy_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Policy</span>
                              <span className="text-sm text-gray-900">{patient.insurance_policy_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SlidePopupBody>
                <SlidePopupFooter className="p-3 pt-2">
                  <SlidePopupClose>
                    <button className="w-full px-4 py-2 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                      Close
                    </button>
                  </SlidePopupClose>
                </SlidePopupFooter>
              </SlidePopupContent>
            </SlidePopup>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '../../../../store/hooks';
import ApiManager from '../../../../services/api';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, MapPin, Heart, Shield, 
  FileText, Clock, Activity, AlertCircle, Plus, Save, Edit3, 
  CheckCircle, Stethoscope, Pill, Brain, Target, ClipboardList,
  CalendarPlus, Eye, Edit, Trash2, Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SmartNoteInput from '../../../../components/notes/SmartNoteInput';
import NutritionSuggestions from '../../../../components/nutrition/NutritionSuggestions';
import TreatmentProtocolModal from '../../../../components/molecule/TreatmentProtocolModal';
import {
  SlidePopup,
  SlidePopupContent,
  SlidePopupHeader,
  SlidePopupTitle,
  SlidePopupDescription,
  SlidePopupBody,
  SlidePopupFooter,
  SlidePopupClose
} from '../../../../components/ui/slide-popup';

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
  visit_type: string;
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

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentClinic, userData } = useAppSelector(state => state.user);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitHistory, setVisitHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSmartNotePopup, setShowSmartNotePopup] = useState(false);
  const [showManualNotePopup, setShowManualNotePopup] = useState(false);
  const [showTreatmentProtocol, setShowTreatmentProtocol] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteType, setNoteType] = useState<'SOAP' | 'DAP' | 'PROGRESS'>('SOAP');
  const [noteData, setNoteData] = useState({
    soap: { subjective: '', objective: '', assessment: '', plan: '' },
    dap: { data: '', assessment: '', plan: '' },
    progress: { progress: '', interventions: '', response: '', plan: '' }
  });
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (params.id && currentClinic?.id) {
      fetchPatientData();
      fetchVisits();
      fetchVisitHistory();
    }
  }, [params.id, currentClinic?.id]);

  const fetchPatientData = async () => {
    try {
      const response = await ApiManager.getPatient(params.id as string);
      if (response.success && response.data) {
        setPatient(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getPatientVisits(params.id as string, { 
        limit: 100 
      });
      if (response.success && response.data) {
        setVisits(response.data.visits || []);
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitHistory = async () => {
    try {
      const response = await ApiManager.getPatientVisitHistory(params.id as string);
      if (response.success && response.data) {
        setVisitHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch visit history:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!selectedVisit) {
      alert('Please select a visit first');
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
        visit_id: selectedVisit.id,
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
        await fetchVisits();
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
      case 'ACTIVE':
        return 'bg-healui-physio/20 text-healui-physio border-healui-physio/30';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'DISCHARGED':
        return 'bg-healui-primary/20 text-healui-primary border-healui-primary/30';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatVisitType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const renderNoteContent = (note: Note) => {
    if (note.note_type === 'SOAP') {
      const data = note.note_data as any;
      return (
        <div className="space-y-3">
          {data.subjective && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">SUBJECTIVE</h6>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{data.subjective}</p>
            </div>
          )}
          {data.objective && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">OBJECTIVE</h6>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{data.objective}</p>
            </div>
          )}
          {data.assessment && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">ASSESSMENT</h6>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{data.assessment}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">PLAN</h6>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{data.plan}</p>
            </div>
          )}
        </div>
      );
    }
    // Similar rendering for DAP and PROGRESS
    return <p className="text-sm text-gray-600">Note content available</p>;
  };

  if (loading || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healui-physio mx-auto"></div>
          <p className="mt-4 text-text-gray font-medium">Loading patient details...</p>
        </div>
      </div>
    );
  }

  const completedVisits = visits.filter(v => v.status === 'COMPLETED');
  const upcomingVisits = visits.filter(v => v.status === 'SCHEDULED');
  const notesCount = visits.filter(v => v.note).length;
  const visitsWithoutNotes = completedVisits.filter(v => !v.note);

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header */}
      <div className="glass border-b border-border-color sticky top-0 z-10 shadow-sm">
        <div className="max-w-full mx-auto px-3">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-text-gray hover:text-text-dark hover:bg-healui-physio/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-physio flex items-center justify-center text-white font-bold shadow-sm">
                  {patient.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h1 className="text-lg font-display font-bold text-text-dark">{patient.full_name}</h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-light font-medium">{patient.patient_code}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedVisit(null);
                  setShowSmartNotePopup(true);
                }}
                className="btn-primary text-sm px-4 py-2 inline-flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Smart Note
              </button>
              <button
                onClick={() => {
                  setSelectedVisit(null);
                  setShowManualNotePopup(true);
                }}
                className="btn-secondary text-sm px-4 py-2 inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Manual Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Optimized Layout */}
      <div className="max-w-full mx-auto px-3 py-1">
        <div className="grid grid-cols-12 gap-4">
          
          {/* Left Sidebar - Patient Details Only */}
          <div className="col-span-12 lg:col-span-3">
            {/* Patient Contact Info */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="text-sm font-display font-semibold text-text-dark mb-3 flex items-center">
                <User className="h-4 w-4 mr-2 text-healui-physio" />
                Contact Information
              </h3>
              
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-healui-physio" />
                  <span className="font-medium">{patient.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-healui-physio" />
                  <span className="truncate">{patient.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-3 text-healui-physio" />
                  <span>{calculateAge(patient.date_of_birth)} years, {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>
                </div>
                {patient.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 text-healui-physio mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{patient.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="text-sm font-display font-semibold text-text-dark mb-3">Visit Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-healui-physio/5 rounded-lg">
                  <p className="text-xl font-display font-bold text-healui-physio">
                    {visitHistory?.statistics?.completedVisits || completedVisits.length}
                  </p>
                  <p className="text-xs text-text-light font-medium mt-1">Completed</p>
                </div>
                <div className="text-center p-3 bg-healui-primary/5 rounded-lg">
                  <p className="text-xl font-display font-bold text-healui-primary">
                    {visitHistory?.statistics?.upcomingVisits || upcomingVisits.length}
                  </p>
                  <p className="text-xs text-text-light font-medium mt-1">Upcoming</p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-display font-semibold text-text-dark mb-3 flex items-center">
                <Heart className="h-4 w-4 mr-2 text-healui-physio" />
                Medical Information
              </h3>
              
              {/* Medical History */}
              {patient.medical_history && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 text-xs mb-2">Medical History</h4>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">{patient.medical_history}</p>
                </div>
              )}

              {/* Allergies */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 text-xs mb-2">Allergies</h4>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No known allergies</p>
                )}
              </div>

              {/* Medications */}
              <div>
                <h4 className="font-medium text-gray-700 text-xs mb-2">Current Medications</h4>
                {patient.current_medications && patient.current_medications.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.current_medications.map((medication, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-healui-primary/10 text-healui-primary">
                        {medication}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No current medications</p>
                )}
              </div>
            </div>

            {/* Nutrition Suggestions */}
            <div className="mt-4">
              <NutritionSuggestions 
                patientData={{
                  age: calculateAge(patient.date_of_birth),
                  gender: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
                  allergies: patient.allergies,
                  currentMedications: patient.current_medications,
                  medicalHistory: patient.medical_history,
                  chiefComplaints: visits.filter(v => v.chief_complaint).map(v => v.chief_complaint!).slice(0, 5),
                  recentNotes: visits.filter(v => v.note).slice(0, 3).map(v => {
                    const noteData = v.note?.note_data as any;
                    if (v.note?.note_type === 'SOAP') {
                      return `${noteData.subjective || ''} ${noteData.assessment || ''}`;
                    }
                    return JSON.stringify(noteData);
                  }).join(' ')
                }}
              />
            </div>
          </div>

          {/* Main Content - Visits & Notes */}
          <div className="col-span-12 lg:col-span-9">
            {/* Chief Complaints Summary */}
            {visits.filter(v => v.chief_complaint).length > 0 && (
              <div className="bg-healui-physio/5 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-display font-semibold text-text-dark mb-3 flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2 text-healui-physio" />
                  Recent Chief Complaints
                </h3>
                <div className="space-y-2">
                  {visits.filter(v => v.chief_complaint).slice(0, 3).map((visit, index) => (
                    <div key={visit.id} className="bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 text-sm">{visit.chief_complaint}</span>
                        <span className="text-gray-500 text-xs">{format(parseISO(visit.scheduled_date), 'MMM dd')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Visit History - Clean Layout */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-text-dark flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-healui-physio" />
                  Visit History & Clinical Notes
                </h3>
                <div className="text-sm text-gray-500">
                  {visits.length} visits • {notesCount} notes
                </div>
              </div>
              
              <div className="space-y-3">
                {visits.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No visits recorded</p>
                  </div>
                ) : (
                  visits.map((visit) => (
                    <div key={visit.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">{formatVisitType(visit.visit_type)}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVisitStatusColor(visit.status)}`}>
                            {visit.status.replace('_', ' ')}
                          </span>
                          {visit.note && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <FileText className="h-3 w-3 mr-1" />
                              {visit.note.note_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600 text-right">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')} at {visit.scheduled_time}
                            </div>
                            <div className="flex items-center mt-1">
                              <Stethoscope className="h-4 w-4 mr-1" />
                              Dr. {visit.physiotherapist.full_name}
                            </div>
                          </div>
                          {!visit.note && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedVisit(visit);
                                  setShowSmartNotePopup(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Smart Note
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedVisit(visit);
                                  setShowManualNotePopup(true);
                                }}
                                className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                              >
                                Manual
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {visit.chief_complaint && (
                        <div className="mb-3 p-3 bg-white rounded-lg">
                          <span className="font-medium text-gray-700 text-sm">Chief Complaint: </span>
                          <span className="text-gray-600 text-sm">{visit.chief_complaint}</span>
                        </div>
                      )}
                      
                      {visit.note && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <h5 className="font-medium text-gray-700 text-sm mb-2">Clinical Note</h5>
                          {renderNoteContent(visit.note)}
                          {visit.note.additional_notes && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <h6 className="font-medium text-gray-700 text-sm">Additional Notes</h6>
                              <p className="text-sm text-gray-600 mt-1">{visit.note.additional_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
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
              <SlidePopupContent className="max-h-[90vh]">
                <SlidePopupHeader>
                  <SlidePopupTitle>Create Smart Note</SlidePopupTitle>
                  <SlidePopupDescription>
                    Let AI help you create comprehensive clinical notes
                  </SlidePopupDescription>
                </SlidePopupHeader>
                <SlidePopupBody>
                  {/* Visit Selection */}
                  {!selectedVisit && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Visit</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {visits.filter(v => !v.note).map((visit) => (
                          <button
                            key={visit.id}
                            onClick={() => setSelectedVisit(visit)}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{formatVisitType(visit.visit_type)}</p>
                                <p className="text-xs text-gray-500">
                                  {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')} at {visit.scheduled_time}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVisit && (
                    <>
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <p className="font-medium text-blue-900 text-sm">
                          Selected Visit: {formatVisitType(selectedVisit.visit_type)}
                        </p>
                        <p className="text-blue-700 text-xs">
                          {format(parseISO(selectedVisit.scheduled_date), 'MMM dd, yyyy')} at {selectedVisit.scheduled_time}
                        </p>
                      </div>

                      <SmartNoteInput
                        visitId={selectedVisit.id}
                        onNoteCreated={() => {
                          setShowSmartNotePopup(false);
                          setSelectedVisit(null);
                          fetchVisits();
                        }}
                        onCancel={() => {
                          setShowSmartNotePopup(false);
                          setSelectedVisit(null);
                          resetNoteForm();
                        }}
                      />
                    </>
                  )}
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
              <SlidePopupContent className="max-h-[90vh]">
                <SlidePopupHeader>
                  <SlidePopupTitle>Create Manual Note</SlidePopupTitle>
                  <SlidePopupDescription>
                    Create a clinical note with structured format
                  </SlidePopupDescription>
                </SlidePopupHeader>
                <SlidePopupBody>
                  {/* Visit Selection */}
                  {!selectedVisit && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Visit</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {visits.filter(v => !v.note).map((visit) => (
                          <button
                            key={visit.id}
                            onClick={() => setSelectedVisit(visit)}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{formatVisitType(visit.visit_type)}</p>
                                <p className="text-xs text-gray-500">
                                  {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')} at {visit.scheduled_time}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVisit && (
                    <>
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <p className="font-medium text-blue-900 text-sm">
                          Selected Visit: {formatVisitType(selectedVisit.visit_type)}
                        </p>
                        <p className="text-blue-700 text-xs">
                          {format(parseISO(selectedVisit.scheduled_date), 'MMM dd, yyyy')} at {selectedVisit.scheduled_time}
                        </p>
                      </div>

                      {/* Note Type Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['SOAP', 'DAP', 'PROGRESS'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setNoteType(type)}
                              className={`p-2 border rounded-lg text-xs transition-colors ${
                                noteType === type
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-medium">{type}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note Content */}
                      <div className="space-y-4">
                        {noteType === 'SOAP' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                              <textarea
                                value={noteData.soap.subjective}
                                onChange={(e) => setNoteData({
                                  ...noteData,
                                  soap: { ...noteData.soap, subjective: e.target.value }
                                })}
                                rows={3}
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
                                rows={3}
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
                                rows={3}
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
                                rows={3}
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
                                rows={4}
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
                                rows={4}
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
                                rows={4}
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
                                rows={3}
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
                                rows={3}
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
                                rows={3}
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
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Future treatment plan..."
                              />
                            </div>
                          </div>
                        )}

                        {/* Additional Notes - Separate Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                          <textarea
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Any additional observations, recommendations, or notes..."
                          />
                        </div>
                      </div>
                    </>
                  )}
                </SlidePopupBody>
                {selectedVisit && (
                  <SlidePopupFooter>
                    <button
                      onClick={() => {
                        setShowManualNotePopup(false);
                        setSelectedVisit(null);
                        resetNoteForm();
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await handleCreateNote();
                        if (!isCreatingNote) {
                          setShowManualNotePopup(false);
                        }
                      }}
                      disabled={!selectedVisit || isCreatingNote}
                      className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                )}
              </SlidePopupContent>
            </SlidePopup>

          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, Calendar, MapPin, Heart, Shield, 
  CalendarPlus, FileText, Clock, Activity, AlertCircle, 
  Edit3, Plus, Check, ChevronDown, ChevronUp, Stethoscope,
  ClipboardList, Target, Brain, Pill
} from 'lucide-react';
import ApiManager from '../../services/api';
import { format, parseISO } from 'date-fns';
import EditPatientModal from './EditPatientModal';

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
}

interface Visit {
  id: string;
  visit_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  chief_complaint?: string;
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
  created_by: string;
}

interface EnhancedPatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onScheduleVisit: () => void;
  onPatientUpdate?: () => void;
}

const EnhancedPatientDetailsModal: React.FC<EnhancedPatientDetailsModalProps> = ({ 
  patient, 
  onClose, 
  onScheduleVisit,
  onPatientUpdate
}) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(false);
  const [fullPatientData, setFullPatientData] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'notes' | 'history'>('overview');
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [selectedVisitForNote, setSelectedVisitForNote] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteType, setNoteType] = useState<'SOAP' | 'DAP' | 'PROGRESS'>('SOAP');
  const [noteData, setNoteData] = useState<any>({
    soap: { subjective: '', objective: '', assessment: '', plan: '' },
    dap: { data: '', assessment: '', plan: '' },
    progress: { progress: '', interventions: '', response: '', plan: '' }
  });

  useEffect(() => {
    fetchVisits();
    fetchFullPatientData();
  }, [patient.id]);

  const fetchFullPatientData = async () => {
    if (!patient.id) return;
    
    try {
      setPatientLoading(true);
      const response = await ApiManager.getPatient(patient.id);
      if (response.success && response.data) {
        setFullPatientData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch full patient data:', error);
    } finally {
      setPatientLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getVisits({ 
        patient_id: patient.id,
        limit: 50 
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'DISCHARGED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
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

  const handleCreateNote = async () => {
    if (!selectedVisitForNote) return;

    try {
      const notePayload = {
        visit_id: selectedVisitForNote,
        note_type: noteType,
        note_data: noteType === 'SOAP' ? noteData.soap : 
                   noteType === 'DAP' ? noteData.dap : 
                   noteData.progress,
        additional_notes: '',
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

      const response = await ApiManager.createNote(notePayload);
      if (response.success) {
        fetchVisits();
        setShowNewNote(false);
        setSelectedVisitForNote(null);
        setNoteData({
          soap: { subjective: '', objective: '', assessment: '', plan: '' },
          dap: { data: '', assessment: '', plan: '' },
          progress: { progress: '', interventions: '', response: '', plan: '' }
        });
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const renderNoteContent = (note: Note) => {
    if (note.note_type === 'SOAP') {
      const data = note.note_data as any;
      return (
        <div className="space-y-3">
          <div>
            <h5 className="font-medium text-gray-700">Subjective</h5>
            <p className="text-sm text-gray-600 mt-1">{data.subjective}</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700">Objective</h5>
            <p className="text-sm text-gray-600 mt-1">{data.objective}</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700">Assessment</h5>
            <p className="text-sm text-gray-600 mt-1">{data.assessment}</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700">Plan</h5>
            <p className="text-sm text-gray-600 mt-1">{data.plan}</p>
          </div>
        </div>
      );
    }
    // Similar for DAP and PROGRESS notes
    return null;
  };

  const completedVisits = visits.filter(v => v.status === 'COMPLETED');
  const upcomingVisits = visits.filter(v => v.status === 'SCHEDULED');
  const notesCount = visits.filter(v => v.note).length;
  
  // Use full patient data if available, otherwise fall back to passed patient data
  const displayPatient = fullPatientData || patient;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
                {displayPatient.full_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{displayPatient.full_name}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-blue-100 text-sm">{displayPatient.patient_code}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(displayPatient.status)}`}>
                    {displayPatient.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Patient
              </button>
              <button
                onClick={onScheduleVisit}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Visit
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
              <p className="text-xs text-gray-600">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedVisits.length}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{upcomingVisits.length}</p>
              <p className="text-xs text-gray-600">Upcoming</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{notesCount}</p>
              <p className="text-xs text-gray-600">Clinical Notes</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'visits', label: 'Visits', icon: Calendar },
              { id: 'notes', label: 'Clinical Notes', icon: FileText },
              { id: 'history', label: 'Medical History', icon: Heart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {patientLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading patient details...</p>
              </div>
            </div>
          ) : activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Contact Information Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {displayPatient.phone}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {displayPatient.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="mt-1 text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(displayPatient.date_of_birth), 'MMM dd, yyyy')} ({calculateAge(displayPatient.date_of_birth)} years)
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="mt-1 text-gray-900">
                        {displayPatient.gender === 'M' ? 'Male' : displayPatient.gender === 'F' ? 'Female' : 'Other'}
                      </p>
                    </div>
                  </div>
                </div>
                {displayPatient.address && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="mt-1 text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      {displayPatient.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Emergency Contact Card */}
              {(displayPatient.emergency_contact_name || displayPatient.emergency_contact_phone) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Name</label>
                      <p className="mt-1 text-gray-900">{displayPatient.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                      <p className="mt-1 text-gray-900">{displayPatient.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Card */}
              {(displayPatient.insurance_provider || displayPatient.insurance_policy_number) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-600" />
                    Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Insurance Provider</label>
                      <p className="mt-1 text-gray-900">{displayPatient.insurance_provider || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Policy Number</label>
                      <p className="mt-1 text-gray-900">{displayPatient.insurance_policy_number || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : visits.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No visits scheduled</h3>
                  <p className="text-gray-600 mb-6">Schedule the first visit for this patient</p>
                  <button
                    onClick={onScheduleVisit}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule First Visit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <div key={visit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                visit.status === 'COMPLETED' ? 'bg-green-100' :
                                visit.status === 'SCHEDULED' ? 'bg-blue-100' :
                                'bg-gray-100'
                              }`}>
                                <Calendar className={`h-5 w-5 ${
                                  visit.status === 'COMPLETED' ? 'text-green-600' :
                                  visit.status === 'SCHEDULED' ? 'text-blue-600' :
                                  'text-gray-600'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {formatVisitType(visit.visit_type)}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVisitStatusColor(visit.status)}`}>
                                  {visit.status.replace('_', ' ')}
                                </span>
                                {visit.note && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {visit.note.note_type} Note
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')} at {visit.scheduled_time}
                                </span>
                                <span className="flex items-center">
                                  <Stethoscope className="h-4 w-4 mr-1" />
                                  Dr. {visit.physiotherapist.full_name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {visit.status === 'COMPLETED' && !visit.note && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVisitForNote(visit.id);
                                  setShowNewNote(true);
                                }}
                                className="mr-2 inline-flex items-center px-3 py-1 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Note
                              </button>
                            )}
                            {expandedVisit === visit.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {expandedVisit === visit.id && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {visit.chief_complaint && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</h5>
                              <p className="text-sm text-gray-600">{visit.chief_complaint}</p>
                            </div>
                          )}
                          {visit.note && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">{visit.note.note_type} Note</h5>
                                {visit.note.is_signed && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Check className="h-3 w-3 mr-1" />
                                    Signed
                                  </span>
                                )}
                              </div>
                              {renderNoteContent(visit.note)}
                              {visit.note.treatment_details && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h6 className="text-sm font-medium text-gray-700 mb-2">Treatment Details</h6>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {visit.note.treatment_details.modalities && visit.note.treatment_details.modalities.length > 0 && (
                                      <div>
                                        <span className="text-gray-500">Modalities:</span>
                                        <span className="ml-1 text-gray-700">{visit.note.treatment_details.modalities.join(', ')}</span>
                                      </div>
                                    )}
                                    {visit.note.treatment_details.exercises && visit.note.treatment_details.exercises.length > 0 && (
                                      <div>
                                        <span className="text-gray-500">Exercises:</span>
                                        <span className="ml-1 text-gray-700">{visit.note.treatment_details.exercises.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes Summary</h3>
                {notesCount === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No clinical notes available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visits.filter(v => v.note).map((visit) => (
                      <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {visit.note!.note_type} Note - {format(parseISO(visit.scheduled_date), 'MMM dd, yyyy')}
                            </h4>
                            <p className="text-sm text-gray-500">Visit: {formatVisitType(visit.visit_type)}</p>
                          </div>
                          {visit.note!.is_signed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Signed
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          {renderNoteContent(visit.note!)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6 space-y-6">
              {/* Medical History */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Medical History
                </h3>
                {displayPatient.medical_history ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{displayPatient.medical_history}</p>
                ) : (
                  <p className="text-gray-500 italic">No medical history recorded</p>
                )}
              </div>

              {/* Allergies */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Allergies
                </h3>
                {displayPatient.allergies && displayPatient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayPatient.allergies.map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No known allergies</p>
                )}
              </div>

              {/* Current Medications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-blue-600" />
                  Current Medications
                </h3>
                {displayPatient.current_medications && displayPatient.current_medications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayPatient.current_medications.map((medication, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {medication}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No current medications</p>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                  Chronic Conditions
                </h3>
                {displayPatient.chronic_conditions && displayPatient.chronic_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayPatient.chronic_conditions.map((condition, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No chronic conditions recorded</p>
                )}
              </div>

              {/* Previous Surgeries */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-indigo-600" />
                  Previous Surgeries
                </h3>
                {displayPatient.previous_surgeries && displayPatient.previous_surgeries.length > 0 ? (
                  <div className="space-y-3">
                    {displayPatient.previous_surgeries.map((surgery, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Procedure:</span>
                            <p className="text-gray-900">{surgery.procedure}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Date:</span>
                            <p className="text-gray-900">
                              {surgery.date ? format(new Date(surgery.date), 'MMM dd, yyyy') : 'Not specified'}
                            </p>
                          </div>
                          {surgery.body_part && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Body Part:</span>
                              <p className="text-gray-900">{surgery.body_part}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No previous surgeries recorded</p>
                )}
              </div>

              {/* Past Illnesses */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Past Illnesses
                </h3>
                {displayPatient.past_illnesses && displayPatient.past_illnesses.length > 0 ? (
                  <div className="space-y-3">
                    {displayPatient.past_illnesses.map((illness, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Illness:</span>
                            <p className="text-gray-900">{illness.illness}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Date:</span>
                            <p className="text-gray-900">
                              {illness.date ? format(new Date(illness.date), 'MMM dd, yyyy') : 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Treatment:</span>
                            <p className="text-gray-900">{illness.treatment}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              illness.resolved 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {illness.resolved ? 'Resolved' : 'Ongoing'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No past illnesses recorded</p>
                )}
              </div>

              {/* Past Investigations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-teal-600" />
                  Past Investigations
                </h3>
                {displayPatient.past_investigations && displayPatient.past_investigations.length > 0 ? (
                  <div className="space-y-3">
                    {displayPatient.past_investigations.map((investigation, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Type:</span>
                            <p className="text-gray-900">{investigation.type}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Date:</span>
                            <p className="text-gray-900">
                              {investigation.date ? format(new Date(investigation.date), 'MMM dd, yyyy') : 'Not specified'}
                            </p>
                          </div>
                          {investigation.body_part && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Body Part:</span>
                              <p className="text-gray-900">{investigation.body_part}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Findings:</span>
                          <p className="text-gray-900 mt-1">{investigation.findings}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No past investigations recorded</p>
                )}
              </div>

              {/* Lifestyle Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Occupation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-gray-600" />
                    Occupation
                  </h3>
                  {displayPatient.occupation ? (
                    <p className="text-gray-700">{displayPatient.occupation}</p>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>

                {/* Activity Level */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-emerald-600" />
                    Activity Level
                  </h3>
                  {displayPatient.activity_level ? (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      displayPatient.activity_level === 'ATHLETIC' ? 'bg-green-100 text-green-800 border border-green-200' :
                      displayPatient.activity_level === 'ACTIVE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      displayPatient.activity_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      displayPatient.activity_level === 'LIGHT' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {displayPatient.activity_level.charAt(0) + displayPatient.activity_level.slice(1).toLowerCase()}
                    </span>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
              </div>

              {/* Family History */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-pink-600" />
                  Family History
                </h3>
                {displayPatient.family_history ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{displayPatient.family_history}</p>
                ) : (
                  <p className="text-gray-500 italic">No family history recorded</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* New Note Modal */}
        {showNewNote && selectedVisitForNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Add Clinical Note</h3>
                  <button
                    onClick={() => {
                      setShowNewNote(false);
                      setSelectedVisitForNote(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SOAP">SOAP Note</option>
                    <option value="DAP">DAP Note</option>
                    <option value="PROGRESS">Progress Note</option>
                  </select>
                </div>

                {noteType === 'SOAP' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                      <textarea
                        value={noteData.soap.subjective}
                        onChange={(e) => setNoteData({
                          ...noteData,
                          soap: { ...noteData.soap, subjective: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Patient's description of symptoms, pain levels, etc."
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Clinical findings, measurements, observations..."
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Clinical judgment, diagnosis, progress..."
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Treatment plan, next steps, follow-up..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewNote(false);
                    setSelectedVisitForNote(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Patient Modal */}
        {showEditModal && fullPatientData && (
          <EditPatientModal
            patient={fullPatientData}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchFullPatientData(); // Refresh patient data
              onPatientUpdate?.(); // Notify parent component
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedPatientDetailsModal;
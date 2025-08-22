import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, Heart, Shield, CalendarPlus, FileText, Clock, Activity } from 'lucide-react';
import ApiManager from '../../services/api';

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
  scheduled_date: Date;
  scheduled_time: string;
  status: string;
  physiotherapist: {
    full_name: string;
  };
  note?: {
    id: string;
    note_type: string;
    is_signed: boolean;
  };
}

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onScheduleVisit: () => void;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ patient, onClose, onScheduleVisit }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'visits' | 'notes'>('details');

  useEffect(() => {
    fetchVisits();
  }, [patient.id]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getVisits({ patient_id: patient.id });
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
        return 'bg-healui-physio/20 text-healui-physio border-healui-physio/30 border';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200 border';
      case 'DISCHARGED':
        return 'bg-healui-primary/20 text-healui-primary border-healui-primary/30 border';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 border';
    }
  };

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-healui-primary/20 text-healui-primary border-healui-primary/30 border';
      case 'IN_PROGRESS':
        return 'bg-healui-accent/20 text-healui-accent border-healui-accent/30 border';
      case 'COMPLETED':
        return 'bg-healui-physio/20 text-healui-physio border-healui-physio/30 border';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200 border';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 border';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border-color">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gradient-physio flex items-center justify-center text-white font-semibold shadow-physio">
              {patient.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-text-dark">{patient.full_name}</h2>
              <p className="text-sm text-text-light font-medium">{patient.patient_code}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
              {patient.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onScheduleVisit}
              className="btn-primary inline-flex items-center px-4 py-2.5"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Schedule Visit
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-healui-physio/10 rounded-lg transition-all duration-200"
            >
              <X className="h-5 w-5 text-text-light" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border-color">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'details'
                  ? 'border-healui-physio text-healui-physio'
                  : 'border-transparent text-text-light hover:text-text-dark'
              }`}
            >
              Patient Details
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'visits'
                  ? 'border-healui-physio text-healui-physio'
                  : 'border-transparent text-text-light hover:text-text-dark'
              }`}
            >
              Visits ({visits.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'notes'
                  ? 'border-healui-physio text-healui-physio'
                  : 'border-transparent text-text-light hover:text-text-dark'
              }`}
            >
              Clinical Notes
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-healui-physio" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark">Full Name</label>
                    <p className="mt-1 text-sm text-text-gray font-medium">{patient.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark">Patient Code</label>
                    <p className="mt-1 text-sm text-text-gray font-medium">{patient.patient_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark">Phone</label>
                    <p className="mt-1 text-sm text-text-gray font-medium">{patient.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark">Email</label>
                    <p className="mt-1 text-sm text-text-gray font-medium">{patient.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark">Age & Gender</label>
                    <p className="mt-1 text-sm text-text-gray font-medium">
                      {calculateAge(patient.date_of_birth)} years, {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark">Date of Birth</label>
                    <p className="mt-1 text-sm text-text-gray font-medium">
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  {patient.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-dark">Address</label>
                      <p className="mt-1 text-sm text-text-gray font-medium">{patient.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
                <div>
                  <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-healui-physio" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Contact Name</label>
                      <p className="mt-1 text-sm text-text-gray font-medium">{patient.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Contact Phone</label>
                      <p className="mt-1 text-sm text-text-gray font-medium">{patient.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-healui-physio" />
                  Medical Information
                </h3>
                <div className="space-y-4">
                  {patient.medical_history && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Medical History</label>
                      <p className="mt-1 text-sm text-text-gray font-medium whitespace-pre-wrap">{patient.medical_history}</p>
                    </div>
                  )}
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Allergies</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {patient.allergies.map((allergy, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.current_medications && patient.current_medications.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Current Medications</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {patient.current_medications.map((medication, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-healui-primary/20 text-healui-primary border border-healui-primary/30">
                            {medication}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance Information */}
              {(patient.insurance_provider || patient.insurance_policy_number) && (
                <div>
                  <h3 className="text-lg font-display font-semibold text-text-dark mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-healui-physio" />
                    Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Insurance Provider</label>
                      <p className="mt-1 text-sm text-text-gray font-medium">{patient.insurance_provider || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark">Policy Number</label>
                      <p className="mt-1 text-sm text-text-gray font-medium">{patient.insurance_policy_number || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healui-physio"></div>
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-healui-physio/50 mx-auto mb-4" />
                  <h3 className="text-lg font-display font-semibold text-text-dark mb-2">No visits yet</h3>
                  <p className="text-text-gray mb-4">Schedule the first visit for this patient</p>
                  <button
                    onClick={onScheduleVisit}
                    className="btn-primary inline-flex items-center px-6 py-3"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule Visit
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((visit) => (
                    <div key={visit.id} className="card-base">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-display font-semibold text-text-dark">{visit.visit_type.replace('_', ' ')}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVisitStatusColor(visit.status)}`}>
                            {visit.status}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-text-light">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(visit.scheduled_date).toLocaleDateString()} at {visit.scheduled_time}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-text-gray">
                        <span className="font-medium">Physiotherapist: {visit.physiotherapist.full_name}</span>
                        {visit.note && (
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {visit.note.note_type} Note {visit.note.is_signed ? '(Signed)' : '(Unsigned)'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-healui-physio/50 mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-text-dark mb-2">Clinical Notes</h3>
                <p className="text-text-gray">Notes will appear here after visits are completed</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
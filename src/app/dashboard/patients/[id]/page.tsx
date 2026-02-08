'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '../../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft, Phone, Mail, Calendar, MapPin, Plus,
  Activity, ChevronRight, Clock, User, FileText,
  AlertTriangle, CheckCircle, Circle, MoreHorizontal,
  Edit2, Power, RotateCcw, Play
} from 'lucide-react';
import {
  PatientConditionResponseDto,
  ConditionStatus,
  UrgencyLevel,
  DischargeReason,
  DISCHARGE_REASONS
} from '../../../../lib/types';

// ============ TYPES ============

interface PatientAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  address?: string | PatientAddress;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  chronic_conditions?: string[];
  previous_surgeries?: any[];
  past_illnesses?: any[];
  allergies?: string[];
  current_medications?: string[];
  occupation?: string;
  activity_level?: string;
  family_history?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  status: string;
  created_at: string;
}

interface Visit {
  id: string;
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
  visitConditions?: any[];
  notes?: any[];
}

type TabType = 'overview' | 'conditions' | 'visits' | 'history' | 'settings';

// ============ HELPER FUNCTIONS ============

const calculateAge = (dob: string): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatAddress = (address?: string | PatientAddress): string => {
  if (!address) return 'Not provided';
  if (typeof address === 'string') return address;
  return [address.line1, address.line2, address.city, address.state, address.postal_code]
    .filter(Boolean)
    .join(', ');
};

const getUrgencyColor = (level?: UrgencyLevel): string => {
  switch (level) {
    case UrgencyLevel.URGENT: return 'text-red-600';
    case UrgencyLevel.HIGH: return 'text-orange-500';
    case UrgencyLevel.MODERATE: return 'text-yellow-600';
    default: return 'text-gray-500';
  }
};

const getStatusBadge = (status: ConditionStatus): { bg: string; text: string } => {
  switch (status) {
    case ConditionStatus.ACTIVE: return { bg: 'bg-green-50', text: 'text-green-700' };
    case ConditionStatus.IMPROVING: return { bg: 'bg-blue-50', text: 'text-blue-700' };
    case ConditionStatus.ON_HOLD: return { bg: 'bg-yellow-50', text: 'text-yellow-700' };
    case ConditionStatus.DISCHARGED: return { bg: 'bg-gray-100', text: 'text-gray-600' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
};

const getDiagnosisProgress = (condition: PatientConditionResponseDto): { step: number; label: string } => {
  if (condition.final_diagnosis) return { step: 4, label: 'Complete' };
  if (condition.clinical_dx_differential) return { step: 3, label: 'Differential ready' };
  if (condition.clinical_dx_completed) return { step: 2, label: 'Clinical done' };
  if (condition.symptom_dx_completed) return { step: 1, label: 'Symptoms recorded' };
  return { step: 0, label: 'Not started' };
};

// ============ MAIN COMPONENT ============

export default function PatientPage() {
  const params = useParams();
  const router = useRouter();
  const { currentClinic } = useAppSelector(state => state.user);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [conditions, setConditions] = useState<PatientConditionResponseDto[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitHistory, setVisitHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCondition, setSelectedCondition] = useState<PatientConditionResponseDto | null>(null);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [conditionToDischarge, setConditionToDischarge] = useState<PatientConditionResponseDto | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const [patientRes, conditionsRes, visitsRes, historyRes] = await Promise.all([
        ApiManager.getPatient(params.id as string),
        ApiManager.getPatientConditions(params.id as string),
        ApiManager.getPatientVisits(params.id as string, { limit: 100 }),
        ApiManager.getPatientVisitHistory(params.id as string),
      ]);

      if (patientRes.success) setPatient(patientRes.data);
      if (conditionsRes.success) setConditions(conditionsRes.data || []);
      if (visitsRes.success) setVisits(visitsRes.data?.visits || []);
      if (historyRes.success) setVisitHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleDischarge = async (conditionId: string, reason: DischargeReason, summary: string) => {
    try {
      await ApiManager.dischargeCondition(params.id as string, conditionId, {
        discharge_reason: reason,
        discharge_summary: summary,
      });
      fetchData();
      setShowDischargeModal(false);
      setConditionToDischarge(null);
    } catch (error) {
      console.error('Failed to discharge condition:', error);
    }
  };

  const handleReactivate = async (conditionId: string) => {
    try {
      await ApiManager.reactivateCondition(params.id as string, conditionId);
      fetchData();
    } catch (error) {
      console.error('Failed to reactivate condition:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Patient not found</div>
      </div>
    );
  }

  const activeConditions = conditions.filter(c => c.status === ConditionStatus.ACTIVE || c.status === ConditionStatus.IMPROVING);
  const dischargedConditions = conditions.filter(c => c.status === ConditionStatus.DISCHARGED);
  const upcomingVisits = visits.filter(v => v.status === 'SCHEDULED');
  const completedVisits = visits.filter(v => v.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-light text-gray-900">{patient.full_name}</h1>
                <p className="text-sm text-gray-400">
                  {patient.patient_code} · {calculateAge(patient.date_of_birth)}y · {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/visits/new?patient_id=${patient.id}`)}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Schedule Visit
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-6 mt-4 -mb-px">
            {(['overview', 'conditions', 'visits', 'history', 'settings'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            patient={patient}
            conditions={activeConditions}
            upcomingVisits={upcomingVisits}
            visitHistory={visitHistory}
            onViewConditions={() => setActiveTab('conditions')}
          />
        )}

        {activeTab === 'conditions' && (
          <ConditionsTab
            patientId={patient.id}
            conditions={conditions}
            selectedCondition={selectedCondition}
            onSelectCondition={setSelectedCondition}
            onDischarge={(c) => { setConditionToDischarge(c); setShowDischargeModal(true); }}
            onReactivate={handleReactivate}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'visits' && (
          <VisitsTab
            visits={visits}
            patientId={patient.id}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            patient={patient}
            dischargedConditions={dischargedConditions}
            onReactivate={handleReactivate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            patient={patient}
            onUpdate={fetchData}
          />
        )}
      </main>

      {/* Discharge Modal */}
      {showDischargeModal && conditionToDischarge && (
        <DischargeModal
          condition={conditionToDischarge}
          onConfirm={handleDischarge}
          onClose={() => { setShowDischargeModal(false); setConditionToDischarge(null); }}
        />
      )}
    </div>
  );
}

// ============ TAB COMPONENTS ============

function OverviewTab({
  patient,
  conditions,
  upcomingVisits,
  visitHistory,
  onViewConditions,
}: {
  patient: Patient;
  conditions: PatientConditionResponseDto[];
  upcomingVisits: Visit[];
  visitHistory: any;
  onViewConditions: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Active Conditions" value={conditions.length} />
        <StatCard label="Total Visits" value={visitHistory?.statistics?.completedVisits || 0} />
        <StatCard label="Upcoming" value={upcomingVisits.length} />
      </div>

      {/* Active Conditions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-light text-gray-900">Active Conditions</h2>
          <button
            onClick={onViewConditions}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {conditions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg">
            No active conditions
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.slice(0, 3).map((condition) => (
              <ConditionCard key={condition.id} condition={condition} compact />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Visits */}
      <section>
        <h2 className="text-lg font-light text-gray-900 mb-4">Upcoming Visits</h2>
        {upcomingVisits.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg">
            No upcoming visits
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingVisits.slice(0, 3).map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Info */}
      <section className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contact</h3>
          <div className="space-y-3">
            <InfoRow icon={Phone} label="Phone" value={patient.phone} />
            <InfoRow icon={Mail} label="Email" value={patient.email || 'Not provided'} />
            <InfoRow icon={MapPin} label="Address" value={formatAddress(patient.address)} />
          </div>
        </div>

        {(patient.allergies?.length || patient.current_medications?.length) && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Medical Alerts</h3>
            <div className="space-y-3">
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, i) => (
                      <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {patient.current_medications && patient.current_medications.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Medications</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.current_medications.map((med, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ConditionsTab({
  patientId,
  conditions,
  selectedCondition,
  onSelectCondition,
  onDischarge,
  onReactivate,
  onRefresh,
}: {
  patientId: string;
  conditions: PatientConditionResponseDto[];
  selectedCondition: PatientConditionResponseDto | null;
  onSelectCondition: (c: PatientConditionResponseDto | null) => void;
  onDischarge: (c: PatientConditionResponseDto) => void;
  onReactivate: (id: string) => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const activeConditions = conditions.filter(c => c.status !== ConditionStatus.DISCHARGED);
  const dischargedConditions = conditions.filter(c => c.status === ConditionStatus.DISCHARGED);

  if (selectedCondition) {
    return (
      <ConditionDetail
        condition={selectedCondition}
        patientId={patientId}
        onBack={() => onSelectCondition(null)}
        onDischarge={() => onDischarge(selectedCondition)}
        onReactivate={() => onReactivate(selectedCondition.id)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light text-gray-900">
          {activeConditions.length} Active Condition{activeConditions.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={() => router.push(`/dashboard/patients/${patientId}/add-condition`)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Condition
        </button>
      </div>

      {/* Active Conditions */}
      {activeConditions.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-gray-50 rounded-lg">
          No active conditions
        </div>
      ) : (
        <div className="space-y-4">
          {activeConditions.map((condition) => (
            <ConditionCard
              key={condition.id}
              condition={condition}
              onClick={() => onSelectCondition(condition)}
              onDischarge={() => onDischarge(condition)}
            />
          ))}
        </div>
      )}

      {/* Discharged */}
      {dischargedConditions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Discharged ({dischargedConditions.length})
          </h3>
          <div className="space-y-3">
            {dischargedConditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-gray-600">{condition.condition_name}</p>
                  <p className="text-xs text-gray-400">
                    {condition.discharge_reason && DISCHARGE_REASONS.find(r => r.value === condition.discharge_reason)?.label}
                    {condition.discharged_at && ` · ${format(new Date(condition.discharged_at), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <button
                  onClick={() => onReactivate(condition.id)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ConditionDetail({
  condition,
  patientId,
  onBack,
  onDischarge,
  onReactivate,
}: {
  condition: PatientConditionResponseDto;
  patientId: string;
  onBack: () => void;
  onDischarge: () => void;
  onReactivate: () => void;
}) {
  const [conditionVisits, setConditionVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await ApiManager.getConditionHistory(condition.id);
        if (res.success) {
          setConditionVisits(res.data || []);
        }
      } catch (e) {
        console.error('Failed to fetch condition history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [condition.id]);

  const progress = getDiagnosisProgress(condition);
  const isActive = condition.status !== ConditionStatus.DISCHARGED;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-light text-gray-900">{condition.condition_name}</h2>
            <p className="text-sm text-gray-400">
              {condition.body_region} · Added {format(new Date(condition.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        {isActive ? (
          <button
            onClick={onDischarge}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Discharge
          </button>
        ) : (
          <button
            onClick={onReactivate}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reactivate
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Status</p>
          <p className="font-medium text-gray-900">{condition.status}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">VAS Score</p>
          <p className="font-medium text-gray-900">{condition.vas_score ?? '-'}/10</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Urgency</p>
          <p className={`font-medium ${getUrgencyColor(condition.urgency_level)}`}>
            {condition.urgency_level || 'Not set'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Total Visits</p>
          <p className="font-medium text-gray-900">{condition.visit_conditions_count || 0}</p>
        </div>
      </div>

      {/* Chief Complaint */}
      {condition.chief_complaint && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Chief Complaint</h3>
          <p className="text-gray-700">{condition.chief_complaint}</p>
        </div>
      )}

      {/* Diagnosis Progress */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Diagnosis Progress</h3>
        <div className="flex items-center gap-4">
          {['Symptoms', 'Clinical', 'Differential', 'Final'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                i < progress.step ? 'bg-green-500 text-white' : i === progress.step ? 'bg-gray-300' : 'bg-gray-100'
              }`}>
                {i < progress.step ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <span className={`text-sm ${i <= progress.step ? 'text-gray-700' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < 3 && <div className={`w-8 h-px ${i < progress.step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">{progress.label}</p>
      </div>

      {/* Differential Diagnosis */}
      {condition.clinical_dx_differential && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Differential Diagnosis</h3>
          {Array.isArray(condition.clinical_dx_differential) ? (
            <div className="space-y-2">
              {condition.clinical_dx_differential.map((dx: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-700">{dx.condition || dx.name || dx}</span>
                  {dx.confidence && (
                    <span className="text-sm text-gray-400">{dx.confidence}%</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{JSON.stringify(condition.clinical_dx_differential)}</p>
          )}
        </div>
      )}

      {/* Visit History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Visit History</h3>
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : conditionVisits.length === 0 ? (
          <div className="text-gray-400 text-center py-8 bg-gray-50 rounded-lg">No visits for this condition</div>
        ) : (
          <div className="space-y-3">
            {conditionVisits.map((vc: any) => (
              <div key={vc.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {vc.visit?.scheduled_date && format(parseISO(vc.visit.scheduled_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {vc.treatment_focus} focus · {vc.session_goals || 'No goals set'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {vc.notes_count || 0} notes · {vc.protocols_count || 0} protocols
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VisitsTab({ visits, patientId }: { visits: Visit[]; patientId: string }) {
  const router = useRouter();
  const upcoming = visits.filter(v => v.status === 'SCHEDULED');
  const completed = visits.filter(v => v.status === 'COMPLETED');
  const other = visits.filter(v => !['SCHEDULED', 'COMPLETED'].includes(v.status));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light text-gray-900">{visits.length} Visits</h2>
        <button
          onClick={() => router.push(`/dashboard/visits/new?patient_id=${patientId}`)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          Schedule Visit
        </button>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Completed ({completed.length})
          </h3>
          <div className="space-y-3">
            {completed.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Other</h3>
          <div className="space-y-3">
            {other.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </section>
      )}

      {visits.length === 0 && (
        <div className="py-16 text-center text-gray-400 bg-gray-50 rounded-lg">
          No visits recorded
        </div>
      )}
    </div>
  );
}

function HistoryTab({
  patient,
  dischargedConditions,
  onReactivate,
}: {
  patient: Patient;
  dischargedConditions: PatientConditionResponseDto[];
  onReactivate: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Medical History */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Medical History</h3>
        {patient.medical_history ? (
          <p className="text-gray-700">{patient.medical_history}</p>
        ) : (
          <p className="text-gray-400">No medical history recorded</p>
        )}
      </section>

      {/* Chronic Conditions */}
      {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Chronic Conditions</h3>
          <div className="flex flex-wrap gap-2">
            {patient.chronic_conditions.map((condition, i) => (
              <span key={i} className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm">
                {condition}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Surgeries */}
      {patient.previous_surgeries && patient.previous_surgeries.length > 0 && (
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Previous Surgeries</h3>
          <div className="space-y-2">
            {patient.previous_surgeries.map((surgery, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-700">{surgery.procedure}</span>
                <span className="text-sm text-gray-400">{surgery.date || 'Unknown date'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Allergies & Medications */}
      <div className="grid grid-cols-2 gap-6">
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Allergies</h3>
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, i) => (
                <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No known allergies</p>
          )}
        </section>

        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Current Medications</h3>
          {patient.current_medications && patient.current_medications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.current_medications.map((med, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {med}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No current medications</p>
          )}
        </section>
      </div>

      {/* Lifestyle */}
      {(patient.occupation || patient.activity_level) && (
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Lifestyle</h3>
          <div className="grid grid-cols-2 gap-4">
            {patient.occupation && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Occupation</p>
                <p className="text-gray-700">{patient.occupation}</p>
              </div>
            )}
            {patient.activity_level && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Activity Level</p>
                <p className="text-gray-700">{patient.activity_level}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Discharged Conditions */}
      {dischargedConditions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Discharged Conditions ({dischargedConditions.length})
          </h3>
          <div className="space-y-3">
            {dischargedConditions.map((condition) => (
              <div key={condition.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">{condition.condition_name}</p>
                    <p className="text-sm text-gray-400">
                      {condition.discharge_reason && DISCHARGE_REASONS.find(r => r.value === condition.discharge_reason)?.label}
                      {condition.discharged_at && ` · ${format(new Date(condition.discharged_at), 'MMM d, yyyy')}`}
                    </p>
                    {condition.discharge_summary && (
                      <p className="text-sm text-gray-500 mt-2">{condition.discharge_summary}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onReactivate(condition.id)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SettingsTab({ patient, onUpdate }: { patient: Patient; onUpdate: () => void }) {
  return (
    <div className="space-y-8">
      {/* Contact Information */}
      <section className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h3>
          <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <InfoRow icon={Phone} label="Phone" value={patient.phone} />
          <InfoRow icon={Mail} label="Email" value={patient.email || 'Not provided'} />
          <InfoRow icon={Calendar} label="Date of Birth" value={format(new Date(patient.date_of_birth), 'MMMM d, yyyy')} />
          <InfoRow icon={User} label="Gender" value={patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'} />
        </div>
        <div className="mt-4">
          <InfoRow icon={MapPin} label="Address" value={formatAddress(patient.address)} />
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact</h3>
          <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
        </div>
        {patient.emergency_contact_name ? (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Name</p>
              <p className="text-gray-700">{patient.emergency_contact_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Phone</p>
              <p className="text-gray-700">{patient.emergency_contact_phone || 'Not provided'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No emergency contact set</p>
        )}
      </section>

      {/* Insurance */}
      <section className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Insurance</h3>
          <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
        </div>
        {patient.insurance_provider ? (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Provider</p>
              <p className="text-gray-700">{patient.insurance_provider}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Policy Number</p>
              <p className="text-gray-700">{patient.insurance_policy_number || 'Not provided'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No insurance information</p>
        )}
      </section>
    </div>
  );
}

// ============ SHARED COMPONENTS ============

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <p className="text-3xl font-light text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function ConditionCard({
  condition,
  compact = false,
  onClick,
  onDischarge,
}: {
  condition: PatientConditionResponseDto;
  compact?: boolean;
  onClick?: () => void;
  onDischarge?: () => void;
}) {
  const statusBadge = getStatusBadge(condition.status);
  const progress = getDiagnosisProgress(condition);

  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''} transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{condition.condition_name}</h4>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
              {condition.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {condition.body_region}
            {condition.vas_score !== undefined && ` · VAS: ${condition.vas_score}/10`}
            {condition.urgency_level && (
              <span className={`ml-2 ${getUrgencyColor(condition.urgency_level)}`}>
                {condition.urgency_level}
              </span>
            )}
          </p>
          {!compact && condition.chief_complaint && (
            <p className="text-sm text-gray-600 mt-2">{condition.chief_complaint}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!compact && (
            <span className="text-xs text-gray-400">{progress.label}</span>
          )}
          {onClick && <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {condition.visit_conditions_count || 0} visits
            {condition.last_treated_date && ` · Last: ${format(new Date(condition.last_treated_date), 'MMM d')}`}
          </span>
          {onDischarge && condition.status !== ConditionStatus.DISCHARGED && (
            <button
              onClick={(e) => { e.stopPropagation(); onDischarge(); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Discharge
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
  const router = useRouter();
  const isUpcoming = visit.status === 'SCHEDULED';
  const isCompleted = visit.status === 'COMPLETED';

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  };

  const formatVisitType = (type: string) =>
    type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

  return (
    <div
      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => router.push(`/dashboard/visits/${visit.id}`)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{formatVisitType(visit.visit_type)}</h4>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[visit.status] || 'bg-gray-100 text-gray-600'}`}>
              {visit.status.replace('_', ' ')}
            </span>
            {visit.visit_mode === 'ONLINE' && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700">
                Online
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {format(parseISO(visit.scheduled_date), 'MMM d, yyyy')} at {visit.scheduled_time}
            {visit.physiotherapist && ` · Dr. ${visit.physiotherapist.full_name}`}
          </p>
          {visit.chief_complaint && (
            <p className="text-sm text-gray-600 mt-2">{visit.chief_complaint}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
      {visit.notes && visit.notes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">{visit.notes.length} note(s)</span>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-gray-700">{value}</p>
      </div>
    </div>
  );
}

function DischargeModal({
  condition,
  onConfirm,
  onClose,
}: {
  condition: PatientConditionResponseDto;
  onConfirm: (id: string, reason: DischargeReason, summary: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<DischargeReason>('GOALS_MET');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm(condition.id, reason, summary);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-light text-gray-900 mb-1">Discharge Condition</h2>
        <p className="text-sm text-gray-500 mb-6">{condition.condition_name}</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DischargeReason)}
              className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-200"
            >
              {DISCHARGE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Brief discharge summary..."
              className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-200 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Discharging...' : 'Discharge'}
          </button>
        </div>
      </div>
    </div>
  );
}

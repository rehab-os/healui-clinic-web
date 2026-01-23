'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '../../../../store/hooks';
import ApiManager from '../../../../services/api';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Activity,
  DollarSign,
  Package,
  ChevronLeft,
  Edit,
  QrCode,
  Upload,
  Globe,
  Calendar,
  Bed,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Timer,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet,
  CreditCard,
  UserPlus,
  Box,
  AlertTriangle,
  Plus,
  X,
  Save,
  Camera,
  Minus,
  Image,
} from 'lucide-react';
import ClinicQRCodeModal from '../../../../components/molecule/ClinicQRCodeModal';

// Types
interface Clinic {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  total_beds?: number;
  is_active: boolean;
  facilities?: string[];
  specializations?: string[];
  amenities?: string[];
  insurance_accepted?: string[];
  working_hours?: Record<string, any>;
  website_url?: string;
  social_links?: Record<string, string>;
  established_date?: string;
  registration_number?: string;
  created_at: string;
}

interface LiveStatus {
  waiting_count: number;
  in_treatment_count: number;
  completed_today: number;
  no_shows_today: number;
  scheduled_today: number;
  avg_wait_minutes: number;
  avg_session_minutes: number;
  waiting_patients: any[];
  in_treatment_patients: any[];
  upcoming_appointments: any[];
}

interface TeamData {
  total_members: number;
  physiotherapists: number;
  receptionists: number;
  admins: number;
  members: any[];
}

interface FinanceSummary {
  total_revenue: number;
  total_collected: number;
  total_outstanding: number;
  total_advances: number;
  payment_method_breakdown: { method: string; amount: number }[];
  recent_payments: any[];
  outstanding_accounts: any[];
}

interface PatientSummary {
  total_patients: number;
  active_patients: number;
  new_this_month: number;
  with_outstanding: number;
  by_status: { status: string; count: number }[];
  recent_patients: any[];
}

interface EquipmentSummary {
  summary: {
    total_equipment: number;
    working_count: number;
    needs_maintenance_count: number;
    under_repair_count: number;
    out_of_service_count: number;
    total_value: number;
    categories_count: number;
    maintenance_due_soon: number;
    warranty_expiring_soon: number;
  };
  needs_maintenance: Equipment[];
  warranty_expiring: Equipment[];
  categories: { id: string; name: string; equipment_count: number }[];
}

interface Equipment {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  asset_tag?: string;
  purchase_date?: string;
  purchase_price?: number;
  vendor?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  warranty_details?: string;
  location?: string;
  status: 'WORKING' | 'NEEDS_MAINTENANCE' | 'UNDER_REPAIR' | 'OUT_OF_SERVICE' | 'RETIRED';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  maintenance_interval_days?: number;
  image_url?: string;
  notes?: string;
  category?: { id: string; name: string };
}

type TabType = 'overview' | 'live-status' | 'team' | 'patients' | 'finance' | 'equipment';

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.id as string;
  const { userData } = useAppSelector(state => state.user);

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Tab-specific data
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null);
  const [equipmentSummary, setEquipmentSummary] = useState<EquipmentSummary | null>(null);
  const [tabLoading, setTabLoading] = useState(false);

  // File inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClinic();
  }, [clinicId]);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, clinicId]);

  const fetchClinic = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getClinic(clinicId);
      if (response.success) {
        setClinic(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch clinic:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    if (!clinicId) return;

    setTabLoading(true);
    try {
      switch (activeTab) {
        case 'live-status':
          const liveRes = await ApiManager.getClinicLiveStatus(clinicId);
          if (liveRes.success) setLiveStatus(liveRes.data);
          break;
        case 'team':
          const teamRes = await ApiManager.getClinicTeam(clinicId);
          if (teamRes.success) setTeamData(teamRes.data);
          break;
        case 'finance':
          const financeRes = await ApiManager.getClinicFinanceSummary(clinicId);
          if (financeRes.success) setFinanceSummary(financeRes.data);
          break;
        case 'patients':
          const patientRes = await ApiManager.getClinicPatientSummary(clinicId);
          if (patientRes.success) setPatientSummary(patientRes.data);
          break;
        case 'equipment':
          const equipRes = await ApiManager.getEquipmentSummary(clinicId);
          if (equipRes.success) setEquipmentSummary(equipRes.data);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch tab data:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const response = await ApiManager.uploadClinicLogo(clinicId, file);
      if (response.success) {
        setClinic(prev => prev ? { ...prev, logo_url: response.data.logo_url } : null);
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const response = await ApiManager.uploadClinicCover(clinicId, file);
      if (response.success) {
        setClinic(prev => prev ? { ...prev, cover_image_url: response.data.cover_image_url } : null);
      }
    } catch (error) {
      console.error('Failed to upload cover:', error);
    } finally {
      setUploadingCover(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
    { id: 'live-status', label: 'Live Status', icon: <Activity className="h-4 w-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
    { id: 'patients', label: 'Patients', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'finance', label: 'Finance', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <Package className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1e5f79]" />
          <p className="mt-2 text-gray-600">Loading clinic...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Clinic not found</h2>
          <button
            onClick={() => router.push('/dashboard/clinics')}
            className="mt-4 text-[#1e5f79] hover:underline"
          >
            Back to Clinics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-[#1e5f79] to-[#2a7a9b]">
        {clinic.cover_image_url && (
          <img
            src={clinic.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          {uploadingCover ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Image className="h-4 w-4" />
          )}
          {clinic.cover_image_url ? 'Change Cover' : 'Add Cover'}
        </button>
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Clinic header with logo */}
          <div className="flex items-start gap-6 -mt-12 pb-6 relative z-10">
            {/* Logo with upload */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-xl bg-white shadow-lg flex items-center justify-center flex-shrink-0 border-4 border-white overflow-hidden">
                {clinic.logo_url ? (
                  <img src={clinic.logo_url} alt={clinic.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#1e5f79] to-[#2a7a9b] flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 pt-14">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
                    <span className="px-3 py-1 text-xs font-medium text-[#1e5f79] bg-[#eff8ff] rounded-full">
                      {clinic.code}
                    </span>
                    {clinic.is_active && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-[#1e5f79]" />
                      {clinic.city}, {clinic.state}
                    </span>
                    <span className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-[#1e5f79]" />
                      {clinic.phone}
                    </span>
                    {clinic.email && (
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-[#1e5f79]" />
                        {clinic.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/dashboard/clinics')}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back
                  </button>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="p-2 text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-lg transition-colors"
                    title="Patient Registration QR"
                  >
                    <QrCode className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#1e5f79] text-[#1e5f79]'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tabLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#1e5f79]" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab clinic={clinic} onUpdate={fetchClinic} />}
            {activeTab === 'live-status' && <LiveStatusTab data={liveStatus} onRefresh={fetchTabData} />}
            {activeTab === 'team' && <TeamTab data={teamData} />}
            {activeTab === 'patients' && <PatientsTab data={patientSummary} clinicId={clinicId} />}
            {activeTab === 'finance' && <FinanceTab data={financeSummary} />}
            {activeTab === 'equipment' && <EquipmentTab data={equipmentSummary} clinicId={clinicId} onRefresh={fetchTabData} />}
          </>
        )}
      </div>

      {/* QR Modal */}
      <ClinicQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        clinicName={clinic.name}
        clinicCode={clinic.code}
      />
    </div>
  );
}

// ========== OVERVIEW TAB ==========
function OverviewTab({ clinic, onUpdate }: { clinic: Clinic; onUpdate: () => void }) {
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);

  const formatWorkingHours = (hours: Record<string, any>) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map((day) => {
      const schedule = hours[day];
      if (!schedule || !schedule.is_open) {
        return { day: day.charAt(0).toUpperCase() + day.slice(1), hours: 'Closed', isOpen: false };
      }
      const phases = schedule.phases || [];
      if (phases.length === 0) {
        return { day: day.charAt(0).toUpperCase() + day.slice(1), hours: '9:00 AM - 6:00 PM', isOpen: true };
      }
      const formatTime = (time: string) => {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
      };
      const hoursStr = phases.map((p: any) => `${formatTime(p.start_time)} - ${formatTime(p.end_time)}`).join(', ');
      return { day: day.charAt(0).toUpperCase() + day.slice(1), hours: hoursStr, isOpen: true };
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact & Location */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[#1e5f79] mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{clinic.address}</p>
                <p className="text-gray-600">{clinic.city}, {clinic.state} - {clinic.pincode}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#1e5f79]" />
              <span className="text-gray-900">{clinic.phone}</span>
            </div>
            {clinic.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#1e5f79]" />
                <span className="text-gray-900">{clinic.email}</span>
              </div>
            )}
            {clinic.website_url && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-[#1e5f79]" />
                <a href={clinic.website_url} target="_blank" rel="noopener noreferrer" className="text-[#1e5f79] hover:underline">
                  {clinic.website_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {clinic.description && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-gray-600">{clinic.description}</p>
          </div>
        )}

        {/* Facilities & Specializations */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Facilities & Specializations</h3>
          <div className="space-y-4">
            {clinic.total_beds && (
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-[#1e5f79]" />
                <span className="text-gray-900">{clinic.total_beds} Treatment Beds</span>
              </div>
            )}
            {clinic.facilities && clinic.facilities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Facilities</p>
                <div className="flex flex-wrap gap-2">
                  {clinic.facilities.map((facility, idx) => (
                    <span key={idx} className="px-3 py-1 text-sm bg-[#eff8ff] text-[#1e5f79] rounded-full">
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {clinic.specializations && clinic.specializations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {clinic.specializations.map((spec, idx) => (
                    <span key={idx} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {clinic.amenities && clinic.amenities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {clinic.amenities.map((amenity, idx) => (
                    <span key={idx} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Working Hours */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#1e5f79]" />
              Working Hours
            </h3>
            <button
              onClick={() => setShowWorkingHoursModal(true)}
              className="p-2 text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {clinic.working_hours ? (
              formatWorkingHours(clinic.working_hours).map((item) => (
                <div key={item.day} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 font-medium">{item.day}</span>
                  <span className={!item.isOpen ? 'text-red-500 font-medium' : 'text-gray-900'}>
                    {item.hours}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No working hours set</p>
            )}
          </div>
        </div>

        {/* Insurance */}
        {clinic.insurance_accepted && clinic.insurance_accepted.length > 0 && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1e5f79]" />
              Insurance Accepted
            </h3>
            <div className="space-y-2">
              {clinic.insurance_accepted.map((insurance, idx) => (
                <div key={idx} className="text-sm text-gray-700">{insurance}</div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Info */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Info</h3>
          <div className="space-y-3 text-sm">
            {clinic.registration_number && (
              <div>
                <span className="text-gray-500">Registration No:</span>
                <p className="text-gray-900 font-medium">{clinic.registration_number}</p>
              </div>
            )}
            {clinic.established_date && (
              <div>
                <span className="text-gray-500">Established:</span>
                <p className="text-gray-900 font-medium">
                  {new Date(clinic.established_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Created:</span>
              <p className="text-gray-900 font-medium">
                {new Date(clinic.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Working Hours Modal */}
      <WorkingHoursModal
        isOpen={showWorkingHoursModal}
        onClose={() => setShowWorkingHoursModal(false)}
        clinicId={clinic.id}
        currentHours={clinic.working_hours}
        onSave={onUpdate}
      />
    </div>
  );
}

// ========== WORKING HOURS MODAL ==========
function WorkingHoursModal({
  isOpen,
  onClose,
  clinicId,
  currentHours,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  currentHours?: Record<string, any>;
  onSave: () => void;
}) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<Record<string, any>>(() => {
    const defaultHours: Record<string, any> = {};
    days.forEach(day => {
      defaultHours[day] = currentHours?.[day] || {
        is_open: day !== 'sunday',
        phases: [{ start_time: '09:00', end_time: '18:00' }],
      };
    });
    return defaultHours;
  });

  const handleToggleDay = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], is_open: !prev[day].is_open },
    }));
  };

  const handleTimeChange = (day: string, phaseIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        phases: prev[day].phases.map((phase: any, idx: number) =>
          idx === phaseIndex ? { ...phase, [field]: value } : phase
        ),
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await ApiManager.updateClinic(clinicId, { working_hours: hours });
      if (response.success) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save working hours:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Working Hours</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {days.map(day => (
            <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-24">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours[day]?.is_open}
                    onChange={() => handleToggleDay(day)}
                    className="w-4 h-4 text-[#1e5f79] rounded"
                  />
                  <span className="font-medium capitalize">{day}</span>
                </label>
              </div>
              {hours[day]?.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[day]?.phases?.[0]?.start_time || '09:00'}
                    onChange={(e) => handleTimeChange(day, 0, 'start_time', e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours[day]?.phases?.[0]?.end_time || '18:00'}
                    onChange={(e) => handleTimeChange(day, 0, 'end_time', e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-red-500">Closed</span>
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#174a5c] transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== LIVE STATUS TAB ==========
function LiveStatusTab({ data, onRefresh }: { data: LiveStatus | null; onRefresh: () => void }) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Waiting" value={data.waiting_count} color="yellow" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="In Treatment" value={data.in_treatment_count} color="green" />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Completed" value={data.completed_today} color="blue" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="No Shows" value={data.no_shows_today} color="red" />
        <StatCard icon={<Timer className="h-5 w-5" />} label="Avg Wait" value={`${data.avg_wait_minutes}m`} color="purple" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Avg Session" value={`${data.avg_session_minutes}m`} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Room */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
            Waiting Room ({data.waiting_count})
          </h3>
          {data.waiting_patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patients waiting</p>
          ) : (
            <div className="space-y-3">
              {data.waiting_patients.map((patient: any) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{patient.patient_name}</p>
                    <p className="text-sm text-gray-500">{patient.visit_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-600">{patient.wait_minutes} min</p>
                    <p className="text-xs text-gray-500">waiting</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* In Treatment */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            In Treatment ({data.in_treatment_count})
          </h3>
          {data.in_treatment_patients.length === 0 ? (
            <p className="text-sm text-gray-500">No active treatments</p>
          ) : (
            <div className="space-y-3">
              {data.in_treatment_patients.map((patient: any) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{patient.patient_name}</p>
                    <p className="text-sm text-gray-500">with {patient.physiotherapist_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{patient.session_minutes} min</p>
                    <p className="text-xs text-gray-500">in session</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
        {data.upcoming_appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming appointments</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcoming_appointments.map((apt: any) => (
              <div key={apt.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{apt.patient_name}</p>
                <p className="text-sm text-gray-500">{apt.scheduled_time} - {apt.visit_type}</p>
                <p className="text-xs text-gray-400 mt-1">with {apt.physiotherapist_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== TEAM TAB ==========
function TeamTab({ data }: { data: TeamData | null }) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Members" value={data.total_members} color="blue" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Physiotherapists" value={data.physiotherapists} color="green" />
        <StatCard icon={<UserCheck className="h-5 w-5" />} label="Receptionists" value={data.receptionists} color="purple" />
        <StatCard icon={<Shield className="h-5 w-5" />} label="Admins" value={data.admins} color="orange" />
      </div>

      {/* Team list */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
        {data.members.length === 0 ? (
          <p className="text-sm text-gray-500">No team members</p>
        ) : (
          <div className="space-y-4">
            {data.members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#1e5f79] flex items-center justify-center text-white font-medium">
                    {member.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.full_name}</p>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    member.role === 'PHYSIOTHERAPIST' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {member.role}
                  </span>
                  {member.is_admin && (
                    <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== PATIENTS TAB ==========
function PatientsTab({ data, clinicId }: { data: PatientSummary | null; clinicId: string }) {
  const router = useRouter();

  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Patients" value={data.total_patients} color="blue" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Active (30d)" value={data.active_patients} color="green" />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="New This Month" value={data.new_this_month} color="purple" />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="With Outstanding" value={data.with_outstanding} color="orange" />
      </div>

      {/* Recent patients */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Patients</h3>
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="text-sm text-[#1e5f79] hover:underline"
          >
            View All
          </button>
        </div>
        {data.recent_patients.length === 0 ? (
          <p className="text-sm text-gray-500">No patients yet</p>
        ) : (
          <div className="space-y-3">
            {data.recent_patients.map((patient: any) => (
              <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{patient.full_name}</p>
                  <p className="text-sm text-gray-500">{patient.patient_code} - {patient.phone}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  patient.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {patient.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== FINANCE TAB ==========
function FinanceTab({ data }: { data: FinanceSummary | null }) {
  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Revenue" value={formatCurrency(data.total_revenue)} color="blue" />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Collected" value={formatCurrency(data.total_collected)} color="green" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="Outstanding" value={formatCurrency(data.total_outstanding)} color="orange" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Advances" value={formatCurrency(data.total_advances)} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          {data.recent_payments.length === 0 ? (
            <p className="text-sm text-gray-500">No recent payments</p>
          ) : (
            <div className="space-y-3">
              {data.recent_payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.patient_name}</p>
                    <p className="text-sm text-gray-500">{payment.payment_method} - {payment.payment_for}</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outstanding Accounts */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Accounts</h3>
          {data.outstanding_accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No outstanding accounts</p>
          ) : (
            <div className="space-y-3">
              {data.outstanding_accounts.map((account: any) => (
                <div key={account.patient_id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{account.patient_name}</p>
                    <p className="text-sm text-gray-500">
                      Last payment: {account.last_payment_date ? new Date(account.last_payment_date).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <p className="font-semibold text-orange-600">{formatCurrency(account.outstanding_balance)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== EQUIPMENT TAB ==========
function EquipmentTab({ data, clinicId, onRefresh }: { data: EquipmentSummary | null; clinicId: string; onRefresh: () => void }) {
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<Equipment | null>(null);
  const [showEquipmentDetail, setShowEquipmentDetail] = useState<Equipment | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
  }, [clinicId]);

  const fetchEquipment = async () => {
    try {
      setLoadingEquipment(true);
      const response = await ApiManager.getEquipment(clinicId, undefined, filterStatus || undefined);
      if (response.success) {
        setEquipment(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await ApiManager.getEquipmentCategories(clinicId);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [filterStatus]);

  const handleRefresh = () => {
    fetchEquipment();
    fetchCategories();
    onRefresh();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORKING': return 'bg-green-100 text-green-700';
      case 'NEEDS_MAINTENANCE': return 'bg-yellow-100 text-yellow-700';
      case 'UNDER_REPAIR': return 'bg-blue-100 text-blue-700';
      case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-700';
      case 'RETIRED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'FAIR': return 'text-yellow-600';
      case 'POOR': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ');

  if (!data) return <div className="text-center py-12 text-gray-500">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="WORKING">Working</option>
            <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="px-4 py-2 text-sm text-[#1e5f79] border border-[#1e5f79] rounded-lg hover:bg-[#1e5f79]/10 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
          <button
            onClick={() => setShowAddEquipmentModal(true)}
            className="px-4 py-2 text-sm text-white bg-[#1e5f79] rounded-lg hover:bg-[#174a5c] transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Box className="h-5 w-5" />} label="Total Equipment" value={data.summary.total_equipment} color="blue" />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Working" value={data.summary.working_count} color="green" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Needs Maintenance" value={data.summary.needs_maintenance_count} color="yellow" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Under Repair" value={data.summary.under_repair_count} color="blue" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Out of Service" value={data.summary.out_of_service_count} color="red" />
      </div>

      {/* Alerts */}
      {(data.summary.maintenance_due_soon > 0 || data.summary.warranty_expiring_soon > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.summary.maintenance_due_soon > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Maintenance Due Soon</p>
                  <p className="text-sm text-yellow-600">{data.summary.maintenance_due_soon} equipment need maintenance within 7 days</p>
                </div>
              </div>
            </div>
          )}
          {data.summary.warranty_expiring_soon > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Warranty Expiring</p>
                  <p className="text-sm text-orange-600">{data.summary.warranty_expiring_soon} equipment warranties expire within 30 days</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equipment List */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Equipment & Machines</h3>
          <button
            onClick={handleRefresh}
            className="p-2 text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loadingEquipment ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#1e5f79]" />
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-8">
            <Box className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No equipment registered yet</p>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="mt-4 text-[#1e5f79] hover:underline"
            >
              Add your first equipment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {equipment.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setShowEquipmentDetail(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {formatStatus(item.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {item.brand && (
                        <div>
                          <span className="text-gray-500">Brand:</span>
                          <span className="ml-1 text-gray-900">{item.brand}</span>
                        </div>
                      )}
                      {item.model && (
                        <div>
                          <span className="text-gray-500">Model:</span>
                          <span className="ml-1 text-gray-900">{item.model}</span>
                        </div>
                      )}
                      {item.location && (
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-1 text-gray-900">{item.location}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Condition:</span>
                        <span className={`ml-1 font-medium ${getConditionColor(item.condition)}`}>{item.condition}</span>
                      </div>
                    </div>
                    {item.next_maintenance_due && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Next Maintenance:</span>
                        <span className={`ml-1 ${new Date(item.next_maintenance_due) <= new Date() ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(item.next_maintenance_due).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMaintenanceModal(item);
                    }}
                    className="px-3 py-1.5 text-sm text-[#1e5f79] border border-[#1e5f79] rounded-lg hover:bg-[#1e5f79]/10 transition-colors"
                  >
                    Log Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories yet. Add categories like "Electrotherapy", "Exercise Equipment", "Treatment Beds", etc.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="font-medium text-gray-900">{cat.name}</p>
                <p className="text-2xl font-bold text-[#1e5f79]">
                  {equipment.filter(e => e.category?.id === cat.id).length}
                </p>
                <p className="text-sm text-gray-500">items</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEquipmentModal
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        clinicId={clinicId}
        categories={categories}
        onSave={handleRefresh}
      />

      <AddEquipmentCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        clinicId={clinicId}
        onSave={handleRefresh}
      />

      {showMaintenanceModal && (
        <MaintenanceModal
          isOpen={!!showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(null)}
          clinicId={clinicId}
          equipment={showMaintenanceModal}
          onSave={handleRefresh}
        />
      )}

      {showEquipmentDetail && (
        <EquipmentDetailModal
          isOpen={!!showEquipmentDetail}
          onClose={() => setShowEquipmentDetail(null)}
          equipment={showEquipmentDetail}
          onLogMaintenance={() => {
            setShowEquipmentDetail(null);
            setShowMaintenanceModal(showEquipmentDetail);
          }}
        />
      )}
    </div>
  );
}

// ========== ADD EQUIPMENT MODAL ==========
function AddEquipmentModal({
  isOpen,
  onClose,
  clinicId,
  categories,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  categories: any[];
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    brand: '',
    model: '',
    serial_number: '',
    location: '',
    purchase_date: '',
    purchase_price: '',
    warranty_end_date: '',
    condition: 'GOOD',
    status: 'WORKING',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = {
        ...form,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : undefined,
        category_id: form.category_id || undefined,
        purchase_date: form.purchase_date || undefined,
        warranty_end_date: form.warranty_end_date || undefined,
      };
      const response = await ApiManager.createEquipment(clinicId, data);
      if (response.success) {
        onSave();
        onClose();
        setForm({
          name: '',
          category_id: '',
          brand: '',
          model: '',
          serial_number: '',
          location: '',
          purchase_date: '',
          purchase_price: '',
          warranty_end_date: '',
          condition: 'GOOD',
          status: 'WORKING',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Failed to create equipment:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Equipment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Ultrasound Machine US-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Treatment Room 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Chattanooga"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., US-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Serial number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="WORKING">Working</option>
                <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
                <option value="UNDER_REPAIR">Under Repair</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
              <input
                type="number"
                value={form.purchase_price}
                onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty End Date</label>
              <input
                type="date"
                value={form.warranty_end_date}
                onChange={(e) => setForm({ ...form, warranty_end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Additional notes about this equipment"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name}
              className="px-4 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#174a5c] transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== ADD EQUIPMENT CATEGORY MODAL ==========
function AddEquipmentCategoryModal({
  isOpen,
  onClose,
  clinicId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await ApiManager.createEquipmentCategory(clinicId, { name, description });
      if (response.success) {
        onSave();
        onClose();
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-md w-full mx-4">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Equipment Category</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Electrotherapy, Exercise Equipment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name}
              className="px-4 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#174a5c] transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== MAINTENANCE MODAL ==========
function MaintenanceModal({
  isOpen,
  onClose,
  clinicId,
  equipment,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  equipment: Equipment;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    maintenance_type: 'ROUTINE',
    performed_date: new Date().toISOString().split('T')[0],
    description: '',
    performed_by_name: '',
    cost: '',
    status_after: equipment.status,
    next_maintenance_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = {
        ...form,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        next_maintenance_date: form.next_maintenance_date || undefined,
      };
      const response = await ApiManager.addMaintenanceLog(clinicId, equipment.id, data);

      if (response.success) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to log maintenance:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Log Maintenance - {equipment.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type *</label>
              <select
                value={form.maintenance_type}
                onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="ROUTINE">Routine</option>
                <option value="REPAIR">Repair</option>
                <option value="CALIBRATION">Calibration</option>
                <option value="CLEANING">Cleaning</option>
                <option value="INSPECTION">Inspection</option>
                <option value="REPLACEMENT">Part Replacement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.performed_date}
                onChange={(e) => setForm({ ...form, performed_date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="What was done during this maintenance?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
              <input
                type="text"
                value={form.performed_by_name}
                onChange={(e) => setForm({ ...form, performed_by_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Technician name or vendor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status After Maintenance</label>
              <select
                value={form.status_after}
                onChange={(e) => setForm({ ...form, status_after: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="WORKING">Working</option>
                <option value="NEEDS_MAINTENANCE">Still Needs Maintenance</option>
                <option value="UNDER_REPAIR">Under Repair</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Date</label>
              <input
                type="date"
                value={form.next_maintenance_date}
                onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#174a5c] transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Log Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== EQUIPMENT DETAIL MODAL ==========
function EquipmentDetailModal({
  isOpen,
  onClose,
  equipment,
  onLogMaintenance,
}: {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  onLogMaintenance: () => void;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORKING': return 'bg-green-100 text-green-700';
      case 'NEEDS_MAINTENANCE': return 'bg-yellow-100 text-yellow-700';
      case 'UNDER_REPAIR': return 'bg-blue-100 text-blue-700';
      case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-700';
      case 'RETIRED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{equipment.name}</h2>
            <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(equipment.status)}`}>
              {equipment.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            {equipment.brand && (
              <div>
                <p className="text-sm text-gray-500">Brand</p>
                <p className="font-medium">{equipment.brand}</p>
              </div>
            )}
            {equipment.model && (
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{equipment.model}</p>
              </div>
            )}
            {equipment.serial_number && (
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="font-medium">{equipment.serial_number}</p>
              </div>
            )}
            {equipment.location && (
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{equipment.location}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Condition</p>
              <p className="font-medium">{equipment.condition}</p>
            </div>
            {equipment.category && (
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{equipment.category.name}</p>
              </div>
            )}
          </div>

          {/* Purchase Info */}
          {(equipment.purchase_date || equipment.purchase_price || equipment.vendor) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Purchase Information</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {equipment.purchase_date && (
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p className="font-medium">{new Date(equipment.purchase_date).toLocaleDateString()}</p>
                  </div>
                )}
                {equipment.purchase_price && (
                  <div>
                    <p className="text-sm text-gray-500">Purchase Price</p>
                    <p className="font-medium">{formatCurrency(equipment.purchase_price)}</p>
                  </div>
                )}
                {equipment.vendor && (
                  <div>
                    <p className="text-sm text-gray-500">Vendor</p>
                    <p className="font-medium">{equipment.vendor}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warranty Info */}
          {equipment.warranty_end_date && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Warranty</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Warranty Expires</p>
                    <p className={`font-medium ${new Date(equipment.warranty_end_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(equipment.warranty_end_date).toLocaleDateString()}
                    </p>
                  </div>
                  {new Date(equipment.warranty_end_date) >= new Date() ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Active</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">Expired</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Maintenance</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              {equipment.last_maintenance_date && (
                <div>
                  <p className="text-sm text-gray-500">Last Maintenance</p>
                  <p className="font-medium">{new Date(equipment.last_maintenance_date).toLocaleDateString()}</p>
                </div>
              )}
              {equipment.next_maintenance_due && (
                <div>
                  <p className="text-sm text-gray-500">Next Maintenance Due</p>
                  <p className={`font-medium ${new Date(equipment.next_maintenance_due) <= new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(equipment.next_maintenance_due).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {equipment.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
              <p className="text-gray-600">{equipment.notes}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onLogMaintenance}
            className="px-4 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#174a5c] transition-colors"
          >
            Log Maintenance
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== STAT CARD COMPONENT ==========
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

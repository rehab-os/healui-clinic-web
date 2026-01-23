'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  IndianRupee,
  Users,
  Calendar,
  Activity,
  Building2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import {
  KPICard,
  SimpleBarChart,
  AppointmentList,
  OutstandingList,
  ClinicComparisonTable,
  PatientsAttention,
  SessionsEndingSoon,
} from '../../components/dashboard';
import ApiManager from '../../services/api';

// Types for API responses
interface OrgSummary {
  revenueThisMonth: number;
  revenueTrend: number;
  totalPatients: number;
  totalOutstanding: number;
  activeCases: number;
  totalClinics: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  collections: number;
}

interface ClinicComparison {
  clinicId: string;
  clinicName: string;
  patients: number;
  revenue: number;
  outstanding: number;
  visits: number;
}

interface OutstandingPatient {
  patientId: string;
  patientName: string;
  clinicName?: string;
  outstanding: number;
  lastVisitDate: string;
}

interface ClinicToday {
  totalAppointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  collectedToday: number;
  newPatientsToday: number;
  totalOutstanding: number;
}

interface TodayAppointment {
  visitId: string;
  patientName: string;
  patientCode: string;
  scheduledTime: string;
  visitType: string;
  physiotherapistName: string;
  status: string;
  duration: number;
}

interface WeeklyCollection {
  day: string;
  collections: number;
}

interface SessionEnding {
  patientId: string;
  patientName: string;
  packName: string;
  sessionsRemaining: number;
  totalSessions: number;
  conditionName?: string;
}

interface PhysioSummary {
  todayAppointments: number;
  completedToday: number;
  pendingToday: number;
  activePatients: number;
  patientsNeedingAttention: number;
}

interface PhysioScheduleItem {
  visitId: string;
  patientName: string;
  patientCode: string;
  scheduledTime: string;
  visitType: string;
  conditionName?: string;
  status: string;
  duration: number;
  sessionsRemaining?: number;
}

interface PatientAttention {
  patientId: string;
  patientName: string;
  reason: string;
  lastVisitDate?: string;
  conditionName?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function Dashboard() {
  const { userData, currentClinic, currentContext } = useAppSelector((state) => state.user);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Organization data
  const [orgSummary, setOrgSummary] = useState<OrgSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [clinicComparison, setClinicComparison] = useState<ClinicComparison[]>([]);
  const [orgOutstanding, setOrgOutstanding] = useState<OutstandingPatient[]>([]);

  // Clinic data
  const [clinicToday, setClinicToday] = useState<ClinicToday | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [weeklyCollections, setWeeklyCollections] = useState<WeeklyCollection[]>([]);
  const [sessionsEnding, setSessionsEnding] = useState<SessionEnding[]>([]);
  const [clinicOutstanding, setClinicOutstanding] = useState<OutstandingPatient[]>([]);

  // Physio data
  const [physioSummary, setPhysioSummary] = useState<PhysioSummary | null>(null);
  const [physioSchedule, setPhysioSchedule] = useState<PhysioScheduleItem[]>([]);
  const [patientsAttention, setPatientsAttention] = useState<PatientAttention[]>([]);

  // Determine dashboard mode
  const isOrgOwner = userData?.organization?.is_owner && !currentClinic;
  const isClinicAdmin = currentClinic?.is_admin || currentClinic?.role === 'receptionist' || currentClinic?.role === 'manager';

  const dashboardMode = useMemo(() => {
    if (!currentClinic && userData?.organization?.is_owner) return 'org';
    if (isClinicAdmin) return 'clinic';
    return 'physio';
  }, [currentClinic, userData, isClinicAdmin]);

  const organizationId = userData?.organization?.id;
  const clinicId = currentClinic?.id;

  // Load Organization Dashboard Data
  const loadOrgDashboard = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [summaryRes, revenueRes, clinicsRes, outstandingRes] = await Promise.all([
        ApiManager.getOrgDashboardSummary(organizationId),
        ApiManager.getOrgMonthlyRevenue(organizationId, 6),
        ApiManager.getOrgClinicComparison(organizationId),
        ApiManager.getOrgOutstandingPatients(organizationId, 10),
      ]);

      if (summaryRes.success) setOrgSummary(summaryRes.data);
      if (revenueRes.success) setMonthlyRevenue(revenueRes.data);
      if (clinicsRes.success) setClinicComparison(clinicsRes.data);
      if (outstandingRes.success) setOrgOutstanding(outstandingRes.data);
    } catch (error) {
      console.error('Failed to load org dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Load Clinic Dashboard Data
  const loadClinicDashboard = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [todayRes, appointmentsRes, collectionsRes, sessionsRes, outstandingRes] = await Promise.all([
        ApiManager.getClinicDashboardToday(clinicId),
        ApiManager.getClinicAppointmentsToday(clinicId),
        ApiManager.getClinicWeeklyCollections(clinicId),
        ApiManager.getClinicSessionsEnding(clinicId, 3),
        ApiManager.getClinicOutstandingPatients(clinicId, 10),
      ]);

      if (todayRes.success) setClinicToday(todayRes.data);
      if (appointmentsRes.success) setTodayAppointments(appointmentsRes.data);
      if (collectionsRes.success) setWeeklyCollections(collectionsRes.data);
      if (sessionsRes.success) setSessionsEnding(sessionsRes.data);
      if (outstandingRes.success) setClinicOutstanding(outstandingRes.data);
    } catch (error) {
      console.error('Failed to load clinic dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // Load Physio Dashboard Data
  const loadPhysioDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, scheduleRes, attentionRes] = await Promise.all([
        ApiManager.getPhysioDashboardSummary(clinicId),
        ApiManager.getPhysioSchedule(clinicId),
        ApiManager.getPhysioPatientsAttention(clinicId),
      ]);

      if (summaryRes.success) setPhysioSummary(summaryRes.data);
      if (scheduleRes.success) setPhysioSchedule(scheduleRes.data);
      if (attentionRes.success) setPatientsAttention(attentionRes.data);
    } catch (error) {
      console.error('Failed to load physio dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // Load data based on mode
  useEffect(() => {
    if (dashboardMode === 'org' && organizationId) {
      loadOrgDashboard();
    } else if (dashboardMode === 'clinic' && clinicId) {
      loadClinicDashboard();
    } else if (dashboardMode === 'physio') {
      loadPhysioDashboard();
    }
  }, [dashboardMode, organizationId, clinicId, loadOrgDashboard, loadClinicDashboard, loadPhysioDashboard]);

  // Get current date info
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  // Access denied for org view without permission
  if (dashboardMode === 'org' && !userData?.organization?.is_owner) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view organization analytics.</p>
        </div>
      </div>
    );
  }

  // No clinic selected
  if (!currentClinic && !userData?.organization?.is_owner) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Clinic Selected</h2>
          <p className="text-gray-500">Please select a clinic from the header to view the dashboard.</p>
        </div>
      </div>
    );
  }

  // Helper function to calculate days since visit
  const getDaysSinceVisit = (dateStr: string) => {
    const visitDate = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {dashboardMode === 'org' ? 'Organization Overview' :
                 dashboardMode === 'clinic' ? `${currentClinic?.name || 'Clinic'} Dashboard` :
                 `Welcome, Dr. ${userData?.name?.split(' ')[0] || 'Doctor'}`}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-brand-teal" />}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ============ ORGANIZATION OWNER DASHBOARD ============ */}
        {dashboardMode === 'org' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Revenue This Month"
                value={`₹${((orgSummary?.revenueThisMonth || 0) / 1000).toFixed(0)}K`}
                icon={IndianRupee}
                color="green"
                trend={orgSummary?.revenueTrend ? { value: Math.round(orgSummary.revenueTrend), label: 'vs last month' } : undefined}
                loading={loading}
              />
              <KPICard
                title="Total Patients"
                value={(orgSummary?.totalPatients || 0).toLocaleString()}
                icon={Users}
                color="blue"
                loading={loading}
              />
              <KPICard
                title="Outstanding"
                value={`₹${((orgSummary?.totalOutstanding || 0) / 1000).toFixed(0)}K`}
                icon={AlertCircle}
                color="red"
                loading={loading}
              />
              <KPICard
                title="Active Cases"
                value={orgSummary?.activeCases || 0}
                icon={Activity}
                color="teal"
                loading={loading}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <SimpleBarChart
                  data={monthlyRevenue.map(m => ({ name: m.month, value: m.collections }))}
                  color="#00897B"
                  height={220}
                  loading={loading}
                />
              </div>

              {/* Clinic Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Clinic Performance</h3>
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <ClinicComparisonTable
                  clinics={clinicComparison.map(c => ({
                    clinicId: c.clinicId,
                    clinicName: c.clinicName,
                    patients: c.patients,
                    revenueThisMonth: c.revenue,
                    outstanding: c.outstanding,
                  }))}
                  loading={loading}
                />
              </div>
            </div>

            {/* Outstanding Payments */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Outstanding Payments</h3>
              </div>
              <OutstandingList
                patients={orgOutstanding.map(p => ({
                  patientId: p.patientId,
                  patientName: p.patientName,
                  clinicName: p.clinicName || '',
                  amount: p.outstanding,
                  lastVisitDate: p.lastVisitDate,
                  daysSinceVisit: getDaysSinceVisit(p.lastVisitDate),
                }))}
                showClinic
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* ============ CLINIC ADMIN DASHBOARD ============ */}
        {dashboardMode === 'clinic' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Today's Appointments"
                value={`${clinicToday?.completed || 0}/${clinicToday?.totalAppointments || 0}`}
                subtitle={`${clinicToday?.pending || 0} pending`}
                icon={Calendar}
                color="blue"
                loading={loading}
              />
              <KPICard
                title="Collected Today"
                value={`₹${(clinicToday?.collectedToday || 0).toLocaleString('en-IN')}`}
                icon={IndianRupee}
                color="green"
                loading={loading}
              />
              <KPICard
                title="New Patients"
                value={clinicToday?.newPatientsToday || 0}
                icon={Users}
                color="purple"
                loading={loading}
              />
              <KPICard
                title="Outstanding"
                value={`₹${((clinicToday?.totalOutstanding || 0) / 1000).toFixed(1)}K`}
                icon={AlertCircle}
                color="red"
                loading={loading}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Appointments - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Today's Appointments</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" /> {clinicToday?.completed || 0}
                    </span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <Clock className="h-4 w-4" /> {clinicToday?.pending || 0}
                    </span>
                  </div>
                </div>
                <AppointmentList
                  appointments={todayAppointments.map(a => ({
                    id: a.visitId,
                    time: a.scheduledTime,
                    patientName: a.patientName,
                    patientCode: a.patientCode,
                    physioName: a.physiotherapistName,
                    status: a.status as 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED',
                    conditionName: a.visitType,
                  }))}
                  showPhysio
                  loading={loading}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Weekly Collections */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">This Week's Collections</h3>
                  <SimpleBarChart
                    data={weeklyCollections.map(w => ({ name: w.day, value: w.collections }))}
                    color="#00897B"
                    height={160}
                    loading={loading}
                  />
                </div>

                {/* Sessions Ending Soon */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Sessions Ending Soon</h3>
                  <SessionsEndingSoon
                    patients={sessionsEnding.map(s => ({
                      patientId: s.patientId,
                      patientName: s.patientName,
                      patientCode: '',
                      sessionsLeft: s.sessionsRemaining,
                      packName: s.packName,
                      conditionName: s.conditionName,
                    }))}
                    loading={loading}
                  />
                </div>
              </div>
            </div>

            {/* Outstanding */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Outstanding Payments</h3>
              <OutstandingList
                patients={clinicOutstanding.map(p => ({
                  patientId: p.patientId,
                  patientName: p.patientName,
                  amount: p.outstanding,
                  lastVisitDate: p.lastVisitDate,
                  daysSinceVisit: getDaysSinceVisit(p.lastVisitDate),
                }))}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* ============ PHYSIOTHERAPIST DASHBOARD ============ */}
        {dashboardMode === 'physio' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <KPICard
                title="Today"
                value={`${physioSummary?.completedToday || 0}/${physioSummary?.todayAppointments || 0}`}
                subtitle="patients"
                icon={Calendar}
                color="teal"
                loading={loading}
              />
              <KPICard
                title="Pending"
                value={physioSummary?.pendingToday || 0}
                subtitle="remaining"
                icon={TrendingUp}
                color="blue"
                loading={loading}
              />
              <KPICard
                title="Active Patients"
                value={physioSummary?.activePatients || 0}
                subtitle="under care"
                icon={Users}
                color="green"
                loading={loading}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* My Schedule - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">My Schedule Today</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" /> {physioSummary?.completedToday || 0}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-4 w-4" /> {physioSummary?.pendingToday || 0}
                    </span>
                  </div>
                </div>
                <AppointmentList
                  appointments={physioSchedule.map(s => ({
                    id: s.visitId,
                    time: s.scheduledTime,
                    patientName: s.patientName,
                    patientCode: s.patientCode,
                    status: s.status as 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED',
                    conditionName: s.conditionName,
                    sessionNumber: s.sessionsRemaining ? undefined : undefined,
                    totalSessions: s.sessionsRemaining,
                  }))}
                  loading={loading}
                  onStartSession={(id) => console.log('Start session:', id)}
                />
              </div>

              {/* Patients Needing Attention */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Needs Attention</h3>
                <PatientsAttention
                  lastSession={patientsAttention
                    .filter(p => p.reason.includes('session'))
                    .map(p => ({
                      patientId: p.patientId,
                      patientName: p.patientName,
                      conditionName: p.conditionName || '',
                      sessionsUsed: 0,
                      totalSessions: 0,
                    }))}
                  treatmentGap={patientsAttention
                    .filter(p => p.reason.includes('visit') || p.reason.includes('days'))
                    .map(p => ({
                      patientId: p.patientId,
                      patientName: p.patientName,
                      conditionName: p.conditionName || '',
                      daysSinceVisit: p.lastVisitDate ? getDaysSinceVisit(p.lastVisitDate) : 0,
                    }))}
                  newPatients={[]}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

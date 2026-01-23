// Analytics Types - Mirror backend DTOs
export interface PatientCountDto {
  total: number;
  new: number;
  returning: number;
  active: number;
}

export interface AppointmentSummaryDto {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  confirmed?: number;
  unconfirmed?: number;
}

export interface PatientCategoryDto {
  review: number;
  emergency: number;
  newConsultation: number;
  followUp: number;
  postSurgery: number;
}

export interface ClinicPatientAnalyticsDto {
  today: PatientCountDto & { yesterdayComparison: number };
  thisWeek: PatientCountDto & { lastWeekComparison: number };
  thisMonth: PatientCountDto & { lastMonthComparison: number };
}

export interface ClinicAppointmentAnalyticsDto {
  today: AppointmentSummaryDto;
  tomorrow: AppointmentSummaryDto;
  thisWeek: {
    total: number;
    byDay: Array<{ day: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  thisMonth: {
    total: number;
    trend: number; // percentage change from last month
  };
}

export interface CaseTypeDistributionDto {
  condition: string;
  count: number;
  percentage: number;
  averageDuration: number; // in days
}

export interface PhysiotherapistUtilizationDto {
  physiotherapistId: string;
  name: string;
  totalPatients: number;
  completedSessions: number;
  upcomingSessions: number;
  utilizationRate: number; // percentage
}

export interface ClinicSummaryDto {
  clinicId: string;
  clinicName: string;
  totalPatients: number;
  activeCases: number;
  totalPhysiotherapists: number;
  utilizationRate: number;
  monthlyGrowth: number; // percentage
}

export interface OrganizationOverviewDto {
  totalClinics: number;
  totalPatients: number;
  totalActiveCases: number;
  totalPhysiotherapists: number;
  averageUtilization: number;
}

export interface RecentActivityDto {
  id: string;
  action: string;
  description: string;
  timestamp: string; // ISO string format for Redux serialization
  clinicId?: string;
  clinicName?: string;
}

export interface QuickStatsDto {
  activePatientsNow: number;
  pendingAppointments: number;
  completedToday: number;
  criticalAlerts: number;
}

// Dashboard State Types
export interface DashboardAnalytics {
  // Clinic Analytics
  clinicPatients: ClinicPatientAnalyticsDto | null;
  clinicAppointments: ClinicAppointmentAnalyticsDto | null;
  clinicPatientCategories: PatientCategoryDto | null;
  clinicCaseTypes: CaseTypeDistributionDto[] | null;
  clinicUtilization: PhysiotherapistUtilizationDto[] | null;
  
  // Organization Analytics
  organizationOverview: OrganizationOverviewDto | null;
  organizationClinics: ClinicSummaryDto[] | null;
  
  // Common Analytics
  recentActivities: RecentActivityDto[] | null;
  quickStats: QuickStatsDto | null;
}

export interface AnalyticsLoadingState {
  clinicPatients: boolean;
  clinicAppointments: boolean;
  clinicPatientCategories: boolean;
  clinicCaseTypes: boolean;
  clinicUtilization: boolean;
  organizationOverview: boolean;
  organizationClinics: boolean;
  recentActivities: boolean;
  quickStats: boolean;
}

export interface AnalyticsErrorState {
  clinicPatients: string | null;
  clinicAppointments: string | null;
  clinicPatientCategories: string | null;
  clinicCaseTypes: string | null;
  clinicUtilization: string | null;
  organizationOverview: string | null;
  organizationClinics: string | null;
  recentActivities: string | null;
  quickStats: string | null;
}

// ============ NEW DASHBOARD TYPES ============

// Organization Owner Dashboard
export interface OrgDashboardSummary {
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalPatients: number;
  totalOutstanding: number;
  activeCases: number;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface ClinicComparisonItem {
  clinicId: string;
  clinicName: string;
  patients: number;
  revenueThisMonth: number;
  outstanding: number;
}

export interface OutstandingPatient {
  patientId: string;
  patientName: string;
  clinicId?: string;
  clinicName?: string;
  amount: number;
  lastVisitDate: string;
  daysSinceVisit: number;
}

// Clinic Admin Dashboard
export interface ClinicDashboardToday {
  appointmentsTotal: number;
  appointmentsCompleted: number;
  appointmentsPending: number;
  appointmentsInProgress: number;
  collectedToday: number;
  newPatientsToday: number;
  outstandingTotal: number;
}

export interface TodayAppointment {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  physioId: string;
  physioName: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  visitType: string;
  conditionName?: string;
}

export interface WeeklyCollection {
  day: string;
  dayName: string;
  amount: number;
}

export interface SessionEndingSoon {
  patientId: string;
  patientName: string;
  patientCode: string;
  sessionsLeft: number;
  packName: string;
  conditionName?: string;
}

// Physiotherapist Dashboard
export interface PhysioDashboardSummary {
  todayCount: number;
  todayCompleted: number;
  thisMonthCount: number;
  activePatients: number;
}

export interface PhysioScheduleItem {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  conditionName: string;
  sessionNumber: number;
  totalSessions: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  visitType: string;
}

export interface PatientAttention {
  lastSession: Array<{
    patientId: string;
    patientName: string;
    conditionName: string;
    sessionsUsed: number;
    totalSessions: number;
  }>;
  treatmentGap: Array<{
    patientId: string;
    patientName: string;
    conditionName: string;
    daysSinceVisit: number;
    lastVisitDate: string;
  }>;
  newPatients: Array<{
    patientId: string;
    patientName: string;
    createdAt: string;
  }>;
}

// Insights Data
export interface AgeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
}

export interface TopCondition {
  conditionName: string;
  bodyRegion: string;
  count: number;
  percentage: number;
}

export interface BodyRegionData {
  region: string;
  count: number;
  percentage: number;
}

export interface PeakHourData {
  day: string;
  hour: number;
  appointmentCount: number;
}

export interface PatientSourceData {
  source: string;
  count: number;
  percentage: number;
}

export interface PatientTrendData {
  month: string;
  newPatients: number;
  returningVisits: number;
}

export interface InsightsDemographics {
  ageDistribution: AgeDistribution[];
  genderDistribution: GenderDistribution;
}

export interface InsightsConditions {
  topConditions: TopCondition[];
  bodyRegions: BodyRegionData[];
}

export interface InsightsOperations {
  peakHours: PeakHourData[];
  completionRate: number;
  avgSessionsByCondition: Array<{ condition: string; avgSessions: number }>;
  cancellationRate: number;
  noShowRate: number;
}

export interface InsightsPatientSources {
  sources: PatientSourceData[];
}

export interface InsightsPatientTrends {
  trends: PatientTrendData[];
}
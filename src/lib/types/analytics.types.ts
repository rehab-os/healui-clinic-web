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
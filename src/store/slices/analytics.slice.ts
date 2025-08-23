import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DashboardAnalytics,
  AnalyticsLoadingState,
  AnalyticsErrorState,
  ClinicPatientAnalyticsDto,
  ClinicAppointmentAnalyticsDto,
  PatientCategoryDto,
  CaseTypeDistributionDto,
  PhysiotherapistUtilizationDto,
  OrganizationOverviewDto,
  ClinicSummaryDto,
  RecentActivityDto,
  QuickStatsDto
} from '../../lib/types/analytics.types'

interface AnalyticsState {
  data: DashboardAnalytics;
  loading: AnalyticsLoadingState;
  error: AnalyticsErrorState;
}

const initialData: DashboardAnalytics = {
  clinicPatients: null,
  clinicAppointments: null,
  clinicPatientCategories: null,
  clinicCaseTypes: null,
  clinicUtilization: null,
  organizationOverview: null,
  organizationClinics: null,
  recentActivities: null,
  quickStats: null,
}

const initialLoading: AnalyticsLoadingState = {
  clinicPatients: false,
  clinicAppointments: false,
  clinicPatientCategories: false,
  clinicCaseTypes: false,
  clinicUtilization: false,
  organizationOverview: false,
  organizationClinics: false,
  recentActivities: false,
  quickStats: false,
}

const initialError: AnalyticsErrorState = {
  clinicPatients: null,
  clinicAppointments: null,
  clinicPatientCategories: null,
  clinicCaseTypes: null,
  clinicUtilization: null,
  organizationOverview: null,
  organizationClinics: null,
  recentActivities: null,
  quickStats: null,
}

const initialState: AnalyticsState = {
  data: initialData,
  loading: initialLoading,
  error: initialError,
}

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // Clinic Patient Analytics
    setClinicPatientsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.clinicPatients = action.payload
      if (action.payload) {
        state.error.clinicPatients = null
      }
    },
    setClinicPatientsSuccess: (state, action: PayloadAction<ClinicPatientAnalyticsDto>) => {
      state.data.clinicPatients = action.payload
      state.loading.clinicPatients = false
      state.error.clinicPatients = null
    },
    setClinicPatientsError: (state, action: PayloadAction<string>) => {
      state.loading.clinicPatients = false
      state.error.clinicPatients = action.payload
    },

    // Clinic Appointment Analytics
    setClinicAppointmentsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.clinicAppointments = action.payload
      if (action.payload) {
        state.error.clinicAppointments = null
      }
    },
    setClinicAppointmentsSuccess: (state, action: PayloadAction<ClinicAppointmentAnalyticsDto>) => {
      state.data.clinicAppointments = action.payload
      state.loading.clinicAppointments = false
      state.error.clinicAppointments = null
    },
    setClinicAppointmentsError: (state, action: PayloadAction<string>) => {
      state.loading.clinicAppointments = false
      state.error.clinicAppointments = action.payload
    },

    // Clinic Patient Categories
    setClinicPatientCategoriesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.clinicPatientCategories = action.payload
      if (action.payload) {
        state.error.clinicPatientCategories = null
      }
    },
    setClinicPatientCategoriesSuccess: (state, action: PayloadAction<PatientCategoryDto>) => {
      state.data.clinicPatientCategories = action.payload
      state.loading.clinicPatientCategories = false
      state.error.clinicPatientCategories = null
    },
    setClinicPatientCategoriesError: (state, action: PayloadAction<string>) => {
      state.loading.clinicPatientCategories = false
      state.error.clinicPatientCategories = action.payload
    },

    // Clinic Case Types
    setCaseTypesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.clinicCaseTypes = action.payload
      if (action.payload) {
        state.error.clinicCaseTypes = null
      }
    },
    setCaseTypesSuccess: (state, action: PayloadAction<CaseTypeDistributionDto[]>) => {
      state.data.clinicCaseTypes = action.payload
      state.loading.clinicCaseTypes = false
      state.error.clinicCaseTypes = null
    },
    setCaseTypesError: (state, action: PayloadAction<string>) => {
      state.loading.clinicCaseTypes = false
      state.error.clinicCaseTypes = action.payload
    },

    // Clinic Utilization
    setClinicUtilizationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.clinicUtilization = action.payload
      if (action.payload) {
        state.error.clinicUtilization = null
      }
    },
    setClinicUtilizationSuccess: (state, action: PayloadAction<PhysiotherapistUtilizationDto[]>) => {
      state.data.clinicUtilization = action.payload
      state.loading.clinicUtilization = false
      state.error.clinicUtilization = null
    },
    setClinicUtilizationError: (state, action: PayloadAction<string>) => {
      state.loading.clinicUtilization = false
      state.error.clinicUtilization = action.payload
    },

    // Organization Overview
    setOrganizationOverviewLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.organizationOverview = action.payload
      if (action.payload) {
        state.error.organizationOverview = null
      }
    },
    setOrganizationOverviewSuccess: (state, action: PayloadAction<OrganizationOverviewDto>) => {
      state.data.organizationOverview = action.payload
      state.loading.organizationOverview = false
      state.error.organizationOverview = null
    },
    setOrganizationOverviewError: (state, action: PayloadAction<string>) => {
      state.loading.organizationOverview = false
      state.error.organizationOverview = action.payload
    },

    // Organization Clinics
    setOrganizationClinicsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.organizationClinics = action.payload
      if (action.payload) {
        state.error.organizationClinics = null
      }
    },
    setOrganizationClinicsSuccess: (state, action: PayloadAction<ClinicSummaryDto[]>) => {
      state.data.organizationClinics = action.payload
      state.loading.organizationClinics = false
      state.error.organizationClinics = null
    },
    setOrganizationClinicsError: (state, action: PayloadAction<string>) => {
      state.loading.organizationClinics = false
      state.error.organizationClinics = action.payload
    },

    // Recent Activities
    setRecentActivitiesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.recentActivities = action.payload
      if (action.payload) {
        state.error.recentActivities = null
      }
    },
    setRecentActivitiesSuccess: (state, action: PayloadAction<RecentActivityDto[]>) => {
      // Ensure timestamps are serialized as strings
      const serializedActivities = action.payload.map(activity => ({
        ...activity,
        timestamp: typeof activity.timestamp === 'string' 
          ? activity.timestamp 
          : activity.timestamp instanceof Date 
            ? activity.timestamp.toISOString() 
            : new Date(activity.timestamp).toISOString()
      }))
      state.data.recentActivities = serializedActivities
      state.loading.recentActivities = false
      state.error.recentActivities = null
    },
    setRecentActivitiesError: (state, action: PayloadAction<string>) => {
      state.loading.recentActivities = false
      state.error.recentActivities = action.payload
    },

    // Quick Stats
    setQuickStatsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.quickStats = action.payload
      if (action.payload) {
        state.error.quickStats = null
      }
    },
    setQuickStatsSuccess: (state, action: PayloadAction<QuickStatsDto>) => {
      state.data.quickStats = action.payload
      state.loading.quickStats = false
      state.error.quickStats = null
    },
    setQuickStatsError: (state, action: PayloadAction<string>) => {
      state.loading.quickStats = false
      state.error.quickStats = action.payload
    },

    // Clear all data (useful when switching clinics/organizations)
    clearAnalyticsData: (state) => {
      state.data = initialData
      state.loading = initialLoading
      state.error = initialError
    },

    // Clear specific data
    clearClinicData: (state) => {
      state.data.clinicPatients = null
      state.data.clinicAppointments = null
      state.data.clinicPatientCategories = null
      state.data.clinicCaseTypes = null
      state.data.clinicUtilization = null
    },

    clearOrganizationData: (state) => {
      state.data.organizationOverview = null
      state.data.organizationClinics = null
    },
  },
})

export const {
  // Clinic Patient Analytics
  setClinicPatientsLoading,
  setClinicPatientsSuccess,
  setClinicPatientsError,

  // Clinic Appointment Analytics
  setClinicAppointmentsLoading,
  setClinicAppointmentsSuccess,
  setClinicAppointmentsError,

  // Clinic Patient Categories
  setClinicPatientCategoriesLoading,
  setClinicPatientCategoriesSuccess,
  setClinicPatientCategoriesError,

  // Clinic Case Types
  setCaseTypesLoading,
  setCaseTypesSuccess,
  setCaseTypesError,

  // Clinic Utilization
  setClinicUtilizationLoading,
  setClinicUtilizationSuccess,
  setClinicUtilizationError,

  // Organization Overview
  setOrganizationOverviewLoading,
  setOrganizationOverviewSuccess,
  setOrganizationOverviewError,

  // Organization Clinics
  setOrganizationClinicsLoading,
  setOrganizationClinicsSuccess,
  setOrganizationClinicsError,

  // Recent Activities
  setRecentActivitiesLoading,
  setRecentActivitiesSuccess,
  setRecentActivitiesError,

  // Quick Stats
  setQuickStatsLoading,
  setQuickStatsSuccess,
  setQuickStatsError,

  // Clear actions
  clearAnalyticsData,
  clearClinicData,
  clearOrganizationData,
} = analyticsSlice.actions

export default analyticsSlice.reducer
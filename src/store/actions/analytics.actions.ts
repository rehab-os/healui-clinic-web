import { AppDispatch } from '../store'
import ApiManager from '../../services/api'
import {
  setClinicPatientsLoading,
  setClinicPatientsSuccess,
  setClinicPatientsError,
  setClinicAppointmentsLoading,
  setClinicAppointmentsSuccess,
  setClinicAppointmentsError,
  setClinicPatientCategoriesLoading,
  setClinicPatientCategoriesSuccess,
  setClinicPatientCategoriesError,
  setCaseTypesLoading,
  setCaseTypesSuccess,
  setCaseTypesError,
  setClinicUtilizationLoading,
  setClinicUtilizationSuccess,
  setClinicUtilizationError,
  setOrganizationOverviewLoading,
  setOrganizationOverviewSuccess,
  setOrganizationOverviewError,
  setOrganizationClinicsLoading,
  setOrganizationClinicsSuccess,
  setOrganizationClinicsError,
  setRecentActivitiesLoading,
  setRecentActivitiesSuccess,
  setRecentActivitiesError,
  setQuickStatsLoading,
  setQuickStatsSuccess,
  setQuickStatsError,
} from '../slices/analytics.slice'

// Clinic Analytics Actions
export const fetchClinicPatientAnalytics = (clinicId: string) => async (dispatch: AppDispatch) => {
  dispatch(setClinicPatientsLoading(true))
  try {
    const response = await ApiManager.getClinicPatientAnalytics(clinicId)
    if (response.success && response.data) {
      dispatch(setClinicPatientsSuccess(response.data))
    } else {
      dispatch(setClinicPatientsError(response.message || 'Failed to fetch patient analytics'))
    }
  } catch (error: any) {
    dispatch(setClinicPatientsError(error.message || 'Failed to fetch patient analytics'))
  }
}

export const fetchClinicAppointmentAnalytics = (clinicId: string) => async (dispatch: AppDispatch) => {
  dispatch(setClinicAppointmentsLoading(true))
  try {
    const response = await ApiManager.getClinicAppointmentAnalytics(clinicId)
    if (response.success && response.data) {
      dispatch(setClinicAppointmentsSuccess(response.data))
    } else {
      dispatch(setClinicAppointmentsError(response.message || 'Failed to fetch appointment analytics'))
    }
  } catch (error: any) {
    dispatch(setClinicAppointmentsError(error.message || 'Failed to fetch appointment analytics'))
  }
}

export const fetchClinicPatientCategories = (clinicId: string) => async (dispatch: AppDispatch) => {
  dispatch(setClinicPatientCategoriesLoading(true))
  try {
    const response = await ApiManager.getClinicPatientCategories(clinicId)
    if (response.success && response.data) {
      dispatch(setClinicPatientCategoriesSuccess(response.data))
    } else {
      dispatch(setClinicPatientCategoriesError(response.message || 'Failed to fetch patient categories'))
    }
  } catch (error: any) {
    dispatch(setClinicPatientCategoriesError(error.message || 'Failed to fetch patient categories'))
  }
}

export const fetchClinicCaseTypes = (clinicId: string) => async (dispatch: AppDispatch) => {
  dispatch(setCaseTypesLoading(true))
  try {
    const response = await ApiManager.getClinicCaseTypes(clinicId)
    if (response.success && response.data) {
      dispatch(setCaseTypesSuccess(response.data))
    } else {
      dispatch(setCaseTypesError(response.message || 'Failed to fetch case types'))
    }
  } catch (error: any) {
    dispatch(setCaseTypesError(error.message || 'Failed to fetch case types'))
  }
}

export const fetchClinicUtilization = (clinicId: string) => async (dispatch: AppDispatch) => {
  dispatch(setClinicUtilizationLoading(true))
  try {
    const response = await ApiManager.getClinicUtilization(clinicId)
    if (response.success && response.data) {
      dispatch(setClinicUtilizationSuccess(response.data))
    } else {
      dispatch(setClinicUtilizationError(response.message || 'Failed to fetch utilization data'))
    }
  } catch (error: any) {
    dispatch(setClinicUtilizationError(error.message || 'Failed to fetch utilization data'))
  }
}

// Organization Analytics Actions
export const fetchOrganizationOverview = (organizationId: string) => async (dispatch: AppDispatch) => {
  dispatch(setOrganizationOverviewLoading(true))
  try {
    const response = await ApiManager.getOrganizationOverview(organizationId)
    if (response.success && response.data) {
      dispatch(setOrganizationOverviewSuccess(response.data))
    } else {
      dispatch(setOrganizationOverviewError(response.message || 'Failed to fetch organization overview'))
    }
  } catch (error: any) {
    dispatch(setOrganizationOverviewError(error.message || 'Failed to fetch organization overview'))
  }
}

export const fetchOrganizationClinics = (organizationId: string) => async (dispatch: AppDispatch) => {
  dispatch(setOrganizationClinicsLoading(true))
  try {
    const response = await ApiManager.getOrganizationClinicsSummary(organizationId)
    if (response.success && response.data) {
      dispatch(setOrganizationClinicsSuccess(response.data))
    } else {
      dispatch(setOrganizationClinicsError(response.message || 'Failed to fetch clinics data'))
    }
  } catch (error: any) {
    dispatch(setOrganizationClinicsError(error.message || 'Failed to fetch clinics data'))
  }
}

// Common Analytics Actions
export const fetchRecentActivities = (clinicId?: string) => async (dispatch: AppDispatch) => {
  dispatch(setRecentActivitiesLoading(true))
  try {
    const response = await ApiManager.getRecentActivities(clinicId)
    if (response.success && response.data) {
      // Pass data directly - reducer will handle timestamp serialization
      dispatch(setRecentActivitiesSuccess(response.data))
    } else {
      dispatch(setRecentActivitiesError(response.message || 'Failed to fetch recent activities'))
    }
  } catch (error: any) {
    dispatch(setRecentActivitiesError(error.message || 'Failed to fetch recent activities'))
  }
}

export const fetchQuickStats = (clinicId?: string) => async (dispatch: AppDispatch) => {
  dispatch(setQuickStatsLoading(true))
  try {
    const response = await ApiManager.getQuickStats(clinicId)
    if (response.success && response.data) {
      dispatch(setQuickStatsSuccess(response.data))
    } else {
      dispatch(setQuickStatsError(response.message || 'Failed to fetch quick stats'))
    }
  } catch (error: any) {
    dispatch(setQuickStatsError(error.message || 'Failed to fetch quick stats'))
  }
}

// Composite Actions - Load all clinic data
export const loadClinicDashboard = (clinicId: string) => async (dispatch: AppDispatch) => {
  // Load all clinic-specific data
  dispatch(fetchClinicPatientAnalytics(clinicId))
  dispatch(fetchClinicAppointmentAnalytics(clinicId))
  dispatch(fetchClinicPatientCategories(clinicId))
  dispatch(fetchClinicCaseTypes(clinicId))
  dispatch(fetchClinicUtilization(clinicId))
  
  // Load common data
  dispatch(fetchRecentActivities(clinicId))
  dispatch(fetchQuickStats(clinicId))
}

// Composite Actions - Load all organization data
export const loadOrganizationDashboard = (organizationId: string) => async (dispatch: AppDispatch) => {
  // Load organization-specific data
  dispatch(fetchOrganizationOverview(organizationId))
  dispatch(fetchOrganizationClinics(organizationId))
  
  // Load common data (no clinic filter for org admin)
  dispatch(fetchRecentActivities())
  dispatch(fetchQuickStats())
}
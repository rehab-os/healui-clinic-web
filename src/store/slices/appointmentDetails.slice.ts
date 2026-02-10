import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type {
  ClinicalInsightResponseDto,
  ClinicalInsightsListResponseDto,
  AddClinicalInsightDto,
  UpdateClinicalInsightDto,
} from '../../types/clinical-insights.types'
import type {
  TreatmentHistoryResponseDto,
  TreatmentHistoryListResponseDto,
  CompareVersionsResponseDto,
} from '../../types/treatment-history.types'
import type {
  PatientDietaryProfileResponseDto,
  AllContraindicationsResponseDto,
  GenerateDietaryProfileDto,
  UpdateDietaryProfileDto,
  AddContraindicationDto,
} from '../../types/dietary-profile.types'
import type { VisitCondition } from '../../types/condition-types'
import ApiManager from '../../services/api/api.service'

interface AppointmentDetailsState {
  // Appointment data
  appointment: any | null
  patient: any | null
  visitConditions: VisitCondition[]

  // Clinical Insights
  clinicalInsights: {
    data: ClinicalInsightResponseDto[]
    total: number
    limit?: number
    offset?: number
  }

  // Treatment History
  treatmentHistory: {
    data: TreatmentHistoryResponseDto[]
    total: number
    currentVersion?: number
  }

  // Protocol Version Comparison
  versionComparison: CompareVersionsResponseDto | null

  // Dietary Profile
  dietaryProfile: PatientDietaryProfileResponseDto | null
  contraindications: AllContraindicationsResponseDto | null

  // Loading states
  loading: {
    appointment: boolean
    visitConditions: boolean
    clinicalInsights: boolean
    addingInsight: boolean
    treatmentHistory: boolean
    versionComparison: boolean
    dietaryProfile: boolean
    generatingProfile: boolean
    addingContraindication: boolean
  }

  // Error states
  error: {
    appointment: string | null
    visitConditions: string | null
    clinicalInsights: string | null
    addingInsight: string | null
    treatmentHistory: string | null
    versionComparison: string | null
    dietaryProfile: string | null
    generatingProfile: string | null
    addingContraindication: string | null
  }
}

const initialState: AppointmentDetailsState = {
  appointment: null,
  patient: null,
  visitConditions: [],
  clinicalInsights: {
    data: [],
    total: 0,
  },
  treatmentHistory: {
    data: [],
    total: 0,
  },
  versionComparison: null,
  dietaryProfile: null,
  contraindications: null,
  loading: {
    appointment: false,
    visitConditions: false,
    clinicalInsights: false,
    addingInsight: false,
    treatmentHistory: false,
    versionComparison: false,
    dietaryProfile: false,
    generatingProfile: false,
    addingContraindication: false,
  },
  error: {
    appointment: null,
    visitConditions: null,
    clinicalInsights: null,
    addingInsight: null,
    treatmentHistory: null,
    versionComparison: null,
    dietaryProfile: null,
    generatingProfile: null,
    addingContraindication: null,
  },
}

// ========== ASYNC THUNKS ==========

// Fetch appointment details
export const fetchAppointmentDetails = createAsyncThunk(
  'appointmentDetails/fetchAppointment',
  async ({ patientId, appointmentId }: { patientId: string; appointmentId: string }) => {
    const response = await ApiManager.getVisit(appointmentId)
    if (!response.success) throw new Error(response.message || 'Failed to fetch appointment')
    return response.data
  }
)

// Fetch visit conditions
export const fetchVisitConditions = createAsyncThunk(
  'appointmentDetails/fetchVisitConditions',
  async (visitId: string) => {
    const response = await ApiManager.getVisitConditions(visitId)
    if (!response.success) throw new Error(response.message || 'Failed to fetch visit conditions')
    return response.data
  }
)

// Fetch clinical insights
export const fetchClinicalInsights = createAsyncThunk(
  'appointmentDetails/fetchClinicalInsights',
  async ({ patientConditionId, params }: { patientConditionId: string; params?: any }) => {
    const response = await ApiManager.getClinicalInsights(patientConditionId, params)
    if (!response.success) throw new Error(response.message || 'Failed to fetch clinical insights')
    return response.data
  }
)

// Add clinical insight
export const addClinicalInsight = createAsyncThunk(
  'appointmentDetails/addClinicalInsight',
  async ({ patientConditionId, data }: { patientConditionId: string; data: AddClinicalInsightDto }) => {
    const response = await ApiManager.addClinicalInsight(patientConditionId, data)
    if (!response.success) throw new Error(response.message || 'Failed to add clinical insight')
    return response.data
  }
)

// Update clinical insight
export const updateClinicalInsight = createAsyncThunk(
  'appointmentDetails/updateClinicalInsight',
  async ({ insightId, data }: { insightId: string; data: UpdateClinicalInsightDto }) => {
    const response = await ApiManager.updateClinicalInsight(insightId, data)
    if (!response.success) throw new Error(response.message || 'Failed to update clinical insight')
    return response.data
  }
)

// Delete clinical insight
export const deleteClinicalInsight = createAsyncThunk(
  'appointmentDetails/deleteClinicalInsight',
  async (insightId: string) => {
    const response = await ApiManager.deleteClinicalInsight(insightId)
    if (!response.success) throw new Error(response.message || 'Failed to delete clinical insight')
    return insightId
  }
)

// Mark insight as used
export const markInsightAsUsed = createAsyncThunk(
  'appointmentDetails/markInsightAsUsed',
  async ({ insightId, protocolId }: { insightId: string; protocolId: string }) => {
    const response = await ApiManager.markInsightAsUsed(insightId, protocolId)
    if (!response.success) throw new Error(response.message || 'Failed to mark insight as used')
    return response.data
  }
)

// Fetch treatment history
export const fetchTreatmentHistory = createAsyncThunk(
  'appointmentDetails/fetchTreatmentHistory',
  async ({ patientConditionId, params }: { patientConditionId: string; params?: any }) => {
    const response = await ApiManager.getTreatmentHistory(patientConditionId, params)
    if (!response.success) throw new Error(response.message || 'Failed to fetch treatment history')
    return response.data
  }
)

// Compare protocol versions
export const compareProtocolVersions = createAsyncThunk(
  'appointmentDetails/compareProtocolVersions',
  async ({ currentId, previousId }: { currentId: string; previousId: string }) => {
    const response = await ApiManager.compareProtocolVersions(currentId, previousId)
    if (!response.success) throw new Error(response.message || 'Failed to compare protocol versions')
    return response.data
  }
)

// Fetch dietary profile
export const fetchDietaryProfile = createAsyncThunk(
  'appointmentDetails/fetchDietaryProfile',
  async ({ patientId, patientUserId }: { patientId?: string; patientUserId?: string }) => {
    const response = await ApiManager.getDietaryProfile(patientId, patientUserId)
    if (!response.success) throw new Error(response.message || 'Failed to fetch dietary profile')
    return response.data
  }
)

// Generate dietary profile
export const generateDietaryProfile = createAsyncThunk(
  'appointmentDetails/generateDietaryProfile',
  async ({ patientId, patientUserId, data }: { patientId?: string; patientUserId?: string; data: GenerateDietaryProfileDto }) => {
    const response = await ApiManager.generateDietaryProfile(patientId, patientUserId, data)
    if (!response.success) throw new Error(response.message || 'Failed to generate dietary profile')
    return response.data
  }
)

// Update dietary profile
export const updateDietaryProfile = createAsyncThunk(
  'appointmentDetails/updateDietaryProfile',
  async ({ id, data }: { id: string; data: UpdateDietaryProfileDto }) => {
    const response = await ApiManager.updateDietaryProfile(id, data)
    if (!response.success) throw new Error(response.message || 'Failed to update dietary profile')
    return response.data
  }
)

// Add contraindication
export const addContraindication = createAsyncThunk(
  'appointmentDetails/addContraindication',
  async ({ patientId, patientUserId, data }: { patientId?: string; patientUserId?: string; data: AddContraindicationDto }) => {
    const response = await ApiManager.addContraindication(patientId, patientUserId, data)
    if (!response.success) throw new Error(response.message || 'Failed to add contraindication')
    return response.data
  }
)

// Fetch all contraindications
export const fetchAllContraindications = createAsyncThunk(
  'appointmentDetails/fetchAllContraindications',
  async ({ patientId, patientUserId }: { patientId?: string; patientUserId?: string }) => {
    const response = await ApiManager.getAllContraindications(patientId, patientUserId)
    if (!response.success) throw new Error(response.message || 'Failed to fetch contraindications')
    return response.data
  }
)

// Update visit condition phase/goals
export const updateVisitConditionPhaseGoals = createAsyncThunk(
  'appointmentDetails/updateVisitConditionPhaseGoals',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await ApiManager.updateVisitConditionPhaseGoals(id, data)
    if (!response.success) throw new Error(response.message || 'Failed to update phase/goals')
    return response.data
  }
)

// ========== SLICE ==========

export const appointmentDetailsSlice = createSlice({
  name: 'appointmentDetails',
  initialState,
  reducers: {
    // Clear actions
    clearAppointmentDetails: (state) => {
      state.appointment = null
      state.patient = null
      state.visitConditions = []
      state.clinicalInsights = initialState.clinicalInsights
      state.treatmentHistory = initialState.treatmentHistory
      state.versionComparison = null
      state.dietaryProfile = null
      state.contraindications = null
      state.error = initialState.error
    },
    clearClinicalInsights: (state) => {
      state.clinicalInsights = initialState.clinicalInsights
      state.error.clinicalInsights = null
    },
    clearTreatmentHistory: (state) => {
      state.treatmentHistory = initialState.treatmentHistory
      state.error.treatmentHistory = null
    },
    clearVersionComparison: (state) => {
      state.versionComparison = null
      state.error.versionComparison = null
    },
    setPatient: (state, action: PayloadAction<any>) => {
      state.patient = action.payload
    },
  },
  extraReducers: (builder) => {
    // Fetch appointment details
    builder
      .addCase(fetchAppointmentDetails.pending, (state) => {
        state.loading.appointment = true
        state.error.appointment = null
      })
      .addCase(fetchAppointmentDetails.fulfilled, (state, action) => {
        state.loading.appointment = false
        state.appointment = action.payload
      })
      .addCase(fetchAppointmentDetails.rejected, (state, action) => {
        state.loading.appointment = false
        state.error.appointment = action.error.message || 'Failed to fetch appointment'
      })

    // Fetch visit conditions
    builder
      .addCase(fetchVisitConditions.pending, (state) => {
        state.loading.visitConditions = true
        state.error.visitConditions = null
      })
      .addCase(fetchVisitConditions.fulfilled, (state, action) => {
        state.loading.visitConditions = false
        state.visitConditions = action.payload
      })
      .addCase(fetchVisitConditions.rejected, (state, action) => {
        state.loading.visitConditions = false
        state.error.visitConditions = action.error.message || 'Failed to fetch visit conditions'
      })

    // Fetch clinical insights
    builder
      .addCase(fetchClinicalInsights.pending, (state) => {
        state.loading.clinicalInsights = true
        state.error.clinicalInsights = null
      })
      .addCase(fetchClinicalInsights.fulfilled, (state, action) => {
        state.loading.clinicalInsights = false
        state.clinicalInsights = action.payload
      })
      .addCase(fetchClinicalInsights.rejected, (state, action) => {
        state.loading.clinicalInsights = false
        state.error.clinicalInsights = action.error.message || 'Failed to fetch clinical insights'
      })

    // Add clinical insight
    builder
      .addCase(addClinicalInsight.pending, (state) => {
        state.loading.addingInsight = true
        state.error.addingInsight = null
      })
      .addCase(addClinicalInsight.fulfilled, (state, action) => {
        state.loading.addingInsight = false
        state.clinicalInsights.data.unshift(action.payload)
        state.clinicalInsights.total += 1
      })
      .addCase(addClinicalInsight.rejected, (state, action) => {
        state.loading.addingInsight = false
        state.error.addingInsight = action.error.message || 'Failed to add clinical insight'
      })

    // Update clinical insight
    builder
      .addCase(updateClinicalInsight.fulfilled, (state, action) => {
        const index = state.clinicalInsights.data.findIndex(i => i.id === action.payload.id)
        if (index !== -1) {
          state.clinicalInsights.data[index] = action.payload
        }
      })

    // Delete clinical insight
    builder
      .addCase(deleteClinicalInsight.fulfilled, (state, action) => {
        state.clinicalInsights.data = state.clinicalInsights.data.filter(i => i.id !== action.payload)
        state.clinicalInsights.total = Math.max(0, state.clinicalInsights.total - 1)
      })

    // Mark insight as used
    builder
      .addCase(markInsightAsUsed.fulfilled, (state, action) => {
        const index = state.clinicalInsights.data.findIndex(i => i.id === action.payload.id)
        if (index !== -1) {
          state.clinicalInsights.data[index] = action.payload
        }
      })

    // Fetch treatment history
    builder
      .addCase(fetchTreatmentHistory.pending, (state) => {
        state.loading.treatmentHistory = true
        state.error.treatmentHistory = null
      })
      .addCase(fetchTreatmentHistory.fulfilled, (state, action) => {
        state.loading.treatmentHistory = false
        state.treatmentHistory = action.payload
      })
      .addCase(fetchTreatmentHistory.rejected, (state, action) => {
        state.loading.treatmentHistory = false
        state.error.treatmentHistory = action.error.message || 'Failed to fetch treatment history'
      })

    // Compare protocol versions
    builder
      .addCase(compareProtocolVersions.pending, (state) => {
        state.loading.versionComparison = true
        state.error.versionComparison = null
      })
      .addCase(compareProtocolVersions.fulfilled, (state, action) => {
        state.loading.versionComparison = false
        state.versionComparison = action.payload
      })
      .addCase(compareProtocolVersions.rejected, (state, action) => {
        state.loading.versionComparison = false
        state.error.versionComparison = action.error.message || 'Failed to compare versions'
      })

    // Fetch dietary profile
    builder
      .addCase(fetchDietaryProfile.pending, (state) => {
        state.loading.dietaryProfile = true
        state.error.dietaryProfile = null
      })
      .addCase(fetchDietaryProfile.fulfilled, (state, action) => {
        state.loading.dietaryProfile = false
        state.dietaryProfile = action.payload
      })
      .addCase(fetchDietaryProfile.rejected, (state, action) => {
        state.loading.dietaryProfile = false
        state.error.dietaryProfile = action.error.message || 'Failed to fetch dietary profile'
      })

    // Generate dietary profile
    builder
      .addCase(generateDietaryProfile.pending, (state) => {
        state.loading.generatingProfile = true
        state.error.generatingProfile = null
      })
      .addCase(generateDietaryProfile.fulfilled, (state, action) => {
        state.loading.generatingProfile = false
        state.dietaryProfile = action.payload
      })
      .addCase(generateDietaryProfile.rejected, (state, action) => {
        state.loading.generatingProfile = false
        state.error.generatingProfile = action.error.message || 'Failed to generate dietary profile'
      })

    // Update dietary profile
    builder
      .addCase(updateDietaryProfile.fulfilled, (state, action) => {
        state.dietaryProfile = action.payload
      })

    // Add contraindication
    builder
      .addCase(addContraindication.pending, (state) => {
        state.loading.addingContraindication = true
        state.error.addingContraindication = null
      })
      .addCase(addContraindication.fulfilled, (state, action) => {
        state.loading.addingContraindication = false
        // Refresh contraindications after adding
      })
      .addCase(addContraindication.rejected, (state, action) => {
        state.loading.addingContraindication = false
        state.error.addingContraindication = action.error.message || 'Failed to add contraindication'
      })

    // Fetch all contraindications
    builder
      .addCase(fetchAllContraindications.fulfilled, (state, action) => {
        state.contraindications = action.payload
      })

    // Update visit condition phase/goals
    builder
      .addCase(updateVisitConditionPhaseGoals.fulfilled, (state, action) => {
        const index = state.visitConditions.findIndex(vc => vc.id === action.payload.id)
        if (index !== -1) {
          state.visitConditions[index] = action.payload
        }
      })
  },
})

export const {
  clearAppointmentDetails,
  clearClinicalInsights,
  clearTreatmentHistory,
  clearVersionComparison,
  setPatient,
} = appointmentDetailsSlice.actions

export default appointmentDetailsSlice.reducer

// ========== SELECTORS ==========

export const selectAppointment = (state: any) => state.appointmentDetails.appointment
export const selectPatient = (state: any) => state.appointmentDetails.patient
export const selectVisitConditions = (state: any) => state.appointmentDetails.visitConditions
export const selectClinicalInsights = (state: any) => state.appointmentDetails.clinicalInsights
export const selectUnusedInsights = (state: any) =>
  state.appointmentDetails.clinicalInsights?.data?.filter((i: ClinicalInsightResponseDto) => !i.used_in_protocol_generation) || []
export const selectTreatmentHistory = (state: any) => state.appointmentDetails.treatmentHistory
export const selectVersionComparison = (state: any) => state.appointmentDetails.versionComparison
export const selectDietaryProfile = (state: any) => state.appointmentDetails.dietaryProfile
export const selectContraindications = (state: any) => state.appointmentDetails.contraindications
export const selectLoadingStates = (state: any) => state.appointmentDetails.loading
export const selectErrors = (state: any) => state.appointmentDetails.error

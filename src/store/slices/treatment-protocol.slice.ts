import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { 
    TreatmentProtocolResponseDto, 
    TreatmentProtocolExistsResponseDto 
} from '../../lib/types'

interface TreatmentProtocolState {
    // Current protocol being worked on
    currentProtocol: TreatmentProtocolResponseDto | null
    
    // List of protocols (for filtering, search, etc.)
    protocols: TreatmentProtocolResponseDto[]
    
    // Pagination info
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    
    // Loading states
    loading: {
        list: boolean
        current: boolean
        creating: boolean
        updating: boolean
        deleting: boolean
        finalizing: boolean
        sendingToPatient: boolean
        generatingPDF: boolean
        checkingExists: boolean
    }
    
    // Error states
    error: {
        list: string | null
        current: string | null
        creating: string | null
        updating: string | null
        deleting: string | null
        finalizing: string | null
        sendingToPatient: string | null
        generatingPDF: string | null
        checkingExists: string | null
    }

    // Protocol existence cache (visitId -> exists info)
    existsCache: Record<string, TreatmentProtocolExistsResponseDto>

    // UI state
    ui: {
        modalOpen: boolean
        selectedVisitId: string | null
        editMode: boolean
    }
}

const initialState: TreatmentProtocolState = {
    currentProtocol: null,
    protocols: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    },
    loading: {
        list: false,
        current: false,
        creating: false,
        updating: false,
        deleting: false,
        finalizing: false,
        sendingToPatient: false,
        generatingPDF: false,
        checkingExists: false
    },
    error: {
        list: null,
        current: null,
        creating: null,
        updating: null,
        deleting: null,
        finalizing: null,
        sendingToPatient: null,
        generatingPDF: null,
        checkingExists: null
    },
    existsCache: {},
    ui: {
        modalOpen: false,
        selectedVisitId: null,
        editMode: false
    }
}

export const treatmentProtocolSlice = createSlice({
    name: 'treatmentProtocol',
    initialState,
    reducers: {
        // List protocols
        setProtocolsLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.list = action.payload
            if (action.payload) {
                state.error.list = null
            }
        },
        setProtocolsSuccess: (state, action: PayloadAction<{
            protocols: TreatmentProtocolResponseDto[]
            total: number
            page: number
            limit: number
            totalPages: number
        }>) => {
            state.protocols = action.payload.protocols
            state.pagination = {
                total: action.payload.total,
                page: action.payload.page,
                limit: action.payload.limit,
                totalPages: action.payload.totalPages
            }
            state.loading.list = false
            state.error.list = null
        },
        setProtocolsError: (state, action: PayloadAction<string>) => {
            state.loading.list = false
            state.error.list = action.payload
        },

        // Current protocol
        setCurrentProtocolLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.current = action.payload
            if (action.payload) {
                state.error.current = null
            }
        },
        setCurrentProtocolSuccess: (state, action: PayloadAction<TreatmentProtocolResponseDto>) => {
            state.currentProtocol = action.payload
            state.loading.current = false
            state.error.current = null
        },
        setCurrentProtocolError: (state, action: PayloadAction<string>) => {
            state.loading.current = false
            state.error.current = action.payload
        },

        // Create protocol
        setCreateProtocolLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.creating = action.payload
            if (action.payload) {
                state.error.creating = null
            }
        },
        setCreateProtocolSuccess: (state, action: PayloadAction<TreatmentProtocolResponseDto>) => {
            state.currentProtocol = action.payload
            state.protocols.unshift(action.payload) // Add to beginning of list
            state.pagination.total += 1
            state.loading.creating = false
            state.error.creating = null
            
            // Update exists cache
            if (action.payload.visit_id) {
                state.existsCache[action.payload.visit_id] = {
                    exists: true,
                    protocol_id: action.payload.id,
                    status: action.payload.status
                }
            }
        },
        setCreateProtocolError: (state, action: PayloadAction<string>) => {
            state.loading.creating = false
            state.error.creating = action.payload
        },

        // Update protocol
        setUpdateProtocolLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.updating = action.payload
            if (action.payload) {
                state.error.updating = null
            }
        },
        setUpdateProtocolSuccess: (state, action: PayloadAction<TreatmentProtocolResponseDto>) => {
            console.log('🔄 REDUX: Updating protocol state with:', action.payload.protocol_title)
            state.currentProtocol = action.payload
            
            // Update in protocols list
            const index = state.protocols.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.protocols[index] = action.payload
            }
            
            state.loading.updating = false
            state.error.updating = null
            
            // Update exists cache
            if (action.payload.visit_id) {
                state.existsCache[action.payload.visit_id] = {
                    exists: true,
                    protocol_id: action.payload.id,
                    status: action.payload.status
                }
            }
        },
        setUpdateProtocolError: (state, action: PayloadAction<string>) => {
            state.loading.updating = false
            state.error.updating = action.payload
        },

        // Delete protocol
        setDeleteProtocolLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.deleting = action.payload
            if (action.payload) {
                state.error.deleting = null
            }
        },
        setDeleteProtocolSuccess: (state, action: PayloadAction<string>) => {
            // Remove from protocols list
            state.protocols = state.protocols.filter(p => p.id !== action.payload)
            
            // Clear current protocol if it was deleted
            if (state.currentProtocol?.id === action.payload) {
                state.currentProtocol = null
            }
            
            state.pagination.total = Math.max(0, state.pagination.total - 1)
            state.loading.deleting = false
            state.error.deleting = null
        },
        setDeleteProtocolError: (state, action: PayloadAction<string>) => {
            state.loading.deleting = false
            state.error.deleting = action.payload
        },

        // Finalize protocol
        setFinalizeProtocolLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.finalizing = action.payload
            if (action.payload) {
                state.error.finalizing = null
            }
        },
        setFinalizeProtocolSuccess: (state, action: PayloadAction<TreatmentProtocolResponseDto>) => {
            state.currentProtocol = action.payload
            
            // Update in protocols list
            const index = state.protocols.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.protocols[index] = action.payload
            }
            
            state.loading.finalizing = false
            state.error.finalizing = null
            
            // Update exists cache
            if (action.payload.visit_id) {
                state.existsCache[action.payload.visit_id] = {
                    exists: true,
                    protocol_id: action.payload.id,
                    status: action.payload.status
                }
            }
        },
        setFinalizeProtocolError: (state, action: PayloadAction<string>) => {
            state.loading.finalizing = false
            state.error.finalizing = action.payload
        },

        // Send to patient
        setSendToPatientLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.sendingToPatient = action.payload
            if (action.payload) {
                state.error.sendingToPatient = null
            }
        },
        setSendToPatientSuccess: (state, action: PayloadAction<TreatmentProtocolResponseDto>) => {
            state.currentProtocol = action.payload
            
            // Update in protocols list
            const index = state.protocols.findIndex(p => p.id === action.payload.id)
            if (index !== -1) {
                state.protocols[index] = action.payload
            }
            
            state.loading.sendingToPatient = false
            state.error.sendingToPatient = null
            
            // Update exists cache
            if (action.payload.visit_id) {
                state.existsCache[action.payload.visit_id] = {
                    exists: true,
                    protocol_id: action.payload.id,
                    status: action.payload.status
                }
            }
        },
        setSendToPatientError: (state, action: PayloadAction<string>) => {
            state.loading.sendingToPatient = false
            state.error.sendingToPatient = action.payload
        },

        // Generate PDF
        setGeneratePDFLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.generatingPDF = action.payload
            if (action.payload) {
                state.error.generatingPDF = null
            }
        },
        setGeneratePDFSuccess: (state) => {
            state.loading.generatingPDF = false
            state.error.generatingPDF = null
        },
        setGeneratePDFError: (state, action: PayloadAction<string>) => {
            state.loading.generatingPDF = false
            state.error.generatingPDF = action.payload
        },

        // Check protocol exists
        setCheckExistsLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.checkingExists = action.payload
            if (action.payload) {
                state.error.checkingExists = null
            }
        },
        setCheckExistsSuccess: (state, action: PayloadAction<{
            visitId: string
            data: TreatmentProtocolExistsResponseDto
        }>) => {
            state.existsCache[action.payload.visitId] = action.payload.data
            state.loading.checkingExists = false
            state.error.checkingExists = null
        },
        setCheckExistsError: (state, action: PayloadAction<string>) => {
            state.loading.checkingExists = false
            state.error.checkingExists = action.payload
        },

        // UI actions
        openProtocolModal: (state, action: PayloadAction<{
            visitId: string
            editMode?: boolean
        }>) => {
            state.ui.modalOpen = true
            state.ui.selectedVisitId = action.payload.visitId
            state.ui.editMode = action.payload.editMode || false
        },
        closeProtocolModal: (state) => {
            state.ui.modalOpen = false
            state.ui.selectedVisitId = null
            state.ui.editMode = false
            state.currentProtocol = null
            
            // Clear creating/updating errors when closing modal
            state.error.creating = null
            state.error.updating = null
        },
        setEditMode: (state, action: PayloadAction<boolean>) => {
            state.ui.editMode = action.payload
        },

        // Clear actions
        clearCurrentProtocol: (state) => {
            state.currentProtocol = null
            state.error.current = null
        },
        clearProtocolsList: (state) => {
            state.protocols = []
            state.pagination = initialState.pagination
            state.error.list = null
        },
        clearAllProtocolErrors: (state) => {
            state.error = initialState.error
        },
        clearExistsCache: (state) => {
            state.existsCache = {}
        }
    }
})

export const {
    // List protocols
    setProtocolsLoading,
    setProtocolsSuccess,
    setProtocolsError,

    // Current protocol
    setCurrentProtocolLoading,
    setCurrentProtocolSuccess,
    setCurrentProtocolError,

    // Create protocol
    setCreateProtocolLoading,
    setCreateProtocolSuccess,
    setCreateProtocolError,

    // Update protocol
    setUpdateProtocolLoading,
    setUpdateProtocolSuccess,
    setUpdateProtocolError,

    // Delete protocol
    setDeleteProtocolLoading,
    setDeleteProtocolSuccess,
    setDeleteProtocolError,

    // Finalize protocol
    setFinalizeProtocolLoading,
    setFinalizeProtocolSuccess,
    setFinalizeProtocolError,

    // Send to patient
    setSendToPatientLoading,
    setSendToPatientSuccess,
    setSendToPatientError,

    // Generate PDF
    setGeneratePDFLoading,
    setGeneratePDFSuccess,
    setGeneratePDFError,

    // Check exists
    setCheckExistsLoading,
    setCheckExistsSuccess,
    setCheckExistsError,

    // UI actions
    openProtocolModal,
    closeProtocolModal,
    setEditMode,

    // Clear actions
    clearCurrentProtocol,
    clearProtocolsList,
    clearAllProtocolErrors,
    clearExistsCache
} = treatmentProtocolSlice.actions

export default treatmentProtocolSlice.reducer
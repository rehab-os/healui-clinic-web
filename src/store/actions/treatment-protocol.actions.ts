import { AppDispatch } from '../store'
import ApiManager from '../../services/api'
import {
    setProtocolsLoading,
    setProtocolsSuccess,
    setProtocolsError,
    setCurrentProtocolLoading,
    setCurrentProtocolSuccess,
    setCurrentProtocolError,
    setCreateProtocolLoading,
    setCreateProtocolSuccess,
    setCreateProtocolError,
    setUpdateProtocolLoading,
    setUpdateProtocolSuccess,
    setUpdateProtocolError,
    setDeleteProtocolLoading,
    setDeleteProtocolSuccess,
    setDeleteProtocolError,
    setFinalizeProtocolLoading,
    setFinalizeProtocolSuccess,
    setFinalizeProtocolError,
    setSendToPatientLoading,
    setSendToPatientSuccess,
    setSendToPatientError,
    setGeneratePDFLoading,
    setGeneratePDFSuccess,
    setGeneratePDFError,
    setCheckExistsLoading,
    setCheckExistsSuccess,
    setCheckExistsError,
} from '../slices/treatment-protocol.slice'
import { 
    CreateTreatmentProtocolDto, 
    UpdateTreatmentProtocolDto, 
    GetTreatmentProtocolsQueryDto 
} from '../../lib/types'

// Fetch list of treatment protocols
export const fetchTreatmentProtocols = (params?: GetTreatmentProtocolsQueryDto) => async (dispatch: AppDispatch) => {
    dispatch(setProtocolsLoading(true))
    try {
        const response = await ApiManager.getTreatmentProtocols(params)
        if (response.success && response.data) {
            dispatch(setProtocolsSuccess(response.data))
        } else {
            dispatch(setProtocolsError(response.message || 'Failed to fetch treatment protocols'))
        }
    } catch (error: any) {
        dispatch(setProtocolsError(error.message || 'Failed to fetch treatment protocols'))
    }
}

// Fetch single treatment protocol by ID
export const fetchTreatmentProtocol = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setCurrentProtocolLoading(true))
    try {
        const response = await ApiManager.getTreatmentProtocol(id)
        if (response.success && response.data) {
            dispatch(setCurrentProtocolSuccess(response.data))
        } else {
            dispatch(setCurrentProtocolError(response.message || 'Failed to fetch treatment protocol'))
        }
    } catch (error: any) {
        dispatch(setCurrentProtocolError(error.message || 'Failed to fetch treatment protocol'))
    }
}

// Fetch treatment protocol by visit ID
export const fetchTreatmentProtocolByVisit = (visitId: string) => async (dispatch: AppDispatch) => {
    dispatch(setCurrentProtocolLoading(true))
    try {
        const response = await ApiManager.getTreatmentProtocolByVisit(visitId)
        if (response.success && response.data) {
            dispatch(setCurrentProtocolSuccess(response.data))
        } else {
            // If no protocol found, it's not an error - just set to null
            dispatch(setCurrentProtocolSuccess(null as any))
        }
    } catch (error: any) {
        dispatch(setCurrentProtocolError(error.message || 'Failed to fetch treatment protocol'))
    }
}

// Check if treatment protocol exists for a visit
export const checkTreatmentProtocolExists = (visitId: string) => async (dispatch: AppDispatch) => {
    dispatch(setCheckExistsLoading(true))
    try {
        const response = await ApiManager.checkTreatmentProtocolExists(visitId)
        if (response.success && response.data) {
            dispatch(setCheckExistsSuccess({ visitId, data: response.data }))
        } else {
            dispatch(setCheckExistsError(response.message || 'Failed to check protocol existence'))
        }
    } catch (error: any) {
        dispatch(setCheckExistsError(error.message || 'Failed to check protocol existence'))
    }
}

// Create new treatment protocol
export const createTreatmentProtocol = (data: CreateTreatmentProtocolDto) => async (dispatch: AppDispatch) => {
    dispatch(setCreateProtocolLoading(true))
    try {
        const response = await ApiManager.createTreatmentProtocol(data)
        if (response.success && response.data) {
            dispatch(setCreateProtocolSuccess(response.data))
            return response.data // Return for component use
        } else {
            dispatch(setCreateProtocolError(response.message || 'Failed to create treatment protocol'))
            throw new Error(response.message || 'Failed to create treatment protocol')
        }
    } catch (error: any) {
        dispatch(setCreateProtocolError(error.message || 'Failed to create treatment protocol'))
        throw error
    }
}

// Update treatment protocol
export const updateTreatmentProtocol = (id: string, data: UpdateTreatmentProtocolDto) => async (dispatch: AppDispatch) => {
    dispatch(setUpdateProtocolLoading(true))
    try {
        const response = await ApiManager.updateTreatmentProtocol(id, data)
        if (response.success && response.data) {
            dispatch(setUpdateProtocolSuccess(response.data))
            return response.data // Return for component use
        } else {
            dispatch(setUpdateProtocolError(response.message || 'Failed to update treatment protocol'))
            throw new Error(response.message || 'Failed to update treatment protocol')
        }
    } catch (error: any) {
        dispatch(setUpdateProtocolError(error.message || 'Failed to update treatment protocol'))
        throw error
    }
}

// Delete treatment protocol
export const deleteTreatmentProtocol = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setDeleteProtocolLoading(true))
    try {
        const response = await ApiManager.deleteTreatmentProtocol(id)
        if (response.success) {
            dispatch(setDeleteProtocolSuccess(id))
            return true
        } else {
            dispatch(setDeleteProtocolError(response.message || 'Failed to delete treatment protocol'))
            throw new Error(response.message || 'Failed to delete treatment protocol')
        }
    } catch (error: any) {
        dispatch(setDeleteProtocolError(error.message || 'Failed to delete treatment protocol'))
        throw error
    }
}

// Finalize treatment protocol
export const finalizeTreatmentProtocol = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setFinalizeProtocolLoading(true))
    try {
        const response = await ApiManager.finalizeTreatmentProtocol(id)
        if (response.success && response.data) {
            dispatch(setFinalizeProtocolSuccess(response.data))
            return response.data
        } else {
            dispatch(setFinalizeProtocolError(response.message || 'Failed to finalize treatment protocol'))
            throw new Error(response.message || 'Failed to finalize treatment protocol')
        }
    } catch (error: any) {
        dispatch(setFinalizeProtocolError(error.message || 'Failed to finalize treatment protocol'))
        throw error
    }
}

// Send treatment protocol to patient
export const sendTreatmentProtocolToPatient = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setSendToPatientLoading(true))
    try {
        const response = await ApiManager.sendTreatmentProtocolToPatient(id)
        if (response.success && response.data) {
            dispatch(setSendToPatientSuccess(response.data))
            return response.data
        } else {
            dispatch(setSendToPatientError(response.message || 'Failed to send protocol to patient'))
            throw new Error(response.message || 'Failed to send protocol to patient')
        }
    } catch (error: any) {
        dispatch(setSendToPatientError(error.message || 'Failed to send protocol to patient'))
        throw error
    }
}

// Generate treatment protocol PDF
export const generateTreatmentProtocolPDF = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setGeneratePDFLoading(true))
    try {
        const response = await ApiManager.generateTreatmentProtocolPDF(id)
        if (response.success) {
            dispatch(setGeneratePDFSuccess())
            
            // Handle PDF response (this will depend on your backend implementation)
            // For now, we'll just return the response data
            return response.data
        } else {
            dispatch(setGeneratePDFError(response.message || 'Failed to generate PDF'))
            throw new Error(response.message || 'Failed to generate PDF')
        }
    } catch (error: any) {
        dispatch(setGeneratePDFError(error.message || 'Failed to generate PDF'))
        throw error
    }
}

// Composite action: Load protocol for visit (check exists first, then load if exists)
export const loadProtocolForVisit = (visitId: string) => async (dispatch: AppDispatch) => {
    try {
        // First check if protocol exists
        const existsResponse = await ApiManager.checkTreatmentProtocolExists(visitId)
        
        if (existsResponse.success && existsResponse.data?.exists) {
            // Protocol exists, load it
            dispatch(fetchTreatmentProtocolByVisit(visitId))
            dispatch(setCheckExistsSuccess({ 
                visitId, 
                data: existsResponse.data 
            }))
        } else {
            // No protocol exists
            dispatch(setCheckExistsSuccess({ 
                visitId, 
                data: { exists: false } 
            }))
            dispatch(setCurrentProtocolSuccess(null as any))
        }
    } catch (error: any) {
        dispatch(setCheckExistsError(error.message || 'Failed to load protocol for visit'))
    }
}

// Create protocol and then load it
export const createAndLoadTreatmentProtocol = (data: CreateTreatmentProtocolDto) => async (dispatch: AppDispatch) => {
    try {
        const protocol = await dispatch(createTreatmentProtocol(data))
        // Protocol is already set in Redux by createTreatmentProtocol
        return protocol
    } catch (error) {
        throw error
    }
}

// Update protocol and then reload it
export const updateAndReloadTreatmentProtocol = (id: string, data: UpdateTreatmentProtocolDto) => async (dispatch: AppDispatch) => {
    try {
        const protocol = await dispatch(updateTreatmentProtocol(id, data))
        // Protocol is already updated in Redux by updateTreatmentProtocol
        return protocol
    } catch (error) {
        throw error
    }
}
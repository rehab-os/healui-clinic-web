import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum AvailabilityType {
    CLINIC = 'CLINIC',
    HOME_VISIT = 'HOME_VISIT',
    ONLINE = 'ONLINE'
}

export enum DayOfWeek {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6
}

export interface PhysiotherapistAvailability {
    id: string
    physiotherapist_id: string
    availability_type: AvailabilityType
    clinic_id?: string
    day_of_week: DayOfWeek
    start_time: string
    end_time: string
    slot_duration_minutes: number
    service_pincodes?: string[]
    max_radius_km?: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface AvailableSlot {
    availability_id: string
    clinic_id?: string
    date: string
    start_time: string
    end_time: string
    duration_minutes: number
}

interface AvailabilityState {
    availabilities: PhysiotherapistAvailability[]
    availableSlots: AvailableSlot[]
    loading: {
        fetch: boolean
        create: boolean
        update: boolean
        delete: boolean
        slots: boolean
    }
    error: {
        fetch: string | null
        create: string | null
        update: string | null
        delete: string | null
        slots: string | null
    }
}

const initialState: AvailabilityState = {
    availabilities: [],
    availableSlots: [],
    loading: {
        fetch: false,
        create: false,
        update: false,
        delete: false,
        slots: false
    },
    error: {
        fetch: null,
        create: null,
        update: null,
        delete: null,
        slots: null
    }
}

export const availabilitySlice = createSlice({
    name: 'availability',
    initialState,
    reducers: {
        // Fetch availabilities
        setFetchLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.fetch = action.payload
            if (action.payload) {
                state.error.fetch = null
            }
        },
        setAvailabilities: (state, action: PayloadAction<PhysiotherapistAvailability[]>) => {
            state.availabilities = action.payload
            state.loading.fetch = false
            state.error.fetch = null
        },
        setFetchError: (state, action: PayloadAction<string>) => {
            state.loading.fetch = false
            state.error.fetch = action.payload
        },

        // Create availability
        setCreateLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.create = action.payload
            if (action.payload) {
                state.error.create = null
            }
        },
        addAvailability: (state, action: PayloadAction<PhysiotherapistAvailability>) => {
            state.availabilities.push(action.payload)
            state.loading.create = false
            state.error.create = null
        },
        setCreateError: (state, action: PayloadAction<string>) => {
            state.loading.create = false
            state.error.create = action.payload
        },

        // Update availability
        setUpdateLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.update = action.payload
            if (action.payload) {
                state.error.update = null
            }
        },
        updateAvailability: (state, action: PayloadAction<PhysiotherapistAvailability>) => {
            const index = state.availabilities.findIndex(a => a.id === action.payload.id)
            if (index !== -1) {
                state.availabilities[index] = action.payload
            }
            state.loading.update = false
            state.error.update = null
        },
        setUpdateError: (state, action: PayloadAction<string>) => {
            state.loading.update = false
            state.error.update = action.payload
        },

        // Delete availability
        setDeleteLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.delete = action.payload
            if (action.payload) {
                state.error.delete = null
            }
        },
        removeAvailability: (state, action: PayloadAction<string>) => {
            state.availabilities = state.availabilities.filter(a => a.id !== action.payload)
            state.loading.delete = false
            state.error.delete = null
        },
        setDeleteError: (state, action: PayloadAction<string>) => {
            state.loading.delete = false
            state.error.delete = action.payload
        },

        // Available slots
        setSlotsLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.slots = action.payload
            if (action.payload) {
                state.error.slots = null
                state.availableSlots = []
            }
        },
        setAvailableSlots: (state, action: PayloadAction<AvailableSlot[]>) => {
            state.availableSlots = action.payload
            state.loading.slots = false
            state.error.slots = null
        },
        setSlotsError: (state, action: PayloadAction<string>) => {
            state.loading.slots = false
            state.error.slots = action.payload
        },

        // Clear state
        clearAvailability: (state) => {
            state.availabilities = []
            state.availableSlots = []
            state.loading = initialState.loading
            state.error = initialState.error
        }
    }
})

export const {
    setFetchLoading,
    setAvailabilities,
    setFetchError,
    setCreateLoading,
    addAvailability,
    setCreateError,
    setUpdateLoading,
    updateAvailability,
    setUpdateError,
    setDeleteLoading,
    removeAvailability,
    setDeleteError,
    setSlotsLoading,
    setAvailableSlots,
    setSlotsError,
    clearAvailability
} = availabilitySlice.actions

export default availabilitySlice.reducer
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

// New coordinate-based zone configuration
export interface CoordinateZoneConfig {
    green_radius_km: number        // e.g., 5 km - no travel charge
    yellow_radius_km: number       // e.g., 15 km  
    red_radius_km: number          // e.g., 25 km
    yellow_travel_charge: number   // travel charge for yellow zone
    red_travel_charge: number      // travel charge for red zone
}

// New ServiceArea entity (coordinate-based)
export interface ServiceArea {
    id: string
    physiotherapist_id: string
    name: string
    latitude: number
    longitude: number
    zone_config: CoordinateZoneConfig
    base_address?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

// Legacy - keeping for backward compatibility during transition
export interface ZoneConfig {
    pincodes: string[]
    radius_km: number
    extra_charge?: number
}

export interface ServiceZoneConfig {
    green: ZoneConfig
    yellow: ZoneConfig & { extra_charge: number }
    red: ZoneConfig & { extra_charge: number }
}

export interface PhysioServiceLocation {
    id: string
    physiotherapist_id: string
    location_name: string
    base_address: string
    base_pincode: string
    latitude: number
    longitude: number
    service_pincodes: string[]
    zone_config: ServiceZoneConfig
    is_active: boolean
    created_at: string
    updated_at: string
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
    service_location_id?: string
    is_active: boolean
    created_at: string
    updated_at: string
    serviceLocation?: PhysioServiceLocation
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
    serviceLocations: PhysioServiceLocation[]  // Legacy
    serviceAreas: ServiceArea[]  // New coordinate-based service areas
    loading: {
        fetch: boolean
        create: boolean
        update: boolean
        delete: boolean
        slots: boolean
        locations: boolean
        createLocation: boolean
        updateLocation: boolean
        deleteLocation: boolean
    }
    error: {
        fetch: string | null
        create: string | null
        update: string | null
        delete: string | null
        slots: string | null
        locations: string | null
        createLocation: string | null
        updateLocation: string | null
        deleteLocation: string | null
    }
}

const initialState: AvailabilityState = {
    availabilities: [],
    availableSlots: [],
    serviceLocations: [],  // Legacy
    serviceAreas: [],      // New coordinate-based service areas
    loading: {
        fetch: false,
        create: false,
        update: false,
        delete: false,
        slots: false,
        locations: false,
        createLocation: false,
        updateLocation: false,
        deleteLocation: false
    },
    error: {
        fetch: null,
        create: null,
        update: null,
        delete: null,
        slots: null,
        locations: null,
        createLocation: null,
        updateLocation: null,
        deleteLocation: null
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

        // Service Locations
        setLocationsLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.locations = action.payload
            if (action.payload) {
                state.error.locations = null
            }
        },
        setServiceLocations: (state, action: PayloadAction<PhysioServiceLocation[]>) => {
            state.serviceLocations = action.payload
            state.loading.locations = false
            state.error.locations = null
        },
        setLocationsError: (state, action: PayloadAction<string>) => {
            state.loading.locations = false
            state.error.locations = action.payload
        },

        // Create service location
        setCreateLocationLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.createLocation = action.payload
            if (action.payload) {
                state.error.createLocation = null
            }
        },
        addServiceLocation: (state, action: PayloadAction<PhysioServiceLocation>) => {
            state.serviceLocations.push(action.payload)
            state.loading.createLocation = false
            state.error.createLocation = null
        },
        setCreateLocationError: (state, action: PayloadAction<string>) => {
            state.loading.createLocation = false
            state.error.createLocation = action.payload
        },

        // Update service location
        setUpdateLocationLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.updateLocation = action.payload
            if (action.payload) {
                state.error.updateLocation = null
            }
        },
        updateServiceLocation: (state, action: PayloadAction<PhysioServiceLocation>) => {
            const index = state.serviceLocations.findIndex(l => l.id === action.payload.id)
            if (index !== -1) {
                state.serviceLocations[index] = action.payload
            }
            state.loading.updateLocation = false
            state.error.updateLocation = null
        },
        setUpdateLocationError: (state, action: PayloadAction<string>) => {
            state.loading.updateLocation = false
            state.error.updateLocation = action.payload
        },

        // Delete service location
        setDeleteLocationLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.deleteLocation = action.payload
            if (action.payload) {
                state.error.deleteLocation = null
            }
        },
        removeServiceLocation: (state, action: PayloadAction<string>) => {
            state.serviceLocations = state.serviceLocations.filter(l => l.id !== action.payload)
            state.loading.deleteLocation = false
            state.error.deleteLocation = null
        },
        setDeleteLocationError: (state, action: PayloadAction<string>) => {
            state.loading.deleteLocation = false
            state.error.deleteLocation = action.payload
        },

        // Clear state
        clearAvailability: (state) => {
            state.availabilities = []
            state.availableSlots = []
            state.serviceLocations = []
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
    setLocationsLoading,
    setServiceLocations,
    setLocationsError,
    setCreateLocationLoading,
    addServiceLocation,
    setCreateLocationError,
    setUpdateLocationLoading,
    updateServiceLocation,
    setUpdateLocationError,
    setDeleteLocationLoading,
    removeServiceLocation,
    setDeleteLocationError,
    clearAvailability
} = availabilitySlice.actions

export default availabilitySlice.reducer
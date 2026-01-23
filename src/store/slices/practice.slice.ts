import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PracticeSettings {
    id?: string
    online_consultation_available?: boolean
    home_visit_available?: boolean
    marketplace_active?: boolean
    profile_completed_at?: string
    updated_at?: string
}

interface PracticeState {
    settings: PracticeSettings
    loading: {
        fetch: boolean
        update: boolean
    }
    error: {
        fetch: string | null
        update: string | null
    }
}

const initialState: PracticeState = {
    settings: {
        online_consultation_available: false,
        home_visit_available: false
    },
    loading: {
        fetch: false,
        update: false
    },
    error: {
        fetch: null,
        update: null
    }
}

export const practiceSlice = createSlice({
    name: 'practice',
    initialState,
    reducers: {
        // Fetch practice settings
        setFetchLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.fetch = action.payload
            if (action.payload) {
                state.error.fetch = null
            }
        },
        setPracticeSettings: (state, action: PayloadAction<PracticeSettings>) => {
            state.settings = { ...state.settings, ...action.payload }
            state.loading.fetch = false
            state.error.fetch = null
        },
        setFetchError: (state, action: PayloadAction<string>) => {
            state.loading.fetch = false
            state.error.fetch = action.payload
        },

        // Update practice settings
        setUpdateLoading: (state, action: PayloadAction<boolean>) => {
            state.loading.update = action.payload
            if (action.payload) {
                state.error.update = null
            }
        },
        updatePracticeSettings: (state, action: PayloadAction<Partial<PracticeSettings>>) => {
            state.settings = { ...state.settings, ...action.payload }
            state.loading.update = false
            state.error.update = null
        },
        setUpdateError: (state, action: PayloadAction<string>) => {
            state.loading.update = false
            state.error.update = action.payload
        },

        // Update individual fields
        updatePracticeField: (state, action: PayloadAction<{ field: keyof PracticeSettings; value: any }>) => {
            const { field, value } = action.payload
            state.settings[field] = value
        },

        // Clear state
        clearPracticeSettings: (state) => {
            state.settings = initialState.settings
            state.loading = initialState.loading
            state.error = initialState.error
        }
    }
})

export const {
    setFetchLoading,
    setPracticeSettings,
    setFetchError,
    setUpdateLoading,
    updatePracticeSettings,
    setUpdateError,
    updatePracticeField,
    clearPracticeSettings
} = practiceSlice.actions

export default practiceSlice.reducer
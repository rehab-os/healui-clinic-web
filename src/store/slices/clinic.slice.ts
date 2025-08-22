import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Clinic {
    id: string
    organization_id: string
    name: string
    code: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    email: string
    is_active: boolean
}

interface ClinicState {
    currentClinic: Clinic | null
    clinics: Clinic[]
    isLoading: boolean
}

const initialState: ClinicState = {
    currentClinic: null,
    clinics: [],
    isLoading: false,
}

export const clinicSlice = createSlice({
    name: 'clinic',
    initialState,
    reducers: {
        setClinicsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
        setClinics: (state, action: PayloadAction<Clinic[]>) => {
            state.clinics = action.payload
            if (action.payload.length > 0 && !state.currentClinic) {
                state.currentClinic = action.payload[0]
            }
        },
        setCurrentClinic: (state, action: PayloadAction<Clinic>) => {
            state.currentClinic = action.payload
        },
    },
})

export const { 
    setClinicsLoading, 
    setClinics, 
    setCurrentClinic 
} = clinicSlice.actions
export default clinicSlice.reducer
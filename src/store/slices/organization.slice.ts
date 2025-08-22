import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Organization {
    id: string
    name: string
    slug: string
    type: string
    is_active: boolean
}

interface OrganizationState {
    currentOrganization: Organization | null
    organizations: Organization[]
    isLoading: boolean
}

const initialState: OrganizationState = {
    currentOrganization: null,
    organizations: [],
    isLoading: false,
}

export const organizationSlice = createSlice({
    name: 'organization',
    initialState,
    reducers: {
        setOrganizationsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
        setOrganizations: (state, action: PayloadAction<Organization[]>) => {
            state.organizations = action.payload
            if (action.payload.length > 0 && !state.currentOrganization) {
                state.currentOrganization = action.payload[0]
            }
        },
        setCurrentOrganization: (state, action: PayloadAction<Organization>) => {
            state.currentOrganization = action.payload
        },
    },
})

export const { 
    setOrganizationsLoading, 
    setOrganizations, 
    setCurrentOrganization 
} = organizationSlice.actions
export default organizationSlice.reducer
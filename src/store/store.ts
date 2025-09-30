import { configureStore } from '@reduxjs/toolkit'
import { authSlice, organizationSlice, clinicSlice, userSlice, analyticsSlice, availabilitySlice, treatmentProtocolSlice } from './slices'
import practiceReducer from './slices/practice.slice'

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        organization: organizationSlice.reducer,
        clinic: clinicSlice.reducer,
        user: userSlice.reducer,
        analytics: analyticsSlice.reducer,
        availability: availabilitySlice.reducer,
        practice: practiceReducer,
        treatmentProtocol: treatmentProtocolSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
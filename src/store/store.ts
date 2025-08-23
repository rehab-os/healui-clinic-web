import { configureStore } from '@reduxjs/toolkit'
import { authSlice, organizationSlice, clinicSlice, userSlice, analyticsSlice } from './slices'

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        organization: organizationSlice.reducer,
        clinic: clinicSlice.reducer,
        user: userSlice.reducer,
        analytics: analyticsSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
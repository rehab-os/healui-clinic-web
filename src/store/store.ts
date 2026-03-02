import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { authSlice, organizationSlice, clinicSlice, userSlice, analyticsSlice, availabilitySlice, treatmentProtocolSlice } from './slices'
import { appointmentDetailsSlice } from './slices/appointmentDetails.slice'
import practiceReducer from './slices/practice.slice'

const appReducer = combineReducers({
    auth: authSlice.reducer,
    organization: organizationSlice.reducer,
    clinic: clinicSlice.reducer,
    user: userSlice.reducer,
    analytics: analyticsSlice.reducer,
    availability: availabilitySlice.reducer,
    practice: practiceReducer,
    treatmentProtocol: treatmentProtocolSlice.reducer,
    appointmentDetails: appointmentDetailsSlice.reducer,
})

// Root reducer that resets all state on logout (prevents data leaking between users)
const rootReducer: typeof appReducer = (state, action) => {
    if (action.type === 'auth/logout') {
        // Let auth reducer handle its own cleanup (cookie removal etc.)
        // Reset everything else to initial state
        return appReducer(undefined, action)
    }
    return appReducer(state, action)
}

export const store = configureStore({
    reducer: rootReducer,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

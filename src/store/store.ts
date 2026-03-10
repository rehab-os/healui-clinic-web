import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { authSlice, clinicSlice, userSlice } from './slices'

const appReducer = combineReducers({
    auth: authSlice.reducer,
    clinic: clinicSlice.reducer,
    user: userSlice.reducer,
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

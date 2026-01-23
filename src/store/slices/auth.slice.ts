import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { LoginResponseDto } from '../../lib/types'
import { setTokenCookie, removeTokenCookie } from '../../lib/utils/helpers'

interface AuthState {
    isAuthenticated: boolean
    user: LoginResponseDto['user'] | null
    loading: boolean
    otpSent: boolean
    otpVerifying: boolean
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    otpSent: false,
    otpVerifying: false,
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        setOtpSent: (state, action: PayloadAction<boolean>) => {
            state.otpSent = action.payload
        },
        setOtpVerifying: (state, action: PayloadAction<boolean>) => {
            state.otpVerifying = action.payload
        },
        loginStart: (state) => {
            state.loading = true
        },
        loginSuccess: (state, action: PayloadAction<LoginResponseDto>) => {
            state.isAuthenticated = true
            state.user = action.payload.user
            state.loading = false
            state.otpSent = false
            state.otpVerifying = false
            setTokenCookie('access_token', action.payload.access_token)
            setTokenCookie('refresh_token', action.payload.refresh_token)
        },
        loginFailure: (state) => {
            state.loading = false
            state.otpVerifying = false
        },
        setUser: (state, action: PayloadAction<LoginResponseDto['user']>) => {
            state.user = action.payload
            state.isAuthenticated = true
        },
        logout: (state) => {
            state.isAuthenticated = false
            state.user = null
            state.otpSent = false
            state.otpVerifying = false
            removeTokenCookie('access_token')
            removeTokenCookie('refresh_token')
        },
    },
})

export const { 
    setLoading, 
    setOtpSent, 
    setOtpVerifying, 
    loginStart, 
    loginSuccess, 
    loginFailure, 
    setUser, 
    logout 
} = authSlice.actions
export default authSlice.reducer
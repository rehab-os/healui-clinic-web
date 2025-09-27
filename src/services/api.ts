import { ApiMethods } from '../lib/data-access/api-client'
import { ENDPOINTS } from '../lib/data-access/endpoints'
import { store } from '../store/store'
import {
    authSlice,
    organizationSlice,
    clinicSlice,
    userSlice
} from '../store/slices'

import type {
    LoginDto,
    SendOtpDto,
    CreateClinicDto,
    UpdateClinicDto,
    AddTeamMemberDto,
    CreatePatientDto,
    UpdatePatientDto,
    CreateVisitDto,
    UpdateVisitDto,
    CheckInVisitDto,
    StartVisitDto,
    CancelVisitDto,
    RescheduleVisitDto,
    PhysiotherapistAvailabilityDto,
    CreateNoteDto,
    UpdateNoteDto,
    SignNoteDto,
} from '../lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://healui-backend-core.onrender.com/api/v1/'

class ApiManager {
    // Auth
    static sendOtp = (data: SendOtpDto) => {
        const url = BASE_URL + ENDPOINTS.SEND_OTP()
        return ApiMethods.post(url, data)
    }

    static login = (data: LoginDto) => {
        const url = BASE_URL + ENDPOINTS.LOGIN()
        return ApiMethods.post(url, data).then((res) => {
            if (res.success && res.data) {
                store.dispatch(authSlice.actions.loginSuccess(res.data))
                if (res.data.user) {
                    store.dispatch(userSlice.actions.setUserData(res.data.user))
                }
            }
            return res
        })
    }

    static getMe = () => {
        const url = BASE_URL + ENDPOINTS.GET_ME()
        return ApiMethods.get(url).then((res) => {
            if (res.success && res.data) {
                store.dispatch(authSlice.actions.setUser(res.data))
                store.dispatch(userSlice.actions.setUserData(res.data))
            }
            return res
        })
    }

    // Organizations
    static getOrganizations = () => {
        const url = BASE_URL + ENDPOINTS.GET_ORGANIZATIONS()
        return ApiMethods.get(url).then((res) => {
            if (res.success && res.data) {
                store.dispatch(organizationSlice.actions.setOrganizations(res.data))
            }
            return res
        })
    }

    // Clinics
    static getClinics = (organizationId?: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CLINICS()
        const headers = organizationId ? { 'x-organization-id': organizationId } : undefined
        return ApiMethods.get(url, headers).then((res) => {
            if (res.success && res.data) {
                store.dispatch(clinicSlice.actions.setClinics(res.data))
            }
            return res
        })
    }

    static createClinic = (organizationId: string, data: CreateClinicDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_CLINIC()
        const headers = { 'x-organization-id': organizationId }
        return ApiMethods.post(url, data, headers).then((res) => {
            if (res.success && res.data) {
                // Refresh clinics list
                ApiManager.getClinics(organizationId)
            }
            return res
        })
    }

    static updateClinic = (id: string, data: UpdateClinicDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_CLINIC(id)
        return ApiMethods.patch(url, data).then((res) => {
            if (res.success && res.data) {
                // Could update clinic in store here
            }
            return res
        })
    }

    static deleteClinic = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_CLINIC(id)
        return ApiMethods.delete(url)
    }

    // Team Management
    static getTeamMembers = (organizationId: string, clinicId?: string) => {
        let url = BASE_URL + ENDPOINTS.GET_TEAM_MEMBERS()
        const headers = { 'x-organization-id': organizationId }
        
        // Add query parameters to URL
        if (clinicId) {
            const searchParams = new URLSearchParams()
            searchParams.append('clinic_id', clinicId)
            url += '?' + searchParams.toString()
        }
        
        return ApiMethods.get(url, headers)
    }

    static addTeamMember = (organizationId: string, data: AddTeamMemberDto) => {
        const url = BASE_URL + ENDPOINTS.ADD_TEAM_MEMBER()
        const headers = { 'x-organization-id': organizationId }
        return ApiMethods.post(url, data, headers)
    }

    static removeTeamMember = (organizationId: string, userId: string, clinicId?: string) => {
        let url = BASE_URL + ENDPOINTS.REMOVE_TEAM_MEMBER(userId)
        const headers = { 'x-organization-id': organizationId }
        
        // Add query parameters to URL
        if (clinicId) {
            const searchParams = new URLSearchParams()
            searchParams.append('clinic_id', clinicId)
            url += '?' + searchParams.toString()
        }
        
        return ApiMethods.delete(url, headers)
    }

    static updateTeamMemberRole = (organizationId: string, userId: string, data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_TEAM_MEMBER_ROLE(userId)
        const headers = { 'x-organization-id': organizationId }
        return ApiMethods.patch(url, data, headers)
    }

    // Patients
    static getPatients = (params?: any) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENTS(params)
        return ApiMethods.get(url)
    }

    static getPatient = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT(id)
        return ApiMethods.get(url)
    }

    static getPatientVisits = (id: string, params?: any) => {
        let url = BASE_URL + ENDPOINTS.GET_PATIENT_VISITS(id)
        
        // Add query parameters to URL
        if (params) {
            const searchParams = new URLSearchParams()
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, params[key].toString())
                }
            })
            if (searchParams.toString()) {
                url += '?' + searchParams.toString()
            }
        }
        
        return ApiMethods.get(url)
    }

    static getPatientVisitHistory = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT_VISIT_HISTORY(id)
        return ApiMethods.get(url)
    }

    static createPatient = (data: CreatePatientDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_PATIENT()
        return ApiMethods.post(url, data)
    }

    static updatePatient = (id: string, data: UpdatePatientDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_PATIENT(id)
        return ApiMethods.patch(url, data)
    }

    static deletePatient = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_PATIENT(id)
        return ApiMethods.delete(url)
    }

    // Visits
    static getVisits = (params?: any) => {
        let url = BASE_URL + ENDPOINTS.GET_VISITS()
        
        // Add query parameters to URL
        if (params) {
            const searchParams = new URLSearchParams()
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, params[key].toString())
                }
            })
            if (searchParams.toString()) {
                url += '?' + searchParams.toString()
            }
        }
        
        return ApiMethods.get(url)
    }

    static getVisit = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_VISIT(id)
        return ApiMethods.get(url)
    }

    static createVisit = (data: CreateVisitDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_VISIT()
        return ApiMethods.post(url, data)
    }

    static updateVisit = (id: string, data: UpdateVisitDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_VISIT(id)
        return ApiMethods.patch(url, data)
    }

    static checkInVisit = (id: string, data: CheckInVisitDto) => {
        const url = BASE_URL + ENDPOINTS.CHECK_IN_VISIT(id)
        return ApiMethods.post(url, data)
    }

    static startVisit = (id: string, data: StartVisitDto) => {
        const url = BASE_URL + ENDPOINTS.START_VISIT(id)
        return ApiMethods.post(url, data)
    }

    static completeVisit = (id: string) => {
        const url = BASE_URL + ENDPOINTS.COMPLETE_VISIT(id)
        return ApiMethods.post(url, {})
    }

    static cancelVisit = (id: string, data: CancelVisitDto) => {
        const url = BASE_URL + ENDPOINTS.CANCEL_VISIT(id)
        return ApiMethods.post(url, data)
    }

    static rescheduleVisit = (id: string, data: RescheduleVisitDto) => {
        const url = BASE_URL + ENDPOINTS.RESCHEDULE_VISIT(id)
        return ApiMethods.put(url, data)
    }

    static getAvailablePhysiotherapists = (data: PhysiotherapistAvailabilityDto) => {
        const url = BASE_URL + ENDPOINTS.GET_AVAILABLE_PHYSIOTHERAPISTS()
        return ApiMethods.post(url, data)
    }

    // Notes
    static createNote = (data: CreateNoteDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_NOTE()
        return ApiMethods.post(url, data)
    }

    static getNote = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_NOTE(id)
        return ApiMethods.get(url)
    }

    static updateNote = (id: string, data: UpdateNoteDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_NOTE(id)
        return ApiMethods.patch(url, data)
    }

    static signNote = (id: string, data: SignNoteDto) => {
        const url = BASE_URL + ENDPOINTS.SIGN_NOTE(id)
        return ApiMethods.post(url, data)
    }

    // Physiotherapist Profile
    static getPhysiotherapistProfile = () => {
        const url = BASE_URL + ENDPOINTS.GET_PHYSIOTHERAPIST_PROFILE()
        return ApiMethods.get(url)
    }

    static createPhysiotherapistProfile = (data: any) => {
        const url = BASE_URL + ENDPOINTS.CREATE_PHYSIOTHERAPIST_PROFILE()
        return ApiMethods.post(url, data)
    }

    static updatePhysiotherapistProfile = (data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_PHYSIOTHERAPIST_PROFILE()
        return ApiMethods.put(url, data)
    }

    static createCompleteProfile = (data: any) => {
        const url = BASE_URL + ENDPOINTS.CREATE_COMPLETE_PROFILE()
        return ApiMethods.post(url, data)
    }

    static updatePracticeSettings = (data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_PHYSIOTHERAPIST_PROFILE()
        return ApiMethods.put(url, data)
    }

    static addEducation = (data: any) => {
        const url = BASE_URL + ENDPOINTS.ADD_EDUCATION()
        return ApiMethods.post(url, data)
    }

    static addTechnique = (data: any) => {
        const url = BASE_URL + ENDPOINTS.ADD_TECHNIQUE()
        return ApiMethods.post(url, data)
    }

    static addMachine = (data: any) => {
        const url = BASE_URL + ENDPOINTS.ADD_MACHINE()
        return ApiMethods.post(url, data)
    }

    static addWorkshop = (data: any) => {
        const url = BASE_URL + ENDPOINTS.ADD_WORKSHOP()
        return ApiMethods.post(url, data)
    }

    static deleteEducation = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_EDUCATION(id)
        return ApiMethods.delete(url)
    }

    static deleteTechnique = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_TECHNIQUE(id)
        return ApiMethods.delete(url)
    }

    static deleteMachine = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_MACHINE(id)
        return ApiMethods.delete(url)
    }

    static deleteWorkshop = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_WORKSHOP(id)
        return ApiMethods.delete(url)
    }

    // Physiotherapist Profile Photos
    static uploadProfilePhoto = (file: File, photoType: 'profile' | 'cover' | 'gallery', caption?: string) => {
        const url = BASE_URL + ENDPOINTS.UPLOAD_PROFILE_PHOTO()
        return ApiMethods.photoPost(url, file, photoType, caption)
    }

    static getProfilePhotos = () => {
        const url = BASE_URL + ENDPOINTS.GET_PROFILE_PHOTOS()
        return ApiMethods.get(url)
    }

    static deleteProfilePhoto = (photoType: 'profile' | 'cover' | 'gallery', photoId?: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_PROFILE_PHOTO()
        return ApiMethods.post(url, { photoType, photoId }, { 'X-HTTP-Method-Override': 'DELETE' })
    }

    static getPhotoConstraints = () => {
        const url = BASE_URL + ENDPOINTS.GET_PHOTO_CONSTRAINTS()
        return ApiMethods.get(url)
    }

    // Audio
    static transcribeAudio = (file: File) => {
        const url = BASE_URL + ENDPOINTS.TRANSCRIBE_AUDIO()
        return ApiMethods.audioPost(url, file)
    }

    // Notes Generation
    static generateNote = (data: { transcription: string; noteType: 'SOAP' | 'BAP' | 'Progress' }) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_NOTE()
        return ApiMethods.post(url, data)
    }

    // Nutrition Plan Generation
    static generateNutritionPlan = (data: { prompt: string }) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_NUTRITION_PLAN()
        return ApiMethods.post(url, data)
    }

    // Video Sessions
    static getVideoSession = (visitId: string) => {
        const url = BASE_URL + `video/sessions/visit/${visitId}`
        return ApiMethods.get(url)
    }

    static createVideoSession = (visitId: string) => {
        const url = BASE_URL + `video/sessions/visit/${visitId}`
        return ApiMethods.post(url, {})
    }

    static validateVideoAccess = (visitId: string) => {
        const url = BASE_URL + `video/sessions/visit/${visitId}/validate`
        return ApiMethods.post(url, {})
    }

    // Public video session for patients (no auth required)
    static getPublicVideoSession = (visitId: string) => {
        const url = BASE_URL + `video/public/sessions/visit/${visitId}`
        return ApiMethods.get(url)
    }

    // Public API for patient portal (no auth required)
    static getPublicVisitInfo = (visitId: string) => {
        const url = BASE_URL + `public/visits/${visitId}/info`
        return ApiMethods.get(url)
    }

    // Analytics - Clinic Admin
    static getClinicPatientAnalytics = (clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CLINIC_PATIENT_ANALYTICS(clinicId)
        return ApiMethods.get(url)
    }

    static getClinicAppointmentAnalytics = (clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CLINIC_APPOINTMENT_ANALYTICS(clinicId)
        return ApiMethods.get(url)
    }

    static getClinicPatientCategories = (clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CLINIC_PATIENT_CATEGORIES(clinicId)
        return ApiMethods.get(url)
    }

    static getClinicCaseTypes = (clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CLINIC_CASE_TYPES(clinicId)
        return ApiMethods.get(url)
    }

    static getClinicUtilization = (clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CLINIC_UTILIZATION(clinicId)
        return ApiMethods.get(url)
    }

    // Analytics - Organization Admin
    static getOrganizationOverview = (organizationId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_ORGANIZATION_OVERVIEW(organizationId)
        return ApiMethods.get(url)
    }

    static getOrganizationClinicsSummary = (organizationId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_ORGANIZATION_CLINICS_SUMMARY(organizationId)
        return ApiMethods.get(url)
    }

    // Analytics - Common
    static getRecentActivities = (clinicId?: string) => {
        const url = BASE_URL + ENDPOINTS.GET_RECENT_ACTIVITIES(clinicId)
        return ApiMethods.get(url)
    }

    static getQuickStats = (clinicId?: string) => {
        const url = BASE_URL + ENDPOINTS.GET_QUICK_STATS(clinicId)
        return ApiMethods.get(url)
    }

    // Physiotherapist Availability
    static getMyAvailability = () => {
        const url = BASE_URL + ENDPOINTS.GET_MY_AVAILABILITY()
        return ApiMethods.get(url)
    }

    static getPhysiotherapistAvailability = (physiotherapistId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PHYSIOTHERAPIST_AVAILABILITY(physiotherapistId)
        return ApiMethods.get(url)
    }

    static createAvailability = (data: any) => {
        const url = BASE_URL + ENDPOINTS.CREATE_AVAILABILITY()
        return ApiMethods.post(url, data)
    }

    static updateAvailability = (id: string, data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_AVAILABILITY(id)
        return ApiMethods.put(url, data)
    }

    static deleteAvailability = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_AVAILABILITY(id)
        return ApiMethods.delete(url)
    }

    static setDefaultAvailability = () => {
        const url = BASE_URL + ENDPOINTS.SET_DEFAULT_AVAILABILITY()
        return ApiMethods.post(url, {})
    }

    static getAvailableSlots = (params: { date: string; availability_type: string; pincode?: string }) => {
        const url = BASE_URL + ENDPOINTS.GET_AVAILABLE_SLOTS(params)
        return ApiMethods.get(url)
    }

    static getPhysiotherapistSlots = (physiotherapistId: string, params: { date: string; availability_type: string; pincode?: string }) => {
        const url = BASE_URL + ENDPOINTS.GET_PHYSIOTHERAPIST_SLOTS(physiotherapistId, params)
        return ApiMethods.get(url)
    }
}

export default ApiManager
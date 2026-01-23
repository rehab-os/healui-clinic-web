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
    CreateOrganizationDto,
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
    CreateTreatmentProtocolDto,
    UpdateTreatmentProtocolDto,
    GetTreatmentProtocolsQueryDto,
    // Multi-Condition Support Types
    CreatePatientConditionDto,
    UpdatePatientConditionStatusDto,
    UpdatePatientConditionDescriptionDto,
    CreateVisitConditionDto,
    // Public Registration Types
    PublicPatientRegistrationDto,
    // Billing Types
    CreateSessionPackDto,
    AddSessionsDto,
    SessionPackQueryParams,
    BillVisitDto,
    UpdateVisitBillingDto,
    RecordPaymentDto,
    CreateInvoiceDto,
    InvoiceQueryParams,
    OutstandingReportParams,
    CollectionReportParams,
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

    static createOrganization = (data: CreateOrganizationDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_ORGANIZATION()
        return ApiMethods.post(url, data).then((res) => {
            if (res.success && res.data) {
                // Refresh organizations list
                ApiManager.getOrganizations()
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

    static getClinic = (id: string) => {
        const url = BASE_URL + `clinics/${id}`
        return ApiMethods.get(url)
    }

    static getClinicLiveStatus = (id: string) => {
        const url = BASE_URL + `clinics/${id}/live-status`
        return ApiMethods.get(url)
    }

    static getClinicTeam = (id: string) => {
        const url = BASE_URL + `clinics/${id}/team`
        return ApiMethods.get(url)
    }

    static getClinicFinanceSummary = (id: string, period?: 'today' | 'week' | 'month') => {
        let url = BASE_URL + `clinics/${id}/finance-summary`
        if (period) {
            url += `?period=${period}`
        }
        return ApiMethods.get(url)
    }

    static getClinicPatientSummary = (id: string) => {
        const url = BASE_URL + `clinics/${id}/patient-summary`
        return ApiMethods.get(url)
    }

    static uploadClinicLogo = (id: string, file: File) => {
        const url = BASE_URL + `clinics/${id}/upload-logo`
        return ApiMethods.filePost(url, file, 'file')
    }

    static uploadClinicCover = (id: string, file: File) => {
        const url = BASE_URL + `clinics/${id}/upload-cover`
        return ApiMethods.filePost(url, file, 'file')
    }

    // Inventory Management
    static getInventorySummary = (clinicId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/summary`
        return ApiMethods.get(url)
    }

    static getInventoryCategories = (clinicId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/categories`
        return ApiMethods.get(url)
    }

    static createInventoryCategory = (clinicId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/categories`
        return ApiMethods.post(url, data)
    }

    static getInventoryItems = (clinicId: string, categoryId?: string) => {
        let url = BASE_URL + `clinics/${clinicId}/inventory/items`
        if (categoryId) {
            url += `?category_id=${categoryId}`
        }
        return ApiMethods.get(url)
    }

    static createInventoryItem = (clinicId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/items`
        return ApiMethods.post(url, data)
    }

    static updateInventoryItem = (clinicId: string, itemId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/items/${itemId}`
        return ApiMethods.patch(url, data)
    }

    static stockIn = (clinicId: string, itemId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/items/${itemId}/stock-in`
        return ApiMethods.post(url, data)
    }

    static stockOut = (clinicId: string, itemId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/items/${itemId}/stock-out`
        return ApiMethods.post(url, data)
    }

    static getStockMovements = (clinicId: string, itemId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/inventory/items/${itemId}/movements`
        return ApiMethods.get(url)
    }

    // Equipment Management (Clinic Assets/Machines)
    static getEquipmentSummary = (clinicId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/summary`
        return ApiMethods.get(url)
    }

    static getEquipmentCategories = (clinicId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/categories`
        return ApiMethods.get(url)
    }

    static createEquipmentCategory = (clinicId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/categories`
        return ApiMethods.post(url, data)
    }

    static getEquipment = (clinicId: string, categoryId?: string, status?: string) => {
        let url = BASE_URL + `clinics/${clinicId}/equipment/items`
        const params = new URLSearchParams()
        if (categoryId) params.append('category_id', categoryId)
        if (status) params.append('status', status)
        if (params.toString()) url += `?${params.toString()}`
        return ApiMethods.get(url)
    }

    static getEquipmentById = (clinicId: string, equipmentId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/items/${equipmentId}`
        return ApiMethods.get(url)
    }

    static createEquipment = (clinicId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/items`
        return ApiMethods.post(url, data)
    }

    static updateEquipment = (clinicId: string, equipmentId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/items/${equipmentId}`
        return ApiMethods.patch(url, data)
    }

    static deleteEquipment = (clinicId: string, equipmentId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/items/${equipmentId}`
        return ApiMethods.delete(url)
    }

    static addMaintenanceLog = (clinicId: string, equipmentId: string, data: any) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/items/${equipmentId}/maintenance`
        return ApiMethods.post(url, data)
    }

    static getMaintenanceLogs = (clinicId: string, equipmentId: string) => {
        const url = BASE_URL + `clinics/${clinicId}/equipment/items/${equipmentId}/maintenance`
        return ApiMethods.get(url)
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

    static getPatientIntakeStatus = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT_INTAKE_STATUS(id)
        return ApiMethods.get(url)
    }

    // Patient Conditions (Multi-Condition Support)
    static getPatientConditions = (patientId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT_CONDITIONS(patientId)
        return ApiMethods.get(url)
    }

    static createPatientCondition = (patientId: string, data: CreatePatientConditionDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_PATIENT_CONDITION(patientId)
        return ApiMethods.post(url, data)
    }

    static updatePatientConditionStatus = (patientId: string, conditionId: string, data: UpdatePatientConditionStatusDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_PATIENT_CONDITION_STATUS(patientId, conditionId)
        return ApiMethods.put(url, data)
    }

    static updatePatientConditionDescription = (patientId: string, conditionId: string, data: UpdatePatientConditionDescriptionDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_PATIENT_CONDITION_DESCRIPTION(patientId, conditionId)
        return ApiMethods.put(url, data)
    }

    // Unified update method - preferred for new implementations
    static updatePatientCondition = (patientId: string, conditionId: string, data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_PATIENT_CONDITION(patientId, conditionId)
        return ApiMethods.patch(url, data)
    }

    static deletePatientCondition = (patientId: string, conditionId: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_PATIENT_CONDITION(patientId, conditionId)
        return ApiMethods.delete(url)
    }

    static getAvailableConditions = (patientId: string, params?: any) => {
        const url = BASE_URL + ENDPOINTS.GET_AVAILABLE_CONDITIONS(patientId, params)
        return ApiMethods.get(url)
    }

    static syncPatientCondition = (patientId: string, conditionId: string) => {
        const url = BASE_URL + ENDPOINTS.SYNC_PATIENT_CONDITION(patientId, conditionId)
        return ApiMethods.post(url, {})
    }

    // Visit Conditions (Multi-Condition Support)
    static getVisitConditions = (visitId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_VISIT_CONDITIONS(visitId)
        return ApiMethods.get(url)
    }

    static createVisitCondition = (data: CreateVisitConditionDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_VISIT_CONDITION()
        return ApiMethods.post(url, data)
    }

    static addConditionToVisit = (visitId: string, data: CreateVisitConditionDto) => {
        const visitConditionData = {
            ...data,
            visit_id: visitId
        }
        const url = BASE_URL + ENDPOINTS.CREATE_VISIT_CONDITION()
        return ApiMethods.post(url, visitConditionData)
    }

    static updateVisitCondition = (id: string, data: Partial<CreateVisitConditionDto>) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_VISIT_CONDITION(id)
        return ApiMethods.put(url, data)
    }

    static deleteVisitCondition = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_VISIT_CONDITION(id)
        return ApiMethods.delete(url)
    }

    static getConditionHistory = (patientConditionId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CONDITION_HISTORY(patientConditionId)
        return ApiMethods.get(url)
    }

    static getAvailableConditionsForVisit = (patientId: string, params?: any) => {
        const url = BASE_URL + ENDPOINTS.GET_AVAILABLE_CONDITIONS_FOR_VISIT(patientId, params)
        return ApiMethods.get(url)
    }

    static getConditionProtocol = (conditionId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CONDITION_PROTOCOL(conditionId)
        return ApiMethods.get(url)
    }

    // Static Data - Conditions
    static getAllStaticConditions = () => {
        const url = BASE_URL + ENDPOINTS.GET_ALL_STATIC_CONDITIONS()
        return ApiMethods.get(url)
    }

    static searchConditions = (params?: any) => {
        const url = BASE_URL + ENDPOINTS.SEARCH_CONDITIONS(params)
        return ApiMethods.get(url)
    }

    static getConditionByIdentifier = (identifier: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CONDITION_BY_IDENTIFIER(identifier)
        return ApiMethods.get(url)
    }

    // Neo4j Conditions (Knowledge Graph)
    static getAllConditions = (params?: any) => {
        const url = BASE_URL + ENDPOINTS.GET_ALL_CONDITIONS(params)
        return ApiMethods.get(url)
    }

    static getConditionById = (conditionId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CONDITION_BY_ID(conditionId)
        return ApiMethods.get(url)
    }

    static getConditionsByBodyRegion = (bodyRegion: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CONDITIONS_BY_BODY_REGION(bodyRegion)
        return ApiMethods.get(url)
    }

    static getConditionProtocols = (conditionId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_CONDITION_PROTOCOLS(conditionId)
        return ApiMethods.get(url)
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

    static completeVisit = (id: string, feedback?: { rating?: number; comment?: string; signature?: string; skipped?: boolean }) => {
        const url = BASE_URL + ENDPOINTS.COMPLETE_VISIT(id)
        return ApiMethods.post(url, feedback || {})
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
    static uploadProfilePhoto = (file: File, photoType: 'profile' | 'cover' | 'gallery' | 'signature', caption?: string) => {
        const url = BASE_URL + ENDPOINTS.UPLOAD_PROFILE_PHOTO()
        return ApiMethods.photoPost(url, file, photoType, caption)
    }

    static getProfilePhotos = () => {
        const url = BASE_URL + ENDPOINTS.GET_PROFILE_PHOTOS()
        return ApiMethods.get(url)
    }

    static deleteProfilePhoto = (photoType: 'profile' | 'cover' | 'gallery' | 'signature', photoId?: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_PROFILE_PHOTO()
        return ApiMethods.post(url, { photoType, photoId }, { 'X-HTTP-Method-Override': 'DELETE' })
    }

    static getPhotoConstraints = () => {
        const url = BASE_URL + ENDPOINTS.GET_PHOTO_CONSTRAINTS()
        return ApiMethods.get(url)
    }

    // Bank Account
    static updateBankAccount = (data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_BANK_ACCOUNT()
        return ApiMethods.put(url, data)
    }

    static getBankAccount = () => {
        const url = BASE_URL + ENDPOINTS.GET_BANK_ACCOUNT()
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

    // Physio Service Locations
    static getServiceLocations = (physiotherapistId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_SERVICE_LOCATIONS(physiotherapistId)
        return ApiMethods.get(url)
    }

    static createServiceLocation = (physiotherapistId: string, data: any) => {
        const url = BASE_URL + ENDPOINTS.CREATE_SERVICE_LOCATION(physiotherapistId)
        return ApiMethods.post(url, data)
    }

    static updateServiceLocation = (physiotherapistId: string, locationId: string, data: any) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_SERVICE_LOCATION(physiotherapistId, locationId)
        return ApiMethods.put(url, data)
    }

    static deleteServiceLocation = (physiotherapistId: string, locationId: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_SERVICE_LOCATION(physiotherapistId, locationId)
        return ApiMethods.delete(url)
    }

    // Service Areas (New coordinate-based system)
    static getMyServiceArea = () => {
        const url = BASE_URL + 'service-areas/my-area'
        return ApiMethods.get(url)
    }

    static createServiceArea = (data: any) => {
        const url = BASE_URL + 'service-areas'
        return ApiMethods.post(url, data)
    }

    static updateServiceArea = (data: any) => {
        const url = BASE_URL + 'service-areas'
        return ApiMethods.put(url, data)
    }

    static deleteServiceArea = () => {
        const url = BASE_URL + 'service-areas'
        return ApiMethods.delete(url)
    }

    static searchPhysiotherapistsByLocation = (params: { latitude: number; longitude: number; max_radius_km?: number; availability_type?: string }) => {
        const url = BASE_URL + 'service-areas/search'
        return ApiMethods.post(url, params)
    }

    static checkServiceAvailability = (physiotherapistId: string, params: { latitude: number; longitude: number }) => {
        const url = BASE_URL + `service-areas/check-availability/${physiotherapistId}`
        return ApiMethods.get(url, { params })
    }

    // Legacy pincode-based methods (keeping for backward compatibility)
    static searchPhysiosByPincode = (params: { pincode: string; dayOfWeek?: number }) => {
        const url = BASE_URL + ENDPOINTS.SEARCH_BY_PINCODE(params)
        return ApiMethods.get(url)
    }

    static getZoneInfo = (locationId: string, params: { pincode: string; latitude?: number; longitude?: number }) => {
        const url = BASE_URL + ENDPOINTS.GET_ZONE_INFO(locationId, params)
        return ApiMethods.get(url)
    }

    // Pincodes
    static searchPincodes = (query: string, limit?: number) => {
        const params = new URLSearchParams({ q: query })
        if (limit) params.append('limit', limit.toString())
        const url = BASE_URL + `pincodes/search?${params.toString()}`
        return ApiMethods.get(url)
    }

    static getPincodeDetails = (pincode: string) => {
        const url = BASE_URL + `pincodes/${pincode}`
        return ApiMethods.get(url)
    }

    static validatePincodes = (pincodes: string[]) => {
        const url = BASE_URL + `pincodes/validate`
        return ApiMethods.post(url, { pincodes })
    }

    // Treatment Protocols
    static getTreatmentProtocols = (params?: GetTreatmentProtocolsQueryDto) => {
        const url = BASE_URL + ENDPOINTS.GET_TREATMENT_PROTOCOLS(params)
        return ApiMethods.get(url)
    }

    static getTreatmentProtocol = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_TREATMENT_PROTOCOL(id)
        return ApiMethods.get(url)
    }

    static getTreatmentProtocolByVisit = (visitId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_TREATMENT_PROTOCOL_BY_VISIT(visitId)
        return ApiMethods.get(url)
    }

    static checkTreatmentProtocolExists = (visitId: string) => {
        const url = BASE_URL + ENDPOINTS.CHECK_TREATMENT_PROTOCOL_EXISTS(visitId)
        return ApiMethods.get(url)
    }

    static createTreatmentProtocol = (data: CreateTreatmentProtocolDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_TREATMENT_PROTOCOL()
        return ApiMethods.post(url, data)
    }

    static updateTreatmentProtocol = (id: string, data: UpdateTreatmentProtocolDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_TREATMENT_PROTOCOL(id)
        return ApiMethods.put(url, data)
    }

    static deleteTreatmentProtocol = (id: string) => {
        const url = BASE_URL + ENDPOINTS.DELETE_TREATMENT_PROTOCOL(id)
        return ApiMethods.delete(url)
    }

    static finalizeTreatmentProtocol = (id: string) => {
        const url = BASE_URL + ENDPOINTS.FINALIZE_TREATMENT_PROTOCOL(id)
        return ApiMethods.post(url, {})
    }

    static sendTreatmentProtocolToPatient = (id: string) => {
        const url = BASE_URL + ENDPOINTS.SEND_TREATMENT_PROTOCOL(id)
        return ApiMethods.post(url, {})
    }

    static generateTreatmentProtocolPDF = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_TREATMENT_PROTOCOL_PDF(id)
        return ApiMethods.get(url)
    }

    // Specialization Pricing APIs
    static getSpecializations = () => {
        const url = BASE_URL + 'specialty-pricing/specializations'
        return ApiMethods.get(url)
    }

    static getMySpecialtyPricings = () => {
        const url = BASE_URL + 'specialty-pricing/my-specialties'
        return ApiMethods.get(url)
    }

    static createSpecialtyPricing = (data: any) => {
        const url = BASE_URL + 'specialty-pricing'
        return ApiMethods.post(url, data)
    }

    static bulkCreateSpecialtyPricings = (data: any) => {
        const url = BASE_URL + 'specialty-pricing/bulk'
        return ApiMethods.post(url, data)
    }

    static updateSpecialtyPricing = (id: string, data: any) => {
        const url = BASE_URL + `specialty-pricing/${id}`
        return ApiMethods.put(url, data)
    }

    static deleteSpecialtyPricing = (id: string) => {
        const url = BASE_URL + `specialty-pricing/${id}`
        return ApiMethods.delete(url)
    }

    static searchPhysiotherapistsBySpecialty = (params: { latitude: number; longitude: number; specialization?: string; min_price?: number; max_price?: number; featured_only?: boolean }) => {
        const url = BASE_URL + 'specialty-pricing/search'
        return ApiMethods.post(url, params)
    }

    static getPhysiotherapistSpecialties = (physiotherapistId: string, params?: { latitude?: number; longitude?: number }) => {
        const url = BASE_URL + `specialty-pricing/physio/${physiotherapistId}/specialties`
        return ApiMethods.get(url, { params })
    }

    static getSpecialtyPricingSetupGuide = () => {
        const url = BASE_URL + 'specialty-pricing/setup-guide'
        return ApiMethods.get(url)
    }

    // Protocol Generator (AI)
    static generateProtocol = (data: any) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_PROTOCOL()
        return ApiMethods.post(url, data)
    }

    static generateProtocolDirect = (data: any) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_PROTOCOL_DIRECT()
        return ApiMethods.post(url, data)
    }

    static generateProtocolStructured = (data: any) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_PROTOCOL_STRUCTURED()
        return ApiMethods.post(url, data)
    }

    static generateProtocolStructuredDirect = (data: any) => {
        const url = BASE_URL + ENDPOINTS.GENERATE_PROTOCOL_STRUCTURED_DIRECT()
        return ApiMethods.post(url, data)
    }

    static validateProtocolSafety = (data: { patientId: string; conditionId: string }) => {
        const url = BASE_URL + ENDPOINTS.VALIDATE_PROTOCOL_SAFETY()
        return ApiMethods.post(url, data)
    }

    // Protocol Loggings (Manual Entry Audit)
    static createProtocolLogging = (data: any) => {
        const url = BASE_URL + ENDPOINTS.CREATE_PROTOCOL_LOGGING()
        return ApiMethods.post(url, data)
    }

    static getProtocolLoggings = (params?: Record<string, any>) => {
        const url = BASE_URL + ENDPOINTS.GET_PROTOCOL_LOGGINGS(params)
        return ApiMethods.get(url)
    }

    // Protocol Generation Logs (AI vs Physio comparison)
    static createProtocolGenerationLog = (data: {
        patientId: string
        conditionId: string
        conditionName?: string
        visitId?: string
        protocolType: 'home' | 'clinical'
        aiSent: any
        physioPrescribed: any
    }) => {
        const url = BASE_URL + ENDPOINTS.CREATE_PROTOCOL_GENERATION_LOG()
        return ApiMethods.post(url, data)
    }

    static getProtocolGenerationLogs = (params?: Record<string, any>) => {
        const url = BASE_URL + ENDPOINTS.GET_PROTOCOL_GENERATION_LOGS(params)
        return ApiMethods.get(url)
    }

    // ============ PUBLIC APIs (No Auth Required - For QR Registration) ============

    /**
     * Get clinic info by code (public - for QR registration page)
     */
    static getPublicClinicByCode = (clinicCode: string) => {
        const url = BASE_URL + `public/clinics/code/${clinicCode}`
        return ApiMethods.publicGet(url)
    }

    /**
     * Register patient via QR code (public - no auth required)
     */
    static publicPatientRegister = (data: PublicPatientRegistrationDto) => {
        const url = BASE_URL + 'public/patients/register'
        return ApiMethods.publicPost(url, data)
    }

    // ============ BILLING APIs ============

    // Patient Account & Balance
    static getPatientAccount = (patientId: string, clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT_ACCOUNT(patientId, clinicId)
        return ApiMethods.get(url)
    }

    static getPatientBalance = (patientId: string, clinicId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT_BALANCE(patientId, clinicId)
        return ApiMethods.get(url)
    }

    static recordPayment = (patientId: string, clinicId: string, data: RecordPaymentDto) => {
        const url = BASE_URL + ENDPOINTS.RECORD_PATIENT_PAYMENT(patientId, clinicId)
        return ApiMethods.post(url, data)
    }

    static getPatientPayments = (patientId: string, clinicId: string, limit?: number) => {
        const url = BASE_URL + ENDPOINTS.GET_PATIENT_PAYMENTS(patientId, clinicId, limit)
        return ApiMethods.get(url)
    }

    static getAvailableSessionPacks = (patientId: string, clinicId: string, conditionId?: string) => {
        const url = BASE_URL + ENDPOINTS.GET_AVAILABLE_SESSION_PACKS(patientId, clinicId, conditionId)
        return ApiMethods.get(url)
    }

    // Session Packs
    static createSessionPack = (data: CreateSessionPackDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_SESSION_PACK()
        return ApiMethods.post(url, data)
    }

    static getSessionPacks = (params: SessionPackQueryParams) => {
        const url = BASE_URL + ENDPOINTS.GET_SESSION_PACKS(params)
        return ApiMethods.get(url)
    }

    static getSessionPack = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_SESSION_PACK(id)
        return ApiMethods.get(url)
    }

    static addSessionsToPack = (id: string, data: AddSessionsDto) => {
        const url = BASE_URL + ENDPOINTS.ADD_SESSIONS_TO_PACK(id)
        return ApiMethods.post(url, data)
    }

    // Visit Billing
    static billVisit = (visitId: string, data: BillVisitDto) => {
        const url = BASE_URL + ENDPOINTS.BILL_VISIT(visitId)
        return ApiMethods.post(url, data)
    }

    static getVisitBilling = (visitId: string) => {
        const url = BASE_URL + ENDPOINTS.GET_VISIT_BILLING(visitId)
        return ApiMethods.get(url)
    }

    static updateVisitBilling = (visitId: string, data: UpdateVisitBillingDto) => {
        const url = BASE_URL + ENDPOINTS.UPDATE_VISIT_BILLING(visitId)
        return ApiMethods.patch(url, data)
    }

    // Invoices
    static createInvoice = (data: CreateInvoiceDto) => {
        const url = BASE_URL + ENDPOINTS.CREATE_INVOICE()
        return ApiMethods.post(url, data)
    }

    static getInvoices = (params: InvoiceQueryParams) => {
        const url = BASE_URL + ENDPOINTS.GET_INVOICES(params)
        return ApiMethods.get(url)
    }

    static getInvoice = (id: string) => {
        const url = BASE_URL + ENDPOINTS.GET_INVOICE(id)
        return ApiMethods.get(url)
    }

    static finalizeInvoice = (id: string) => {
        const url = BASE_URL + ENDPOINTS.FINALIZE_INVOICE(id)
        return ApiMethods.post(url, {})
    }

    // Billing Reports
    static getDailySummary = (clinicId: string, date?: string) => {
        const url = BASE_URL + ENDPOINTS.GET_DAILY_SUMMARY(clinicId, date)
        return ApiMethods.get(url)
    }

    static getOutstandingReport = (params: OutstandingReportParams) => {
        const url = BASE_URL + ENDPOINTS.GET_OUTSTANDING_REPORT(params)
        return ApiMethods.get(url)
    }

    static getCollectionReport = (params: CollectionReportParams) => {
        const url = BASE_URL + ENDPOINTS.GET_COLLECTION_REPORT(params)
        return ApiMethods.get(url)
    }

    // ============ DASHBOARD APIs ============

    // Organization Owner Dashboard
    static getOrgDashboardSummary = (organizationId: string) => {
        const url = BASE_URL + `analytics/dashboard/org/${organizationId}/summary`
        return ApiMethods.get(url)
    }

    static getOrgMonthlyRevenue = (organizationId: string, months: number = 6) => {
        const url = BASE_URL + `analytics/dashboard/org/${organizationId}/monthly-revenue?months=${months}`
        return ApiMethods.get(url)
    }

    static getOrgOutstandingPatients = (organizationId: string, limit: number = 10) => {
        const url = BASE_URL + `analytics/dashboard/org/${organizationId}/outstanding-patients?limit=${limit}`
        return ApiMethods.get(url)
    }

    static getOrgClinicComparison = (organizationId: string) => {
        const url = BASE_URL + `analytics/dashboard/org/${organizationId}/clinic-comparison`
        return ApiMethods.get(url)
    }

    // Clinic Admin Dashboard
    static getClinicDashboardToday = (clinicId: string) => {
        const url = BASE_URL + `analytics/dashboard/clinic/${clinicId}/today`
        return ApiMethods.get(url)
    }

    static getClinicAppointmentsToday = (clinicId: string) => {
        const url = BASE_URL + `analytics/dashboard/clinic/${clinicId}/appointments-today`
        return ApiMethods.get(url)
    }

    static getClinicWeeklyCollections = (clinicId: string) => {
        const url = BASE_URL + `analytics/dashboard/clinic/${clinicId}/weekly-collections`
        return ApiMethods.get(url)
    }

    static getClinicSessionsEnding = (clinicId: string, threshold: number = 3) => {
        const url = BASE_URL + `analytics/dashboard/clinic/${clinicId}/sessions-ending?threshold=${threshold}`
        return ApiMethods.get(url)
    }

    static getClinicOutstandingPatients = (clinicId: string, limit: number = 10) => {
        const url = BASE_URL + `analytics/dashboard/clinic/${clinicId}/outstanding-patients?limit=${limit}`
        return ApiMethods.get(url)
    }

    // Physiotherapist Dashboard
    static getPhysioDashboardSummary = (clinicId?: string) => {
        const url = BASE_URL + `analytics/dashboard/physio/summary${clinicId ? `?clinicId=${clinicId}` : ''}`
        return ApiMethods.get(url)
    }

    static getPhysioSchedule = (clinicId?: string, date?: string) => {
        const params = new URLSearchParams()
        if (clinicId) params.append('clinicId', clinicId)
        if (date) params.append('date', date)
        const url = BASE_URL + `analytics/dashboard/physio/schedule${params.toString() ? `?${params.toString()}` : ''}`
        return ApiMethods.get(url)
    }

    static getPhysioPatientsAttention = (clinicId?: string) => {
        const url = BASE_URL + `analytics/dashboard/physio/attention-needed${clinicId ? `?clinicId=${clinicId}` : ''}`
        return ApiMethods.get(url)
    }

    // Insights
    static getInsightsDemographics = (clinicId: string) => {
        const url = BASE_URL + `analytics/insights/${clinicId}/demographics`
        return ApiMethods.get(url)
    }

    static getInsightsConditions = (clinicId: string, limit: number = 10) => {
        const url = BASE_URL + `analytics/insights/${clinicId}/conditions?limit=${limit}`
        return ApiMethods.get(url)
    }

    static getInsightsOperations = (clinicId: string) => {
        const url = BASE_URL + `analytics/insights/${clinicId}/operations`
        return ApiMethods.get(url)
    }

    static getInsightsConditionsMonthly = (clinicId: string, months: number = 6) => {
        const url = BASE_URL + `analytics/insights/${clinicId}/conditions-monthly?months=${months}`
        return ApiMethods.get(url)
    }

    // Organization Insights
    static getOrgInsightsDemographics = (organizationId: string) => {
        const url = BASE_URL + `analytics/insights/org/${organizationId}/demographics`
        return ApiMethods.get(url)
    }

    static getOrgInsightsConditions = (organizationId: string, limit: number = 10) => {
        const url = BASE_URL + `analytics/insights/org/${organizationId}/conditions?limit=${limit}`
        return ApiMethods.get(url)
    }

    static getOrgInsightsOperations = (organizationId: string) => {
        const url = BASE_URL + `analytics/insights/org/${organizationId}/operations`
        return ApiMethods.get(url)
    }

    static getOrgInsightsConditionsMonthly = (organizationId: string, months: number = 6) => {
        const url = BASE_URL + `analytics/insights/org/${organizationId}/conditions-monthly?months=${months}`
        return ApiMethods.get(url)
    }

    // Clinical Outcomes
    static getOrgClinicalOutcomes = (organizationId: string) => {
        const url = BASE_URL + `analytics/outcomes/org/${organizationId}`
        return ApiMethods.get(url)
    }

    static getOrgClinicalOutcomesSummary = (organizationId: string) => {
        const url = BASE_URL + `analytics/outcomes/org/${organizationId}/summary`
        return ApiMethods.get(url)
    }

    static getOrgClinicalOutcomesByCondition = (organizationId: string) => {
        const url = BASE_URL + `analytics/outcomes/org/${organizationId}/by-condition`
        return ApiMethods.get(url)
    }

    static getOrgClinicalOutcomesByTherapist = (organizationId: string) => {
        const url = BASE_URL + `analytics/outcomes/org/${organizationId}/by-therapist`
        return ApiMethods.get(url)
    }
}

export default ApiManager
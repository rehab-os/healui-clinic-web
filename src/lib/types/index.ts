export interface LoginDto {
    phone: string
    firebaseIdToken: string
    otp?: string // Deprecated: Use firebaseIdToken instead
}

export interface SendOtpDto {
    phone: string
}

export interface LoginResponseDto {
    access_token: string
    refresh_token: string
    user: {
        id: string
        phone: string
        full_name: string
        email?: string
        roles: Array<{
            role: string
            display_name: string
            organization_id?: string
            clinic_id?: string
            permissions: string[]
        }>
    }
}

// Organization Types
export enum OrganizationType {
    CHAIN = 'CHAIN',
    SINGLE_CLINIC = 'SINGLE_CLINIC',
}

export interface CreateOrganizationDto {
    name: string
    registration_no?: string
    gst_no?: string
    pan_no?: string
    bank_details?: Record<string, any>
    admin_phone: string
    admin_name: string
    admin_email?: string
}

export type UpdateOrganizationDto = Partial<CreateOrganizationDto>

export interface OrganizationResponseDto {
    id: string
    name: string
    slug: string
    type: OrganizationType
    registration_no?: string
    gst_no?: string
    pan_no?: string
    logo_url?: string
    owner_user_id: string
    is_active: boolean
    created_at: Date
    updated_at: Date
}

// Clinic Types
export interface CreateClinicDto {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    email?: string
    latitude?: number
    longitude?: number
    working_hours?: Record<string, any>
    facilities?: string[]
    total_beds?: number
    admin_phone: string
}

export type UpdateClinicDto = Partial<CreateClinicDto>

export interface ClinicResponseDto {
    id: string
    organization_id: string
    name: string
    code: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    email?: string
    latitude?: number
    longitude?: number
    working_hours?: Record<string, any>
    facilities?: string[]
    total_beds?: number
    is_active: boolean
    created_at: Date
    updated_at: Date
}

// User Types
export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export enum BloodGroup {
    A_POSITIVE = 'A_POSITIVE',
    A_NEGATIVE = 'A_NEGATIVE',
    B_POSITIVE = 'B_POSITIVE',
    B_NEGATIVE = 'B_NEGATIVE',
    AB_POSITIVE = 'AB_POSITIVE',
    AB_NEGATIVE = 'AB_NEGATIVE',
    O_POSITIVE = 'O_POSITIVE',
    O_NEGATIVE = 'O_NEGATIVE',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

export interface CreateUserDto {
    phone: string
    full_name: string
    email?: string
    date_of_birth?: string
    gender?: Gender
    blood_group?: BloodGroup
    emergency_contact?: string
    address?: string
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
    user_status?: UserStatus
}

export interface UpdateProfileDto {
    full_name?: string
    email?: string
    date_of_birth?: string
    gender?: Gender
    blood_group?: BloodGroup
    emergency_contact?: string
    address?: string
    profile_photo_url?: string
}

export interface AssignRoleDto {
    roleId: string
    organizationId?: string
    clinicId?: string
}

export interface UserListQueryDto {
    organizationId?: string
    clinicId?: string
    role?: string
    status?: UserStatus
    page?: number
    limit?: number
}

export interface UserResponseDto {
    id: string
    phone: string
    full_name: string
    email?: string
    date_of_birth?: Date
    gender?: Gender
    profile_photo_url?: string
    blood_group?: BloodGroup
    emergency_contact?: string
    address?: string
    user_status: UserStatus
    profile_completed: boolean
    created_at: Date
    updated_at: Date
    roles?: Array<{
        id: string
        role: {
            id: string
            name: string
            display_name: string
        }
        organization?: {
            id: string
            name: string
        }
        clinic?: {
            id: string
            name: string
        }
        assigned_at: Date
    }>
}

// Role Types
export interface CreateRoleDto {
    name: string
    display_name: string
    description?: string
    is_system_role?: boolean
}

export type UpdateRoleDto = Partial<CreateRoleDto>

export interface AssignPermissionsDto {
    permission_ids: string[]
}

export interface RoleResponseDto {
    id: string
    name: string
    display_name: string
    description?: string
    is_system_role: boolean
    created_at: Date
    permissions?: PermissionResponseDto[]
}

// Permission Types
export interface CreatePermissionDto {
    resource: string
    action: string
    description?: string
}

export type UpdatePermissionDto = Partial<CreatePermissionDto>

export interface PermissionResponseDto {
    id: string
    resource: string
    action: string
    name: string
    description?: string
    created_at: Date
}

// Patient Types
export enum PatientStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DISCHARGED = 'DISCHARGED'
}

export interface CreatePatientDto {
    full_name: string
    phone: string
    email?: string
    date_of_birth: string
    gender: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    medical_history?: string
    allergies?: string[]
    current_medications?: string[]
    referred_by?: string
    insurance_provider?: string
    insurance_policy_number?: string
    clinic_id: string
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
    status?: PatientStatus
}

export interface PatientResponseDto {
    id: string
    clinic_id: string
    patient_code: string
    full_name: string
    phone: string
    email?: string
    date_of_birth: Date
    gender: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    medical_history?: string
    allergies?: string[]
    current_medications?: string[]
    status: PatientStatus
    referred_by?: string
    insurance_provider?: string
    insurance_policy_number?: string
    created_by: string
    created_at: Date
    updated_at: Date
}

// Visit Types
export enum VisitStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW'
}

export enum VisitType {
    INITIAL_CONSULTATION = 'INITIAL_CONSULTATION',
    FOLLOW_UP = 'FOLLOW_UP',
    REVIEW = 'REVIEW',
    EMERGENCY = 'EMERGENCY'
}

export enum VisitMode {
    WALK_IN = 'WALK_IN',
    ONLINE = 'ONLINE'
}

export interface CreateVisitDto {
    patient_id: string
    clinic_id: string
    physiotherapist_id: string
    visit_type: VisitType
    scheduled_date: string
    scheduled_time: string
    duration_minutes?: number
    chief_complaint?: string
    parent_visit_id?: string
    visit_mode?: VisitMode
}

export interface UpdateVisitDto extends Partial<CreateVisitDto> {
    status?: VisitStatus
    vital_signs?: any
}

export interface CheckInVisitDto {
    vital_signs?: any
}

export interface StartVisitDto {
    vital_signs?: any
}

export interface CancelVisitDto {
    cancellation_reason: string
}

export interface RescheduleVisitDto {
    scheduled_date: string
    scheduled_time: string
    duration_minutes?: number
}

export interface PhysiotherapistAvailabilityDto {
    clinic_id: string
    date: string
    time: string
    duration_minutes?: number
}

export interface VisitResponseDto {
    id: string
    patient_id: string
    clinic_id: string
    physiotherapist_id: string
    visit_type: VisitType
    scheduled_date: Date
    scheduled_time: string
    duration_minutes: number
    status: VisitStatus
    chief_complaint?: string
    check_in_time?: Date
    start_time?: Date
    end_time?: Date
    cancellation_reason?: string
    cancelled_by?: string
    cancelled_at?: Date
    parent_visit_id?: string
    vital_signs?: any
    visit_mode: VisitMode
    video_link?: string
    video_session_id?: string
    created_by: string
    created_at: Date
    updated_at: Date
}

// Note Types
export enum NoteType {
    SOAP = 'SOAP',
    DAP = 'DAP',
    PROGRESS = 'PROGRESS'
}

export interface CreateNoteDto {
    visit_id: string
    note_type: NoteType
    note_data: any
    additional_notes?: string
    treatment_codes?: string[]
    treatment_details?: any
    goals?: any
    outcome_measures?: Record<string, any>
    attachments?: string[]
}

export interface UpdateNoteDto extends Partial<CreateNoteDto> {}

export interface SignNoteDto {
    is_signed: boolean
}

export interface NoteResponseDto {
    id: string
    visit_id: string
    note_type: NoteType
    note_data: any
    additional_notes?: string
    treatment_codes?: string[]
    treatment_details?: any
    goals?: any
    outcome_measures?: Record<string, any>
    attachments?: string[]
    is_signed: boolean
    signed_by?: string
    signed_at?: Date
    created_by: string
    created_at: Date
    updated_at: Date
}

// Team Management Types
export interface AddTeamMemberDto {
    user_id: string
    role_id: string
    clinic_id?: string
}

// Audio Transcription Types
export interface TranscribeAudioDto {
    audio: File
}

export interface TranscriptionResponseDto {
    transcription: string
}

// Notes Generation Types
export interface GenerateNoteDto {
    transcription: string
    noteType: 'SOAP' | 'BAP' | 'Progress'
}

export interface SOAPNoteData {
    subjective: string
    objective: string
    assessment: string
    plan: string
}

export interface BAPNoteData {
    behavior: string
    assessment: string
    plan: string
}

export interface ProgressNoteData {
    progressNote: string
}

export interface GenerateNoteResponseDto {
    noteType: string
    note: SOAPNoteData | BAPNoteData | ProgressNoteData
}
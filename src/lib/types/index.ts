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

// Medical History Support Types
export enum ActivityLevel {
    SEDENTARY = 'SEDENTARY',
    LIGHT = 'LIGHT',
    MODERATE = 'MODERATE',
    ACTIVE = 'ACTIVE',
    ATHLETIC = 'ATHLETIC'
}

export interface PreviousSurgeryDto {
    procedure: string
    date?: string
    body_part?: string
}

export interface PastIllnessDto {
    illness: string
    date?: string
    treatment: string
    resolved: boolean
}

export interface PastInvestigationDto {
    type: string
    date?: string
    findings: string
    body_part?: string
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
    chronic_conditions?: string[]
    previous_surgeries?: PreviousSurgeryDto[]
    past_illnesses?: PastIllnessDto[]
    past_investigations?: PastInvestigationDto[]
    occupation?: string
    activity_level?: ActivityLevel
    family_history?: string
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
    chronic_conditions?: string[]
    previous_surgeries?: PreviousSurgeryDto[]
    past_illnesses?: PastIllnessDto[]
    past_investigations?: PastInvestigationDto[]
    occupation?: string
    activity_level?: ActivityLevel
    family_history?: string
    allergies?: string[]
    current_medications?: string[]
    status: PatientStatus
    referred_by?: string
    insurance_provider?: string
    insurance_policy_number?: string
    created_by: string
    created_at: Date
    updated_at: Date
    conditions?: PatientConditionResponseDto[]  // NEW: Multi-condition support
}

// Multi-Condition Support Types
export enum ConditionStatus {
    ACTIVE = 'ACTIVE',
    RESOLVED = 'RESOLVED',
    IMPROVING = 'IMPROVING',
    CHRONIC = 'CHRONIC'
}

export enum ConditionType {
    ACUTE = 'ACUTE',
    CHRONIC = 'CHRONIC',
    POST_SURGICAL = 'POST_SURGICAL',
    CONGENITAL = 'CONGENITAL'
}

export enum TreatmentFocus {
    PRIMARY = 'PRIMARY',
    SECONDARY = 'SECONDARY'
}

// Patient Condition Types
export interface CreatePatientConditionDto {
    neo4j_condition_id: string
    description?: string
    condition_type?: ConditionType
    onset_date?: string
}

export interface UpdatePatientConditionStatusDto {
    status: ConditionStatus
}

export interface UpdatePatientConditionDescriptionDto {
    description: string
}

export enum SeverityLevel {
    MILD = 'MILD',
    MODERATE = 'MODERATE',
    SEVERE = 'SEVERE',
}

export interface UpdatePatientConditionDto {
    status?: ConditionStatus
    description?: string
    severity_level?: SeverityLevel
    current_protocol_id?: string
    last_assessment_date?: string
    discharge_summary?: string
    discharged_at?: string
    discharged_by_id?: string
}

export interface PatientConditionResponseDto {
    id: string
    patient_id?: string
    patient_user_id?: string
    neo4j_condition_id: string
    condition_name: string
    description?: string
    condition_type: ConditionType
    onset_date?: Date
    status: ConditionStatus
    body_region?: string
    neo4j_metadata?: any
    created_at: Date
    updated_at: Date
    neo4j_condition?: Neo4jConditionResponseDto
    visit_conditions_count?: number
    last_treated_date?: Date
    
    // New fields
    discharged_at?: Date
    discharged_by_id?: string
    discharge_summary?: string
    current_protocol_id?: string
    severity_level?: SeverityLevel
    last_assessment_date?: Date
    dischargedBy?: {
        id: string
        full_name: string
    }
}

// Visit Condition Types
export interface CreateVisitConditionDto {
    visit_id: string
    patient_condition_id: string
    treatment_focus?: TreatmentFocus
    chief_complaint?: string
    session_goals?: string[]
    condition_metadata?: any
}

export interface VisitConditionResponseDto {
    id: string
    visit_id: string
    patient_condition_id: string
    neo4j_condition_id: string
    condition_name: string
    body_region?: string
    treatment_focus: TreatmentFocus
    chief_complaint?: string
    session_goals?: string[]
    condition_metadata?: any
    next_visit_plan?: string
    created_at: Date
    updated_at: Date
    condition?: PatientConditionResponseDto
    notes_count?: number
    protocols_count?: number
}

// Neo4j Condition Types
export interface Neo4jConditionResponseDto {
    condition_id: string
    condition_name: string
    description: string
    body_region: string
    category: string
    severity_levels?: string[]
    typical_duration_weeks?: number
    contraindications?: string[]
    risk_factors?: string[]
    assessment_criteria?: string[]
    treatment_protocols?: Neo4jTreatmentProtocolResponseDto[]
}

export interface Neo4jTreatmentProtocolResponseDto {
    protocol_id: string
    protocol_name: string
    phase: string
    duration_weeks: number
    goals?: string[]
    precautions?: string[]
    progression_criteria?: string[]
    exercises?: any[]
}

// Enhanced Visit Types with Multi-Condition Support
export interface ChiefComplaintDto {
    condition_id: string
    condition_name: string
    complaint: string
    severity?: number // 1-10 scale
    treatment_focus: TreatmentFocus
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
    chief_complaint?: string           // Keep for backward compatibility
    chief_complaints?: ChiefComplaintDto[]  // NEW: Multi-condition support
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
    chief_complaint?: string          // Keep for backward compatibility
    chief_complaints?: ChiefComplaintDto[]  // NEW: Multi-condition support
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
    visitConditions?: VisitConditionResponseDto[]  // NEW: Conditions treated in visit
    notes?: NoteResponseDto[]         // NEW: Multiple notes support
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
    visit_condition_id?: string      // NEW: Link note to specific condition
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
    visit_condition_id?: string      // NEW: Link note to specific condition
    condition_name?: string          // NEW: Condition name for display
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

// Treatment Protocol Types
export enum ProtocolStatus {
    DRAFT = 'DRAFT',
    FINALIZED = 'FINALIZED',
    SENT_TO_PATIENT = 'SENT_TO_PATIENT',
    ARCHIVED = 'ARCHIVED'
}

export enum StructureType {
    MUSCLES = 'muscles',
    JOINTS = 'joints',
    TENDONS = 'tendons',
    NEURAL = 'neural'
}

export interface CreateTreatmentProtocolExerciseDto {
    exercise_id?: string
    exercise_name: string
    exercise_description?: string
    custom_reps: number
    custom_sets: number
    custom_duration_seconds: number
    custom_notes?: string
    frequency?: string
    order_index?: number
}

export interface CreateTreatmentProtocolAreaDto {
    structure_id?: string
    structure_name: string
    structure_type: StructureType
    structure_category?: string
    additional_metadata?: {
        side?: 'left' | 'right' | 'bilateral'
        severity?: 'mild' | 'moderate' | 'severe'
        notes?: string
    }
}

export interface CreateTreatmentProtocolRecommendationDto {
    blood_tests?: string[]
    recommended_foods?: string[]
    foods_to_avoid?: string[]
    supplements?: string[]
    general_advice?: string[]
    precautions?: string[]
    hydration_notes?: string
    general_guidelines?: string[]
    additional_notes?: string
}

export interface CreateTreatmentProtocolDto {
    visit_id: string
    protocol_title: string
    current_complaint?: string
    general_notes?: string
    additional_manual_notes?: string
    show_explanations?: boolean
    exercises?: CreateTreatmentProtocolExerciseDto[]
    affected_areas?: CreateTreatmentProtocolAreaDto[]
    recommendations?: CreateTreatmentProtocolRecommendationDto
}

export interface UpdateTreatmentProtocolDto extends Partial<CreateTreatmentProtocolDto> {
    status?: ProtocolStatus
}

export interface TreatmentProtocolExerciseResponseDto {
    id: string
    exercise_id?: string
    exercise_name: string
    exercise_description?: string
    custom_reps: number
    custom_sets: number
    custom_duration_seconds: number
    custom_notes?: string
    frequency?: string
    order_index: number
}

export interface TreatmentProtocolAreaResponseDto {
    id: string
    structure_id?: string
    structure_name: string
    structure_type: StructureType
    structure_category?: string
    additional_metadata?: {
        side?: 'left' | 'right' | 'bilateral'
        severity?: 'mild' | 'moderate' | 'severe'
        notes?: string
    }
}

export interface TreatmentProtocolRecommendationResponseDto {
    id: string
    blood_tests?: string[]
    recommended_foods?: string[]
    foods_to_avoid?: string[]
    supplements?: string[]
    general_advice?: string[]
    precautions?: string[]
    hydration_notes?: string
    general_guidelines?: string[]
    additional_notes?: string
}

export interface TreatmentProtocolResponseDto {
    id: string
    visit_id: string
    patient_id: string
    clinic_id: string
    physiotherapist_id: string
    protocol_title: string
    current_complaint?: string
    general_notes?: string
    additional_manual_notes?: string
    show_explanations: boolean
    status: ProtocolStatus
    finalized_at?: Date
    sent_to_patient_at?: Date
    created_by: string
    updated_by?: string
    created_at: Date
    updated_at: Date
    exercises?: TreatmentProtocolExerciseResponseDto[]
    affected_areas?: TreatmentProtocolAreaResponseDto[]
    recommendations?: TreatmentProtocolRecommendationResponseDto
    patient?: {
        id: string
        full_name: string
        phone: string
        email?: string
        date_of_birth: Date
        gender: string
    }
    clinic?: {
        id: string
        name: string
        address?: string
        contact_phone?: string
    }
    physiotherapist?: {
        id: string
        first_name: string
        last_name: string
        email: string
    }
}

export interface GetTreatmentProtocolsQueryDto {
    visit_id?: string
    patient_id?: string
    clinic_id?: string
    physiotherapist_id?: string
    status?: ProtocolStatus
    search?: string
    page?: number
    limit?: number
}

export interface TreatmentProtocolExistsResponseDto {
    exists: boolean
    protocol_id?: string
    status?: ProtocolStatus
}

// Re-export analytics types
export * from './analytics.types'
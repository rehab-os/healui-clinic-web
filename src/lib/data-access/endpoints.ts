export const ENDPOINTS = {
    // Auth
    SEND_OTP: () => 'auth/send-otp',
    LOGIN: () => 'auth/login',
    GET_ME: () => 'auth/me',

    // Organizations
    GET_ORGANIZATIONS: () => 'organizations',
    GET_ORGANIZATION: (id: string) => `organizations/${id}`,
    CREATE_ORGANIZATION: () => 'organizations',
    UPDATE_ORGANIZATION: (id: string) => `organizations/${id}`,
    DELETE_ORGANIZATION: (id: string) => `organizations/${id}`,

    // Clinics
    GET_CLINICS: () => 'clinics',
    GET_CLINIC: (id: string) => `clinics/${id}`,
    CREATE_CLINIC: () => 'clinics',
    UPDATE_CLINIC: (id: string) => `clinics/${id}`,
    DELETE_CLINIC: (id: string) => `clinics/${id}`,

    // Users
    GET_USERS: () => 'users',
    GET_USER: (id: string) => `users/${id}`,
    CREATE_USER: () => 'users',
    UPDATE_USER: (id: string) => `users/${id}`,
    DELETE_USER: (id: string) => `users/${id}`,
    ASSIGN_ROLE: (id: string) => `users/${id}/assign-role`,
    REMOVE_ROLE: (userId: string, roleId: string) => `users/${userId}/roles/${roleId}`,
    GET_USER_PERMISSIONS: (id: string) => `users/${id}/permissions`,
    UPDATE_PROFILE: () => 'users/me',

    // Roles
    GET_ROLES: () => 'roles',
    GET_ROLE: (id: string) => `roles/${id}`,
    CREATE_ROLE: () => 'roles',
    UPDATE_ROLE: (id: string) => `roles/${id}`,
    DELETE_ROLE: (id: string) => `roles/${id}`,
    ASSIGN_PERMISSIONS: (id: string) => `roles/${id}/permissions`,
    UNASSIGN_PERMISSIONS: (id: string) => `roles/${id}/permissions`,

    // Permissions
    GET_PERMISSIONS: () => 'permissions',
    GET_PERMISSION: (id: string) => `permissions/${id}`,
    CREATE_PERMISSION: () => 'permissions',
    UPDATE_PERMISSION: (id: string) => `permissions/${id}`,
    DELETE_PERMISSION: (id: string) => `permissions/${id}`,

    // Team Management
    GET_TEAM_MEMBERS: () => 'team/members',
    ADD_TEAM_MEMBER: () => 'team/members',
    REMOVE_TEAM_MEMBER: (userId: string) => `team/members/${userId}`,
    UPDATE_TEAM_MEMBER_ROLE: (userId: string) => `team/members/${userId}/role`,

    // Patients
    GET_PATIENTS: (params?: Record<string, any>) => {
        let url = 'patients'
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
        return url
    },
    GET_PATIENT: (id: string) => `patients/${id}`,
    CREATE_PATIENT: () => 'patients',
    UPDATE_PATIENT: (id: string) => `patients/${id}`,
    DELETE_PATIENT: (id: string) => `patients/${id}`,
    GET_PATIENT_VISITS: (id: string) => `patients/${id}/visits`,
    GET_PATIENT_VISIT_HISTORY: (id: string) => `patients/${id}/visit-history`,

    // Visits
    GET_VISITS: () => 'patients/visits',
    GET_VISIT: (id: string) => `patients/visits/${id}`,
    CREATE_VISIT: () => 'patients/visits',
    UPDATE_VISIT: (id: string) => `patients/visits/${id}`,
    CHECK_IN_VISIT: (id: string) => `patients/visits/${id}/check-in`,
    START_VISIT: (id: string) => `patients/visits/${id}/start`,
    COMPLETE_VISIT: (id: string) => `patients/visits/${id}/complete`,
    CANCEL_VISIT: (id: string) => `patients/visits/${id}/cancel`,
    RESCHEDULE_VISIT: (id: string) => `patients/visits/${id}/reschedule`,
    GET_AVAILABLE_PHYSIOTHERAPISTS: () => 'patients/physiotherapists/availability',

    // Notes
    CREATE_NOTE: () => 'patients/notes',
    GET_NOTE: (id: string) => `patients/notes/${id}`,
    UPDATE_NOTE: (id: string) => `patients/notes/${id}`,
    SIGN_NOTE: (id: string) => `patients/notes/${id}/sign`,

    // Physiotherapist Profile
    GET_PHYSIOTHERAPIST_PROFILE: () => 'physiotherapist-profile',
    CREATE_PHYSIOTHERAPIST_PROFILE: () => 'physiotherapist-profile',
    UPDATE_PHYSIOTHERAPIST_PROFILE: () => 'physiotherapist-profile',
    CREATE_COMPLETE_PROFILE: () => 'physiotherapist-profile/complete',
    ADD_EDUCATION: () => 'physiotherapist-profile/education',
    ADD_TECHNIQUE: () => 'physiotherapist-profile/technique',
    ADD_MACHINE: () => 'physiotherapist-profile/machine',
    ADD_WORKSHOP: () => 'physiotherapist-profile/workshop',
    DELETE_EDUCATION: (id: string) => `physiotherapist-profile/education/${id}`,
    DELETE_TECHNIQUE: (id: string) => `physiotherapist-profile/technique/${id}`,
    DELETE_MACHINE: (id: string) => `physiotherapist-profile/machine/${id}`,
    DELETE_WORKSHOP: (id: string) => `physiotherapist-profile/workshop/${id}`,

    // Audio
    TRANSCRIBE_AUDIO: () => 'audio/transcribe',

    // Notes Generation
    GENERATE_NOTE: () => 'notes/generate',

    // Nutrition
    GENERATE_NUTRITION_PLAN: () => 'nutrition/generate',
}
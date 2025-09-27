import { getCookieValue } from '../utils/helpers'
import { store } from '../../store/store'

const getHeaders = (additionalHeaders?: Record<string, string>) => {
    const access_token = getCookieValue('access_token')
    
    // Get context from Redux store
    let contextHeaders: Record<string, string> = {}
    
    if (typeof window !== 'undefined') {
        try {
            const state = store.getState()
            const userData = state.user?.userData
            const currentClinic = state.user?.currentClinic
            
            if (userData?.organization?.id) {
                contextHeaders['x-organization-id'] = userData.organization.id
            }
            
            if (currentClinic?.id) {
                contextHeaders['x-clinic-id'] = currentClinic.id
            }
        } catch (error) {
            // Silently fail if store is not available
        }
    }
    
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        ...contextHeaders,
        ...additionalHeaders, // Allow override of context headers if needed
    }
}

const getFileHeaders = (additionalHeaders?: Record<string, string>) => {
    const access_token = getCookieValue('access_token')
    
    // Get context from Redux store
    let contextHeaders: Record<string, string> = {}
    
    if (typeof window !== 'undefined') {
        try {
            const state = store.getState()
            const userData = state.user?.userData
            const currentClinic = state.user?.currentClinic
            
            if (userData?.organization?.id) {
                contextHeaders['x-organization-id'] = userData.organization.id
            }
            
            if (currentClinic?.id) {
                contextHeaders['x-clinic-id'] = currentClinic.id
            }
        } catch (error) {
            // Silently fail if store is not available
        }
    }
    
    return { 
        Authorization: `Bearer ${access_token}`,
        ...contextHeaders,
        ...additionalHeaders,
    }
}

interface ApiResponse {
    success: boolean
    statusCode: number
    message: string
    data?: any
    error?: any
}

const responseMiddleware = async (response: Response): Promise<ApiResponse> => {
    const data = await response.json()

    if (response.status === 401) {
        // Let the error bubble up to be handled by AuthProvider
        // Don't redirect here as it causes infinite loops
        throw new Error('Unauthorized');
    }

    return data
}

export class ApiMethods {
    static async apiRequest(method: string, url: string, body?: any, additionalHeaders?: Record<string, string>) {
        const headers = getHeaders(additionalHeaders)
        const config: RequestInit = {
            method,
            headers,
        }

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body)
        }

        try {
            const response = await fetch(url, config)
            return await responseMiddleware(response)
        } catch (error) {
            console.error('API Request Error:', error)
            throw error
        }
    }

    static async apiFileRequest(method: string, url: string, file: File, fieldName: string = 'file', additionalHeaders?: Record<string, string>) {
        const formData = new FormData()
        formData.append(fieldName, file)

        try {
            const response = await fetch(url, {
                method,
                body: formData,
                headers: getFileHeaders(additionalHeaders),
            })
            return await responseMiddleware(response)
        } catch (error) {
            console.error('File Upload Error:', error)
            throw error
        }
    }

    static async apiPhotoRequest(method: string, url: string, file: File, photoType: 'profile' | 'cover' | 'gallery', caption?: string, additionalHeaders?: Record<string, string>) {
        const formData = new FormData()
        formData.append('photo', file)
        formData.append('photoType', photoType)
        if (caption) {
            formData.append('caption', caption)
        }

        try {
            const response = await fetch(url, {
                method,
                body: formData,
                headers: getFileHeaders(additionalHeaders),
            })
            return await responseMiddleware(response)
        } catch (error) {
            console.error('Photo Upload Error:', error)
            throw error
        }
    }

    static get(url: string, headers?: Record<string, string>) {
        return this.apiRequest('GET', url, undefined, headers)
    }

    static post(url: string, data: any, headers?: Record<string, string>) {
        return this.apiRequest('POST', url, data, headers)
    }

    static filePost(url: string, file: File, fieldName?: string, headers?: Record<string, string>) {
        return this.apiFileRequest('POST', url, file, fieldName, headers)
    }

    static audioPost(url: string, file: File, headers?: Record<string, string>) {
        return this.apiFileRequest('POST', url, file, 'audio', headers)
    }

    static photoPost(url: string, file: File, photoType: 'profile' | 'cover' | 'gallery', caption?: string, headers?: Record<string, string>) {
        return this.apiPhotoRequest('POST', url, file, photoType, caption, headers)
    }

    static put(url: string, data: any, headers?: Record<string, string>) {
        return this.apiRequest('PUT', url, data, headers)
    }

    static patch(url: string, data: any, headers?: Record<string, string>) {
        return this.apiRequest('PATCH', url, data, headers)
    }

    static delete(url: string, data?: any, headers?: Record<string, string>) {
        return this.apiRequest('DELETE', url, data, headers)
    }
}

export default ApiMethods
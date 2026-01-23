import { getCookie, setCookie, deleteCookie } from 'cookies-next'

export const getCookieValue = (name: string): string | undefined => {
    return getCookie(name) as string | undefined
}

export const setTokenCookie = (name: string, value: string) => {
    setCookie(name, value, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })
}

export const removeTokenCookie = (name: string) => {
    deleteCookie(name)
}

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/)
    if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
    return phone
}

export const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') {
        return 'U';
    }
    
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}
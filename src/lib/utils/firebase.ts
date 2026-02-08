/**
 * Firebase Auth Helper Utilities
 */

export const clearFirebaseAuthCache = () => {
  // Clear any cached auth data
  if (typeof window !== 'undefined') {
    // Clear Firebase auth persistence
    localStorage.removeItem('firebase:authUser');
    sessionStorage.removeItem('firebase:authUser');
    
    // Clear any indexed DB entries
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
    }
  }
};

export const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { isMobile: false, userAgent: '' };
  
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    userAgent
  };
};

export const formatErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number. Please enter a valid 10-digit mobile number.';
    case 'auth/missing-phone-number':
      return 'Phone number is required.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/app-not-authorized':
      return 'This app is not authorized to use Firebase Authentication.';
    case 'auth/operation-not-allowed':
      return 'Phone authentication is not enabled. Please contact support.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later.';
    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
};
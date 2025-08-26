import { auth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from '../../credentials';
import { ConfirmationResult } from 'firebase/auth';
import { getDeviceInfo, formatErrorMessage, clearFirebaseAuthCache } from '../utils/firebase-helper';

class FirebaseAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  /**
   * Initialize reCAPTCHA verifier
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }

    // Always use invisible reCAPTCHA
    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA verified successfully');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired, reinitializing...');
        // Clear and reinitialize
        if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear();
          this.recaptchaVerifier = null;
        }
      }
    });
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string, retryCount: number = 0): Promise<ConfirmationResult> {
    try {
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }

      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA verifier not initialized');
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Handle too-many-requests with retry logic for mobile
      if (error.code === 'auth/too-many-requests' && retryCount < 1) {
        const { isMobile } = getDeviceInfo();
        
        if (isMobile) {
          // For mobile, clear everything and retry with a delay
          clearFirebaseAuthCache();
          this.cleanup();
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Reinitialize and retry once
          this.initializeRecaptcha();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return this.sendOTP(phoneNumber, retryCount + 1);
        }
      }
      
      // Clear cache on too-many-requests error
      if (error.code === 'auth/too-many-requests') {
        clearFirebaseAuthCache();
      }
      
      throw new Error(formatErrorMessage(error));
    }
  }

  /**
   * Verify OTP and get Firebase ID token
   */
  async verifyOTP(confirmationResult: ConfirmationResult, otp: string): Promise<string> {
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('OTP has expired. Please request a new one.');
      }
      throw new Error(error.message || 'Failed to verify OTP');
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await auth.signOut();
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get current user's ID token
   */
  async getCurrentUserIdToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error: any) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Reset reCAPTCHA (useful for retry scenarios)
   */
  resetRecaptcha(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    // Re-initialize after a short delay
    setTimeout(() => {
      this.initializeRecaptcha();
    }, 100);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
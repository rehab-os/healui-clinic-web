'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { getCookieValue } from '../../lib/utils/helpers';
import ApiManager from '@/services/api/api.service';
import { logout, setAuthInitialized } from '../../store/slices/auth.slice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = getCookieValue('access_token');

      if (token) {
        try {
          // Verify token by fetching user data — this also hydrates user slice
          await ApiManager.getMe();
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          dispatch(logout());
        }
      } else {
        // No token — ensure auth state is cleared
        dispatch(logout());
      }
      // Signal that auth initialization is complete (regardless of outcome)
      dispatch(setAuthInitialized());
    };

    // Safety timeout: if getMe() hangs, unblock the UI after 5s
    const timeout = setTimeout(() => {
      dispatch(setAuthInitialized());
    }, 5000);

    initAuth().finally(() => clearTimeout(timeout));
  }, [dispatch]);

  return <>{children}</>;
}

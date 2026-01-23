'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { getCookieValue } from '../../lib/utils/helpers';
import ApiManager from '../../services/api';
import { logout } from '../../store/slices/auth.slice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = getCookieValue('access_token');
      
      if (token) {
        try {
          // Verify token by fetching user data
          await ApiManager.getMe();
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Token is invalid, clear auth state
          dispatch(logout());
        }
      } else {
        // No token found, ensure auth state is cleared
        dispatch(logout());
      }
    };

    initAuth();
  }, [dispatch]);

  return <>{children}</>;
}
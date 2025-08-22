import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import ApiManager from '../../services/api';
import {
  setOrganizations,
  setOrganizationsLoading,
} from '../../store/slices/organization.slice';
import { setClinics, setClinicsLoading } from '../../store/slices/clinic.slice';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { organizations, isLoading: orgsLoading } = useAppSelector(
    (state) => state.organization
  );
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    const initializeUserData = async () => {
      if (isAuthenticated && user && organizations.length === 0) {
        try {
          // Fetch organizations
          dispatch(setOrganizationsLoading(true));
          const orgsResponse = await ApiManager.getOrganizations();
          dispatch(setOrganizations(orgsResponse.data));

          // Fetch clinics for the first organization
          if (orgsResponse.data.length > 0) {
            dispatch(setClinicsLoading(true));
            const clinicsResponse = await ApiManager.getClinics(
              orgsResponse.data[0].id
            );
            dispatch(setClinics(clinicsResponse.data));
            dispatch(setClinicsLoading(false));
          }

          dispatch(setOrganizationsLoading(false));
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          dispatch(setOrganizationsLoading(false));
          dispatch(setClinicsLoading(false));
        }
      }
      setIsInitializing(false);
    };

    initializeUserData();
  }, [isAuthenticated, user, organizations.length, dispatch]);

  // Show loader during initialization
  if (isInitializing || (isAuthenticated && orgsLoading)) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}

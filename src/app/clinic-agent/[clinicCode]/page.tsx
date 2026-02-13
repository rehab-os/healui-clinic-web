/**
 * Clinic-Specific AI Agent Registration Page
 * Route: /clinic-agent/[clinicCode]
 *
 * Each clinic gets its own branded AI registration experience
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FullScreenChat } from '@/components/chat/FullScreenChat';
import ApiManager from '@/services/api/api.service';
import { PublicClinicInfoDto } from '@/lib/types';
import { motion } from 'framer-motion';
import { AlertCircle, Building2, Loader2 } from 'lucide-react';

type PageState = 'loading' | 'error' | 'ready';

export default function ClinicAgentPage() {
  const params = useParams();
  const clinicCode = params.clinicCode as string;

  const [state, setState] = useState<PageState>('loading');
  const [clinic, setClinic] = useState<PublicClinicInfoDto | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchClinicData() {
      if (!clinicCode) {
        setState('error');
        setError('Clinic code is required');
        return;
      }

      try {
        setState('loading');
        const response = await ApiManager.getPublicClinicByCode(clinicCode);

        if (response.success && response.data) {
          setClinic(response.data);
          setState('ready');
        } else {
          setState('error');
          setError(response.message || 'Failed to load clinic information');
        }
      } catch (err) {
        console.error('Error fetching clinic:', err);
        setState('error');
        setError('Unable to find clinic. Please check the link and try again.');
      }
    }

    fetchClinicData();
  }, [clinicCode]);

  // Loading State
  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-100 p-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Loading Clinic Information
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the clinic details...
          </p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (state === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          className="max-w-md rounded-xl bg-white p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
            Clinic Not Found
          </h2>
          <p className="mb-6 text-center text-gray-600">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Go to Home
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            Clinic Code: <span className="font-mono">{clinicCode}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  // Ready State - Show Chat
  if (state === 'ready' && clinic) {
    return (
      <FullScreenChat
        clinic={{
          id: clinic.id,
          name: clinic.name,
          code: clinic.code,
          city: clinic.city,
          state: clinic.state,
          logo_url: clinic.logo_url,
        }}
        showBackButton={false}
        backUrl="/"
      />
    );
  }

  // Fallback (should never reach here)
  return null;
}

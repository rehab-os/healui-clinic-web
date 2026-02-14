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
import { AlertCircle, Building2, Home } from 'lucide-react';
import { AILoadingScreen } from '@/components/ui/AIBubbleLoader';

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
        const startTime = Date.now();
        const response = await ApiManager.getPublicClinicByCode(clinicCode);

        // Ensure minimum 4 second loading for smooth UX with animated messages
        const elapsed = Date.now() - startTime;
        const minLoadTime = 4000;
        const remainingTime = Math.max(0, minLoadTime - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));

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
      <AILoadingScreen
        message="Loading Clinic Information"
        submessage="Please wait while we prepare your experience..."
      />
    );
  }

  // Error State
  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-red-200/20 to-orange-300/20 blur-3xl" />
          <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-gradient-to-br from-gray-200/20 to-red-200/20 blur-3xl" />
        </div>

        <motion.div
          className="relative max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Error card with glassmorphism */}
          <div className="rounded-3xl bg-white/80 p-10 shadow-xl shadow-gray-900/5 backdrop-blur-xl ring-1 ring-gray-200/50">
            {/* Error icon */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="relative">
                <div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-red-400/30 to-orange-500/30 blur-2xl" />
                <div className="relative rounded-full bg-gradient-to-br from-red-50 to-orange-50 p-4 ring-1 ring-red-200/50">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
              </div>
            </motion.div>

            {/* Error message */}
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900">
                Clinic Not Found
              </h2>
              <p className="text-gray-600">{error}</p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                onClick={() => window.location.reload()}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-medium text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10">Try Again</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>

              <motion.button
                onClick={() => (window.location.href = '/')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-900/5 focus:outline-none focus:ring-4 focus:ring-gray-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home className="h-4 w-4" />
                <span>Go to Home</span>
              </motion.button>
            </motion.div>

            {/* Clinic code */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-gray-400">
                Clinic Code:{' '}
                <span className="font-mono text-gray-500">{clinicCode}</span>
              </p>
            </motion.div>
          </div>
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

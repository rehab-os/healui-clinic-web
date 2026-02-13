/**
 * Registration Complete Page
 * Success page after completing patient intake
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Calendar, Home, Download } from 'lucide-react';
import { motion } from 'framer-motion';

function RegistrationCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <motion.div
        className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <motion.div
            className="rounded-full bg-green-100 p-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="h-20 w-20 text-green-600" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          className="mb-4 text-center text-3xl font-bold text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Registration Complete! 🎉
        </motion.h1>

        {/* Message */}
        <motion.p
          className="mb-8 text-center text-lg text-gray-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thank you for completing your patient registration. We've received
          your information and our team will contact you shortly.
        </motion.p>

        {/* Patient ID */}
        {patientId && (
          <motion.div
            className="mb-8 rounded-lg bg-blue-50 border border-blue-200 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Reference ID:</span>{' '}
              <code className="rounded bg-blue-100 px-2 py-1 text-xs">
                {patientId}
              </code>
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Please save this for your records
            </p>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-gray-900">
            What happens next?
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
              <div className="rounded-full bg-blue-100 p-2">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Review Your Information
                </h3>
                <p className="text-sm text-gray-600">
                  Our team will review your registration details within 24
                  hours
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
              <div className="rounded-full bg-blue-100 p-2">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Appointment Confirmation
                </h3>
                <p className="text-sm text-gray-600">
                  You'll receive a call or email to confirm your appointment
                  time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
              <div className="rounded-full bg-blue-100 p-2">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Your First Visit
                </h3>
                <p className="text-sm text-gray-600">
                  Arrive 10 minutes early to complete any remaining paperwork
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={() => router.push('/')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </button>

          <button
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            <Download className="h-5 w-5" />
            Download Confirmation
          </button>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          className="mt-8 border-t border-gray-200 pt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-gray-600">
            Questions? Contact us at{' '}
            <a
              href="tel:+1234567890"
              className="font-semibold text-blue-600 hover:underline"
            >
              (123) 456-7890
            </a>{' '}
            or{' '}
            <a
              href="mailto:info@healui.com"
              className="font-semibold text-blue-600 hover:underline"
            >
              info@healui.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function RegistrationCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">Loading...</div>}>
      <RegistrationCompleteContent />
    </Suspense>
  );
}

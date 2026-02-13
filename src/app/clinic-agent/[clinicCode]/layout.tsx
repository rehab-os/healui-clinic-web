/**
 * Clinic Agent Layout
 * Provides metadata and SEO for clinic-specific registration pages
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patient Registration - AI Powered Intake',
  description:
    'Complete your patient registration through our AI-powered conversational assistant. Fast, secure, and HIPAA compliant.',
  keywords: [
    'patient registration',
    'AI intake',
    'medical registration',
    'physiotherapy clinic',
    'HIPAA compliant',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Patient Registration - AI Powered Intake',
    description:
      'Complete your patient registration through our AI-powered conversational assistant.',
    type: 'website',
  },
};

export default function ClinicAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

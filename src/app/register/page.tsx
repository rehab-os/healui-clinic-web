/**
 * Patient Registration Page
 * Full-screen chat interface for patient intake
 */

'use client';

import { Suspense } from 'react';
import { FullScreenChat } from '@/components/chat/FullScreenChat';
import { useSearchParams } from 'next/navigation';

function RegisterContent() {
  const searchParams = useSearchParams();
  const clinicId = searchParams.get('clinicId') || process.env.NEXT_PUBLIC_CLINIC_ID || 'default-clinic';

  return (
    <FullScreenChat
      clinicId={clinicId}
      clinicName="HealUI Physiotherapy Clinic"
      showBackButton={true}
      backUrl="/"
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

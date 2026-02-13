/**
 * Patient Registration Page
 * Full-screen chat interface for patient intake
 */

'use client';

import { FullScreenChat } from '@/components/chat/FullScreenChat';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
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

'use client';

import React, { useState } from 'react';
import SmartScreeningChatbot from '../../components/molecule/SmartScreeningChatbot';

export default function SmartScreeningPage() {
  const [key, setKey] = useState(0);

  return (
    <SmartScreeningChatbot
      key={key}
      patientId="test-patient"
      patientName="Test Patient"
      onComplete={(result) => {
        console.log('Screening Result:', result);
      }}
    />
  );
}

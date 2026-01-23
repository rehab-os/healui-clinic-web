'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import ApiManager from '../../../services/api';
import PatientSelfRegistrationForm from '../../../components/public/PatientSelfRegistrationForm';
import RegistrationSuccess from '../../../components/public/RegistrationSuccess';
import type { PublicClinicInfoDto, PublicPatientRegistrationResponseDto } from '../../../lib/types';

type PageState = 'loading' | 'form' | 'success' | 'error';

export default function PatientRegistrationPage() {
  const params = useParams();
  const clinicCode = params.clinicCode as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [clinic, setClinic] = useState<PublicClinicInfoDto | null>(null);
  const [error, setError] = useState<string>('');
  const [registrationResult, setRegistrationResult] = useState<PublicPatientRegistrationResponseDto | null>(null);

  useEffect(() => {
    if (clinicCode) {
      fetchClinicInfo();
    }
  }, [clinicCode]);

  const fetchClinicInfo = async () => {
    try {
      setPageState('loading');
      const response = await ApiManager.getPublicClinicByCode(clinicCode);

      if (response.success && response.data) {
        setClinic(response.data);
        setPageState('form');
      } else {
        setError(response.message || 'Clinic not found');
        setPageState('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic information');
      setPageState('error');
    }
  };

  const handleRegistrationSuccess = (result: PublicPatientRegistrationResponseDto) => {
    setRegistrationResult(result);
    setPageState('success');
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 text-[#1e5f79] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading clinic information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Clinic Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please check the QR code or contact the clinic for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success' && registrationResult) {
    return (
      <RegistrationSuccess
        patientCode={registrationResult.patient_code}
        clinicName={registrationResult.clinic_name}
        message={registrationResult.message}
      />
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-4 sm:py-8">
      <div className="max-w-lg mx-auto">
        {/* Clinic Header */}
        <div className="bg-gradient-to-r from-[#1e5f79] to-[#2a7a9b] rounded-t-2xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-3">
            {clinic?.logo_url ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                <img
                  src={clinic.logo_url}
                  alt={`${clinic.name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{clinic?.name}</h1>
              <p className="text-white/80 text-sm">{clinic?.city}, {clinic?.state}</p>
            </div>
          </div>
          <p className="text-white/90 text-sm">
            Please fill in your details below to register as a new patient.
          </p>
        </div>

        {/* Registration Form */}
        {clinic && (
          <PatientSelfRegistrationForm
            clinicCode={clinicCode}
            clinicName={clinic.name}
            onSuccess={handleRegistrationSuccess}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { CheckCircle, Building2, ClipboardCopy, Clock, UserCheck } from 'lucide-react';

interface RegistrationSuccessProps {
  patientCode: string;
  clinicName: string;
  message?: string;
}

const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  patientCode,
  clinicName,
  message,
}) => {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(patientCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Registration Successful!</h1>
          <p className="text-white/90 text-sm">
            Welcome to {clinicName}
          </p>
        </div>

        {/* Patient Code */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">Your Patient Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold text-[#1e5f79] tracking-wider">
                {patientCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:text-[#1e5f79] hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy code"
              >
                <ClipboardCopy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Save this code for your records
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 text-center">{message}</p>
            </div>
          )}

          {/* What's Next */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">What happens next?</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#1e5f79]/10 rounded-lg flex-shrink-0">
                  <Building2 className="h-4 w-4 text-[#1e5f79]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Visit the Reception</p>
                  <p className="text-xs text-gray-600">Please proceed to the reception desk</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#1e5f79]/10 rounded-lg flex-shrink-0">
                  <UserCheck className="h-4 w-4 text-[#1e5f79]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Verify Your Details</p>
                  <p className="text-xs text-gray-600">Our staff will verify your information</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#1e5f79]/10 rounded-lg flex-shrink-0">
                  <Clock className="h-4 w-4 text-[#1e5f79]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Wait for Your Turn</p>
                  <p className="text-xs text-gray-600">You'll be called when it's your turn</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Thank you for choosing {clinicName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;

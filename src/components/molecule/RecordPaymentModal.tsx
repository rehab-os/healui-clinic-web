'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  IndianRupee,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  FileText,
  User
} from 'lucide-react';
import ApiManager from '../../services/api';
import type {
  RecordPaymentDto,
  PaymentMethod,
  PaymentFor,
  PatientBalanceDto
} from '../../lib/types';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  patient_code: string;
}

interface RecordPaymentModalProps {
  clinicId: string;
  preSelectedPatient?: { id: string; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  clinicId,
  preSelectedPatient,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    preSelectedPatient ? { id: preSelectedPatient.id, full_name: preSelectedPatient.name, phone: '', patient_code: '' } : null
  );
  const [patientBalance, setPatientBalance] = useState<PatientBalanceDto | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentFor, setPaymentFor] = useState<PaymentFor>('OUTSTANDING');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (preSelectedPatient) {
      fetchPatientBalance(preSelectedPatient.id);
    }
  }, [preSelectedPatient]);

  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await ApiManager.getPatients({
        clinic_id: clinicId,
        search: query,
        limit: 5
      });

      if (response.success && response.data?.patients) {
        setSearchResults(response.data.patients);
      }
    } catch (error) {
      console.error('Failed to search patients:', error);
    } finally {
      setSearching(false);
    }
  };

  const fetchPatientBalance = async (patientId: string) => {
    try {
      setLoading(true);
      const response = await ApiManager.getPatientBalance(patientId, clinicId);
      if (response.success && response.data) {
        setPatientBalance(response.data);
        // Default payment for to outstanding if they have outstanding
        if (response.data.outstanding > 0) {
          setPaymentFor('OUTSTANDING');
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
    fetchPatientBalance(patient.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);

      const data: RecordPaymentDto = {
        amount: parseFloat(amount),
        method: paymentMethod,
        payment_for: paymentFor,
        ...(referenceNumber && { reference_number: referenceNumber }),
        ...(notes && { notes })
      };

      const response = await ApiManager.recordPayment(selectedPatient.id, clinicId, data);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(response.error?.message || 'Failed to record payment');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'UPI', label: 'UPI', icon: Smartphone },
    { value: 'CARD', label: 'Card', icon: CreditCard },
    { value: 'BANK_TRANSFER', label: 'Bank', icon: Building },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
  ];

  const paymentForOptions: { value: PaymentFor; label: string; description: string }[] = [
    { value: 'OUTSTANDING', label: 'Clear Outstanding', description: 'Pay off pending dues (udhaari)' },
    { value: 'ADVANCE', label: 'Add Advance', description: 'Credit for future visits' },
    { value: 'SESSION_PACK', label: 'Session Pack', description: 'Payment for session pack' },
    { value: 'VISIT', label: 'Visit Payment', description: 'Direct visit payment' },
  ];

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded p-6 max-w-xs w-full text-center shadow-lg">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Payment Recorded</h3>
          <p className="text-xs text-gray-500">
            {formatCurrency(parseFloat(amount))} received
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded shadow-lg max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded">
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Record Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Patient</label>

            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-teal/10 rounded flex items-center justify-center">
                    <User className="h-4 w-4 text-brand-teal" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedPatient.full_name}</p>
                    <p className="text-[10px] text-gray-500">{selectedPatient.phone || selectedPatient.patient_code}</p>
                  </div>
                </div>
                {!preSelectedPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientBalance(null);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchPatients(e.target.value);
                  }}
                  placeholder="Search by name or phone..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
                />

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || searching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 overflow-hidden">
                    {searching ? (
                      <div className="p-3 text-center">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-teal mx-auto" />
                      </div>
                    ) : (
                      searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{patient.full_name}</p>
                            <p className="text-[10px] text-gray-500">{patient.phone} · {patient.patient_code}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Patient Balance Info */}
          {patientBalance && (
            <div className="bg-gray-50 rounded p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Outstanding</p>
                  <p className={`text-sm font-semibold ${patientBalance.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {formatCurrency(patientBalance.outstanding)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Advance</p>
                  <p className={`text-sm font-semibold ${patientBalance.advance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formatCurrency(patientBalance.advance)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Sessions</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {patientBalance.sessions_available}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-medium"
              />
            </div>
            {patientBalance && patientBalance.outstanding > 0 && (
              <button
                type="button"
                onClick={() => setAmount(patientBalance.outstanding.toString())}
                className="mt-1.5 text-xs text-brand-teal hover:underline"
              >
                Clear outstanding ({formatCurrency(patientBalance.outstanding)})
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`py-2 px-1 rounded border flex flex-col items-center transition-all ${
                    paymentMethod === method.value
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className={`h-4 w-4 ${
                    paymentMethod === method.value ? 'text-brand-teal' : 'text-gray-400'
                  }`} />
                  <span className={`text-[10px] mt-0.5 ${
                    paymentMethod === method.value ? 'text-brand-teal font-medium' : 'text-gray-500'
                  }`}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment For */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Payment For
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {paymentForOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentFor(option.value)}
                  className={`p-2 rounded border text-left transition-all ${
                    paymentFor === option.value
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-xs font-medium ${
                    paymentFor === option.value ? 'text-brand-teal' : 'text-gray-700'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reference Number (for UPI/Card/Bank/Cheque) */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={
                  paymentMethod === 'UPI' ? 'UPI Transaction ID' :
                  paymentMethod === 'CARD' ? 'Card Last 4 Digits' :
                  paymentMethod === 'CHEQUE' ? 'Cheque Number' :
                  'Transaction Reference'
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedPatient}
            className="w-full py-2 px-3 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <IndianRupee className="h-4 w-4" />
                Record Payment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;

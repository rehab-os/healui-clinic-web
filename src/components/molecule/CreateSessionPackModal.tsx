'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  IndianRupee,
  Package,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';
import ApiManager from '../../services/api';
import type {
  CreateSessionPackDto,
  PaymentMethod
} from '../../lib/types';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  patient_code: string;
}

interface Condition {
  id: string;
  condition_name: string;
}

interface CreateSessionPackModalProps {
  clinicId: string;
  preSelectedPatient?: { id: string; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSessionPackModal: React.FC<CreateSessionPackModalProps> = ({
  clinicId,
  preSelectedPatient,
  onClose,
  onSuccess
}) => {
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

  // Patient conditions
  const [patientConditions, setPatientConditions] = useState<Condition[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalSessions, setTotalSessions] = useState('10');
  const [amount, setAmount] = useState('');
  const [conditionId, setConditionId] = useState<string>('');
  const [validUntil, setValidUntil] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  // Common pack presets
  const packPresets = [
    { name: '5-Session Pack', sessions: 5, discount: 0 },
    { name: '10-Session Pack', sessions: 10, discount: 5 },
    { name: '15-Session Pack', sessions: 15, discount: 10 },
    { name: '20-Session Pack', sessions: 20, discount: 15 },
  ];

  useEffect(() => {
    if (preSelectedPatient) {
      fetchPatientConditions(preSelectedPatient.id);
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

  const fetchPatientConditions = async (patientId: string) => {
    try {
      setLoadingConditions(true);
      const response = await ApiManager.getPatientConditions(patientId);
      if (response.success && response.data) {
        // Map patient conditions to a simpler format
        const conditions = response.data.map((pc: any) => ({
          id: pc.id,
          condition_name: pc.condition_name || pc.condition?.name || 'Unknown Condition'
        }));
        setPatientConditions(conditions);
      }
    } catch (error) {
      console.error('Failed to fetch patient conditions:', error);
    } finally {
      setLoadingConditions(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
    fetchPatientConditions(patient.id);
  };

  const handlePresetSelect = (preset: typeof packPresets[0]) => {
    setName(preset.name);
    setTotalSessions(preset.sessions.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (!name.trim()) {
      setError('Please enter pack name');
      return;
    }

    if (!totalSessions || parseInt(totalSessions) <= 0) {
      setError('Please enter valid number of sessions');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter pack amount');
      return;
    }

    try {
      setSubmitting(true);

      const data: CreateSessionPackDto = {
        patient_id: selectedPatient.id,
        clinic_id: clinicId,
        name: name.trim(),
        total_sessions: parseInt(totalSessions),
        amount: parseFloat(amount),
        ...(description && { description }),
        ...(conditionId && { condition_id: conditionId }),
        ...(validUntil && { valid_until: validUntil }),
        ...(notes && { notes }),
        ...(initialPayment && parseFloat(initialPayment) > 0 && {
          initial_payment: parseFloat(initialPayment),
          payment_method: paymentMethod
        })
      };

      const response = await ApiManager.createSessionPack(data);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(response.error?.message || 'Failed to create session pack');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'UPI', label: 'UPI', icon: Smartphone },
    { value: 'CARD', label: 'Card', icon: CreditCard },
  ];

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded p-6 max-w-xs w-full text-center shadow-lg">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Session Pack Created</h3>
          <p className="text-xs text-gray-500">
            {name} with {totalSessions} sessions
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
            <div className="p-1.5 bg-purple-50 rounded">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Create Session Pack</h2>
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
                      setPatientConditions([]);
                      setConditionId('');
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

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Quick Select</label>
            <div className="grid grid-cols-4 gap-1.5">
              {packPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`py-2 px-1 rounded border text-center transition-all ${
                    name === preset.name
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{preset.sessions}</p>
                  <p className="text-[10px] text-gray-500">sessions</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pack Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Pack Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 10-Session Pack"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Total Sessions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Sessions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value)}
                placeholder="10"
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>
            </div>
          </div>

          {/* Per Session Rate Display */}
          {amount && totalSessions && parseInt(totalSessions) > 0 && parseFloat(amount) > 0 && (
            <div className="bg-purple-50 rounded p-2 text-center">
              <p className="text-xs text-purple-600">
                Per session: <span className="font-semibold">{formatCurrency(parseFloat(amount) / parseInt(totalSessions))}</span>
              </p>
            </div>
          )}

          {/* Condition (Optional) */}
          {selectedPatient && patientConditions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Link to Condition (optional)
              </label>
              <select
                value={conditionId}
                onChange={(e) => setConditionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
              >
                <option value="">Any condition</option>
                {patientConditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>
                    {condition.condition_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Valid Until (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Valid Until (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
              />
            </div>
          </div>

          {/* Initial Payment */}
          <div className="bg-gray-50 rounded p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Initial Payment</label>
              <span className="text-[10px] text-gray-400">Optional</span>
            </div>

            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
                placeholder="0 = Unpaid pack"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal bg-white"
              />
            </div>

            {amount && (
              <button
                type="button"
                onClick={() => setInitialPayment(amount)}
                className="text-xs text-brand-teal hover:underline"
              >
                Full payment ({formatCurrency(parseFloat(amount) || 0)})
              </button>
            )}

            {initialPayment && parseFloat(initialPayment) > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`py-2 px-2 rounded border flex flex-col items-center transition-all bg-white ${
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
            )}
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
            className="w-full py-2 px-3 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Create Pack
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionPackModal;

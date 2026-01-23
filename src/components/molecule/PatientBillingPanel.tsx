'use client';

import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Package,
  Loader2,
  CreditCard,
  AlertCircle,
  ChevronLeft,
  Banknote,
  Smartphone,
  Building,
  FileText,
  Calendar,
  CheckCircle
} from 'lucide-react';
import ApiManager from '../../services/api';
import type {
  PatientAccountDto,
  PaymentMethod,
  PaymentFor,
  CreateSessionPackDto,
  RecordPaymentDto
} from '../../lib/types';
import RecordPaymentModal from './RecordPaymentModal';
import CreateSessionPackModal from './CreateSessionPackModal';

type ViewState = 'summary' | 'record-payment' | 'create-pack';

interface PatientBillingPanelProps {
  patientId: string;
  patientName: string;
  clinicId: string;
  compact?: boolean;
  onViewChange?: (view: ViewState) => void;
}

const PatientBillingPanel: React.FC<PatientBillingPanelProps> = ({
  patientId,
  patientName,
  clinicId,
  compact = false,
  onViewChange
}) => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<PatientAccountDto | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('summary');

  // For compact mode - use modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentFor, setPaymentFor] = useState<PaymentFor>('OUTSTANDING');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Pack form state
  const [packName, setPackName] = useState('');
  const [packSessions, setPackSessions] = useState('10');
  const [packAmount, setPackAmount] = useState('');
  const [packValidUntil, setPackValidUntil] = useState('');
  const [packInitialPayment, setPackInitialPayment] = useState('');
  const [packPaymentMethod, setPackPaymentMethod] = useState<PaymentMethod>('CASH');
  const [packSubmitting, setPackSubmitting] = useState(false);
  const [packError, setPackError] = useState('');
  const [packSuccess, setPackSuccess] = useState(false);

  useEffect(() => {
    fetchAccountData();
  }, [patientId, clinicId]);

  const changeView = (view: ViewState) => {
    setCurrentView(view);
    onViewChange?.(view);
    // Reset form states when navigating
    if (view === 'summary') {
      resetPaymentForm();
      resetPackForm();
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentFor('OUTSTANDING');
    setPaymentRef('');
    setPaymentNotes('');
    setPaymentError('');
    setPaymentSuccess(false);
  };

  const resetPackForm = () => {
    setPackName('');
    setPackSessions('10');
    setPackAmount('');
    setPackValidUntil('');
    setPackInitialPayment('');
    setPackPaymentMethod('CASH');
    setPackError('');
    setPackSuccess(false);
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getPatientAccount(patientId, clinicId);
      if (response.success && response.data) {
        setAccount(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient account:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Payment form handlers
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    try {
      setPaymentSubmitting(true);
      const data: RecordPaymentDto = {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        payment_for: paymentFor,
        ...(paymentRef && { reference_number: paymentRef }),
        ...(paymentNotes && { notes: paymentNotes })
      };

      const response = await ApiManager.recordPayment(patientId, clinicId, data);

      if (response.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          fetchAccountData();
          changeView('summary');
        }, 1200);
      } else {
        setPaymentError(response.error?.message || 'Failed to record payment');
      }
    } catch (error: any) {
      setPaymentError(error.message || 'An error occurred');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Pack form handlers
  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackError('');

    if (!packName.trim()) {
      setPackError('Please enter pack name');
      return;
    }
    if (!packSessions || parseInt(packSessions) <= 0) {
      setPackError('Please enter valid number of sessions');
      return;
    }
    if (!packAmount || parseFloat(packAmount) <= 0) {
      setPackError('Please enter pack amount');
      return;
    }

    try {
      setPackSubmitting(true);
      const data: CreateSessionPackDto = {
        patient_id: patientId,
        clinic_id: clinicId,
        name: packName.trim(),
        total_sessions: parseInt(packSessions),
        amount: parseFloat(packAmount),
        ...(packValidUntil && { valid_until: packValidUntil }),
        ...(packInitialPayment && parseFloat(packInitialPayment) > 0 && {
          initial_payment: parseFloat(packInitialPayment),
          payment_method: packPaymentMethod
        })
      };

      const response = await ApiManager.createSessionPack(data);

      if (response.success) {
        setPackSuccess(true);
        setTimeout(() => {
          fetchAccountData();
          changeView('summary');
        }, 1200);
      } else {
        setPackError(response.error?.message || 'Failed to create session pack');
      }
    } catch (error: any) {
      setPackError(error.message || 'An error occurred');
    } finally {
      setPackSubmitting(false);
    }
  };

  const packPresets = [
    { name: '5-Session Pack', sessions: 5 },
    { name: '10-Session Pack', sessions: 10 },
    { name: '15-Session Pack', sessions: 15 },
    { name: '20-Session Pack', sessions: 20 },
  ];

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'UPI', label: 'UPI', icon: Smartphone },
    { value: 'CARD', label: 'Card', icon: CreditCard },
    { value: 'BANK_TRANSFER', label: 'Bank', icon: Building },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
  ];

  const paymentForOptions: { value: PaymentFor; label: string; desc: string }[] = [
    { value: 'OUTSTANDING', label: 'Clear Outstanding', desc: 'Pay off pending dues' },
    { value: 'ADVANCE', label: 'Add Advance', desc: 'Credit for future' },
    { value: 'SESSION_PACK', label: 'Session Pack', desc: 'Pack payment' },
    { value: 'VISIT', label: 'Visit Payment', desc: 'Direct visit' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  // Compact version for sidebar - uses modals since space is limited
  if (compact) {
    return (
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-[10px] text-gray-500 uppercase">Due</p>
            <p className={`text-sm font-semibold ${(account?.outstanding_balance || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(account?.outstanding_balance || 0)}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-[10px] text-gray-500 uppercase">Advance</p>
            <p className={`text-sm font-semibold ${(account?.advance_balance || 0) > 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {formatCurrency(account?.advance_balance || 0)}
            </p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <p className="text-[10px] text-gray-500 uppercase">Sessions</p>
            <p className="text-sm font-semibold text-purple-600">
              {account?.active_session_packs?.reduce((sum, p) => sum + p.sessions_remaining, 0) || 0}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            + Payment
          </button>
          <button
            onClick={() => setShowPackModal(true)}
            className="flex-1 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
          >
            + Pack
          </button>
        </div>
        {showPaymentModal && (
          <RecordPaymentModal
            clinicId={clinicId}
            preSelectedPatient={{ id: patientId, name: patientName }}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => { setShowPaymentModal(false); fetchAccountData(); }}
          />
        )}
        {showPackModal && (
          <CreateSessionPackModal
            clinicId={clinicId}
            preSelectedPatient={{ id: patientId, name: patientName }}
            onClose={() => setShowPackModal(false)}
            onSuccess={() => { setShowPackModal(false); fetchAccountData(); }}
          />
        )}
      </div>
    );
  }

  // Record Payment Form View
  if (currentView === 'record-payment') {
    if (paymentSuccess) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Payment Recorded</h3>
          <p className="text-xs text-gray-500">{formatCurrency(parseFloat(paymentAmount))} received</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Form Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => changeView('summary')}
            className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="p-1.5 bg-green-50 rounded">
            <IndianRupee className="h-4 w-4 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Record Payment</h3>
        </div>

        {/* Form Content */}
        <form onSubmit={handlePaymentSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Balance Info */}
          <div className="bg-gray-50 rounded p-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Outstanding</p>
                <p className={`text-sm font-semibold ${(account?.outstanding_balance || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatCurrency(account?.outstanding_balance || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Advance</p>
                <p className={`text-sm font-semibold ${(account?.advance_balance || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {formatCurrency(account?.advance_balance || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Sessions</p>
                <p className="text-sm font-semibold text-purple-600">
                  {account?.active_session_packs?.reduce((sum, p) => sum + p.sessions_remaining, 0) || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-medium"
              />
            </div>
            {account?.outstanding_balance && account.outstanding_balance > 0 && (
              <button
                type="button"
                onClick={() => setPaymentAmount(account.outstanding_balance!.toString())}
                className="mt-1.5 text-xs text-brand-teal hover:underline"
              >
                Clear outstanding ({formatCurrency(account.outstanding_balance)})
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
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
                  <method.icon className={`h-4 w-4 ${paymentMethod === method.value ? 'text-brand-teal' : 'text-gray-400'}`} />
                  <span className={`text-[10px] mt-0.5 ${paymentMethod === method.value ? 'text-brand-teal font-medium' : 'text-gray-500'}`}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment For */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment For</label>
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
                  <p className={`text-xs font-medium ${paymentFor === option.value ? 'text-brand-teal' : 'text-gray-700'}`}>
                    {option.label}
                  </p>
                  <p className="text-[10px] text-gray-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reference (for non-cash) */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Reference</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder={paymentMethod === 'UPI' ? 'UPI ID' : 'Reference'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
              />
            </div>
          )}

          {/* Error */}
          {paymentError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs">{paymentError}</p>
            </div>
          )}
        </form>

        {/* Submit Button */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <button
            onClick={handlePaymentSubmit}
            disabled={paymentSubmitting}
            className="w-full py-2 px-3 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {paymentSubmitting ? (
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
        </div>
      </div>
    );
  }

  // Create Pack Form View
  if (currentView === 'create-pack') {
    if (packSuccess) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Pack Created</h3>
          <p className="text-xs text-gray-500">{packName} with {packSessions} sessions</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Form Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => changeView('summary')}
            className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="p-1.5 bg-purple-50 rounded">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Create Session Pack</h3>
        </div>

        {/* Form Content */}
        <form onSubmit={handlePackSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Quick Select</label>
            <div className="grid grid-cols-4 gap-1.5">
              {packPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setPackName(preset.name);
                    setPackSessions(preset.sessions.toString());
                  }}
                  className={`py-2 px-1 rounded border text-center transition-all ${
                    packName === preset.name
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
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="e.g., 10-Session Pack"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sessions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Sessions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={packSessions}
                onChange={(e) => setPackSessions(e.target.value)}
                placeholder="10"
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={packAmount}
                  onChange={(e) => setPackAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>
            </div>
          </div>

          {/* Per Session Rate */}
          {packAmount && packSessions && parseInt(packSessions) > 0 && parseFloat(packAmount) > 0 && (
            <div className="bg-purple-50 rounded p-2 text-center">
              <p className="text-xs text-purple-600">
                Per session: <span className="font-semibold">{formatCurrency(parseFloat(packAmount) / parseInt(packSessions))}</span>
              </p>
            </div>
          )}

          {/* Valid Until */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Valid Until (optional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={packValidUntil}
                onChange={(e) => setPackValidUntil(e.target.value)}
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
                value={packInitialPayment}
                onChange={(e) => setPackInitialPayment(e.target.value)}
                placeholder="0 = Unpaid pack"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal bg-white"
              />
            </div>
            {packAmount && (
              <button
                type="button"
                onClick={() => setPackInitialPayment(packAmount)}
                className="text-xs text-brand-teal hover:underline"
              >
                Full payment ({formatCurrency(parseFloat(packAmount) || 0)})
              </button>
            )}
            {packInitialPayment && parseFloat(packInitialPayment) > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentMethods.slice(0, 3).map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPackPaymentMethod(method.value)}
                      className={`py-2 px-2 rounded border flex flex-col items-center transition-all bg-white ${
                        packPaymentMethod === method.value
                          ? 'border-brand-teal bg-brand-teal/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <method.icon className={`h-4 w-4 ${packPaymentMethod === method.value ? 'text-brand-teal' : 'text-gray-400'}`} />
                      <span className={`text-[10px] mt-0.5 ${packPaymentMethod === method.value ? 'text-brand-teal font-medium' : 'text-gray-500'}`}>
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {packError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs">{packError}</p>
            </div>
          )}
        </form>

        {/* Submit Button */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <button
            onClick={handlePackSubmit}
            disabled={packSubmitting}
            className="w-full py-2 px-3 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {packSubmitting ? (
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
        </div>
      </div>
    );
  }

  // Summary View (default)
  return (
    <div className="flex flex-col h-full">
      {/* Balance Summary */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Outstanding</p>
            <p className={`text-xl font-semibold mt-1 ${(account?.outstanding_balance || 0) > 0 ? 'text-red-600' : 'text-gray-300'}`}>
              {formatCurrency(account?.outstanding_balance || 0)}
            </p>
            {account?.outstanding_balance && account.outstanding_balance > 0 && (
              <button
                onClick={() => changeView('record-payment')}
                className="text-xs text-brand-teal hover:underline mt-1"
              >
                Clear dues
              </button>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Advance</p>
            <p className={`text-xl font-semibold mt-1 ${(account?.advance_balance || 0) > 0 ? 'text-green-600' : 'text-gray-300'}`}>
              {formatCurrency(account?.advance_balance || 0)}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Sessions</p>
            <p className="text-xl font-semibold mt-1 text-purple-600">
              {account?.active_session_packs?.reduce((sum, p) => sum + p.sessions_remaining, 0) || 0}
            </p>
            {(!account?.active_session_packs || account.active_session_packs.length === 0) && (
              <button
                onClick={() => changeView('create-pack')}
                className="text-xs text-purple-600 hover:underline mt-1"
              >
                Buy pack
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Session Packs */}
      {account?.active_session_packs && account.active_session_packs.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Packs</h4>
            <button
              onClick={() => changeView('create-pack')}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {account.active_session_packs.map((pack) => (
              <div key={pack.id} className="p-3 border border-gray-200 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pack.name}</p>
                    {pack.condition && (
                      <p className="text-xs text-gray-500">{pack.condition.condition_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-purple-600">{pack.sessions_remaining}</span>
                    <span className="text-xs text-gray-400">/{pack.total_sessions}</span>
                  </div>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(pack.sessions_remaining / pack.total_sessions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {account?.recent_payments && account.recent_payments.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Recent Payments</h4>
          <div className="space-y-0">
            {account.recent_payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">{payment.method} · {formatDate(payment.created_at)}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  payment.payment_for === 'OUTSTANDING' ? 'bg-orange-50 text-orange-600' :
                  payment.payment_for === 'ADVANCE' ? 'bg-green-50 text-green-600' :
                  payment.payment_for === 'SESSION_PACK' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {payment.payment_for === 'SESSION_PACK' ? 'PACK' : payment.payment_for}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unbilled Visits Warning */}
      {account?.unbilled_visits_count && account.unbilled_visits_count > 0 && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {account.unbilled_visits_count} unbilled visit{account.unbilled_visits_count > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600">Requires billing action</p>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <button
            onClick={() => changeView('record-payment')}
            className="flex-1 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
          >
            <IndianRupee className="h-3.5 w-3.5" />
            Record Payment
          </button>
          <button
            onClick={() => changeView('create-pack')}
            className="flex-1 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
          >
            <Package className="h-3.5 w-3.5" />
            New Pack
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientBillingPanel;

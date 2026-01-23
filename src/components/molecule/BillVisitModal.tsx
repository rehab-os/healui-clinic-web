'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  IndianRupee,
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Gift,
  ChevronLeft,
  ChevronUp,
  Receipt,
  Clock,
  FileText
} from 'lucide-react';
import ApiManager from '../../services/api';
import type {
  BillVisitDto,
  PaymentMethod,
  SessionPackDto,
  PatientBalanceDto,
  VisitBillingDto,
  UpdateVisitBillingDto
} from '../../lib/types';

interface BillVisitModalProps {
  visitId: string;
  clinicId: string;
  patientId?: string;
  patientName?: string;
  conditionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ViewMode = 'loading' | 'create-billing' | 'view-paid' | 'add-payment';

const BillVisitModal: React.FC<BillVisitModalProps> = ({
  visitId,
  clinicId,
  patientId,
  patientName,
  conditionId,
  onClose,
  onSuccess
}) => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [existingBilling, setExistingBilling] = useState<VisitBillingDto | null>(null);

  // Common states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Patient data
  const [availablePacks, setAvailablePacks] = useState<SessionPackDto[]>([]);
  const [patientBalance, setPatientBalance] = useState<PatientBalanceDto | null>(null);

  // Create billing form state
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial' | 'none'>('full');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isFreeVisit, setIsFreeVisit] = useState(false);
  const [freeReason, setFreeReason] = useState('');
  const [showAlternateOptions, setShowAlternateOptions] = useState(false);

  // Add payment form state (for OWED/PARTIAL)
  const [addPaymentAmount, setAddPaymentAmount] = useState<string>('');
  const [addPaymentMethod, setAddPaymentMethod] = useState<PaymentMethod>('CASH');
  const [addPaymentRef, setAddPaymentRef] = useState('');

  // Derived state
  const hasPacks = availablePacks.length > 0;
  const primaryPack = availablePacks[0];

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Initial load - check if billing exists
  useEffect(() => {
    checkExistingBilling();
  }, [visitId]);

  const checkExistingBilling = async () => {
    try {
      setViewMode('loading');

      // First, check if this visit already has billing
      const billingRes = await ApiManager.getVisitBilling(visitId);

      if (billingRes.success && billingRes.data) {
        // Billing exists
        setExistingBilling(billingRes.data);

        if (billingRes.data.status === 'PAID') {
          setViewMode('view-paid');
        } else {
          // OWED or PARTIAL - show add payment form
          setAddPaymentAmount(billingRes.data.amount_owed.toString());
          setViewMode('add-payment');
        }

        // Still fetch balance for context
        if (patientId && clinicId) {
          const balanceRes = await ApiManager.getPatientBalance(patientId, clinicId);
          if (balanceRes.success && balanceRes.data) {
            setPatientBalance(balanceRes.data);
          }
        }
      } else {
        // No billing - show create billing form
        setViewMode('create-billing');
        await fetchPatientData();
      }
    } catch (error) {
      console.error('Failed to check billing:', error);
      // If error (likely 404), show create billing form
      setViewMode('create-billing');
      await fetchPatientData();
    }
  };

  const fetchPatientData = async () => {
    if (!patientId || !clinicId) return;

    try {
      const [packsRes, balanceRes] = await Promise.all([
        ApiManager.getAvailableSessionPacks(patientId, clinicId, conditionId),
        ApiManager.getPatientBalance(patientId, clinicId)
      ]);

      if (packsRes.success && packsRes.data) {
        setAvailablePacks(packsRes.data);
        if (packsRes.data.length > 0) {
          setSelectedPackId(packsRes.data[0].id);
        }
      }

      if (balanceRes.success && balanceRes.data) {
        setPatientBalance(balanceRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    }
  };

  // ============ CREATE BILLING HANDLERS ============

  const handleDeductSession = async () => {
    if (!selectedPackId) {
      setError('No pack selected');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const data: BillVisitDto = {
        billing_type: 'SESSION_DEDUCT',
        session_pack_id: selectedPackId
      };

      const response = await ApiManager.billVisit(visitId, data);

      if (response.success) {
        setSuccessMessage('Session deducted from pack');
        setSuccess(true);
        setTimeout(() => onSuccess(), 1200);
      } else {
        setError(response.error?.message || 'Failed to bill visit');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChargeVisit = async () => {
    if (!chargeAmount || parseFloat(chargeAmount) <= 0) {
      setError('Please enter a valid consultation fee');
      return;
    }

    const charge = parseFloat(chargeAmount);
    let payment = 0;

    if (paymentOption === 'full') {
      payment = charge;
    } else if (paymentOption === 'partial') {
      if (!partialAmount || parseFloat(partialAmount) <= 0) {
        setError('Please enter a valid payment amount');
        return;
      }
      payment = parseFloat(partialAmount);
      if (payment > charge) {
        setError('Payment cannot exceed consultation fee');
        return;
      }
    }
    // paymentOption === 'none' means payment = 0

    try {
      setSubmitting(true);
      setError('');

      const data: BillVisitDto = {
        billing_type: 'CHARGED',
        charge_amount: charge,
        ...(payment > 0 && {
          payment_amount: payment,
          payment_method: paymentMethod
        })
      };

      const response = await ApiManager.billVisit(visitId, data);

      if (response.success) {
        const owed = charge - payment;
        if (owed === 0) {
          setSuccessMessage('Payment recorded');
        } else if (payment > 0) {
          setSuccessMessage(`Partial payment recorded. ₹${owed} added to outstanding`);
        } else {
          setSuccessMessage(`₹${charge} added to outstanding`);
        }
        setSuccess(true);
        setTimeout(() => onSuccess(), 1200);
      } else {
        setError(response.error?.message || 'Failed to bill visit');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFreeVisit = async () => {
    if (!freeReason.trim()) {
      setError('Please provide a reason');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const data: BillVisitDto = {
        billing_type: 'COMPLIMENTARY',
        complimentary_reason: freeReason
      };

      const response = await ApiManager.billVisit(visitId, data);

      if (response.success) {
        setSuccessMessage('Marked as complimentary');
        setSuccess(true);
        setTimeout(() => onSuccess(), 1200);
      } else {
        setError(response.error?.message || 'Failed to bill visit');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // ============ ADD PAYMENT HANDLER (for OWED/PARTIAL) ============

  const handleAddPayment = async () => {
    if (!addPaymentAmount || parseFloat(addPaymentAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const data: UpdateVisitBillingDto = {
        payment_amount: parseFloat(addPaymentAmount),
        payment_method: addPaymentMethod,
        ...(addPaymentRef && { payment_reference: addPaymentRef })
      };

      const response = await ApiManager.updateVisitBilling(visitId, data);

      if (response.success) {
        setSuccessMessage('Payment recorded');
        setSuccess(true);
        setTimeout(() => onSuccess(), 1200);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBillingTypeLabel = (type: string) => {
    switch (type) {
      case 'SESSION_DEDUCT': return 'Session Pack';
      case 'CHARGED': return 'Direct Charge';
      case 'COMPLIMENTARY': return 'Complimentary';
      default: return type;
    }
  };

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'UPI', label: 'UPI', icon: Smartphone },
    { value: 'CARD', label: 'Card', icon: CreditCard },
  ];

  // ============ RENDER SUCCESS STATE ============

  if (success) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <div className="w-screen max-w-md" style={{ animation: 'slideInRight 0.2s ease-out' }}>
            <div className="flex h-full flex-col bg-white shadow-xl">
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Done!</h3>
                <p className="text-xs text-gray-500">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  // ============ RENDER MAIN PANEL ============

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          className="w-screen max-w-md transform transition-transform duration-200 ease-out"
          style={{ animation: 'slideInRight 0.2s ease-out' }}
        >
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${
                    viewMode === 'view-paid' ? 'bg-green-50' :
                    viewMode === 'add-payment' ? 'bg-orange-50' : 'bg-brand-teal/10'
                  }`}>
                    {viewMode === 'view-paid' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : viewMode === 'add-payment' ? (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Receipt className="h-4 w-4 text-brand-teal" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">
                      {viewMode === 'view-paid' ? 'Billing Details' :
                       viewMode === 'add-payment' ? 'Collect Payment' :
                       'Bill Visit'}
                    </h2>
                    {patientName && (
                      <p className="text-xs text-gray-500">{patientName}</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* LOADING STATE */}
              {viewMode === 'loading' && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              )}

              {/* VIEW PAID - Read-only billing details */}
              {viewMode === 'view-paid' && existingBilling && (
                <div className="p-4 space-y-4">
                  {/* Paid Badge */}
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-800">Fully Paid</p>
                    <p className="text-xs text-green-600 mt-1">This visit has been billed and paid</p>
                  </div>

                  {/* Billing Details */}
                  <div className="bg-gray-50 rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Billing Type</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getBillingTypeLabel(existingBilling.billing_type)}
                      </span>
                    </div>

                    {existingBilling.billing_type === 'SESSION_DEDUCT' && existingBilling.sessionPack && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Pack Used</span>
                        <span className="text-sm font-medium text-purple-600">
                          {existingBilling.sessionPack.name}
                        </span>
                      </div>
                    )}

                    {existingBilling.charge_amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Charge Amount</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(existingBilling.charge_amount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Amount Paid</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(existingBilling.amount_paid)}
                      </span>
                    </div>

                    {existingBilling.complimentary_reason && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Reason</span>
                        <span className="text-sm text-gray-700">
                          {existingBilling.complimentary_reason}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Billed On</span>
                      <span className="text-xs text-gray-600">
                        {formatDate(existingBilling.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Patient Balance */}
                  {patientBalance && (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Patient Account</p>
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
                </div>
              )}

              {/* ADD PAYMENT - For OWED/PARTIAL visits */}
              {viewMode === 'add-payment' && existingBilling && (
                <div className="p-4 space-y-4">
                  {/* Outstanding Alert */}
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Payment Due</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-[10px] text-orange-600 uppercase">Total Charge</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(existingBilling.charge_amount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-orange-600 uppercase">Amount Due</p>
                        <p className="text-lg font-bold text-orange-700">
                          {formatCurrency(existingBilling.amount_owed)}
                        </p>
                      </div>
                    </div>
                    {existingBilling.amount_paid > 0 && (
                      <p className="text-xs text-orange-600 mt-2 text-center">
                        Already paid: {formatCurrency(existingBilling.amount_paid)}
                      </p>
                    )}
                  </div>

                  {/* Payment Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Payment Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={addPaymentAmount}
                          onChange={(e) => setAddPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddPaymentAmount(existingBilling.amount_owed.toString())}
                        className="mt-1.5 text-xs text-brand-teal hover:underline"
                      >
                        Pay full amount ({formatCurrency(existingBilling.amount_owed)})
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setAddPaymentMethod(method.value)}
                            className={`py-2 px-2 rounded border flex flex-col items-center transition-all ${
                              addPaymentMethod === method.value
                                ? 'border-brand-teal bg-brand-teal/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <method.icon className={`h-4 w-4 ${
                              addPaymentMethod === method.value ? 'text-brand-teal' : 'text-gray-400'
                            }`} />
                            <span className={`text-[10px] mt-0.5 ${
                              addPaymentMethod === method.value ? 'text-brand-teal font-medium' : 'text-gray-500'
                            }`}>
                              {method.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {addPaymentMethod !== 'CASH' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Reference (optional)</label>
                        <input
                          type="text"
                          value={addPaymentRef}
                          onChange={(e) => setAddPaymentRef(e.target.value)}
                          placeholder="Transaction ID"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal"
                        />
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
                    onClick={handleAddPayment}
                    disabled={submitting || !addPaymentAmount}
                    className="w-full py-2.5 px-4 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                </div>
              )}

              {/* CREATE BILLING - For unbilled visits */}
              {viewMode === 'create-billing' && (
                <div className="p-4 space-y-4">
                  {/* Patient Balance Summary */}
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

                  {/* SCENARIO A: Has Pack(s) - Show one-click deduct */}
                  {hasPacks && !showAlternateOptions && (
                    <div className="space-y-4">
                      {availablePacks.length > 1 ? (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">Select Pack</label>
                          {availablePacks.map((pack) => (
                            <button
                              key={pack.id}
                              type="button"
                              onClick={() => setSelectedPackId(pack.id)}
                              className={`w-full p-3 rounded border text-left transition-all ${
                                selectedPackId === pack.id
                                  ? 'border-purple-400 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{pack.name}</p>
                                  {pack.condition && (
                                    <p className="text-xs text-gray-500">{pack.condition.condition_name}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-purple-600">{pack.sessions_remaining}</p>
                                  <p className="text-[10px] text-gray-500">remaining</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-purple-50 border border-purple-200 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{primaryPack.name}</p>
                                {primaryPack.condition && (
                                  <p className="text-xs text-gray-500">{primaryPack.condition.condition_name}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-purple-600">{primaryPack.sessions_remaining}</p>
                              <p className="text-[10px] text-gray-500">sessions left</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleDeductSession}
                        disabled={submitting}
                        className="w-full py-2.5 px-4 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Deduct 1 Session
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAlternateOptions(true)}
                        className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
                      >
                        Charge amount instead or mark as free
                      </button>
                    </div>
                  )}

                  {/* SCENARIO B: No Packs OR User chose alternate options */}
                  {(!hasPacks || showAlternateOptions) && (
                    <div className="space-y-4">
                      {hasPacks && showAlternateOptions && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAlternateOptions(false);
                            setIsFreeVisit(false);
                          }}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          <ChevronUp className="h-3 w-3" />
                          Back to use session pack
                        </button>
                      )}

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium text-gray-700">Free (Complimentary)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFreeVisit(!isFreeVisit)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            isFreeVisit ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              isFreeVisit ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {isFreeVisit ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={freeReason}
                            onChange={(e) => setFreeReason(e.target.value)}
                            placeholder="Reason (e.g., Follow-up check, Trial)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <button
                            onClick={handleFreeVisit}
                            disabled={submitting || !freeReason.trim()}
                            className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Gift className="h-4 w-4" />
                                Mark as Free
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Step 1: Consultation Fee */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Consultation Fee</label>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="number"
                                value={chargeAmount}
                                onChange={(e) => {
                                  setChargeAmount(e.target.value);
                                  // Reset partial amount if charge changes
                                  if (paymentOption === 'partial') {
                                    setPartialAmount('');
                                  }
                                }}
                                placeholder="500"
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-medium"
                              />
                            </div>
                          </div>

                          {/* Step 2: Payment Options */}
                          {chargeAmount && parseFloat(chargeAmount) > 0 && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Payment</label>
                                <div className="space-y-2">
                                  {/* Full Payment Option */}
                                  <button
                                    type="button"
                                    onClick={() => setPaymentOption('full')}
                                    className={`w-full p-3 rounded border text-left transition-all ${
                                      paymentOption === 'full'
                                        ? 'border-green-400 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          paymentOption === 'full' ? 'border-green-500' : 'border-gray-300'
                                        }`}>
                                          {paymentOption === 'full' && (
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                          )}
                                        </div>
                                        <span className={`text-sm ${paymentOption === 'full' ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                                          Full Payment
                                        </span>
                                      </div>
                                      <span className={`text-sm font-semibold ${paymentOption === 'full' ? 'text-green-700' : 'text-gray-500'}`}>
                                        {formatCurrency(parseFloat(chargeAmount))}
                                      </span>
                                    </div>
                                  </button>

                                  {/* Partial Payment Option */}
                                  <button
                                    type="button"
                                    onClick={() => setPaymentOption('partial')}
                                    className={`w-full p-3 rounded border text-left transition-all ${
                                      paymentOption === 'partial'
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        paymentOption === 'partial' ? 'border-blue-500' : 'border-gray-300'
                                      }`}>
                                        {paymentOption === 'partial' && (
                                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        )}
                                      </div>
                                      <span className={`text-sm ${paymentOption === 'partial' ? 'font-medium text-blue-700' : 'text-gray-600'}`}>
                                        Partial Payment
                                      </span>
                                    </div>
                                  </button>

                                  {/* Partial Amount Input */}
                                  {paymentOption === 'partial' && (
                                    <div className="ml-6 mt-2">
                                      <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                          type="number"
                                          value={partialAmount}
                                          onChange={(e) => setPartialAmount(e.target.value)}
                                          placeholder="Enter amount paying now"
                                          max={parseFloat(chargeAmount)}
                                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                                        />
                                      </div>
                                      {partialAmount && parseFloat(partialAmount) > 0 && parseFloat(partialAmount) < parseFloat(chargeAmount) && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          ₹{(parseFloat(chargeAmount) - parseFloat(partialAmount)).toLocaleString('en-IN')} will be added to udhaari
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* No Payment Option */}
                                  <button
                                    type="button"
                                    onClick={() => setPaymentOption('none')}
                                    className={`w-full p-3 rounded border text-left transition-all ${
                                      paymentOption === 'none'
                                        ? 'border-orange-400 bg-orange-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          paymentOption === 'none' ? 'border-orange-500' : 'border-gray-300'
                                        }`}>
                                          {paymentOption === 'none' && (
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                          )}
                                        </div>
                                        <span className={`text-sm ${paymentOption === 'none' ? 'font-medium text-orange-700' : 'text-gray-600'}`}>
                                          Full Udhaari
                                        </span>
                                      </div>
                                      <span className={`text-xs ${paymentOption === 'none' ? 'text-orange-600' : 'text-gray-400'}`}>
                                        Pay later
                                      </span>
                                    </div>
                                  </button>
                                </div>
                              </div>

                              {/* Payment Method Selection (show only if paying something) */}
                              {(paymentOption === 'full' || (paymentOption === 'partial' && partialAmount && parseFloat(partialAmount) > 0)) && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {paymentMethods.map((method) => (
                                      <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.value)}
                                        className={`py-2 px-2 rounded border flex flex-col items-center transition-all ${
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

                              {/* Summary Section */}
                              <div className="bg-gray-50 rounded p-3 space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase">Summary</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Consultation Fee</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatCurrency(parseFloat(chargeAmount))}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Paying Now</span>
                                  <span className={`text-sm font-semibold ${
                                    paymentOption === 'none' ? 'text-gray-400' : 'text-green-600'
                                  }`}>
                                    {paymentOption === 'full'
                                      ? formatCurrency(parseFloat(chargeAmount))
                                      : paymentOption === 'partial' && partialAmount
                                        ? formatCurrency(parseFloat(partialAmount))
                                        : '₹0'
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                  <span className="text-xs font-medium text-gray-700">Udhaari</span>
                                  <span className={`text-sm font-bold ${
                                    paymentOption === 'full' ? 'text-gray-400' : 'text-orange-600'
                                  }`}>
                                    {paymentOption === 'full'
                                      ? '₹0'
                                      : paymentOption === 'partial' && partialAmount
                                        ? formatCurrency(parseFloat(chargeAmount) - parseFloat(partialAmount))
                                        : formatCurrency(parseFloat(chargeAmount))
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Submit Button */}
                              <button
                                onClick={handleChargeVisit}
                                disabled={submitting || (paymentOption === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0))}
                                className={`w-full py-2.5 px-4 text-white text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 ${
                                  paymentOption === 'none'
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    {paymentOption === 'none' ? (
                                      <>
                                        <Clock className="h-4 w-4" />
                                        Add to Udhaari
                                      </>
                                    ) : (
                                      <>
                                        <IndianRupee className="h-4 w-4" />
                                        {paymentOption === 'partial' ? 'Record Partial Payment' : 'Record Payment'}
                                      </>
                                    )}
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-xs">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default BillVisitModal;

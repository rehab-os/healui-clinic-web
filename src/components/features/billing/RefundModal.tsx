'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  IndianRupee,
  Loader2,
  AlertCircle,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import ApiManager from '@/services/api/api.service';
import type {
  ProcessRefundDto,
  PaymentMethod,
  RefundType,
  PaymentDto,
  PatientBalanceDto,
  SessionPackDto,
} from '@/lib/types';

interface RefundModalProps {
  clinicId: string;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess: () => void;
  // Pre-fill for specific refund context
  prefillPayment?: PaymentDto;
  prefillSessionPack?: SessionPackDto;
  prefillType?: RefundType;
}

const RefundModal: React.FC<RefundModalProps> = ({
  clinicId,
  patientId,
  patientName,
  onClose,
  onSuccess,
  prefillPayment,
  prefillSessionPack,
  prefillType,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>(prefillType ? 'form' : 'form');

  // Data
  const [balance, setBalance] = useState<PatientBalanceDto | null>(null);
  const [activePacks, setActivePacks] = useState<SessionPackDto[]>([]);

  // Form state
  const [refundType, setRefundType] = useState<RefundType | ''>(prefillType || '');
  const [amount, setAmount] = useState('');
  const [cancellationFee, setCancellationFee] = useState('');
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedPackId, setSelectedPackId] = useState(prefillSessionPack?.id || '');
  const [selectedPaymentId, setSelectedPaymentId] = useState(prefillPayment?.id || '');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-calculate for session pack
    if (refundType === 'SESSION_PACK' && selectedPackId) {
      const pack = prefillSessionPack?.id === selectedPackId
        ? prefillSessionPack
        : activePacks.find(p => p.id === selectedPackId);
      if (pack) {
        const proRata = (pack.sessions_remaining / pack.total_sessions) * pack.amount;
        setAmount(Math.round(proRata).toString());
      }
    }
    // Auto-fill for advance
    if (refundType === 'ADVANCE' && balance) {
      setAmount(balance.advance.toString());
    }
    // Auto-fill for visit payment
    if (refundType === 'VISIT' && prefillPayment) {
      setAmount(prefillPayment.amount.toString());
      setSelectedPaymentId(prefillPayment.id);
    }
  }, [refundType, selectedPackId, activePacks, balance]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceRes, packsRes] = await Promise.all([
        ApiManager.getPatientBalance(patientId, clinicId),
        ApiManager.getSessionPacks({ clinic_id: clinicId, patient_id: patientId, status: 'ACTIVE' as any }),
      ]);
      if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data);
      if (packsRes.success) {
        const packs = packsRes.data?.packs || (Array.isArray(packsRes.data) ? packsRes.data : []);
        setActivePacks(packs.filter((p: SessionPackDto) => p.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error('Failed to fetch refund data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const netRefund = Math.max(0, (parseFloat(amount) || 0) - (parseFloat(cancellationFee) || 0));

  const getMaxAmount = (): number => {
    if (refundType === 'ADVANCE') return balance?.advance || 0;
    if (refundType === 'SESSION_PACK') {
      const pack = prefillSessionPack?.id === selectedPackId
        ? prefillSessionPack
        : activePacks.find(p => p.id === selectedPackId);
      return pack ? pack.amount : 0;
    }
    if (refundType === 'VISIT' && prefillPayment) return prefillPayment.amount;
    return 0;
  };

  const validate = (): string | null => {
    if (!refundType) return 'Select a refund type';
    if (!amount || parseFloat(amount) <= 0) return 'Enter a valid refund amount';
    if (!reason.trim()) return 'Reason is required';
    const max = getMaxAmount();
    if (max > 0 && parseFloat(amount) > max) return `Amount cannot exceed ${formatCurrency(max)}`;
    if (refundType === 'SESSION_PACK' && !selectedPackId) return 'Select a session pack';
    if (refundType === 'VISIT' && !selectedPaymentId) return 'No payment selected for refund';
    const fee = parseFloat(cancellationFee) || 0;
    if (fee < 0) return 'Cancellation fee cannot be negative';
    if (fee >= parseFloat(amount)) return 'Cancellation fee must be less than the amount — patient must receive something';
    return null;
  };

  const handleProceed = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const data: ProcessRefundDto = {
        refund_type: refundType as RefundType,
        amount: parseFloat(amount),
        reason: reason.trim(),
        method,
        ...(selectedPaymentId && { payment_id: selectedPaymentId }),
        ...(selectedPackId && { session_pack_id: selectedPackId }),
        ...(parseFloat(cancellationFee) > 0 && { cancellation_fee: parseFloat(cancellationFee) }),
        ...(referenceNumber && { reference_number: referenceNumber }),
      };

      const response = await ApiManager.processRefund(patientId, clinicId, data);

      if (response.success) {
        setStep('success');
      } else {
        setError(response.error?.message || 'Failed to process refund');
        setStep('form');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'UPI', label: 'UPI', icon: Smartphone },
    { value: 'CARD', label: 'Card', icon: CreditCard },
    { value: 'BANK_TRANSFER', label: 'Bank', icon: Building },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
  ];

  const selectedPack = prefillSessionPack?.id === selectedPackId
    ? prefillSessionPack
    : activePacks.find(p => p.id === selectedPackId);

  // ---- SUCCESS SCREEN ----
  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded p-6 max-w-xs w-full text-center shadow-lg">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ArrowDownLeft className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Refund Processed</h3>
          <p className="text-xs text-gray-500 mb-1">
            {formatCurrency(netRefund)} refunded to {patientName}
          </p>
          {parseFloat(cancellationFee) > 0 && (
            <p className="text-[10px] text-gray-400 mb-1">
              Gross: {formatCurrency(parseFloat(amount))} | Cancellation fee: {formatCurrency(parseFloat(cancellationFee))}
            </p>
          )}
          <button
            onClick={onSuccess}
            className="mt-4 w-full py-2 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ---- CONFIRMATION SCREEN ----
  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded shadow-lg max-w-sm w-full p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Confirm Refund</h3>
          </div>

          <div className="bg-gray-50 rounded p-3 mb-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Patient</span>
              <span className="font-medium text-gray-900">{patientName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Refund Type</span>
              <span className="font-medium text-gray-900">
                {refundType === 'ADVANCE' ? 'Advance Balance' : refundType === 'SESSION_PACK' ? 'Session Pack' : 'Visit Payment'}
              </span>
            </div>
            {selectedPack && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Pack</span>
                <span className="font-medium text-gray-900">{selectedPack.name}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Refund Amount</span>
              <span className="font-semibold text-red-600">{formatCurrency(parseFloat(amount))}</span>
            </div>
            {parseFloat(cancellationFee) > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cancellation Fee</span>
                  <span className="font-medium text-gray-900">{formatCurrency(parseFloat(cancellationFee))}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5">
                  <span className="text-gray-500">Net to Patient</span>
                  <span className="font-semibold text-red-600">{formatCurrency(netRefund)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Via</span>
              <span className="font-medium text-gray-900">{method}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Reason</span>
              <span className="font-medium text-gray-900 text-right max-w-[180px] truncate">{reason}</span>
            </div>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-4">
            This action cannot be undone. The refund will be recorded permanently.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded mb-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('form'); setError(''); }}
              className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2 px-3 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <>Process Refund</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- FORM SCREEN ----
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded shadow-lg max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded">
              <ArrowDownLeft className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Issue Refund</h2>
              <p className="text-[10px] text-gray-500">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Refund Type Selection */}
            {!prefillType && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Refund Type</label>
                <div className="space-y-1.5">
                  {/* Advance */}
                  <button
                    type="button"
                    onClick={() => setRefundType('ADVANCE')}
                    disabled={!balance || balance.advance <= 0}
                    className={`w-full p-2.5 rounded border text-left transition-all ${
                      refundType === 'ADVANCE' ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                    } ${(!balance || balance.advance <= 0) ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium ${refundType === 'ADVANCE' ? 'text-red-700' : 'text-gray-700'}`}>
                          Advance Balance Refund
                        </p>
                        <p className="text-[10px] text-gray-500">Return advance credit as cash</p>
                      </div>
                      <span className="text-xs font-semibold text-green-600">
                        {balance ? formatCurrency(balance.advance) : '-'}
                      </span>
                    </div>
                  </button>

                  {/* Session Pack */}
                  <button
                    type="button"
                    onClick={() => setRefundType('SESSION_PACK')}
                    disabled={activePacks.length === 0}
                    className={`w-full p-2.5 rounded border text-left transition-all ${
                      refundType === 'SESSION_PACK' ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                    } ${activePacks.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium ${refundType === 'SESSION_PACK' ? 'text-red-700' : 'text-gray-700'}`}>
                          Session Pack Refund
                        </p>
                        <p className="text-[10px] text-gray-500">Cancel pack, refund remaining sessions</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {activePacks.length} active
                      </span>
                    </div>
                  </button>

                  {/* Visit Payment — only available when prefilled */}
                  {prefillPayment && (
                    <button
                      type="button"
                      onClick={() => setRefundType('VISIT')}
                      className={`w-full p-2.5 rounded border text-left transition-all ${
                        refundType === 'VISIT' ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-medium ${refundType === 'VISIT' ? 'text-red-700' : 'text-gray-700'}`}>
                            Visit Payment Refund
                          </p>
                          <p className="text-[10px] text-gray-500">Goodwill refund against specific payment</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {formatCurrency(prefillPayment.amount)}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Session Pack Selector */}
            {refundType === 'SESSION_PACK' && !prefillSessionPack && activePacks.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Pack</label>
                <div className="space-y-1.5">
                  {activePacks.map(pack => {
                    const proRata = (pack.sessions_remaining / pack.total_sessions) * pack.amount;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`w-full p-2.5 rounded border text-left transition-all ${
                          selectedPackId === pack.id ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-xs font-medium text-gray-900">{pack.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-gray-500">
                            {pack.sessions_remaining}/{pack.total_sessions} remaining
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Pack: {formatCurrency(pack.amount)}
                          </span>
                          <span className="text-[10px] font-medium text-red-600">
                            Pro-rata: {formatCurrency(Math.round(proRata))}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pack details when pre-selected */}
            {refundType === 'SESSION_PACK' && selectedPack && (
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-900">{selectedPack.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-500">
                    {selectedPack.sessions_remaining}/{selectedPack.total_sessions} sessions remaining
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Pack total: {formatCurrency(selectedPack.amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Refund Amount */}
            {refundType && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const max = getMaxAmount();
                        const val = e.target.value;
                        if (max > 0 && parseFloat(val) > max) {
                          setAmount(max.toString());
                        } else {
                          setAmount(val);
                        }
                      }}
                      placeholder="Enter amount"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-200 focus:border-red-400 font-medium"
                    />
                  </div>
                  {getMaxAmount() > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Max: {formatCurrency(getMaxAmount())}
                    </p>
                  )}
                </div>

                {/* Cancellation Fee */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Cancellation Fee (optional)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={cancellationFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currentAmount = parseFloat(amount) || 0;
                        // Fee must be less than amount (patient must get something)
                        if (currentAmount > 0 && parseFloat(val) >= currentAmount) {
                          setCancellationFee((currentAmount - 1).toString());
                        } else {
                          setCancellationFee(val);
                        }
                      }}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-200 focus:border-red-400"
                    />
                  </div>
                  {parseFloat(cancellationFee) > 0 && parseFloat(amount) > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Net refund to patient: <span className="font-semibold text-red-600">{formatCurrency(netRefund)}</span>
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Why is this refund being issued?"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-200 focus:border-red-400 resize-none"
                  />
                </div>

                {/* Refund Method */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Refund Via</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMethod(m.value)}
                        className={`py-2 px-1 rounded border flex flex-col items-center transition-all ${
                          method === m.value
                            ? 'border-red-400 bg-red-50/50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <m.icon className={`h-4 w-4 ${method === m.value ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`text-[10px] mt-0.5 ${method === m.value ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference Number */}
                {method !== 'CASH' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Transaction reference"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-200 focus:border-red-400"
                    />
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            {refundType && (
              <button
                type="button"
                onClick={handleProceed}
                disabled={!refundType}
                className="w-full py-2 px-3 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft className="h-4 w-4" />
                Review Refund
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundModal;

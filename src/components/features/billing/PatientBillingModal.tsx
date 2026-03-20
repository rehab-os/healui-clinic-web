'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  Loader2,
  IndianRupee,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  FileText,
  Printer,
  Download,
} from 'lucide-react';
import PatientBillingPanel from './PatientBillingPanel';
import ApiManager from '@/services/api/api.service';
import type { PaymentDto, SessionPackDto } from '@/lib/types';
import { downloadReceiptPDF, printReceipt } from '@/lib/utils/receipt-pdf';
import type { ReceiptData } from '@/lib/utils/receipt-pdf';

interface PatientBillingModalProps {
  patientId: string;
  patientName: string;
  clinicId: string;
  clinic?: { name: string; address?: string; phone?: string };
  onClose: () => void;
}

const PAYMENT_FOR_LABELS: Record<string, string> = {
  VISIT: 'Visit Payment',
  SESSION_PACK: 'Session Pack Purchase',
  OUTSTANDING: 'Outstanding Dues Cleared',
  ADVANCE: 'Advance Payment',
  CORPORATE: 'Corporate Payment',
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  UPI: Smartphone,
  CARD: CreditCard,
  BANK_TRANSFER: Building,
  CHEQUE: FileText,
  OTHER: IndianRupee,
};

const PatientBillingModal: React.FC<PatientBillingModalProps> = ({
  patientId,
  patientName,
  clinicId,
  clinic,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Payment history state
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [sessionPacks, setSessionPacks] = useState<SessionPackDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reprintingId, setReprintingId] = useState<string | null>(null);

  // Full patient profile for receipt enrichment (UID, age, gender)
  const [patientProfile, setPatientProfile] = useState<{
    patient_code?: string; age?: number; gender?: string; phone?: string;
  } | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && payments.length === 0) {
      fetchPaymentHistory();
    }
  }, [activeTab]);

  const fetchPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      // Fetch payments, session packs, and full patient profile in parallel
      const [paymentsRes, packsRes, profileRes] = await Promise.all([
        ApiManager.getPatientPayments(patientId, clinicId, 50),
        ApiManager.getSessionPacks({ clinic_id: clinicId, patient_id: patientId, limit: 50 }),
        ApiManager.getPatient(patientId),
      ]);
      if (paymentsRes.success && paymentsRes.data) setPayments(paymentsRes.data);
      if (packsRes.success && packsRes.data?.packs) setSessionPacks(packsRes.data.packs);
      else if (packsRes.success && Array.isArray(packsRes.data)) setSessionPacks(packsRes.data);
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        const age = p.date_of_birth
          ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined;
        setPatientProfile({ patient_code: p.patient_code, age, gender: p.gender, phone: p.phone });
      }
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Match a SESSION_PACK payment to its session pack by amount + date proximity
  const findMatchingPack = (p: PaymentDto): SessionPackDto | undefined =>
    sessionPacks.find(pack =>
      pack.amount === p.amount &&
      Math.abs(new Date(pack.created_at).getTime() - new Date(p.created_at).getTime()) < 10 * 60 * 1000 // within 10 min
    );

  const buildReceiptFromPayment = (p: PaymentDto): ReceiptData => {
    const matchedPack = p.payment_for === 'SESSION_PACK' ? findMatchingPack(p) : undefined;

    // For VISIT payments, the payment is recorded on the visit day — use as appointment date
    const appointmentDate = p.payment_for === 'VISIT' ? p.created_at : undefined;

    return {
      clinic: clinic || { name: '' },
      receipt_number: p.receipt_number || `PMT-${p.id.slice(-6).toUpperCase()}`,
      payment_date: p.created_at,
      appointment_date: appointmentDate,
      patient: {
        name: p.patient?.full_name || patientName,
        patient_code: patientProfile?.patient_code || p.patient?.patient_code || p.patient?.patientCode,
        age: patientProfile?.age,
        gender: patientProfile?.gender,
      },
      // If session pack matched, show pack name as line item; else use description
      ...(matchedPack ? {
        line_items: [{
          name: matchedPack.name,
          quantity: 1,
          rate: matchedPack.amount,
          amount: matchedPack.amount,
        }],
        pack_details: {
          total_sessions: matchedPack.total_sessions,
          per_session_rate: matchedPack.amount / matchedPack.total_sessions,
          sessions_used: matchedPack.sessions_used,
          sessions_remaining: matchedPack.sessions_remaining,
          valid_until: matchedPack.valid_until,
        },
      } : {
        description: PAYMENT_FOR_LABELS[p.payment_for] || p.payment_for,
      }),
      subtotal: p.amount,
      total_amount: matchedPack?.amount ?? p.amount,
      amount_paid: p.amount,
      balance_due: matchedPack ? Math.max(0, matchedPack.amount - p.amount) : 0,
      payment_method: p.method,
      transaction_ref: p.reference_number,
    };
  };

  const handleReprint = async (p: PaymentDto, mode: 'print' | 'download') => {
    setReprintingId(p.id);
    try {
      const data = buildReceiptFromPayment(p);
      if (mode === 'print') printReceipt(data);
      else await downloadReceiptPDF(data);
    } finally {
      setReprintingId(null);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div className="w-screen max-w-md" style={{ animation: 'slideInRight 0.2s ease-out' }}>
          <div className="flex h-full flex-col bg-white shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-xs">
                      {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">{patientName}</h2>
                    <p className="text-xs text-gray-500">Billing</p>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-4 bg-white">
              {(['overview', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 px-1 mr-5 text-xs font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-brand-teal text-brand-teal'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : 'Payment History'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <PatientBillingPanel
                  patientId={patientId}
                  patientName={patientName}
                  clinicId={clinicId}
                  compact={false}
                />
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="p-4">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading history...</span>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-12">
                      <IndianRupee className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No payment history found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
                        {payments.length} payment{payments.length !== 1 ? 's' : ''} on record
                      </p>
                      {payments.map(p => {
                        const MethodIcon = METHOD_ICONS[p.method] || IndianRupee;
                        const isReprinting = reprintingId === p.id;
                        return (
                          <div
                            key={p.id}
                            className="border border-gray-100 rounded p-3 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Left */}
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="p-1.5 bg-green-50 rounded mt-0.5 flex-shrink-0">
                                  <MethodIcon className="h-3.5 w-3.5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(p.amount)}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {PAYMENT_FOR_LABELS[p.payment_for] || p.payment_for}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-400">{formatDate(p.created_at)}</span>
                                    <span className="text-[10px] text-gray-300">·</span>
                                    <span className="text-[10px] text-gray-400">{p.method}</span>
                                    {p.reference_number && (
                                      <>
                                        <span className="text-[10px] text-gray-300">·</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{p.reference_number}</span>
                                      </>
                                    )}
                                  </div>
                                  {p.receipt_number && (
                                    <p className="text-[10px] text-brand-teal font-mono mt-0.5">
                                      {p.receipt_number}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Reprint buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleReprint(p, 'print')}
                                  disabled={isReprinting}
                                  title="Print receipt"
                                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-40"
                                >
                                  {isReprinting
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Printer className="h-3.5 w-3.5" />
                                  }
                                </button>
                                <button
                                  onClick={() => handleReprint(p, 'download')}
                                  disabled={isReprinting}
                                  title="Download PDF"
                                  className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-teal-50 rounded transition-colors disabled:opacity-40"
                                >
                                  {isReprinting
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Download className="h-3.5 w-3.5" />
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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

export default PatientBillingModal;

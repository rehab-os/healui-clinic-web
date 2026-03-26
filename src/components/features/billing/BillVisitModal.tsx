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
  ChevronDown,
  Receipt,
  Clock,
  FileText,
  Building,
  Percent,
  Tag,
  List
} from 'lucide-react';
import ApiManager from '@/services/api/api.service';
import type {
  BillVisitDto,
  BillingType,
  PaymentMethod,
  SessionPackDto,
  PatientBalanceDto,
  VisitBillingDto,
  UpdateVisitBillingDto,
  ClinicServiceDto,
  ClinicBillingSettingsDto,
  BillingServiceLineItem,
  ReceiptDataDto,
} from '@/lib/types';
import { downloadReceiptPDF, printReceipt } from '@/lib/utils/receipt-pdf';
import type { ReceiptData } from '@/lib/utils/receipt-pdf';
import ReceiptButton from './ReceiptButton';

interface BillVisitModalProps {
  visitId: string;
  clinicId: string;
  patientId?: string;
  patientName?: string;
  conditionId?: string;
  multiVisitIds?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

type ViewMode = 'loading' | 'create-billing' | 'view-paid' | 'add-payment' | 'view-corporate' | 'view-session-pack' | 'view-complimentary';

const BillVisitModal: React.FC<BillVisitModalProps> = ({
  visitId,
  clinicId,
  patientId,
  patientName,
  conditionId,
  multiVisitIds,
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
  const [billingResultId, setBillingResultId] = useState<string>('');
  const [billingResult, setBillingResult] = useState<VisitBillingDto | null>(null);
  const [showReceiptButtons, setShowReceiptButtons] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Patient data
  const [availablePacks, setAvailablePacks] = useState<SessionPackDto[]>([]);
  const [patientBalance, setPatientBalance] = useState<PatientBalanceDto | null>(null);
  const [patientProfile, setPatientProfile] = useState<{ age?: number; gender?: string; patient_code?: string } | null>(null);

  // Clinic data
  const [clinicServices, setClinicServices] = useState<ClinicServiceDto[]>([]);
  const [billingSettings, setBillingSettings] = useState<ClinicBillingSettingsDto | null>(null);

  // Create billing form state
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial' | 'none' | 'corporate'>('full');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [isFreeVisit, setIsFreeVisit] = useState(false);
  const [freeReason, setFreeReason] = useState('');
  const [showAlternateOptions, setShowAlternateOptions] = useState(false);

  // Catalog / Service line items
  const [selectedServices, setSelectedServices] = useState<BillingServiceLineItem[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Discount
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  // Corporate
  const [corporateCompany, setCorporateCompany] = useState('');

  // Add payment form state (for OWED/PARTIAL)
  const [addPaymentAmount, setAddPaymentAmount] = useState<string>('');
  const [addPaymentMethod, setAddPaymentMethod] = useState<PaymentMethod>('CASH');
  const [addPaymentRef, setAddPaymentRef] = useState('');

  // Derived state
  const hasPacks = availablePacks.length > 0;
  const primaryPack = availablePacks[0];
  const enabledMethods = billingSettings?.enabled_payment_methods || ['CASH', 'UPI', 'CARD'];

  const paymentMethodIcons: Record<string, React.ElementType> = {
    CASH: Banknote, UPI: Smartphone, CARD: CreditCard,
    BANK_TRANSFER: Building, CHEQUE: FileText, OTHER: IndianRupee,
  };

  // Calculate subtotal from services or manual amount
  const servicesSubtotal = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const subtotal = selectedServices.length > 0 ? servicesSubtotal : (parseFloat(chargeAmount) || 0);

  // Calculate discount
  const discountAmount = discountType === 'amount'
    ? (parseFloat(discountValue) || 0)
    : (subtotal * (parseFloat(discountValue) || 0) / 100);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

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

  // Initial load
  useEffect(() => {
    checkExistingBilling();
  }, [visitId]);

  const checkExistingBilling = async () => {
    try {
      setViewMode('loading');
      const billingRes = await ApiManager.getVisitBilling(visitId);

      if (billingRes.success && billingRes.data) {
        setExistingBilling(billingRes.data);
        const { status, billing_type } = billingRes.data;

        if (status === 'PAID') {
          setViewMode('view-paid');
        } else if (billing_type === 'CORPORATE') {
          setViewMode('view-corporate');
        } else if (billing_type === 'SESSION_DEDUCT') {
          setViewMode('view-session-pack');
        } else if (billing_type === 'COMPLIMENTARY') {
          setViewMode('view-complimentary');
        } else {
          // CHARGED, CATALOG, MANUAL — payable types
          setAddPaymentAmount(billingRes.data.amount_owed.toString());
          setViewMode('add-payment');
        }
        if (patientId && clinicId) {
          const balanceRes = await ApiManager.getPatientBalance(patientId, clinicId);
          if (balanceRes.success && balanceRes.data) setPatientBalance(balanceRes.data);
        }
      } else {
        setViewMode('create-billing');
        await fetchPatientData();
      }
    } catch (error) {
      setViewMode('create-billing');
      await fetchPatientData();
    }
  };

  const fetchPatientData = async () => {
    if (!patientId || !clinicId) return;
    try {
      const [packsRes, balanceRes, servicesRes, settingsRes, profileRes] = await Promise.all([
        ApiManager.getAvailableSessionPacks(patientId, clinicId, conditionId),
        ApiManager.getPatientBalance(patientId, clinicId),
        ApiManager.getClinicServicesForBilling(clinicId),
        ApiManager.getBillingSettings(clinicId),
        ApiManager.getPatient(patientId),
      ]);

      if (packsRes.success && packsRes.data) {
        setAvailablePacks(packsRes.data);
        if (packsRes.data.length > 0) setSelectedPackId(packsRes.data[0].id);
      }
      if (balanceRes.success && balanceRes.data) setPatientBalance(balanceRes.data);
      if (servicesRes.success && servicesRes.data) setClinicServices(servicesRes.data);
      if (settingsRes.success && settingsRes.data) {
        setBillingSettings(settingsRes.data);
        const methods = settingsRes.data.enabled_payment_methods;
        if (methods && methods.length > 0) setPaymentMethod(methods[0]);
      }
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        const age = p.date_of_birth
          ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined;
        setPatientProfile({ age, gender: p.gender, patient_code: p.patient_code });
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    }
  };

  // ============ SERVICE SELECTION ============

  const addServiceLine = (service: ClinicServiceDto) => {
    const existing = selectedServices.find(s => s.service_id === service.id);
    if (existing) {
      setSelectedServices(prev => prev.map(s =>
        s.service_id === service.id ? { ...s, quantity: s.quantity + 1 } : s
      ));
    } else {
      setSelectedServices(prev => [...prev, {
        service_id: service.id,
        name: service.name,
        price: service.price,
        quantity: 1,
      }]);
    }
    setShowServicePicker(false);
  };

  const removeServiceLine = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateServiceLinePrice = (index: number, newPrice: number) => {
    setSelectedServices(prev => prev.map((s, i) =>
      i === index ? { ...s, price: newPrice } : s
    ));
  };

  // ============ BILLING HANDLERS ============

  const handleDeductSession = async () => {
    if (!selectedPackId) { setError('No pack selected'); return; }
    try {
      setSubmitting(true);
      setError('');
      const data: BillVisitDto = { billing_type: 'SESSION_DEDUCT', session_pack_id: selectedPackId };
      const response = await ApiManager.billVisit(visitId, data);
      if (response.success) {
        setBillingResultId(response.data?.id || '');
        setBillingResult(response.data || null);
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
    const finalAmount = totalAfterDiscount;
    if (finalAmount <= 0 && paymentOption !== 'none') {
      setError('Please enter a valid amount');
      return;
    }

    let payment = 0;
    if (paymentOption === 'full') {
      payment = finalAmount;
    } else if (paymentOption === 'partial') {
      if (!partialAmount || parseFloat(partialAmount) <= 0) {
        setError('Please enter a valid payment amount');
        return;
      }
      payment = parseFloat(partialAmount);
      if (payment > finalAmount) {
        setError('Payment cannot exceed total');
        return;
      }
    } else if (paymentOption === 'corporate') {
      if (!corporateCompany) {
        setError('Please select a company');
        return;
      }
      payment = 0;
    }

    // Require transaction ID for UPI/Card payments
    if (payment > 0 && (paymentMethod === 'UPI' || paymentMethod === 'CARD') && !paymentRef?.trim()) {
      setError('Transaction ID is required for UPI/Card payments');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const billingType: BillingType = paymentOption === 'corporate'
        ? 'CORPORATE'
        : selectedServices.length > 0 ? 'CATALOG' : 'MANUAL';

      const data: BillVisitDto = {
        billing_type: billingType,
        charge_amount: finalAmount,
        ...(selectedServices.length > 0 && { services: selectedServices }),
        ...(discountAmount > 0 && {
          discount_amount: discountAmount,
          discount_percent: discountType === 'percent' ? parseFloat(discountValue) : undefined,
          discount_reason: discountReason || undefined,
        }),
        ...(paymentOption === 'corporate' && { corporate_company: corporateCompany }),
        ...(payment > 0 && {
          payment_amount: payment,
          payment_method: paymentMethod,
          ...(paymentRef?.trim() && { payment_reference: paymentRef.trim() }),
        }),
        ...(multiVisitIds && multiVisitIds.length > 1 && { visit_ids: multiVisitIds }),
      };

      const response = multiVisitIds && multiVisitIds.length > 1
        ? await ApiManager.billMultipleVisits({
            visit_ids: multiVisitIds,
            clinic_id: clinicId,
            billing_type: billingType,
            charge_amount: finalAmount,
            ...(selectedServices.length > 0 && { services: selectedServices }),
            ...(discountAmount > 0 && {
              discount_amount: discountAmount,
              discount_percent: discountType === 'percent' ? parseFloat(discountValue) : undefined,
              discount_reason: discountReason || undefined,
            }),
            ...(paymentOption === 'corporate' && { corporate_company: corporateCompany }),
            ...(payment > 0 && {
              payment_amount: payment,
              payment_method: paymentMethod,
            }),
          })
        : await ApiManager.billVisit(visitId, data);
      if (response.success) {
        setBillingResultId(response.data?.id || '');
        setBillingResult(response.data || null);
        const owed = finalAmount - payment;
        if (paymentOption === 'corporate') {
          setSuccessMessage(`Billed to ${corporateCompany}`);
          setSuccess(true);
          setTimeout(() => onSuccess(), 1200);
        } else if (owed === 0) {
          setSuccessMessage('Payment recorded');
          setShowReceiptButtons(true);
          setSuccess(true);
        } else if (payment > 0) {
          setSuccessMessage(`Partial payment recorded. ₹${owed} outstanding`);
          setShowReceiptButtons(true);
          setSuccess(true);
        } else {
          setSuccessMessage(`₹${finalAmount} added to outstanding`);
          setSuccess(true);
          setTimeout(() => onSuccess(), 1200);
        }
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
    if (!freeReason.trim()) { setError('Please provide a reason'); return; }
    try {
      setSubmitting(true);
      setError('');
      const data: BillVisitDto = { billing_type: 'COMPLIMENTARY', complimentary_reason: freeReason };
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

  const handleAddPayment = async () => {
    if (!addPaymentAmount || parseFloat(addPaymentAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if ((addPaymentMethod === 'UPI' || addPaymentMethod === 'CARD') && !addPaymentRef?.trim()) {
      setError('Transaction ID is required for UPI/Card payments');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const data: UpdateVisitBillingDto = {
        payment_amount: parseFloat(addPaymentAmount),
        payment_method: addPaymentMethod,
        ...(addPaymentRef && { payment_reference: addPaymentRef }),
      };
      const response = await ApiManager.updateVisitBilling(visitId, data);
      if (response.success) {
        // existingBilling.id is the visit_billing_id needed for getReceiptData
        setBillingResultId(existingBilling?.id || '');
        setSuccessMessage('Payment recorded');
        setShowReceiptButtons(true);
        setSuccess(true);
      } else {
        setError(response.error?.message || 'Failed to record payment');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // ============ RECEIPT HANDLERS ============

  // Builds receipt data — merges API response with local billing state as fallback.
  // This ensures the PDF always has data even if getReceiptData returns incomplete fields.
  const buildReceiptData = async (id?: string, localBilling?: VisitBillingDto): Promise<ReceiptData | null> => {
    const targetId = id || billingResultId;
    const billing = localBilling || billingResult || (targetId === existingBilling?.id ? existingBilling : null);

    setLoadingReceipt(true);
    try {
      let dto: ReceiptDataDto | null = null;
      if (targetId) {
        const res = await ApiManager.getReceiptData(targetId);
        if (res.success && res.data) dto = res.data;
      }

      // Need at least one data source
      if (!dto && !billing) return null;

      // Merge: API data takes priority for receipt_number / clinic / payment_method
      // Local billing fills in services, amounts when API is incomplete
      const services = (dto?.services?.length ? dto.services : billing?.services) || [];
      const chargeAmt = billing?.charge_amount ?? dto?.total_amount ?? billing?.amount_paid ?? 0;
      // Appointment date — now returned directly by backend as visit_date
      const apptDate = dto?.visit_date || (billing as any)?.visit?.scheduled_date || null;

      return {
        clinic: dto?.clinic || { name: '' },
        receipt_number: dto?.receipt_number || `RX-${(targetId || '').slice(-6).toUpperCase()}`,
        payment_date: dto?.date || billing?.created_at || new Date().toISOString(),
        appointment_date: apptDate || undefined,
        therapist_name: dto?.therapist_name || undefined,
        patient: {
          name: dto?.patient?.name || patientName || '',
          phone: dto?.patient?.phone,
          // Backend now returns patient_code, age, gender in receipt
          patient_code: dto?.patient?.patient_code || patientProfile?.patient_code,
          age: dto?.patient?.age ?? patientProfile?.age,
          gender: dto?.patient?.gender ?? patientProfile?.gender,
        },
        line_items: services.map(s => ({
          name: s.name,
          quantity: s.quantity,
          rate: s.price,
          amount: s.price * s.quantity,
        })),
        subtotal: chargeAmt,
        discount_amount: billing?.discount_amount ?? dto?.discount_amount,
        discount_reason: billing?.discount_reason ?? dto?.discount_reason,
        total_amount: chargeAmt - (billing?.discount_amount ?? dto?.discount_amount ?? 0),
        amount_paid: billing?.amount_paid ?? dto?.amount_paid ?? 0,
        balance_due: billing?.amount_owed ?? dto?.amount_owed ?? 0,
        payment_method: dto?.payment_method || 'CASH',
        transaction_ref: dto?.payment_reference || undefined,
      };
    } catch {
      // Last resort: build entirely from local billing state
      if (!billing) return null;
      const chargeAmt = billing.charge_amount ?? billing.amount_paid ?? 0;
      const apptDate = (billing as any)?.visit?.scheduled_date;
      return {
        clinic: { name: '' },
        receipt_number: `RX-${(targetId || '').slice(-6).toUpperCase()}`,
        payment_date: billing.created_at,
        appointment_date: apptDate || undefined,
        patient: {
          name: patientName || '',
          patient_code: patientProfile?.patient_code,
          age: patientProfile?.age,
          gender: patientProfile?.gender,
        },
        line_items: (billing.services || []).map(s => ({
          name: s.name, quantity: s.quantity, rate: s.price, amount: s.price * s.quantity,
        })),
        subtotal: chargeAmt,
        discount_amount: billing.discount_amount,
        discount_reason: billing.discount_reason,
        total_amount: chargeAmt - (billing.discount_amount ?? 0),
        amount_paid: billing.amount_paid,
        balance_due: billing.amount_owed,
        payment_method: 'CASH',
      };
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handlePrintReceipt = async (id?: string) => {
    const data = await buildReceiptData(id);
    if (data) printReceipt(data);
  };

  const handleDownloadReceipt = async (id?: string) => {
    const data = await buildReceiptData(id);
    if (data) await downloadReceiptPDF(data);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getBillingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SESSION_DEDUCT: 'Session Pack', CHARGED: 'Direct Charge', COMPLIMENTARY: 'Complimentary',
      MANUAL: 'Manual Charge', CATALOG: 'Catalog Billing', CORPORATE: 'Corporate Billing',
    };
    return labels[type] || type;
  };

  // ============ RENDER SUCCESS STATE ============

  if (success) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <div className="w-screen max-w-md" style={{ animation: 'slideInRight 0.2s ease-out' }}>
            <div className="flex h-full flex-col bg-white shadow-xl">
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Done!</h3>
                <p className="text-xs text-gray-500 mb-6 text-center">{successMessage}</p>

                {showReceiptButtons && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <ReceiptButton
                      onPrint={handlePrintReceipt}
                      onDownload={handleDownloadReceipt}
                      loading={loadingReceipt}
                    />
                    <p className="text-[10px] text-gray-400">Receipt will open in a new tab / download</p>
                  </div>
                )}

                <button
                  onClick={onSuccess}
                  className="mt-6 text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  {showReceiptButtons ? 'Done, close' : 'Close'}
                </button>
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
        <div className="w-screen max-w-md transform transition-transform duration-200 ease-out" style={{ animation: 'slideInRight 0.2s ease-out' }}>
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${
                    viewMode === 'view-paid' || viewMode === 'view-session-pack' || viewMode === 'view-complimentary' ? 'bg-green-50' :
                    viewMode === 'view-corporate' ? 'bg-purple-50' :
                    viewMode === 'add-payment' ? 'bg-orange-50' : 'bg-brand-teal/10'
                  }`}>
                    {viewMode === 'view-paid' || viewMode === 'view-session-pack' || viewMode === 'view-complimentary' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                     viewMode === 'view-corporate' ? <Building className="h-4 w-4 text-purple-600" /> :
                     viewMode === 'add-payment' ? <AlertCircle className="h-4 w-4 text-orange-600" /> :
                     <Receipt className="h-4 w-4 text-brand-teal" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">
                      {viewMode === 'view-paid' ? 'Billing Details' :
                       viewMode === 'view-corporate' ? 'Corporate Billing' :
                       viewMode === 'view-session-pack' ? 'Session Pack' :
                       viewMode === 'view-complimentary' ? 'Complimentary' :
                       viewMode === 'add-payment' ? 'Collect Payment' :
                       multiVisitIds && multiVisitIds.length > 1 ? `Bill ${multiVisitIds.length} Visits` : 'Bill Visit'}
                    </h2>
                    {patientName && <p className="text-xs text-gray-500">{patientName}</p>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* LOADING */}
              {viewMode === 'loading' && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              )}

              {/* VIEW PAID */}
              {viewMode === 'view-paid' && existingBilling && (
                <div className="p-4 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-800">Fully Paid</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <ReceiptButton
                      onPrint={async () => { const d = await buildReceiptData(existingBilling.id, existingBilling); if (d) printReceipt(d); }}
                      onDownload={async () => { const d = await buildReceiptData(existingBilling.id, existingBilling); if (d) await downloadReceiptPDF(d); }}
                      loading={loadingReceipt}
                    />
                  </div>
                  <div className="bg-gray-50 rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Billing Type</span>
                      <span className="text-sm font-medium text-gray-900">{getBillingTypeLabel(existingBilling.billing_type)}</span>
                    </div>
                    {existingBilling.services && existingBilling.services.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Services</span>
                        {existingBilling.services.map((s, i) => (
                          <div key={i} className="flex justify-between text-sm mt-1">
                            <span className="text-gray-700">{s.name} x{s.quantity}</span>
                            <span className="font-medium">{formatCurrency(s.price * s.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {existingBilling.discount_amount && existingBilling.discount_amount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs text-gray-500">
                          Discount {existingBilling.discount_reason ? `(${existingBilling.discount_reason})` : ''}
                        </span>
                        <span className="text-red-600">-{formatCurrency(existingBilling.discount_amount)}</span>
                      </div>
                    )}
                    {existingBilling.charge_amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(existingBilling.charge_amount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Paid</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(existingBilling.amount_paid)}</span>
                    </div>
                    {existingBilling.corporate_company && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Company</span>
                        <span className="text-sm font-medium text-purple-600">{existingBilling.corporate_company}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Billed On</span>
                      <span className="text-xs text-gray-600">{formatDate(existingBilling.created_at)}</span>
                    </div>
                  </div>
                  {patientBalance && (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Patient Account</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Outstanding</p>
                          <p className={`text-sm font-semibold ${patientBalance.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(patientBalance.outstanding)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Advance</p>
                          <p className={`text-sm font-semibold ${patientBalance.advance > 0 ? 'text-green-600' : 'text-gray-400'}`}>{formatCurrency(patientBalance.advance)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Sessions</p>
                          <p className="text-sm font-semibold text-purple-600">{patientBalance.sessions_available}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW CORPORATE */}
              {viewMode === 'view-corporate' && existingBilling && (
                <div className="p-4 space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded p-4 text-center">
                    <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-purple-800">Corporate Billed</p>
                    <p className="text-xs text-purple-600 mt-0.5">Billed to {existingBilling.corporate_company || 'company'}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4 space-y-3">
                    {existingBilling.charge_amount != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Charge Amount</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(existingBilling.charge_amount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Amount Due</span>
                      <span className="text-sm font-semibold text-purple-600">{formatCurrency(existingBilling.amount_owed)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        existingBilling.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {existingBilling.status === 'PAID' ? 'Settled' : 'Pending from company'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Billed On</span>
                      <span className="text-xs text-gray-600">{formatDate(existingBilling.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Corporate billings are settled by the company, not the patient.
                  </p>
                </div>
              )}

              {/* VIEW SESSION PACK */}
              {viewMode === 'view-session-pack' && existingBilling && (
                <div className="p-4 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-800">Paid via Session Pack</p>
                    <p className="text-xs text-green-600 mt-0.5">1 session deducted</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Billing Type</span>
                      <span className="text-sm font-medium text-gray-900">Session Pack</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Billed On</span>
                      <span className="text-xs text-gray-600">{formatDate(existingBilling.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW COMPLIMENTARY */}
              {viewMode === 'view-complimentary' && existingBilling && (
                <div className="p-4 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-800">Complimentary Visit</p>
                    {existingBilling.complimentary_reason && (
                      <p className="text-xs text-green-600 mt-0.5">{existingBilling.complimentary_reason}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Billing Type</span>
                      <span className="text-sm font-medium text-gray-900">Complimentary</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Billed On</span>
                      <span className="text-xs text-gray-600">{formatDate(existingBilling.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ADD PAYMENT */}
              {viewMode === 'add-payment' && existingBilling && (
                <div className="p-4 space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Payment Due</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-[10px] text-orange-600 uppercase">Total Charge</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(existingBilling.charge_amount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-orange-600 uppercase">Amount Due</p>
                        <p className="text-lg font-bold text-orange-700">{formatCurrency(existingBilling.amount_owed)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Amount <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="number" value={addPaymentAmount} onChange={(e) => setAddPaymentAmount(e.target.value)} placeholder="Enter amount"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-medium" />
                      </div>
                      <button type="button" onClick={() => setAddPaymentAmount(existingBilling.amount_owed.toString())}
                        className="mt-1.5 text-xs text-brand-teal hover:underline">
                        Pay full amount ({formatCurrency(existingBilling.amount_owed)})
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {enabledMethods.slice(0, 3).map((method) => {
                          const Icon = paymentMethodIcons[method] || IndianRupee;
                          return (
                            <button key={method} type="button" onClick={() => setAddPaymentMethod(method)}
                              className={`py-2 px-2 rounded border flex flex-col items-center transition-all ${
                                addPaymentMethod === method ? 'border-brand-teal bg-brand-teal/5' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                              <Icon className={`h-4 w-4 ${addPaymentMethod === method ? 'text-brand-teal' : 'text-gray-400'}`} />
                              <span className={`text-[10px] mt-0.5 ${addPaymentMethod === method ? 'text-brand-teal font-medium' : 'text-gray-500'}`}>{method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {addPaymentMethod !== 'CASH' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Transaction ID{(addPaymentMethod === 'UPI' || addPaymentMethod === 'CARD') && <span className="text-red-500"> *</span>}
                        </label>
                        <input type="text" value={addPaymentRef} onChange={(e) => setAddPaymentRef(e.target.value)} placeholder="Transaction ID"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal" />
                      </div>
                    )}
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" /><p className="text-xs">{error}</p>
                    </div>
                  )}
                  <button onClick={handleAddPayment} disabled={submitting || !addPaymentAmount}
                    className="w-full py-2.5 px-4 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Recording...</> : <><IndianRupee className="h-4 w-4" />Record Payment</>}
                  </button>
                </div>
              )}

              {/* CREATE BILLING */}
              {viewMode === 'create-billing' && (
                <div className="p-4 space-y-4">
                  {/* Patient Balance */}
                  {patientBalance && (
                    <div className="bg-gray-50 rounded p-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Outstanding</p>
                          <p className={`text-sm font-semibold ${patientBalance.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(patientBalance.outstanding)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Advance</p>
                          <p className={`text-sm font-semibold ${patientBalance.advance > 0 ? 'text-green-600' : 'text-gray-400'}`}>{formatCurrency(patientBalance.advance)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Sessions</p>
                          <p className="text-sm font-semibold text-purple-600">{patientBalance.sessions_available}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCENARIO A: Session Pack Deduction */}
                  {hasPacks && !showAlternateOptions && (
                    <div className="space-y-4">
                      {availablePacks.length > 1 ? (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">Select Pack</label>
                          {availablePacks.map((pack) => (
                            <button key={pack.id} type="button" onClick={() => setSelectedPackId(pack.id)}
                              className={`w-full p-3 rounded border text-left transition-all ${
                                selectedPackId === pack.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                              }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{pack.name}</p>
                                  {pack.condition && <p className="text-xs text-gray-500">{pack.condition.condition_name}</p>}
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
                                {primaryPack.condition && <p className="text-xs text-gray-500">{primaryPack.condition.condition_name}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-purple-600">{primaryPack.sessions_remaining}</p>
                              <p className="text-[10px] text-gray-500">sessions left</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <button onClick={handleDeductSession} disabled={submitting}
                        className="w-full py-2.5 px-4 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><CheckCircle className="h-4 w-4" />Deduct 1 Session</>}
                      </button>
                      <button type="button" onClick={() => setShowAlternateOptions(true)} className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1">
                        Charge amount instead or mark as free
                      </button>
                    </div>
                  )}

                  {/* SCENARIO B: Charge / Catalog / Free / Corporate */}
                  {(!hasPacks || showAlternateOptions) && (
                    <div className="space-y-4">
                      {hasPacks && showAlternateOptions && (
                        <button type="button" onClick={() => { setShowAlternateOptions(false); setIsFreeVisit(false); }}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium">
                          <ChevronUp className="h-3 w-3" /> Back to use session pack
                        </button>
                      )}

                      {/* Free Visit Toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium text-gray-700">Free (Complimentary)</span>
                        </div>
                        <button type="button" onClick={() => setIsFreeVisit(!isFreeVisit)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${isFreeVisit ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isFreeVisit ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>

                      {isFreeVisit ? (
                        <div className="space-y-3">
                          <input type="text" value={freeReason} onChange={(e) => setFreeReason(e.target.value)}
                            placeholder="Reason (e.g., Follow-up check, Trial)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500" />
                          <button onClick={handleFreeVisit} disabled={submitting || !freeReason.trim()}
                            className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Gift className="h-4 w-4" />Mark as Free</>}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Service Catalog Selection */}
                          {clinicServices.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-gray-600">Services (from catalog)</label>
                                <button type="button" onClick={() => setShowServicePicker(!showServicePicker)}
                                  className="text-xs text-brand-teal hover:underline flex items-center gap-1">
                                  <List className="h-3 w-3" /> Add Service
                                </button>
                              </div>

                              {/* Service Picker Dropdown */}
                              {showServicePicker && (
                                <div className="border border-gray-200 rounded-lg mb-2 max-h-48 overflow-y-auto">
                                  {clinicServices.map(service => (
                                    <button key={service.id} type="button" onClick={() => addServiceLine(service)}
                                      className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left">
                                      <div>
                                        <p className="text-sm text-gray-900">{service.name}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          service.service_type === 'consultation' ? 'bg-blue-50 text-blue-600' :
                                          service.service_type === 'session' ? 'bg-green-50 text-green-600' :
                                          'bg-orange-50 text-orange-600'
                                        }`}>{service.service_type}</span>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">{formatCurrency(service.price)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Selected Service Lines */}
                              {selectedServices.length > 0 && (
                                <div className="space-y-2">
                                  {selectedServices.map((service, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-900">{service.name}</p>
                                      </div>
                                      <div className="relative w-20">
                                        <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                        <input type="number" value={service.price}
                                          onChange={(e) => updateServiceLinePrice(index, Number(e.target.value))}
                                          className="w-full pl-6 pr-1 py-1 text-sm border border-gray-200 rounded text-right" />
                                      </div>
                                      <button type="button" onClick={() => removeServiceLine(index)}
                                        className="p-1 text-gray-400 hover:text-red-500">
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-sm pt-1">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(servicesSubtotal)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Manual Amount (always available) */}
                          {selectedServices.length === 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                {clinicServices.length > 0 ? 'Or enter amount manually' : 'Consultation Fee'}
                              </label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type="number" value={chargeAmount}
                                  onChange={(e) => { setChargeAmount(e.target.value); if (paymentOption === 'partial') setPartialAmount(''); }}
                                  placeholder="500"
                                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-medium" />
                              </div>
                            </div>
                          )}

                          {/* Discount Section */}
                          {subtotal > 0 && (
                            <div>
                              <button type="button" onClick={() => setShowDiscount(!showDiscount)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                                <Tag className="h-3.5 w-3.5" />
                                {showDiscount ? 'Hide discount' : 'Add discount'}
                                {showDiscount ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>

                              {showDiscount && (
                                <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
                                  <div className="flex gap-2">
                                    <button type="button" onClick={() => setDiscountType('amount')}
                                      className={`flex-1 py-1.5 text-xs rounded border ${discountType === 'amount' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-gray-200 text-gray-500'}`}>
                                      <IndianRupee className="h-3 w-3 inline mr-1" />Amount
                                    </button>
                                    <button type="button" onClick={() => setDiscountType('percent')}
                                      className={`flex-1 py-1.5 text-xs rounded border ${discountType === 'percent' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-gray-200 text-gray-500'}`}>
                                      <Percent className="h-3 w-3 inline mr-1" />Percent
                                    </button>
                                  </div>
                                  <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                                    placeholder={discountType === 'amount' ? 'Discount amount' : 'Discount %'}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded" />
                                  {billingSettings?.discount_reasons && billingSettings.discount_reasons.length > 0 ? (
                                    <select value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}
                                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded">
                                      <option value="">Select reason (optional)</option>
                                      {billingSettings.discount_reasons.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input type="text" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}
                                      placeholder="Reason (optional)" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded" />
                                  )}
                                  {discountAmount > 0 && (
                                    <p className="text-xs text-green-600">
                                      Discount: -{formatCurrency(discountAmount)} | Total: {formatCurrency(totalAfterDiscount)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Payment Options */}
                          {totalAfterDiscount > 0 && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Payment</label>
                                <div className="space-y-2">
                                  {/* Full Payment */}
                                  <button type="button" onClick={() => setPaymentOption('full')}
                                    className={`w-full p-3 rounded border text-left transition-all ${paymentOption === 'full' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === 'full' ? 'border-green-500' : 'border-gray-300'}`}>
                                          {paymentOption === 'full' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                        </div>
                                        <span className={`text-sm ${paymentOption === 'full' ? 'font-medium text-green-700' : 'text-gray-600'}`}>Full Payment</span>
                                      </div>
                                      <span className={`text-sm font-semibold ${paymentOption === 'full' ? 'text-green-700' : 'text-gray-500'}`}>{formatCurrency(totalAfterDiscount)}</span>
                                    </div>
                                  </button>

                                  {/* Partial Payment */}
                                  <button type="button" onClick={() => setPaymentOption('partial')}
                                    className={`w-full p-3 rounded border text-left transition-all ${paymentOption === 'partial' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === 'partial' ? 'border-blue-500' : 'border-gray-300'}`}>
                                        {paymentOption === 'partial' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                      </div>
                                      <span className={`text-sm ${paymentOption === 'partial' ? 'font-medium text-blue-700' : 'text-gray-600'}`}>Partial Payment</span>
                                    </div>
                                  </button>
                                  {paymentOption === 'partial' && (
                                    <div className="ml-6 mt-2">
                                      <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="number" value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)}
                                          placeholder="Enter amount paying now" max={totalAfterDiscount}
                                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                                      </div>
                                      {partialAmount && parseFloat(partialAmount) > 0 && parseFloat(partialAmount) < totalAfterDiscount && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          ₹{(totalAfterDiscount - parseFloat(partialAmount)).toLocaleString('en-IN')} will be added to udhaari
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Full Udhaari */}
                                  <button type="button" onClick={() => setPaymentOption('none')}
                                    className={`w-full p-3 rounded border text-left transition-all ${paymentOption === 'none' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === 'none' ? 'border-orange-500' : 'border-gray-300'}`}>
                                          {paymentOption === 'none' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                        </div>
                                        <span className={`text-sm ${paymentOption === 'none' ? 'font-medium text-orange-700' : 'text-gray-600'}`}>Full Udhaari</span>
                                      </div>
                                      <span className={`text-xs ${paymentOption === 'none' ? 'text-orange-600' : 'text-gray-400'}`}>Pay later</span>
                                    </div>
                                  </button>

                                  {/* Corporate Billing */}
                                  {billingSettings?.corporate_companies && billingSettings.corporate_companies.length > 0 && (
                                    <button type="button" onClick={() => setPaymentOption('corporate')}
                                      className={`w-full p-3 rounded border text-left transition-all ${paymentOption === 'corporate' ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === 'corporate' ? 'border-purple-500' : 'border-gray-300'}`}>
                                            {paymentOption === 'corporate' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                          </div>
                                          <span className={`text-sm ${paymentOption === 'corporate' ? 'font-medium text-purple-700' : 'text-gray-600'}`}>
                                            <Building className="h-3.5 w-3.5 inline mr-1" />Bill to Company
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  )}
                                  {paymentOption === 'corporate' && (
                                    <div className="ml-6 mt-2">
                                      <select value={corporateCompany} onChange={(e) => setCorporateCompany(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500">
                                        <option value="">Select company</option>
                                        {billingSettings?.corporate_companies?.map(c => (
                                          <option key={c} value={c}>{c}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Payment Method */}
                              {(paymentOption === 'full' || (paymentOption === 'partial' && partialAmount && parseFloat(partialAmount) > 0)) && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {enabledMethods.slice(0, 6).map((method) => {
                                      const Icon = paymentMethodIcons[method] || IndianRupee;
                                      return (
                                        <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                                          className={`py-2 px-2 rounded border flex flex-col items-center transition-all ${
                                            paymentMethod === method ? 'border-brand-teal bg-brand-teal/5' : 'border-gray-200 hover:border-gray-300'
                                          }`}>
                                          <Icon className={`h-4 w-4 ${paymentMethod === method ? 'text-brand-teal' : 'text-gray-400'}`} />
                                          <span className={`text-[10px] mt-0.5 ${paymentMethod === method ? 'text-brand-teal font-medium' : 'text-gray-500'}`}>{method}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Transaction ID (for non-CASH) */}
                              {paymentOption !== 'none' && paymentOption !== 'corporate' && paymentMethod !== 'CASH' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Transaction ID{(paymentMethod === 'UPI' || paymentMethod === 'CARD') && <span className="text-red-500"> *</span>}
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    placeholder={paymentMethod === 'UPI' ? 'UPI Transaction ID' : paymentMethod === 'CARD' ? 'Card Transaction ID' : 'Reference Number'}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-brand-teal/20 focus:border-brand-teal font-mono"
                                  />
                                </div>
                              )}

                              {/* Summary */}
                              <div className="bg-gray-50 rounded p-3 space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase">Summary</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">
                                    {selectedServices.length > 0 ? `${selectedServices.length} service(s)` : 'Consultation Fee'}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600">
                                      Discount {discountReason ? `(${discountReason})` : ''}
                                    </span>
                                    <span className="text-sm font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Paying Now</span>
                                  <span className={`text-sm font-semibold ${paymentOption === 'none' || paymentOption === 'corporate' ? 'text-gray-400' : 'text-green-600'}`}>
                                    {paymentOption === 'full' ? formatCurrency(totalAfterDiscount) :
                                     paymentOption === 'partial' && partialAmount ? formatCurrency(parseFloat(partialAmount)) : '₹0'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                  <span className="text-xs font-medium text-gray-700">
                                    {paymentOption === 'corporate' ? 'Billed to Company' : 'Udhaari'}
                                  </span>
                                  <span className={`text-sm font-bold ${
                                    paymentOption === 'full' ? 'text-gray-400' :
                                    paymentOption === 'corporate' ? 'text-purple-600' : 'text-orange-600'
                                  }`}>
                                    {paymentOption === 'full' ? '₹0' :
                                     paymentOption === 'corporate' ? formatCurrency(totalAfterDiscount) :
                                     paymentOption === 'partial' && partialAmount ? formatCurrency(totalAfterDiscount - parseFloat(partialAmount)) :
                                     formatCurrency(totalAfterDiscount)}
                                  </span>
                                </div>
                              </div>

                              {/* Submit */}
                              <button onClick={handleChargeVisit}
                                disabled={submitting || (paymentOption === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0)) || (paymentOption === 'corporate' && !corporateCompany)}
                                className={`w-full py-2.5 px-4 text-white text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 ${
                                  paymentOption === 'none' ? 'bg-orange-600 hover:bg-orange-700' :
                                  paymentOption === 'corporate' ? 'bg-purple-600 hover:bg-purple-700' :
                                  'bg-green-600 hover:bg-green-700'
                                }`}>
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> :
                                 paymentOption === 'none' ? <><Clock className="h-4 w-4" />Add to Udhaari</> :
                                 paymentOption === 'corporate' ? <><Building className="h-4 w-4" />Bill to {corporateCompany || 'Company'}</> :
                                 <><IndianRupee className="h-4 w-4" />{paymentOption === 'partial' ? 'Record Partial Payment' : 'Record Payment'}</>}
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
                      <AlertCircle className="h-4 w-4 flex-shrink-0" /><p className="text-xs">{error}</p>
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

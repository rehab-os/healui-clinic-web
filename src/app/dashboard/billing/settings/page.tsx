'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import ApiManager from '../../../../services/api';
import {
  Settings,
  IndianRupee,
  Loader2,
  Save,
  Plus,
  X,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import type {
  ClinicBillingSettingsDto,
  UpdateClinicBillingSettingsDto,
  PaymentMethod
} from '../../../../lib/types';

const ALL_PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building },
  { value: 'CHEQUE', label: 'Cheque', icon: FileText },
  { value: 'OTHER', label: 'Other', icon: IndianRupee },
];

export default function BillingSettingsPage() {
  const { currentClinic } = useAppSelector(state => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Settings state
  const [enabledMethods, setEnabledMethods] = useState<PaymentMethod[]>(['CASH', 'UPI']);
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [receiptPrefix, setReceiptPrefix] = useState('');
  const [discountReasons, setDiscountReasons] = useState<string[]>([]);
  const [referralSources, setReferralSources] = useState<string[]>([]);
  const [corporateCompanies, setCorporateCompanies] = useState<string[]>([]);
  const [autoBill, setAutoBill] = useState(true);

  // Input for adding new items
  const [newDiscount, setNewDiscount] = useState('');
  const [newReferral, setNewReferral] = useState('');
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => {
    if (currentClinic?.id) fetchSettings();
  }, [currentClinic]);

  const fetchSettings = async () => {
    if (!currentClinic?.id) return;
    try {
      setLoading(true);
      const res = await ApiManager.getBillingSettings(currentClinic.id);
      if (res.success && res.data) {
        const s = res.data as ClinicBillingSettingsDto;
        setEnabledMethods(s.enabled_payment_methods || ['CASH', 'UPI']);
        setGstRegistered(s.gst_registered);
        setGstin(s.gstin || '');
        setGstRate(s.gst_rate);
        setReceiptPrefix(s.receipt_prefix || '');
        setDiscountReasons(s.discount_reasons || []);
        setReferralSources(s.referral_sources || []);
        setCorporateCompanies(s.corporate_companies || []);
        setAutoBill(s.auto_bill_on_visit_complete);
      }
    } catch (err) {
      console.error('Failed to fetch billing settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentClinic?.id) return;
    try {
      setSaving(true);
      setError('');
      const data: UpdateClinicBillingSettingsDto = {
        enabled_payment_methods: enabledMethods,
        gst_registered: gstRegistered,
        gstin: gstRegistered ? gstin : undefined,
        gst_rate: gstRate,
        receipt_prefix: receiptPrefix || undefined,
        discount_reasons: discountReasons,
        referral_sources: referralSources,
        corporate_companies: corporateCompanies,
        auto_bill_on_visit_complete: autoBill,
      };
      const res = await ApiManager.updateBillingSettings(currentClinic.id, data);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error?.message || 'Failed to save settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (method: PaymentMethod) => {
    setEnabledMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setValue('');
  };

  const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure payment methods, GST, discounts & more</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Payment Methods</h2>
        <p className="text-sm text-gray-500 mb-4">Select which payment methods your clinic accepts</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
            const enabled = enabledMethods.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleMethod(value)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  enabled
                    ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{label}</span>
                {enabled && <CheckCircle className="h-4 w-4 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* GST Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">GST Configuration</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={gstRegistered}
              onChange={(e) => setGstRegistered(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
            />
            <div>
              <span className="font-medium text-gray-900">GST Registered</span>
              <p className="text-sm text-gray-500">Enable GST on receipts and invoices</p>
            </div>
          </label>

          {gstRegistered && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                <input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  min={0}
                  max={28}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Receipt Settings</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Prefix</label>
          <input
            type="text"
            value={receiptPrefix}
            onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
            placeholder="RCP"
            maxLength={10}
            className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
          />
          <p className="text-xs text-gray-500 mt-1">Custom prefix for receipt numbers (e.g., RCP-ABCD-20260206-001)</p>
        </div>
      </div>

      {/* Auto-Bill */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoBill}
            onChange={(e) => setAutoBill(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
          />
          <div>
            <span className="font-medium text-gray-900">Auto-Bill on Visit Complete</span>
            <p className="text-sm text-gray-500">Automatically open billing modal when a visit is marked complete</p>
          </div>
        </label>
      </div>

      {/* Discount Reasons */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Discount Reasons</h2>
        <p className="text-sm text-gray-500 mb-3">Pre-defined reasons for discounts (shown in billing modal)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {discountReasons.map((reason, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
              {reason}
              <button onClick={() => removeItem(discountReasons, setDiscountReasons, i)} className="text-gray-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDiscount}
            onChange={(e) => setNewDiscount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem(discountReasons, setDiscountReasons, newDiscount, setNewDiscount)}
            placeholder="e.g., Senior Citizen, Staff Family"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
          />
          <button
            onClick={() => addItem(discountReasons, setDiscountReasons, newDiscount, setNewDiscount)}
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Referral Sources */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Referral Sources</h2>
        <p className="text-sm text-gray-500 mb-3">Track how patients find your clinic</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {referralSources.map((source, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700">
              {source}
              <button onClick={() => removeItem(referralSources, setReferralSources, i)} className="text-blue-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newReferral}
            onChange={(e) => setNewReferral(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem(referralSources, setReferralSources, newReferral, setNewReferral)}
            placeholder="e.g., Google, Doctor Referral, Walk-in"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
          />
          <button
            onClick={() => addItem(referralSources, setReferralSources, newReferral, setNewReferral)}
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Corporate Companies */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Corporate Companies</h2>
        <p className="text-sm text-gray-500 mb-3">Companies for corporate billing (bill-to-company)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {corporateCompanies.map((company, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 rounded-full text-sm text-purple-700">
              <Building className="h-3.5 w-3.5" />
              {company}
              <button onClick={() => removeItem(corporateCompanies, setCorporateCompanies, i)} className="text-purple-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem(corporateCompanies, setCorporateCompanies, newCompany, setNewCompany)}
            placeholder="e.g., Infosys, TCS, Wipro"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
          />
          <button
            onClick={() => addItem(corporateCompanies, setCorporateCompanies, newCompany, setNewCompany)}
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

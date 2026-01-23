'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import BillVisitModal from '../../../components/molecule/BillVisitModal';
import RecordPaymentModal from '../../../components/molecule/RecordPaymentModal';
import CreateSessionPackModal from '../../../components/molecule/CreateSessionPackModal';
import {
  IndianRupee,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Loader2,
  Receipt,
  FileText
} from 'lucide-react';
import type {
  DailySummaryDto,
  OutstandingPatientDto,
  PaymentDto,
  SessionPackDto
} from '../../../lib/types';

export default function BillingPage() {
  const { currentClinic } = useAppSelector(state => state.user);

  // Data states
  const [dailySummary, setDailySummary] = useState<DailySummaryDto | null>(null);
  const [outstandingPatients, setOutstandingPatients] = useState<OutstandingPatientDto[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [recentPayments, setRecentPayments] = useState<PaymentDto[]>([]);
  const [activePacks, setActivePacks] = useState<SessionPackDto[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal states
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showCreatePackModal, setShowCreatePackModal] = useState(false);
  const [showBillVisitModal, setShowBillVisitModal] = useState(false);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (currentClinic?.id) {
      fetchBillingData();
    }
  }, [currentClinic, selectedDate]);

  const fetchBillingData = async () => {
    if (!currentClinic?.id) return;

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [summaryRes, outstandingRes, packsRes] = await Promise.all([
        ApiManager.getDailySummary(currentClinic.id, selectedDate),
        ApiManager.getOutstandingReport({ clinic_id: currentClinic.id, limit: 10 }),
        ApiManager.getSessionPacks({ clinic_id: currentClinic.id, status: 'ACTIVE', has_remaining: true, limit: 5 })
      ]);

      if (summaryRes.success && summaryRes.data) {
        setDailySummary(summaryRes.data);
      }

      if (outstandingRes.success && outstandingRes.data) {
        setOutstandingPatients(outstandingRes.data.patients || []);
        setTotalOutstanding(outstandingRes.data.total_outstanding || 0);
      }

      if (packsRes.success && packsRes.data) {
        setActivePacks(packsRes.data.packs || []);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBillingData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRecordPaymentForPatient = (patientId: string, patientName: string) => {
    setSelectedPatientForPayment({ id: patientId, name: patientName });
    setShowRecordPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-teal mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Track payments, session packs & outstanding</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
          />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setShowRecordPaymentModal(true)}
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
        >
          <div className="p-2 bg-green-500 rounded-lg">
            <IndianRupee className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-green-900">Record Payment</p>
            <p className="text-xs text-green-600">Add new payment</p>
          </div>
        </button>

        <button
          onClick={() => setShowCreatePackModal(true)}
          className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <div className="p-2 bg-purple-500 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-purple-900">Session Pack</p>
            <p className="text-xs text-purple-600">Create new pack</p>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/dashboard/billing/invoices'}
          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <div className="p-2 bg-blue-500 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-blue-900">Invoices</p>
            <p className="text-xs text-blue-600">View all invoices</p>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/dashboard/billing/reports'}
          className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
        >
          <div className="p-2 bg-orange-500 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-orange-900">Reports</p>
            <p className="text-xs text-orange-600">View analytics</p>
          </div>
        </button>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Today's Collection</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(dailySummary?.total_collections || 0)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              {formatCurrency(dailySummary?.cash_collections || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              {formatCurrency(dailySummary?.upi_collections || 0)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Visits Billed</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {dailySummary?.visits_billed || 0}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {dailySummary?.sessions_from_packs || 0} from session packs
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Session Packs Sold</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {dailySummary?.session_packs_sold || 0}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {formatCurrency(dailySummary?.session_packs_revenue || 0)} revenue
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {outstandingPatients.length} patients with dues
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Outstanding (Udhaari) Section */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-gray-900">Outstanding (Udhaari)</h2>
            </div>
            <button className="text-sm text-brand-teal hover:underline">View All</button>
          </div>

          <div className="divide-y divide-gray-100">
            {outstandingPatients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <IndianRupee className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No outstanding dues</p>
              </div>
            ) : (
              outstandingPatients.slice(0, 5).map((patient) => (
                <div key={patient.patient_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{patient.patient_name}</p>
                      <p className="text-xs text-gray-500">{patient.patient_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {formatCurrency(patient.outstanding_amount)}
                      </p>
                      {patient.days_since_last_visit > 0 && (
                        <p className="text-xs text-gray-500">
                          {patient.days_since_last_visit} days ago
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleRecordPaymentForPatient(patient.patient_id, patient.patient_name)}
                      className="flex-1 py-1.5 px-3 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Record Payment
                    </button>
                    <button className="py-1.5 px-3 text-xs text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      Send Reminder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Session Packs */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <h2 className="font-semibold text-gray-900">Active Session Packs</h2>
            </div>
            <button
              onClick={() => setShowCreatePackModal(true)}
              className="text-sm text-brand-teal hover:underline flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              New Pack
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {activePacks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No active session packs</p>
                <button
                  onClick={() => setShowCreatePackModal(true)}
                  className="mt-2 text-sm text-brand-teal hover:underline"
                >
                  Create first pack
                </button>
              </div>
            ) : (
              activePacks.map((pack) => (
                <div key={pack.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{pack.patient?.full_name}</p>
                      <p className="text-xs text-gray-500">{pack.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-purple-600">
                          {pack.sessions_remaining}
                        </span>
                        <span className="text-xs text-gray-500">
                          / {pack.total_sessions}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">sessions left</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(pack.sessions_remaining / pack.total_sessions) * 100}%` }}
                    />
                  </div>

                  {pack.payment_status !== 'PAID' && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        pack.payment_status === 'PARTIAL'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {pack.payment_status === 'PARTIAL' ? 'Partial Payment' : 'Unpaid'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(pack.amount - pack.amount_paid)} due
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {dailySummary && dailySummary.total_collections > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Collection by Payment Method</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Cash', amount: dailySummary.cash_collections, icon: Banknote, color: 'green' },
              { label: 'UPI', amount: dailySummary.upi_collections, icon: Smartphone, color: 'blue' },
              { label: 'Card', amount: dailySummary.card_collections, icon: CreditCard, color: 'purple' },
              { label: 'Other', amount: dailySummary.other_collections, icon: Receipt, color: 'gray' },
            ].map((method) => (
              <div key={method.label} className={`p-3 bg-${method.color}-50 rounded-lg`}>
                <div className="flex items-center gap-2 mb-1">
                  <method.icon className={`h-4 w-4 text-${method.color}-600`} />
                  <span className="text-sm text-gray-600">{method.label}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(method.amount || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showRecordPaymentModal && (
        <RecordPaymentModal
          clinicId={currentClinic?.id || ''}
          preSelectedPatient={selectedPatientForPayment}
          onClose={() => {
            setShowRecordPaymentModal(false);
            setSelectedPatientForPayment(null);
          }}
          onSuccess={() => {
            setShowRecordPaymentModal(false);
            setSelectedPatientForPayment(null);
            fetchBillingData();
          }}
        />
      )}

      {showCreatePackModal && (
        <CreateSessionPackModal
          clinicId={currentClinic?.id || ''}
          onClose={() => setShowCreatePackModal(false)}
          onSuccess={() => {
            setShowCreatePackModal(false);
            fetchBillingData();
          }}
        />
      )}

      {showBillVisitModal && (
        <BillVisitModal
          visitId=""
          clinicId={currentClinic?.id || ''}
          onClose={() => setShowBillVisitModal(false)}
          onSuccess={() => {
            setShowBillVisitModal(false);
            fetchBillingData();
          }}
        />
      )}
    </div>
  );
}

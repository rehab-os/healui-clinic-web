'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import ApiManager from '../../../../services/api';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  X,
  AlertCircle,
  IndianRupee,
  Package,
  Star,
  Calendar
} from 'lucide-react';
import type {
  SessionPackTemplateDto,
  CreateSessionPackTemplateDto,
  UpdateSessionPackTemplateDto,
  ClinicServiceDto
} from '../../../../lib/types';

export default function PackTemplatesPage() {
  const { currentClinic } = useAppSelector(state => state.user);
  const [templates, setTemplates] = useState<SessionPackTemplateDto[]>([]);
  const [services, setServices] = useState<ClinicServiceDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionPackTemplateDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [totalSessions, setTotalSessions] = useState('');
  const [amount, setAmount] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [isPopular, setIsPopular] = useState(false);

  useEffect(() => {
    if (currentClinic?.id) {
      fetchData();
    }
  }, [currentClinic]);

  const fetchData = async () => {
    if (!currentClinic?.id) return;
    try {
      setLoading(true);
      const [templatesRes, servicesRes] = await Promise.all([
        ApiManager.getPackTemplates(currentClinic.id, true),
        ApiManager.getClinicServices(currentClinic.id),
      ]);
      if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data);
      if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    setName('');
    setServiceId('');
    setTotalSessions('');
    setAmount('');
    setValidityDays('');
    setIsPopular(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (template: SessionPackTemplateDto) => {
    setEditingTemplate(template);
    setName(template.name);
    setServiceId(template.service_id || '');
    setTotalSessions(template.total_sessions.toString());
    setAmount(template.amount.toString());
    setValidityDays(template.validity_days?.toString() || '');
    setIsPopular(template.is_popular);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentClinic?.id || !name.trim() || !totalSessions || !amount) {
      setError('Name, sessions, and amount are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingTemplate) {
        const data: UpdateSessionPackTemplateDto = {
          name: name.trim(),
          service_id: serviceId || undefined,
          total_sessions: Number(totalSessions),
          amount: Number(amount),
          validity_days: validityDays ? Number(validityDays) : undefined,
          is_popular: isPopular,
        };
        const res = await ApiManager.updatePackTemplate(currentClinic.id, editingTemplate.id, data);
        if (!res.success) {
          setError(res.message || 'Failed to update');
          return;
        }
      } else {
        const data: CreateSessionPackTemplateDto = {
          name: name.trim(),
          service_id: serviceId || undefined,
          total_sessions: Number(totalSessions),
          amount: Number(amount),
          validity_days: validityDays ? Number(validityDays) : undefined,
          is_popular: isPopular,
        };
        const res = await ApiManager.createPackTemplate(currentClinic.id, data);
        if (!res.success) {
          setError(res.message || 'Failed to create');
          return;
        }
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template: SessionPackTemplateDto) => {
    if (!currentClinic?.id) return;
    if (!confirm(`Deactivate "${template.name}"?`)) return;
    try {
      await ApiManager.deletePackTemplate(currentClinic.id, template.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const perSessionRate = totalSessions && amount
    ? (Number(amount) / Number(totalSessions)).toFixed(0)
    : null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
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
            <h1 className="text-2xl font-bold text-gray-900">Pack Templates</h1>
            <p className="text-sm text-gray-500 mt-1">Pre-configured session packs for quick creation</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Template
        </button>
      </div>

      {/* Template Cards */}
      {templates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No templates yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create pack templates for one-tap session pack creation</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm hover:bg-brand-teal/90"
          >
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className={`bg-white border rounded-xl p-5 relative transition-all hover:shadow-md ${
                template.is_popular ? 'border-purple-300 ring-1 ring-purple-200' : 'border-gray-200'
              } ${!template.is_active ? 'opacity-50' : ''}`}
            >
              {template.is_popular && (
                <div className="absolute -top-2 right-3 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Popular
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.service && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Linked to: {template.service.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(template)} className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {template.is_active && (
                    <button onClick={() => handleDelete(template)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{template.total_sessions}</p>
                  <p className="text-[10px] text-gray-500">Sessions</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(template.amount)}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(template.per_session_rate)}</p>
                  <p className="text-[10px] text-gray-500">Per Session</p>
                </div>
              </div>

              {template.validity_days && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Valid for {template.validity_days} days
                </div>
              )}

              {!template.is_active && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 mt-2">
                  Inactive
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Add Pack Template'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., 10 Session Pack"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>

              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link to Service (optional)</label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                  >
                    <option value="">No linked service</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions</label>
                  <input
                    type="number"
                    value={totalSessions}
                    onChange={(e) => setTotalSessions(e.target.value)}
                    placeholder="10"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pack Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                    />
                  </div>
                </div>
              </div>

              {perSessionRate && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center justify-between">
                  <span>Per session rate:</span>
                  <span className="font-bold">{formatCurrency(Number(perSessionRate))}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validity (days, optional)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="e.g., 90"
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-700">Mark as Popular</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !name.trim() || !totalSessions || !amount}
                className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTemplate ? 'Update' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

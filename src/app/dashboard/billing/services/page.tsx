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
  GripVertical,
  X,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Home
} from 'lucide-react';
import type {
  ClinicServiceDto,
  CreateClinicServiceDto,
  UpdateClinicServiceDto,
  ServiceType
} from '../../../../lib/types';

const SERVICE_TYPE_LABELS: Record<ServiceType, { label: string; color: string }> = {
  consultation: { label: 'Consultation', color: 'bg-blue-100 text-blue-700' },
  session: { label: 'Session', color: 'bg-green-100 text-green-700' },
  addon: { label: 'Add-on', color: 'bg-orange-100 text-orange-700' },
};

export default function ClinicServicesPage() {
  const { currentClinic } = useAppSelector(state => state.user);
  const [services, setServices] = useState<ClinicServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ClinicServiceDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [homeVisitPrice, setHomeVisitPrice] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('session');

  useEffect(() => {
    if (currentClinic?.id) fetchServices();
  }, [currentClinic, showInactive]);

  const fetchServices = async () => {
    if (!currentClinic?.id) return;
    try {
      setLoading(true);
      const res = await ApiManager.getClinicServices(currentClinic.id, showInactive);
      if (res.success && res.data) {
        setServices(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setPrice('');
    setHomeVisitPrice('');
    setServiceType('session');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (service: ClinicServiceDto) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    setHomeVisitPrice(service.home_visit_price?.toString() || '');
    setServiceType(service.service_type);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentClinic?.id || !name.trim() || !price) {
      setError('Name and price are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingService) {
        const data: UpdateClinicServiceDto = {
          name: name.trim(),
          price: Number(price),
          home_visit_price: homeVisitPrice ? Number(homeVisitPrice) : undefined,
          service_type: serviceType,
        };
        const res = await ApiManager.updateClinicService(currentClinic.id, editingService.id, data);
        if (!res.success) {
          setError(res.message || 'Failed to update');
          return;
        }
      } else {
        const data: CreateClinicServiceDto = {
          name: name.trim(),
          price: Number(price),
          home_visit_price: homeVisitPrice ? Number(homeVisitPrice) : undefined,
          service_type: serviceType,
        };
        const res = await ApiManager.createClinicService(currentClinic.id, data);
        if (!res.success) {
          setError(res.message || 'Failed to create');
          return;
        }
      }

      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (service: ClinicServiceDto) => {
    if (!currentClinic?.id) return;
    if (!confirm(`Deactivate "${service.name}"? It will be hidden from billing.`)) return;

    try {
      await ApiManager.deleteClinicService(currentClinic.id, service.id);
      fetchServices();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Charges Table</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your clinic&apos;s service catalog & pricing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
            />
            Show inactive
          </label>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {services.length === 0 ? (
          <div className="p-12 text-center">
            <IndianRupee className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No services yet</h3>
            <p className="text-sm text-gray-500 mb-4">Add your clinic&apos;s services to use catalog-based billing</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm hover:bg-brand-teal/90"
            >
              Add First Service
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-8">#</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Service Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Price</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Home Visit</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service, index) => (
                <tr key={service.id} className={`hover:bg-gray-50 transition-colors ${!service.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{service.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${SERVICE_TYPE_LABELS[service.service_type]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {SERVICE_TYPE_LABELS[service.service_type]?.label || service.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(service.price)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {service.home_visit_price ? (
                      <span className="flex items-center justify-end gap-1">
                        <Home className="h-3.5 w-3.5 text-gray-400" />
                        {formatCurrency(service.home_visit_price)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {service.is_active && (
                        <button
                          onClick={() => handleDelete(service)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Edit Service' : 'Add Service'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Physiotherapy Session"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['consultation', 'session', 'addon'] as ServiceType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setServiceType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        serviceType === type
                          ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {SERVICE_TYPE_LABELS[type].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Visit Price</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={homeVisitPrice}
                      onChange={(e) => setHomeVisitPrice(e.target.value)}
                      placeholder="Optional"
                      min={0}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                    />
                  </div>
                </div>
              </div>
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
                disabled={submitting || !name.trim() || !price}
                className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingService ? 'Update' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

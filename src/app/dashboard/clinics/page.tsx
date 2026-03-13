'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import CreateClinicModal from '../../../components/features/clinics/CreateClinicModal';
import ClinicQRCodeModal from '../../../components/features/clinics/ClinicQRCodeModal';
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Loader2,
  AlertCircle,
  QrCode,
  Bot,
  Link2,
  Copy,
  ExternalLink,
  XCircle
} from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  total_beds?: number;
  is_active: boolean;
  facilities?: string[];
  working_hours?: Record<string, any>;
  created_at: string;
}

export default function ClinicsPage() {
  const { userData } = useAppSelector(state => state.user);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    if (!userData?.organization?.id) return;

    try {
      setLoading(true);
      const response = await ApiManager.getClinics(userData.organization.id);
      if (response.success) {
        setClinics(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClinic = () => {
    setShowCreateModal(true);
  };

  if (!userData?.organization?.is_owner) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only organization administrators can manage clinics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — mobile: title + icons, desktop: full bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        {/* Mobile header */}
        <div className="sm:hidden px-4 py-2.5 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">Clinics</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-gray-100 text-brand-teal' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={handleCreateClinic}
              className="p-2 text-brand-teal hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile: expandable search */}
        {showMobileSearch && (
          <div className="sm:hidden px-4 pb-3 border-t border-gray-100">
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal focus:bg-white"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Desktop header — single row */}
        <div className="hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clinics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal focus:bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleCreateClinic}
                  className="bg-brand-teal text-white inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Clinic
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Clinics Table */}
        {loading ? (
          <div className="bg-white rounded-lg p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal mb-3" />
              <span className="text-sm text-gray-600">Loading clinics...</span>
            </div>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No clinics found' : 'No clinics yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first clinic location'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateClinic}
                className="btn-primary inline-flex items-center px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Clinic
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Clinic count */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        Clinic
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                        Phone
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        City
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredClinics.map((clinic) => (
                      <ClinicRow key={clinic.id} clinic={clinic} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Create Clinic Modal */}
        {showCreateModal && (
          <CreateClinicModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchClinics();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface ClinicRowProps {
  clinic: Clinic;
}

const ClinicRow: React.FC<ClinicRowProps> = ({ clinic }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('[data-menu]')) return;
    router.push(`/dashboard/clinics/${clinic.id}`);
  };

  const copyAgentLink = async () => {
    const link = `${window.location.origin}/clinic-agent/${clinic.code}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          textArea.remove();
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
          textArea.remove();
          alert(`Copy this link:\n${link}`);
        }
      }
    } catch (error) {
      alert(`Copy this link:\n${link}`);
    }
  };

  const previewAgent = () => {
    window.open(`/clinic-agent/${clinic.code}`, '_blank');
  };

  return (
    <>
      <tr
        onClick={handleRowClick}
        className="hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {/* Clinic name + status */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${clinic.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">{clinic.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-medium text-brand-teal bg-brand-teal/10 rounded-full hidden sm:inline-flex">
                  {clinic.code}
                </span>
              </div>
              {/* Mobile subtitle: city + phone */}
              <div className="sm:hidden mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {clinic.city}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {clinic.phone}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* Phone — hidden on mobile */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="text-sm text-gray-600">{clinic.phone}</span>
        </td>

        {/* City — hidden on mobile + tablet */}
        <td className="px-4 py-3 hidden md:table-cell">
          <span className="text-sm text-gray-600">{clinic.city}, {clinic.state}</span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {/* QR button */}
            <button
              onClick={() => setShowQRModal(true)}
              className="p-1.5 text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
              title="Patient Registration QR"
            >
              <QrCode className="h-4 w-4" />
            </button>

            {/* Edit — desktop only */}
            <button
              onClick={() => router.push(`/dashboard/clinics/${clinic.id}`)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:inline-flex"
              title="Edit Clinic"
            >
              <Edit className="h-4 w-4" />
            </button>

            {/* Overflow menu */}
            <div className="relative" data-menu>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                    <div className="p-1.5">
                      <button
                        onClick={() => { setShowQRModal(true); setShowMenu(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-2.5 text-brand-teal" />
                        Patient Registration QR
                      </button>
                      <button
                        onClick={() => { copyAgentLink(); setShowMenu(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {copySuccess ? (
                          <>
                            <Copy className="h-4 w-4 mr-2.5 text-green-600" />
                            <span className="text-green-600">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2.5 text-brand-teal" />
                            Copy AI Agent Link
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => { previewAgent(); setShowMenu(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Bot className="h-4 w-4 mr-2.5 text-brand-teal" />
                        Preview AI Agent
                        <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => { router.push(`/dashboard/clinics/${clinic.id}`); setShowMenu(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-2.5 text-brand-teal" />
                        Edit Clinic Details
                      </button>
                      <button className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 mr-2.5" />
                        Delete Clinic
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* QR Code Modal */}
      <ClinicQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        clinicName={clinic.name}
        clinicCode={clinic.code}
      />
    </>
  );
};

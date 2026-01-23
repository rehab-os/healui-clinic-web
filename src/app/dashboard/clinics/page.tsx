'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import CreateClinicModal from '../../../components/molecule/CreateClinicModal';
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Bed,
  Activity,
  Loader2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import ClinicQRCodeModal from '../../../components/molecule/ClinicQRCodeModal';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      {/* Clean Page Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Clinics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your organization's clinic locations
              </p>
            </div>
            
            <button
              onClick={handleCreateClinic}
              className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Clinic
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-[#1e5f79] text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'list' 
                  ? 'bg-[#1e5f79] text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Clinics</p>
                <p className="text-2xl font-semibold text-gray-900">{clinics.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-[#1e5f79]/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-green-600">
                  {clinics.filter(c => c.is_active).length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Beds</p>
                <p className="text-2xl font-semibold text-[#1e5f79]">
                  {clinics.reduce((sum, clinic) => sum + (clinic.total_beds || 0), 0)}
                </p>
              </div>
              <Bed className="h-8 w-8 text-[#1e5f79]/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cities</p>
                <p className="text-2xl font-semibold text-[#1e5f79]">
                  {new Set(clinics.map(c => c.city)).size}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-[#1e5f79]/20" />
            </div>
          </div>
        </div>

        {/* Clinics List/Grid */}
        {loading ? (
          <div className="bg-white rounded-lg p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e5f79] mb-3" />
              <span className="text-sm text-gray-600">Loading clinics...</span>
            </div>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
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
                className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Clinic
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredClinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} viewMode={viewMode} />
            ))}
          </div>
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

interface ClinicCardProps {
  clinic: Clinic;
  viewMode: 'grid' | 'list';
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, viewMode }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const router = require('next/navigation').useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or menu
    if ((e.target as HTMLElement).closest('button')) return;
    router.push(`/dashboard/clinics/${clinic.id}`);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#1e5f79] to-[#2a7a9b] flex items-center justify-center">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900 truncate">{clinic.name}</h3>
                  <span className="px-3 py-1 text-xs font-medium text-[#1e5f79] bg-[#eff8ff] rounded-full">
                    {clinic.code}
                  </span>
                </div>
                <div className="mt-2 flex items-center flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-[#1e5f79]" />
                    {clinic.city}, {clinic.state}
                  </span>
                  <span className="flex items-center">
                    <Phone className="h-4 w-4 mr-1.5 text-[#1e5f79]" />
                    {clinic.phone}
                  </span>
                  {clinic.total_beds && (
                    <span className="flex items-center">
                      <Bed className="h-4 w-4 mr-1.5 text-[#1e5f79]" />
                      {clinic.total_beds} beds
                    </span>
                  )}
                  {clinic.email && (
                    <span className="flex items-center">
                      <Mail className="h-4 w-4 mr-1.5 text-[#1e5f79]" />
                      {clinic.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* QR Code Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="p-3 text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-xl transition-all duration-200"
                title="Patient Registration QR"
              >
                <QrCode className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                    <div className="p-2">
                      <button
                        onClick={() => { setShowQRModal(true); setShowMenu(false); }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-3 text-[#1e5f79]" />
                        Patient Registration QR
                      </button>
                      <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4 mr-3 text-[#1e5f79]" />
                        Edit Clinic Details
                      </button>
                      <button className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 mr-3" />
                        Delete Clinic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        <ClinicQRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          clinicName={clinic.name}
          clinicCode={clinic.code}
        />
      </>
    );
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      >
        {/* Header with gradient */}
        <div className="h-2 bg-gradient-to-r from-[#1e5f79] to-[#2a7a9b]"></div>

        <div className="p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#1e5f79] to-[#2a7a9b] flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center gap-1">
              {/* QR Code Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Patient Registration QR"
              >
                <QrCode className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                    <div className="p-2">
                      <button
                        onClick={() => { setShowQRModal(true); setShowMenu(false); }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-3 text-[#1e5f79]" />
                        Patient Registration QR
                      </button>
                      <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4 mr-3 text-[#1e5f79]" />
                        Edit Clinic Details
                      </button>
                      <button className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 mr-3" />
                        Delete Clinic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clinic Info */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{clinic.name}</h3>
            <span className="inline-flex px-3 py-1 text-xs font-medium text-[#1e5f79] bg-[#eff8ff] rounded-full">
              {clinic.code}
            </span>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-3 text-[#1e5f79] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{clinic.address}</p>
                <p className="text-gray-500">{clinic.city}, {clinic.state} - {clinic.pincode}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-3 text-[#1e5f79] flex-shrink-0" />
              <span className="font-medium">{clinic.phone}</span>
            </div>
            {clinic.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-3 text-[#1e5f79] flex-shrink-0" />
                <span className="truncate font-medium">{clinic.email}</span>
              </div>
            )}
          </div>

          {/* Facilities & Stats */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {clinic.total_beds && (
              <div className="flex items-center text-sm text-gray-700 mb-3">
                <Bed className="h-4 w-4 mr-2 text-[#1e5f79]" />
                <span className="font-medium">{clinic.total_beds} treatment beds</span>
              </div>
            )}

            {clinic.facilities && clinic.facilities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Facilities:</p>
                <div className="flex flex-wrap gap-1">
                  {clinic.facilities.slice(0, 3).map((facility, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#eff8ff] text-[#1e5f79]"
                    >
                      {facility}
                    </span>
                  ))}
                  {clinic.facilities.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-600">
                      +{clinic.facilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {(!clinic.facilities || clinic.facilities.length === 0) && !clinic.total_beds && (
              <p className="text-sm text-gray-500 italic">No additional details available</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Created {new Date(clinic.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" title="Clinic operational"></div>
          </div>
        </div>
      </div>

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


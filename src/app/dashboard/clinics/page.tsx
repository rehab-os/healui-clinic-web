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
  Activity
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
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only organization administrators can manage clinics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clinics</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's clinic locations
          </p>
        </div>
        <button
          onClick={handleCreateClinic}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Clinic
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clinics</p>
              <p className="text-2xl font-semibold text-gray-900">{clinics.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Clinics</p>
              <p className="text-2xl font-semibold text-gray-900">
                {clinics.filter(c => c.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bed className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Beds</p>
              <p className="text-2xl font-semibold text-gray-900">
                {clinics.reduce((sum, clinic) => sum + (clinic.total_beds || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cities</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(clinics.map(c => c.city)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clinics List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
  );
}

interface ClinicCardProps {
  clinic: Clinic;
  viewMode: 'grid' | 'list';
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, viewMode }) => {
  const [showMenu, setShowMenu] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-3 rounded-lg ${clinic.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Building2 className={`h-6 w-6 ${clinic.is_active ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">{clinic.name}</h3>
                <span className="text-sm text-gray-500">({clinic.code})</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  clinic.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {clinic.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {clinic.city}, {clinic.state}
                </span>
                <span className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {clinic.phone}
                </span>
                {clinic.total_beds && (
                  <span className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {clinic.total_beds} beds
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Clinic
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Clinic
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${clinic.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Building2 className={`h-8 w-8 ${clinic.is_active ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            clinic.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {clinic.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{clinic.name}</h3>
          <p className="text-sm text-gray-500">Code: {clinic.code}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{clinic.address}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="ml-6">{clinic.city}, {clinic.state} - {clinic.pincode}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{clinic.phone}</span>
          </div>
          {clinic.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{clinic.email}</span>
            </div>
          )}
        </div>

        {(clinic.total_beds || clinic.facilities?.length) && (
          <div className="mb-4 pt-4 border-t border-gray-100">
            {clinic.total_beds && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Bed className="h-4 w-4 mr-2 text-gray-400" />
                <span>{clinic.total_beds} beds available</span>
              </div>
            )}
            {clinic.facilities && clinic.facilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {clinic.facilities.slice(0, 3).map((facility, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {facility}
                  </span>
                ))}
                {clinic.facilities.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    +{clinic.facilities.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Created {new Date(clinic.created_at).toLocaleDateString()}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 bottom-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Clinic
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Clinic
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


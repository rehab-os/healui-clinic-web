'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import ApiManager from '../../../services/api';
// Removed UI component imports - using clean custom designs
import { 
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertCircle,
  Laptop,
  Home,
  Building2,
  ChevronRight,
  Info,
  Settings,
  DollarSign,
  CheckCircle2,
  User,
  Star,
  Zap,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Activity,
  X
} from 'lucide-react';
import ServiceLocationSetup from '../../../components/molecule/ServiceLocationSetup';
import LeafletMapPicker from '../../../components/molecule/LeafletMapPicker';
import {
  setFetchLoading,
  setAvailabilities,
  setFetchError,
  addAvailability,
  updateAvailability,
  removeAvailability,
  setLocationsLoading,
  setServiceLocations,
  setLocationsError,
  addServiceLocation,
  updateServiceLocation,
  removeServiceLocation,
  AvailabilityType,
  DayOfWeek,
  PhysiotherapistAvailability,
  PhysioServiceLocation,
  ServiceZoneConfig
} from '../../../store/slices/availability.slice';
import {
  setPracticeSettings,
  updatePracticeSettings,
  updatePracticeField,
  setUpdateLoading as setPracticeUpdateLoading,
  setUpdateError as setPracticeUpdateError,
  PracticeSettings
} from '../../../store/slices/practice.slice';
import ProfileCompletionAlert from '../../../components/molecule/ProfileCompletionAlert';
import { useRouter } from 'next/navigation';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

interface AvailabilityFormData {
  availability_type: AvailabilityType;
  clinic_id?: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  service_pincodes?: string[];
  max_radius_km?: number;
  service_location_id?: string;
}

interface ServiceLocationFormData {
  location_name: string;
  base_address: string;
  base_pincode: string;
  latitude: number;
  longitude: number;
  service_pincodes: string[];
  zone_config: ServiceZoneConfig;
  is_active: boolean;
}

export default function AvailabilityPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { availabilities, serviceLocations, loading, error } = useAppSelector(state => state.availability);
  const { settings: practiceSettings, loading: practiceLoading, error: practiceError } = useAppSelector(state => state.practice);
  const { userData } = useAppSelector(state => state.user);
  
  // Debug user state
  console.log('🔍 Current user state:', { userData, hasId: !!userData?.id, hasUserId: !!userData?.user_id });
  
  const [selectedTab, setSelectedTab] = useState<AvailabilityType>(
    userData?.organization?.clinics?.length > 0 ? AvailabilityType.CLINIC : AvailabilityType.HOME_VISIT
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<PhysiotherapistAvailability | null>(null);
  const [showDefaultsDialog, setShowDefaultsDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [isEditingPractice, setIsEditingPractice] = useState(false);
  const [tempPracticeSettings, setTempPracticeSettings] = useState<PracticeSettings>({});
  
  // Service Location State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PhysioServiceLocation | null>(null);
  const [locationFormData, setLocationFormData] = useState<ServiceLocationFormData>({
    location_name: '',
    base_address: '',
    base_pincode: '',
    latitude: 0,
    longitude: 0,
    service_pincodes: [],
    zone_config: {
      green: { pincodes: [], radius_km: 5 },
      yellow: { pincodes: [], radius_km: 10, extra_charge: 200 },
      red: { pincodes: [], radius_km: 15, extra_charge: 500 }
    },
    is_active: true
  });
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [locationSubmitError, setLocationSubmitError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AvailabilityFormData>({
    availability_type: AvailabilityType.CLINIC,
    day_of_week: DayOfWeek.MONDAY,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30
  });

  useEffect(() => {
    fetchAvailability();
    fetchPracticeSettings();
  }, []);
  
  // Fetch service locations when userData becomes available
  useEffect(() => {
    if (userData?.user_id) {
      console.log('✅ userData.user_id available, fetching service locations');
      fetchServiceLocations();
    } else {
      console.log('⏳ Waiting for userData.user_id...');
    }
  }, [userData?.user_id]);

  const fetchServiceLocations = async () => {
    if (!userData?.user_id) return;
    
    try {
      dispatch(setLocationsLoading(true));
      const response = await ApiManager.getServiceLocations(userData.user_id);
      
      if (response.success && response.data) {
        dispatch(setServiceLocations(response.data));
      } else {
        dispatch(setServiceLocations([]));
      }
    } catch (error) {
      console.error('Error fetching service locations:', error);
      dispatch(setLocationsError('Failed to fetch service locations'));
      dispatch(setServiceLocations([]));
    } finally {
      dispatch(setLocationsLoading(false));
    }
  };

  const fetchPracticeSettings = async () => {
    try {
      const response = await ApiManager.getPhysiotherapistProfile();
      
      if (response.success && response.data) {
        const settings: PracticeSettings = {
          practice_address: response.data.practice_address || '',
          service_areas: response.data.service_areas || '',
          consultation_fee: response.data.consultation_fee || 0,
          home_visit_fee: response.data.home_visit_fee || 0,
          online_consultation_available: response.data.online_consultation_available || false,
          home_visit_available: response.data.home_visit_available || false,
          marketplace_active: response.data.marketplace_active || false,
          profile_completed_at: response.data.profile_completed_at
        };
        dispatch(setPracticeSettings(settings));
        setTempPracticeSettings(settings);
      }
    } catch (error) {
      console.error('Error fetching practice settings:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      dispatch(setFetchLoading(true));
      const response = await ApiManager.getMyAvailability();
      
      if (response.success && response.data) {
        dispatch(setAvailabilities(response.data));
      } else {
        dispatch(setAvailabilities([]));
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      dispatch(setFetchError('Failed to fetch availability'));
      dispatch(setAvailabilities([]));
    } finally {
      dispatch(setFetchLoading(false));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (editingAvailability) {
        const response = await ApiManager.updateAvailability(editingAvailability.id, formData);
        if (response.success && response.data) {
          dispatch(updateAvailability(response.data));
          setShowAddModal(false);
          setEditingAvailability(null);
          resetForm();
        } else {
          setSubmitError(response.message || 'Failed to update availability');
        }
      } else {
        const response = await ApiManager.createAvailability(formData);
        if (response.success && response.data) {
          dispatch(addAvailability(response.data));
          setShowAddModal(false);
          resetForm();
        } else {
          setSubmitError(response.message || 'Failed to create availability');
        }
      }
    } catch (error: any) {
      console.error('Error saving availability:', error);
      
      // Extract error message from the response
      let errorMessage = 'An unexpected error occurred';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this availability?')) {
      try {
        const response = await ApiManager.deleteAvailability(id);
        if (response.success) {
          dispatch(removeAvailability(id));
        }
      } catch (error) {
        console.error('Error deleting availability:', error);
      }
    }
  };

  const handleEdit = (availability: PhysiotherapistAvailability) => {
    setEditingAvailability(availability);
    setFormData({
      availability_type: availability.availability_type,
      clinic_id: availability.clinic_id,
      day_of_week: availability.day_of_week,
      start_time: availability.start_time,
      end_time: availability.end_time,
      slot_duration_minutes: availability.slot_duration_minutes,
      service_pincodes: availability.service_pincodes,
      max_radius_km: availability.max_radius_km,
      service_location_id: availability.service_location_id
    });
    setShowAddModal(true);
  };

  const handleSetDefaults = async () => {
    try {
      const response = await ApiManager.setDefaultAvailability();
      if (response.success) {
        fetchAvailability();
        setShowDefaultsDialog(false);
      }
    } catch (error) {
      console.error('Error setting defaults:', error);
    }
  };

  const handleSavePracticeSettings = async () => {
    try {
      dispatch(setPracticeUpdateLoading(true));
      
      // Filter out read-only fields that shouldn't be sent to backend
      const { profile_completed_at, updated_at, id, ...updateData } = tempPracticeSettings;
      
      const response = await ApiManager.updatePracticeSettings(updateData);
      
      if (response.success) {
        dispatch(updatePracticeSettings(tempPracticeSettings));
        setIsEditingPractice(false);
        setShowPracticeModal(false);
      } else {
        dispatch(setPracticeUpdateError(response.message || 'Failed to update practice settings'));
      }
    } catch (error: any) {
      console.error('Error saving practice settings:', error);
      dispatch(setPracticeUpdateError(error.message || 'Failed to save practice settings'));
    } finally {
      dispatch(setPracticeUpdateLoading(false));
    }
  };

  const handleEditPracticeSettings = () => {
    setTempPracticeSettings(practiceSettings);
    setIsEditingPractice(true);
    setShowPracticeModal(true);
  };

  const resetForm = () => {
    setFormData({
      availability_type: selectedTab !== AvailabilityType.CLINIC || userData?.organization?.clinics?.length > 0 
        ? selectedTab 
        : AvailabilityType.HOME_VISIT,
      day_of_week: DayOfWeek.MONDAY,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration_minutes: 30
    });
    setEditingAvailability(null);
    setSubmitError(null);
  };

  // Service Location Handlers
  const handleCreateLocation = async () => {
    if (!userData?.user_id) return;
    
    setIsSubmittingLocation(true);
    setLocationSubmitError(null);
    
    try {
      const response = await ApiManager.createServiceLocation(userData.user_id, locationFormData);
      if (response.success && response.data) {
        dispatch(addServiceLocation(response.data));
        setShowLocationModal(false);
        resetLocationForm();
      } else {
        setLocationSubmitError(response.message || 'Failed to create service location');
      }
    } catch (error: any) {
      console.error('Error creating service location:', error);
      setLocationSubmitError(error.message || 'Failed to create service location');
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!userData?.user_id || !editingLocation) return;
    
    setIsSubmittingLocation(true);
    setLocationSubmitError(null);
    
    try {
      const response = await ApiManager.updateServiceLocation(userData.user_id, editingLocation.id, locationFormData);
      if (response.success && response.data) {
        dispatch(updateServiceLocation(response.data));
        setShowLocationModal(false);
        resetLocationForm();
      } else {
        setLocationSubmitError(response.message || 'Failed to update service location');
      }
    } catch (error: any) {
      console.error('Error updating service location:', error);
      setLocationSubmitError(error.message || 'Failed to update service location');
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!userData?.user_id) return;
    
    if (confirm('Are you sure you want to delete this service location?')) {
      try {
        const response = await ApiManager.deleteServiceLocation(userData.user_id, locationId);
        if (response.success) {
          dispatch(removeServiceLocation(locationId));
        }
      } catch (error) {
        console.error('Error deleting service location:', error);
      }
    }
  };

  const handleEditLocation = (location: PhysioServiceLocation) => {
    setEditingLocation(location);
    setLocationFormData({
      location_name: location.location_name,
      base_address: location.base_address,
      base_pincode: location.base_pincode,
      latitude: location.latitude,
      longitude: location.longitude,
      service_pincodes: location.service_pincodes,
      zone_config: location.zone_config,
      is_active: location.is_active
    });
    setShowLocationModal(true);
  };

  const resetLocationForm = () => {
    setLocationFormData({
      location_name: '',
      base_address: '',
      base_pincode: '',
      latitude: 0,
      longitude: 0,
      service_pincodes: [],
      zone_config: {
        green: { pincodes: [], radius_km: 5 },
        yellow: { pincodes: [], radius_km: 10, extra_charge: 200 },
        red: { pincodes: [], radius_km: 15, extra_charge: 500 }
      },
      is_active: true
    });
    setEditingLocation(null);
    setLocationSubmitError(null);
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    const extractedPincode = extractPincodeFromAddress(address || '');
    setLocationFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      base_address: address || '',
      base_pincode: extractedPincode
    }));
  };

  const extractPincodeFromAddress = (address: string): string => {
    // Extract 6-digit pincode from address string
    const pincodeMatch = address.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : '';
  };

  const getFilteredAvailabilities = (type: AvailabilityType) => {
    return availabilities.filter(a => a.availability_type === type);
  };

  const getAvailabilityIcon = (type: AvailabilityType) => {
    switch (type) {
      case AvailabilityType.CLINIC:
        return <Building2 className="h-4 w-4" />;
      case AvailabilityType.HOME_VISIT:
        return <Home className="h-4 w-4" />;
      case AvailabilityType.ONLINE:
        return <Laptop className="h-4 w-4" />;
    }
  };

  const renderAvailabilityCard = (availability: PhysiotherapistAvailability) => {
    const clinic = userData?.organization?.clinics?.find(c => c.id === availability.clinic_id);
    
    return (
      <div key={availability.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {getAvailabilityIcon(availability.availability_type)}
            <div>
              <span className="font-medium text-gray-900">{DAY_NAMES[availability.day_of_week]}</span>
              {availability.availability_type === AvailabilityType.CLINIC && clinic && (
                <p className="text-sm text-gray-600">{clinic.name}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(availability)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(availability.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Time */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{availability.start_time} - {availability.end_time}</span>
          <span className="text-sm text-gray-500">({availability.slot_duration_minutes} min)</span>
        </div>
        
        {/* Home Visit Details */}
        {availability.availability_type === AvailabilityType.HOME_VISIT && (
          <div className="space-y-2">
            {availability.service_location_id && (
              (() => {
                const serviceLocation = serviceLocations.find(loc => loc.id === availability.service_location_id);
                if (serviceLocation) {
                  const totalPincodes = serviceLocation.service_pincodes.length;
                  const greenCount = serviceLocation.zone_config.green.pincodes.length;
                  const yellowCount = serviceLocation.zone_config.yellow.pincodes.length;
                  const redCount = serviceLocation.zone_config.red.pincodes.length;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{serviceLocation.location_name}</p>
                          <p className="text-xs text-gray-500">{serviceLocation.base_address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600">Service Areas: {totalPincodes} pincodes</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-green-600">{greenCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-yellow-600">{yellowCount} (+₹{serviceLocation.zone_config.yellow.extra_charge})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-red-600">{redCount} (+₹{serviceLocation.zone_config.red.extra_charge})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <p className="text-sm text-orange-600">Service location not found</p>
                    </div>
                  );
                }
              })()
            )}
            
            {/* Legacy support for old format */}
            {!availability.service_location_id && availability.service_pincodes && availability.service_pincodes.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Pincodes: {availability.service_pincodes.join(', ')}</p>
                </div>
              </div>
            )}
            {!availability.service_location_id && availability.max_radius_km && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">Radius: {availability.max_radius_km} km</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Page Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your schedule and service availability</p>
            </div>
            
            <div className="flex gap-3">
              {availabilities.length === 0 && (
                <button
                  onClick={() => setShowDefaultsDialog(true)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Quick Setup
                </button>
              )}
              <button 
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Availability
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Profile Completion Alert */}
      <ProfileCompletionAlert 
        compact={true}
        showDetailsButton={true}
        onNavigateToProfile={() => router.push('/dashboard/profile')}
      />

        {error.fetch && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">{error.fetch}</span>
          </div>
        )}

        {/* Practice Settings Section */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Practice Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your fees, services, and practice details</p>
            </div>
            <button 
              onClick={handleEditPracticeSettings}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Profile Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Profile Status</span>
              </div>
              <div className="flex items-center gap-2">
                {practiceSettings.profile_completed_at ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">Complete</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-700">Incomplete</span>
                  </>
                )}
              </div>
            </div>

            {/* Fee Structure */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Fees</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Consultation: ₹{practiceSettings.consultation_fee || 0}</p>
                <p className="text-sm text-gray-600">Home Visit: ₹{practiceSettings.home_visit_fee || 0}</p>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Services</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${practiceSettings.online_consultation_available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${practiceSettings.home_visit_available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-600">Home Visits</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Location</span>
              </div>
              <p className="text-sm text-gray-600">
                {practiceSettings.practice_address || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Service Locations Section */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Service Locations</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your home visit service areas and zones</p>
            </div>
            <button 
              onClick={() => {
                resetLocationForm();
                setShowLocationModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </button>
          </div>

          {loading.locations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f79]"></div>
            </div>
          ) : serviceLocations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service locations</h3>
              <p className="text-gray-600 mb-4">
                Add service locations to define where you provide home visits and configure zone-based pricing
              </p>
              <button
                onClick={() => {
                  resetLocationForm();
                  setShowLocationModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceLocations.map((location) => (
                <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">{location.location_name}</span>
                        <p className="text-sm text-gray-600">{location.base_pincode}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">{location.base_address}</p>
                  </div>
                  
                  {/* Zone Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600">Green: {location.zone_config.green.pincodes.length} pincodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-gray-600">Yellow: {location.zone_config.yellow.pincodes.length} pincodes (+₹{location.zone_config.yellow.extra_charge})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-600">Red: {location.zone_config.red.pincodes.length} pincodes (+₹{location.zone_config.red.extra_charge})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-1">
              {userData?.organization?.clinics && userData.organization.clinics.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setSelectedTab(AvailabilityType.CLINIC)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all ${
                      selectedTab === AvailabilityType.CLINIC
                        ? 'bg-[#1e5f79] text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Clinic</span>
                    <span className="text-xs">({getFilteredAvailabilities(AvailabilityType.CLINIC).length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab(AvailabilityType.HOME_VISIT)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all ${
                      selectedTab === AvailabilityType.HOME_VISIT
                        ? 'bg-[#1e5f79] text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Home Visit</span>
                    <span className="text-xs">({getFilteredAvailabilities(AvailabilityType.HOME_VISIT).length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab(AvailabilityType.ONLINE)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all ${
                      selectedTab === AvailabilityType.ONLINE
                        ? 'bg-[#1e5f79] text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Laptop className="h-4 w-4" />
                    <span className="hidden sm:inline">Online</span>
                    <span className="text-xs">({getFilteredAvailabilities(AvailabilityType.ONLINE).length})</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setSelectedTab(AvailabilityType.HOME_VISIT)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all ${
                      selectedTab === AvailabilityType.HOME_VISIT
                        ? 'bg-[#1e5f79] text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Home Visit</span>
                    <span className="text-xs">({getFilteredAvailabilities(AvailabilityType.HOME_VISIT).length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab(AvailabilityType.ONLINE)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all ${
                      selectedTab === AvailabilityType.ONLINE
                        ? 'bg-[#1e5f79] text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Laptop className="h-4 w-4" />
                    <span className="hidden sm:inline">Online</span>
                    <span className="text-xs">({getFilteredAvailabilities(AvailabilityType.ONLINE).length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clinic Tab Content */}
          {userData?.organization?.clinics && userData.organization.clinics.length > 0 && selectedTab === AvailabilityType.CLINIC && (
            <div className="mt-6">
              {loading.fetch ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f79]"></div>
                </div>
              ) : getFilteredAvailabilities(AvailabilityType.CLINIC).length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No clinic hours set</h3>
                  <p className="text-gray-600 mb-4">
                    Add your clinic availability to start accepting appointments
                  </p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, availability_type: AvailabilityType.CLINIC });
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Clinic Hours
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredAvailabilities(AvailabilityType.CLINIC).map(renderAvailabilityCard)}
                </div>
              )}
            </div>
          )}

          {/* Home Visit Tab Content */}
          {selectedTab === AvailabilityType.HOME_VISIT && (
            <div className="mt-6">
              <div className="mb-4 p-3 bg-[#eff8ff] border border-[#c8eaeb] rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-[#1e5f79] mt-0.5" />
                <p className="text-sm text-[#1e5f79]">
                  Set your availability for home visits. You can specify service areas by pincodes or radius.
                </p>
              </div>
              
              {getFilteredAvailabilities(AvailabilityType.HOME_VISIT).length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No home visit hours set</h3>
                  <p className="text-gray-600 mb-4">
                    Add your home visit availability to serve patients at their location
                  </p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, availability_type: AvailabilityType.HOME_VISIT });
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Home Visit Hours
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredAvailabilities(AvailabilityType.HOME_VISIT).map(renderAvailabilityCard)}
                </div>
              )}
            </div>
          )}

          {/* Online Tab Content */}
          {selectedTab === AvailabilityType.ONLINE && (
            <div className="mt-6">
              {getFilteredAvailabilities(AvailabilityType.ONLINE).length === 0 ? (
                <div className="text-center py-12">
                  <Laptop className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No online hours set</h3>
                  <p className="text-gray-600 mb-4">
                    Add your online consultation availability to serve patients remotely
                  </p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, availability_type: AvailabilityType.ONLINE });
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Online Hours
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredAvailabilities(AvailabilityType.ONLINE).map(renderAvailabilityCard)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Availability Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAvailability ? 'Edit' : 'Add'} Availability
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
          
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability Type</label>
                    <select
                      value={formData.availability_type}
                      onChange={(e) => setFormData({ ...formData, availability_type: e.target.value as AvailabilityType })}
                      disabled={!!editingAvailability}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] disabled:bg-gray-50"
                    >
                      <option value={AvailabilityType.CLINIC}>Clinic</option>
                      <option value={AvailabilityType.HOME_VISIT}>Home Visit</option>
                      <option value={AvailabilityType.ONLINE}>Online</option>
                    </select>
                  </div>

                  {formData.availability_type === AvailabilityType.CLINIC && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clinic</label>
                      <select
                        value={formData.clinic_id || ''}
                        onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                      >
                        <option value="">Select clinic</option>
                        {userData?.organization?.clinics?.map(clinic => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                  <select
                    value={formData.day_of_week.toString()}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) as DayOfWeek })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  >
                    {DAY_NAMES.map((day, index) => (
                      <option key={index} value={index.toString()}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <select
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <select
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration (minutes)</label>
                  <select
                    value={formData.slot_duration_minutes.toString()}
                    onChange={(e) => setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                {formData.availability_type === AvailabilityType.HOME_VISIT && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Location</label>
                    {serviceLocations.length === 0 ? (
                      <div className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-orange-700 text-sm">
                        No service locations available. 
                        <button
                          type="button"
                          onClick={() => {
                            resetLocationForm();
                            setShowLocationModal(true);
                          }}
                          className="ml-2 underline hover:no-underline"
                        >
                          Create one first
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.service_location_id || ''}
                        onChange={(e) => setFormData({ ...formData, service_location_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                        required
                      >
                        <option value="">Select service location</option>
                        {serviceLocations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.location_name} ({location.base_pincode})
                          </option>
                        ))}
                      </select>
                    )}
                    {formData.service_location_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        This availability will use the zones and pincodes configured for the selected location
                      </p>
                    )}
                  </div>
                )}
              </div>

              {submitError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-700 font-medium">Error saving availability:</p>
                    <p className="text-red-600 text-sm mt-1">{submitError}</p>
                    {submitError.includes('Time conflict') && (
                      <p className="text-red-600 text-xs mt-2 italic">
                        💡 Tip: Try choosing a different time slot or check your existing schedules above.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? 'Saving...' : editingAvailability ? 'Update' : 'Add'} Availability
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Set Defaults Confirmation Dialog */}
        {showDefaultsDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Set Default Schedule</h3>
                <button
                  onClick={() => setShowDefaultsDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 my-4">
                This will set a default schedule with:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  <strong>Clinic hours:</strong> Monday to Friday, 9:00 AM - 5:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  <strong>Online consultations:</strong> Monday, Wednesday, Friday, 7:00 PM - 9:00 PM
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                You can customize these settings after they're created.
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowDefaultsDialog(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetDefaults}
                  className="px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                >
                  Set Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Practice Settings Modal */}
        {showPracticeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Practice Settings</h3>
                <button
                  onClick={() => {
                    setShowPracticeModal(false);
                    setIsEditingPractice(false);
                    setTempPracticeSettings(practiceSettings);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
          
              <div className="space-y-6">
                {/* Practice Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Practice Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Practice Address</label>
                      <textarea
                        placeholder="Enter your practice address..."
                        value={tempPracticeSettings.practice_address || ''}
                        onChange={(e) => setTempPracticeSettings({
                          ...tempPracticeSettings,
                          practice_address: e.target.value
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Areas</label>
                      <textarea
                        placeholder="Describe the areas you serve (e.g., Mumbai Central, Bandra, etc.)"
                        value={tempPracticeSettings.service_areas || ''}
                        onChange={(e) => setTempPracticeSettings({
                          ...tempPracticeSettings,
                          service_areas: e.target.value
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Fee Structure */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Fee Structure
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tempPracticeSettings.consultation_fee || ''}
                        onChange={(e) => setTempPracticeSettings({
                          ...tempPracticeSettings,
                          consultation_fee: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Home Visit Fee (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tempPracticeSettings.home_visit_fee || ''}
                        onChange={(e) => setTempPracticeSettings({
                          ...tempPracticeSettings,
                          home_visit_fee: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Availability */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Service Availability
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="online_consultation"
                        checked={tempPracticeSettings.online_consultation_available || false}
                        onChange={(e) => setTempPracticeSettings({
                          ...tempPracticeSettings,
                          online_consultation_available: e.target.checked
                        })}
                        className="w-4 h-4 text-[#1e5f79] bg-gray-100 border-gray-300 rounded focus:ring-[#1e5f79] focus:ring-2"
                      />
                      <label htmlFor="online_consultation" className="flex items-center gap-2 text-sm">
                        <Laptop className="h-4 w-4" />
                        Online Consultation Available
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="home_visit"
                        checked={tempPracticeSettings.home_visit_available || false}
                        onChange={(e) => setTempPracticeSettings({
                          ...tempPracticeSettings,
                          home_visit_available: e.target.checked
                        })}
                        className="w-4 h-4 text-[#1e5f79] bg-gray-100 border-gray-300 rounded focus:ring-[#1e5f79] focus:ring-2"
                      />
                      <label htmlFor="home_visit" className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4" />
                        Home Visit Available
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {practiceError.update && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-700 font-medium">Error saving practice settings:</p>
                    <p className="text-red-600 text-sm mt-1">{practiceError.update}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowPracticeModal(false);
                    setIsEditingPractice(false);
                    setTempPracticeSettings(practiceSettings);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePracticeSettings}
                  disabled={practiceLoading.update}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {practiceLoading.update ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {practiceLoading.update ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Service Location Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-5xl m-4 max-h-[95vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingLocation ? 'Edit' : 'Add'} Service Location
                </h3>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    resetLocationForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
                <ServiceLocationSetup
                  initialData={editingLocation ? {
                    location_name: locationFormData.location_name,
                    base_address: locationFormData.base_address,
                    base_pincode: locationFormData.base_pincode,
                    latitude: locationFormData.latitude,
                    longitude: locationFormData.longitude,
                    service_pincodes: locationFormData.service_pincodes,
                    zone_config: locationFormData.zone_config
                  } : undefined}
                  onSave={async (data) => {
                    console.log('=== ONSAVE CALLBACK TRIGGERED ===');
                    console.log('Received data:', data);
                    console.log('userData?.user_id:', userData?.user_id);
                    console.log('editingLocation:', editingLocation);
                    
                    setLocationFormData({
                      ...locationFormData,
                      ...data
                    });
                    
                    if (!userData?.user_id) {
                      console.log('❌ No userData.user_id found, aborting');
                      setLocationSubmitError('User session not found. Please refresh the page and try again.');
                      setIsSubmittingLocation(false);
                      return;
                    }
                    
                    console.log('Setting loading state...');
                    setIsSubmittingLocation(true);
                    setLocationSubmitError(null);
                    
                    try {
                      let response;
                      if (editingLocation) {
                        console.log('📝 Updating existing location:', editingLocation.id);
                        response = await ApiManager.updateServiceLocation(userData.user_id, editingLocation.id, data);
                        console.log('Update response:', response);
                        if (response.success && response.data) {
                          dispatch(updateServiceLocation(response.data));
                        }
                      } else {
                        console.log('➕ Creating new location');
                        response = await ApiManager.createServiceLocation(userData.user_id, data);
                        console.log('Create response:', response);
                        if (response.success && response.data) {
                          dispatch(addServiceLocation(response.data));
                        }
                      }
                      
                      if (response.success) {
                        console.log('✅ API call successful, closing modal');
                        setShowLocationModal(false);
                        resetLocationForm();
                      } else {
                        console.log('❌ API call failed:', response.message);
                        setLocationSubmitError(response.message || `Failed to ${editingLocation ? 'update' : 'create'} service location`);
                      }
                    } catch (error: any) {
                      console.error(`❌ Error ${editingLocation ? 'updating' : 'creating'} service location:`, error);
                      setLocationSubmitError(error.message || `Failed to ${editingLocation ? 'update' : 'create'} service location`);
                    } finally {
                      console.log('🏁 Setting loading state to false');
                      setIsSubmittingLocation(false);
                    }
                  }}
                  onCancel={() => {
                    setShowLocationModal(false);
                    resetLocationForm();
                  }}
                  loading={isSubmittingLocation}
                />
                
                {locationSubmitError && (
                  <div className="mx-6 mb-6 p-4 bg-red-50 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-700 font-medium">Error saving location:</p>
                      <p className="text-red-600 text-sm mt-1">{locationSubmitError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
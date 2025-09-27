'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
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
  Activity
} from 'lucide-react';
import {
  setFetchLoading,
  setAvailabilities,
  setFetchError,
  addAvailability,
  updateAvailability,
  removeAvailability,
  AvailabilityType,
  DayOfWeek,
  PhysiotherapistAvailability
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
}

export default function AvailabilityPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { availabilities, loading, error } = useAppSelector(state => state.availability);
  const { settings: practiceSettings, loading: practiceLoading, error: practiceError } = useAppSelector(state => state.practice);
  const { userData } = useAppSelector(state => state.user);
  
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
      max_radius_km: availability.max_radius_km
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
      <div key={availability.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(availability)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(availability.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
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
            {availability.service_pincodes && availability.service_pincodes.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Pincodes: {availability.service_pincodes.join(', ')}</p>
                </div>
              </div>
            )}
            {availability.max_radius_km && (
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
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-12">
      {/* Header Section - Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
          <p className="text-gray-600 mt-1">Manage your schedule and service availability</p>
        </div>
        
        <div className="flex gap-3">
          {availabilities.length === 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDefaultsDialog(true)}
            >
              Quick Setup
            </Button>
          )}
          <Button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Availability
          </Button>
        </div>
      </div>

      {/* Profile Completion Alert */}
      <ProfileCompletionAlert 
        compact={true}
        showDetailsButton={true}
        onNavigateToProfile={() => router.push('/dashboard/profile')}
      />

      {error.fetch && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-700">{error.fetch}</span>
        </div>
      )}

      {/* Practice Settings Section - Minimal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Practice Settings</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Manage your fees, services, and practice details</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEditPracticeSettings}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>

      {/* Tabs Section - Minimal */}
      <Card>
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as AvailabilityType)}>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Schedule</CardTitle>
            <div className="mt-4">
              {userData?.organization?.clinics && userData.organization.clinics.length > 0 ? (
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value={AvailabilityType.CLINIC} className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Clinic
                    <span className="ml-1 text-xs text-gray-500">({getFilteredAvailabilities(AvailabilityType.CLINIC).length})</span>
                  </TabsTrigger>
                  <TabsTrigger value={AvailabilityType.HOME_VISIT} className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home Visit
                    <span className="ml-1 text-xs text-gray-500">({getFilteredAvailabilities(AvailabilityType.HOME_VISIT).length})</span>
                  </TabsTrigger>
                  <TabsTrigger value={AvailabilityType.ONLINE} className="flex items-center gap-2">
                    <Laptop className="h-4 w-4" />
                    Online
                    <span className="ml-1 text-xs text-gray-500">({getFilteredAvailabilities(AvailabilityType.ONLINE).length})</span>
                  </TabsTrigger>
                </TabsList>
              ) : (
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={AvailabilityType.HOME_VISIT} className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home Visit
                    <span className="ml-1 text-xs text-gray-500">({getFilteredAvailabilities(AvailabilityType.HOME_VISIT).length})</span>
                  </TabsTrigger>
                  <TabsTrigger value={AvailabilityType.ONLINE} className="flex items-center gap-2">
                    <Laptop className="h-4 w-4" />
                    Online
                    <span className="ml-1 text-xs text-gray-500">({getFilteredAvailabilities(AvailabilityType.ONLINE).length})</span>
                  </TabsTrigger>
                </TabsList>
              )}
            </div>
          </CardHeader>

          {userData?.organization?.clinics && userData.organization.clinics.length > 0 && (
            <TabsContent value={AvailabilityType.CLINIC}>
              <CardContent>
                {loading.fetch ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : getFilteredAvailabilities(AvailabilityType.CLINIC).length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clinic hours set</h3>
                    <p className="text-gray-600 mb-4">
                      Add your clinic availability to start accepting appointments
                    </p>
                    <Button
                      onClick={() => {
                        setFormData({ ...formData, availability_type: AvailabilityType.CLINIC });
                        setShowAddModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Clinic Hours
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredAvailabilities(AvailabilityType.CLINIC).map(renderAvailabilityCard)}
                  </div>
                )}
              </CardContent>
            </TabsContent>
          )}

          <TabsContent value={AvailabilityType.HOME_VISIT}>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
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
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, availability_type: AvailabilityType.HOME_VISIT });
                      setShowAddModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Home Visit Hours
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredAvailabilities(AvailabilityType.HOME_VISIT).map(renderAvailabilityCard)}
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value={AvailabilityType.ONLINE}>
            <CardContent>
              {getFilteredAvailabilities(AvailabilityType.ONLINE).length === 0 ? (
                <div className="text-center py-12">
                  <Laptop className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No online hours set</h3>
                  <p className="text-gray-600 mb-4">
                    Add your online consultation availability to serve patients remotely
                  </p>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, availability_type: AvailabilityType.ONLINE });
                      setShowAddModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Online Hours
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredAvailabilities(AvailabilityType.ONLINE).map(renderAvailabilityCard)}
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add/Edit Availability Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAvailability ? 'Edit' : 'Add'} Availability
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Availability Type</Label>
                <Select
                  value={formData.availability_type}
                  onValueChange={(value) => setFormData({ ...formData, availability_type: value as AvailabilityType })}
                  disabled={!!editingAvailability}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AvailabilityType.CLINIC}>Clinic</SelectItem>
                    <SelectItem value={AvailabilityType.HOME_VISIT}>Home Visit</SelectItem>
                    <SelectItem value={AvailabilityType.ONLINE}>Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.availability_type === AvailabilityType.CLINIC && (
                <div>
                  <Label>Clinic</Label>
                  <Select
                    value={formData.clinic_id}
                    onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {userData?.organization?.clinics?.map(clinic => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label>Day of Week</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) as DayOfWeek })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Select
                  value={formData.start_time}
                  onValueChange={(value) => setFormData({ ...formData, start_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>End Time</Label>
                <Select
                  value={formData.end_time}
                  onValueChange={(value) => setFormData({ ...formData, end_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Slot Duration (minutes)</Label>
              <Select
                value={formData.slot_duration_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, slot_duration_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.availability_type === AvailabilityType.HOME_VISIT && (
              <>
                <div>
                  <Label>Service Pincodes (comma separated)</Label>
                  <Input
                    placeholder="e.g., 400001, 400002, 400003"
                    value={formData.service_pincodes?.join(', ') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      service_pincodes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                  />
                </div>

                <div>
                  <Label>Maximum Radius (km)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.max_radius_km || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      max_radius_km: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Saving...' : editingAvailability ? 'Update' : 'Add'} Availability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Defaults Confirmation Dialog */}
      <Dialog open={showDefaultsDialog} onOpenChange={setShowDefaultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Default Schedule</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDefaultsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetDefaults}>
              Set Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Practice Settings Modal */}
      <Dialog open={showPracticeModal} onOpenChange={setShowPracticeModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Practice Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Practice Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Practice Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Practice Address</Label>
                  <Textarea
                    placeholder="Enter your practice address..."
                    value={tempPracticeSettings.practice_address || ''}
                    onChange={(e) => setTempPracticeSettings({
                      ...tempPracticeSettings,
                      practice_address: e.target.value
                    })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Service Areas</Label>
                  <Textarea
                    placeholder="Describe the areas you serve (e.g., Mumbai Central, Bandra, etc.)"
                    value={tempPracticeSettings.service_areas || ''}
                    onChange={(e) => setTempPracticeSettings({
                      ...tempPracticeSettings,
                      service_areas: e.target.value
                    })}
                    rows={2}
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
                  <Label>Consultation Fee (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={tempPracticeSettings.consultation_fee || ''}
                    onChange={(e) => setTempPracticeSettings({
                      ...tempPracticeSettings,
                      consultation_fee: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <Label>Home Visit Fee (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={tempPracticeSettings.home_visit_fee || ''}
                    onChange={(e) => setTempPracticeSettings({
                      ...tempPracticeSettings,
                      home_visit_fee: parseInt(e.target.value) || 0
                    })}
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
                    className="w-4 h-4 text-healui-physio bg-gray-100 border-gray-300 rounded focus:ring-healui-physio focus:ring-2"
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
                    className="w-4 h-4 text-healui-physio bg-gray-100 border-gray-300 rounded focus:ring-healui-physio focus:ring-2"
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

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPracticeModal(false);
              setIsEditingPractice(false);
              setTempPracticeSettings(practiceSettings);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSavePracticeSettings} disabled={practiceLoading.update}>
              {practiceLoading.update ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {practiceLoading.update ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
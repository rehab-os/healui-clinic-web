'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import { 
  User, 
  GraduationCap, 
  Award, 
  Settings as SettingsIcon,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { setUser } from '../../../store/slices/auth.slice';
import ProfilePhotoUpload from '../../../components/molecule/ProfilePhotoUpload';

// Import database data
import machinesData from '../../../../database/machines/machines.json';

// Constants for dropdowns
const SPECIALIZATIONS = [
  'orthopedic', 'neurological', 'pediatric', 'geriatric', 'sports',
  'cardiac', 'pulmonary', 'women_health', 'pain_management', 'rehabilitation'
];

const EXPERIENCE_LEVELS = ['fresher', 'junior', 'senior', 'expert'];

const TECHNIQUE_CATEGORIES = [
  'manual_therapy', 'exercise_therapy', 'electrotherapy', 'hydrotherapy',
  'thermotherapy', 'cryotherapy', 'acupuncture', 'dry_needling',
  'massage_therapy', 'mobilization', 'manipulation', 'soft_tissue',
  'trigger_point', 'myofascial_release', 'craniosacral', 'neural_mobilization',
  'pnf_techniques', 'joint_mobilization', 'spinal_manipulation', 'mulligan_technique',
  'maitland_technique', 'kaltenborn_technique', 'mcconnell_taping', 'kinesio_taping',
  'instrument_assisted_soft_tissue', 'cupping_therapy', 'gua_sha',
  'fascial_release', 'strain_counterstrain', 'positional_release'
];

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const mapMachineTypeToEnum = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'Electrotherapy Machine': 'electrotherapy',
    'Manual Therapy Equipment': 'exercise_equipment',
    'Exercise Equipment': 'exercise_equipment',
    'Specialized Rehabilitation Equipment': 'exercise_equipment',
    'Heat and Cold Therapy': 'paraffin_bath',
    'Assessment Tools': 'biofeedback',
    'Hydrotherapy Equipment': 'exercise_equipment'
  };
  return typeMap[type] || 'exercise_equipment';
};

const AVAILABLE_MACHINES = machinesData.machines.map(machine => ({
  name: machine.name,
  type: machine.type,
  enumType: mapMachineTypeToEnum(machine.type),
  usedIn: machine.usedIn
}));

const MACHINE_CATEGORIES = [
  { value: 'electrotherapy', label: 'Electrotherapy Machine' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'laser_therapy', label: 'Laser Therapy' },
  { value: 'tens_unit', label: 'TENS Unit' },
  { value: 'ems_unit', label: 'EMS Unit' },
  { value: 'interferential', label: 'Interferential' },
  { value: 'shortwave_diathermy', label: 'Shortwave Diathermy' },
  { value: 'microwave_diathermy', label: 'Microwave Diathermy' },
  { value: 'paraffin_bath', label: 'Paraffin Bath' },
  { value: 'ice_machine', label: 'Ice Machine' },
  { value: 'exercise_equipment', label: 'Exercise Equipment' },
  { value: 'treadmill', label: 'Treadmill' },
  { value: 'exercise_bike', label: 'Exercise Bike' },
  { value: 'weight_training', label: 'Weight Training' },
  { value: 'balance_trainer', label: 'Balance Trainer' },
  { value: 'traction_unit', label: 'Traction Unit' },
  { value: 'cpm_machine', label: 'CPM Machine' },
  { value: 'biofeedback', label: 'Biofeedback' },
  { value: 'gait_trainer', label: 'Gait Trainer' },
  { value: 'parallel_bars', label: 'Parallel Bars' }
];

const COMPETENCY_LEVELS = ['basic', 'intermediate', 'advanced', 'certified'];

const EDUCATION_TYPES = ['degree', 'diploma', 'certificate', 'specialization'];
const EDUCATION_LEVELS = ['bachelor', 'master', 'doctorate', 'post_graduate', 'certificate'];

const WORKSHOP_TYPES = ['training', 'certification', 'conference', 'seminar', 'webinar', 'hands_on', 'continuing_education'];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
];

interface ProfileData {
  full_name: string;
  license_number: string;
  experience_level: string;
  years_of_experience: number;
  specializations: string[];
  bio: string;
  languages: string[];
  is_profile_complete: boolean;
  profile_completed_at?: string;
}

interface Education {
  id?: string;
  institution_name: string;
  degree_name: string;
  education_type: string;
  education_level: string;
  specialization?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  grade?: number;
  grade_system?: string;
  description?: string;
}

interface Technique {
  id?: string;
  technique_name: string;
  category: string;
  proficiency_level: string;
  years_of_practice?: number;
  description?: string;
  certification_body?: string;
  certified_date?: string;
  certification_expiry?: string;
}

interface Machine {
  id?: string;
  machine_name: string;
  category: string;
  competency_level: string;
  manufacturer?: string;
  model?: string;
  years_of_experience?: number;
  training_received?: string;
  certification_body?: string;
  certified_date?: string;
  certification_expiry?: string;
  is_certified?: boolean;
  notes?: string;
}

interface Workshop {
  id?: string;
  workshop_name: string;
  workshop_type: string;
  organizer_name: string;
  instructor_name?: string;
  start_date: string;
  end_date: string;
  duration_hours?: number;
  location?: string;
  is_online: boolean;
  topics_covered?: string;
  skills_learned?: string;
  certificate_url?: string;
  has_certificate: boolean;
  rating?: number;
  notes?: string;
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { userData } = useAppSelector(state => state.user);
  const { user: authUser } = useAppSelector(state => state.auth);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    license_number: '',
    experience_level: 'fresher',
    years_of_experience: 0,
    specializations: [],
    bio: '',
    languages: [],
    is_profile_complete: false
  });

  const [educations, setEducations] = useState<Education[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [bankAccount, setBankAccount] = useState({
    account_holder_name: '',
    bank_account_number: '',
    ifsc_code: '',
    bank_name: '',
    pan_number: '',
    aadhaar_number: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('profile');

  // Modal states
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);

  // Form states for modals
  const [newEducation, setNewEducation] = useState<Education>({
    institution_name: '',
    degree_name: '',
    education_type: 'degree',
    education_level: 'bachelor',
    start_date: '',
    is_current: false
  });

  const [newTechnique, setNewTechnique] = useState<Technique>({
    technique_name: '',
    category: 'manual_therapy',
    proficiency_level: 'beginner'
  });

  const [newMachine, setNewMachine] = useState<Machine>({
    machine_name: '',
    category: 'electrotherapy',
    competency_level: 'basic',
    is_certified: false
  });

  const [newWorkshop, setNewWorkshop] = useState<Workshop>({
    workshop_name: '',
    workshop_type: 'training',
    organizer_name: '',
    start_date: '',
    end_date: '',
    is_online: false,
    has_certificate: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    setProfile(prev => ({
      ...prev,
      full_name: authUser?.full_name || ''
    }));
  }, [authUser?.full_name]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getPhysiotherapistProfile();
      
      if (response.success && response.data) {
        setProfile({
          full_name: authUser?.full_name || '',
          license_number: response.data.license_number || '',
          experience_level: response.data.experience_level || 'fresher',
          years_of_experience: response.data.years_of_experience || 0,
          specializations: response.data.specializations || [],
          bio: response.data.bio || '',
          languages: response.data.languages || [],
          is_profile_complete: response.data.is_profile_complete || false,
          profile_completed_at: response.data.profile_completed_at
        });
        setEducations(response.data.education || []);
        setTechniques(response.data.techniques || []);
        setMachines(response.data.machines || []);
        setWorkshops(response.data.workshops || []);
        
        // Fetch bank account details separately
        const bankResponse = await ApiManager.getBankAccount();
        if (bankResponse.success && bankResponse.data) {
          setBankAccount(bankResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const profileData = {
        full_name: profile.full_name,
        license_number: profile.license_number,
        experience_level: profile.experience_level,
        years_of_experience: profile.years_of_experience,
        specializations: profile.specializations,
        bio: profile.bio,
        languages: profile.languages
      };
      const response = await ApiManager.createPhysiotherapistProfile(profileData);

      if (response.success) {
        if (profile.full_name !== authUser?.full_name && authUser) {
          dispatch(setUser({
            ...authUser,
            full_name: profile.full_name
          }));
        }
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = async () => {
    try {
      const response = await ApiManager.addEducation(newEducation);

      if (response.success) {
        setShowEducationModal(false);
        fetchProfile();
        setNewEducation({
          institution_name: '',
          degree_name: '',
          education_type: 'degree',
          education_level: 'bachelor',
          start_date: '',
          is_current: false
        });
      }
    } catch (error) {
      console.error('Error adding education:', error);
    }
  };

  const handleAddTechnique = async () => {
    try {
      const response = await ApiManager.addTechnique(newTechnique);

      if (response.success) {
        setShowTechniqueModal(false);
        fetchProfile();
        setNewTechnique({
          technique_name: '',
          category: 'manual_therapy',
          proficiency_level: 'beginner'
        });
      }
    } catch (error) {
      console.error('Error adding technique:', error);
    }
  };

  const handleAddMachine = async () => {
    try {
      const response = await ApiManager.addMachine(newMachine);

      if (response.success) {
        setShowMachineModal(false);
        fetchProfile();
        setNewMachine({
          machine_name: '',
          category: 'electrotherapy',
          competency_level: 'basic',
          is_certified: false
        });
      }
    } catch (error) {
      console.error('Error adding machine:', error);
    }
  };

  const handleAddWorkshop = async () => {
    try {
      const response = await ApiManager.addWorkshop(newWorkshop);

      if (response.success) {
        setShowWorkshopModal(false);
        fetchProfile();
        setNewWorkshop({
          workshop_name: '',
          workshop_type: 'training',
          organizer_name: '',
          start_date: '',
          end_date: '',
          is_online: false,
          has_certificate: false
        });
      }
    } catch (error) {
      console.error('Error adding workshop:', error);
    }
  };

  const formatSpecialization = (spec: string) => {
    return spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1e5f79] mb-3" />
            <span className="text-sm text-gray-600">Loading profile...</span>
          </div>
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
              <h1 className="text-2xl font-semibold text-gray-900">Physiotherapist Profile</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your professional profile and credentials</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Custom Tabs */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-1">
            <div className="grid grid-cols-7 gap-1">
              {[
                { value: 'profile', label: 'Profile', icon: User },
                { value: 'photos', label: 'Photos', icon: Camera },
                { value: 'education', label: 'Education', icon: GraduationCap },
                { value: 'techniques', label: 'Techniques', icon: Award },
                { value: 'machines', label: 'Machines', icon: SettingsIcon },
                { value: 'workshops', label: 'Workshops', icon: Calendar },
                { value: 'bank-account', label: 'Bank Account', icon: CreditCard }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedTab(tab.value)}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded transition-all ${
                      selectedTab === tab.value
                        ? 'bg-[#1e5f79] text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1 hidden sm:block" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden"><Icon className="h-4 w-4" /></span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Tab */}
          {selectedTab === 'profile' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-[#1e5f79]" />
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      id="full_name"
                      type="text"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                    <input
                      id="license"
                      type="text"
                      value={profile.license_number}
                      onChange={(e) => setProfile({...profile, license_number: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Enter your license number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={profile.experience_level}
                      onChange={(e) => setProfile({...profile, experience_level: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      {EXPERIENCE_LEVELS.map(level => (
                        <option key={level} value={level}>
                          {formatSpecialization(level)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="years" className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <input
                      id="years"
                      type="number"
                      value={profile.years_of_experience}
                      onChange={(e) => setProfile({...profile, years_of_experience: parseInt(e.target.value) || 0})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {isEditing ? (
                        <select
                          onChange={(e) => {
                            if (e.target.value && !profile.languages?.includes(e.target.value)) {
                              setProfile({...profile, languages: [...(profile.languages || []), e.target.value]});
                              e.target.value = '';
                            }
                          }}
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 text-sm"
                        >
                          <option value="">Add language</option>
                          {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      ) : null}
                      {profile.languages?.map((lang, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-[#eff8ff] text-[#1e5f79] rounded-full text-sm">
                          {lang}
                          {isEditing && (
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-red-600" 
                              onClick={() => setProfile({
                                ...profile, 
                                languages: profile.languages?.filter((_, i) => i !== index) || []
                              })}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isEditing ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value && !profile.specializations?.includes(e.target.value)) {
                            setProfile({...profile, specializations: [...(profile.specializations || []), e.target.value]});
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 text-sm"
                      >
                        <option value="">Add specialization</option>
                        {SPECIALIZATIONS.map(spec => (
                          <option key={spec} value={spec}>
                            {formatSpecialization(spec)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {profile.specializations?.map((spec, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-[#1e5f79] text-white rounded-full text-sm">
                        {formatSpecialization(spec)}
                        {isEditing && (
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-red-200" 
                            onClick={() => setProfile({
                              ...profile, 
                              specializations: profile.specializations?.filter((_, i) => i !== index) || []
                            })}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {selectedTab === 'photos' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Camera className="h-5 w-5 text-[#1e5f79]" />
                <h2 className="text-lg font-semibold text-gray-900">Profile Photos</h2>
              </div>
              <ProfilePhotoUpload 
                profileId={profile.id}
                onPhotoUpdate={() => {
                  fetchProfile();
                }}
              />
            </div>
          )}

          {/* Education Tab */}
          {selectedTab === 'education' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[#1e5f79]" />
                  <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                </div>
                <button
                  onClick={() => setShowEducationModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </button>
              </div>
              
              <div className="space-y-4">
                {educations?.map((edu, index) => (
                  <div key={index} className="p-4 bg-[#eff8ff] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{edu.degree_name}</h3>
                        <p className="text-sm text-gray-600">{edu.institution_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatSpecialization(edu.education_type)} • {formatSpecialization(edu.education_level)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                        </p>
                        {edu.description && (
                          <p className="text-sm text-gray-600 mt-2">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {educations?.length === 0 && (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No education records added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Techniques Tab */}
          {selectedTab === 'techniques' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#1e5f79]" />
                  <h2 className="text-lg font-semibold text-gray-900">Techniques</h2>
                </div>
                <button
                  onClick={() => setShowTechniqueModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Technique
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {techniques?.map((tech, index) => (
                  <div key={index} className="p-4 bg-[#eff8ff] rounded-lg">
                    <h3 className="font-semibold text-gray-900">{tech.technique_name}</h3>
                    <p className="text-sm text-gray-600">{formatSpecialization(tech.category)}</p>
                    <span className="inline-flex items-center px-2 py-1 bg-[#c8eaeb] text-[#1e5f79] rounded-full text-xs font-medium mt-2">
                      {formatSpecialization(tech.proficiency_level)}
                    </span>
                  </div>
                ))}
                {techniques?.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No techniques added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Machines Tab */}
          {selectedTab === 'machines' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-[#1e5f79]" />
                  <h2 className="text-lg font-semibold text-gray-900">Machines & Equipment</h2>
                </div>
                <button
                  onClick={() => setShowMachineModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Machine
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {machines?.map((machine, index) => (
                  <div key={index} className="p-4 bg-[#eff8ff] rounded-lg">
                    <h3 className="font-semibold text-gray-900">{machine.machine_name}</h3>
                    <p className="text-sm text-gray-600">{formatSpecialization(machine.category)}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-[#c8eaeb] text-[#1e5f79] rounded-full text-xs font-medium">
                        {formatSpecialization(machine.competency_level)}
                      </span>
                      {machine.is_certified && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          Certified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {machines?.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No machines added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workshops Tab */}
          {selectedTab === 'workshops' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#1e5f79]" />
                  <h2 className="text-lg font-semibold text-gray-900">Workshops & Training</h2>
                </div>
                <button
                  onClick={() => setShowWorkshopModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workshop
                </button>
              </div>
              
              <div className="space-y-4">
                {workshops?.map((workshop, index) => (
                  <div key={index} className="p-4 bg-[#eff8ff] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{workshop.workshop_name}</h3>
                        <p className="text-sm text-gray-600">{workshop.organizer_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatSpecialization(workshop.workshop_type)} • {workshop.start_date} - {workshop.end_date}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {workshop.is_online && (
                            <span className="inline-flex items-center px-2 py-1 bg-[#c8eaeb] text-[#1e5f79] rounded-full text-xs font-medium">
                              Online
                            </span>
                          )}
                          {workshop.has_certificate && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                              Certified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {workshops?.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No workshops added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education Modal */}
          {showEducationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Education</h3>
                  <button
                    onClick={() => setShowEducationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                    <input
                      type="text"
                      value={newEducation.institution_name}
                      onChange={(e) => setNewEducation({...newEducation, institution_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree Name</label>
                    <input
                      type="text"
                      value={newEducation.degree_name}
                      onChange={(e) => setNewEducation({...newEducation, degree_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education Type</label>
                    <select
                      value={newEducation.education_type}
                      onChange={(e) => setNewEducation({...newEducation, education_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    >
                      {EDUCATION_TYPES.map(type => (
                        <option key={type} value={type}>{formatSpecialization(type)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
                    <select
                      value={newEducation.education_level}
                      onChange={(e) => setNewEducation({...newEducation, education_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    >
                      {EDUCATION_LEVELS.map(level => (
                        <option key={level} value={level}>{formatSpecialization(level)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newEducation.start_date}
                      onChange={(e) => setNewEducation({...newEducation, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  {!newEducation.is_current && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={newEducation.end_date || ''}
                        onChange={(e) => setNewEducation({...newEducation, end_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newEducation.is_current}
                        onChange={(e) => setNewEducation({...newEducation, is_current: e.target.checked})}
                        className="rounded border-gray-300 text-[#1e5f79] focus:ring-[#1e5f79]"
                      />
                      <span className="text-sm text-gray-700">Currently studying</span>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newEducation.description || ''}
                      onChange={(e) => setNewEducation({...newEducation, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowEducationModal(false)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEducation}
                    className="px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    Add Education
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Technique Modal - Simplified */}
          {showTechniqueModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Technique</h3>
                  <button
                    onClick={() => setShowTechniqueModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technique Name</label>
                    <input
                      type="text"
                      value={newTechnique.technique_name}
                      onChange={(e) => setNewTechnique({...newTechnique, technique_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proficiency Level</label>
                    <select
                      value={newTechnique.proficiency_level}
                      onChange={(e) => setNewTechnique({...newTechnique, proficiency_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    >
                      {PROFICIENCY_LEVELS.map(level => (
                        <option key={level} value={level}>{formatSpecialization(level)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowTechniqueModal(false)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTechnique}
                    className="px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    Add Technique
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Machine Modal - Simplified */}
          {showMachineModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Machine</h3>
                  <button
                    onClick={() => setShowMachineModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Machine Name</label>
                    <input
                      type="text"
                      value={newMachine.machine_name}
                      onChange={(e) => setNewMachine({...newMachine, machine_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Competency Level</label>
                    <select
                      value={newMachine.competency_level}
                      onChange={(e) => setNewMachine({...newMachine, competency_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    >
                      {COMPETENCY_LEVELS.map(level => (
                        <option key={level} value={level}>{formatSpecialization(level)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowMachineModal(false)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMachine}
                    className="px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    Add Machine
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Workshop Modal - Simplified */}
          {showWorkshopModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Workshop</h3>
                  <button
                    onClick={() => setShowWorkshopModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workshop Name</label>
                    <input
                      type="text"
                      value={newWorkshop.workshop_name}
                      onChange={(e) => setNewWorkshop({...newWorkshop, workshop_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organizer</label>
                    <input
                      type="text"
                      value={newWorkshop.organizer_name}
                      onChange={(e) => setNewWorkshop({...newWorkshop, organizer_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={newWorkshop.start_date}
                        onChange={(e) => setNewWorkshop({...newWorkshop, start_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={newWorkshop.end_date}
                        onChange={(e) => setNewWorkshop({...newWorkshop, end_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowWorkshopModal(false)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddWorkshop}
                    className="px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                  >
                    Add Workshop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bank Account Tab */}
          {selectedTab === 'bank-account' && (
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#1e5f79]" />
                  <h2 className="text-lg font-semibold text-gray-900">Bank Account Details</h2>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await ApiManager.updateBankAccount(bankAccount);
                      alert('Bank account details updated successfully!');
                    } catch (error) {
                      console.error('Error updating bank account:', error);
                      alert('Failed to update bank account details');
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Details
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankAccount.account_holder_name}
                    onChange={(e) => setBankAccount({...bankAccount, account_holder_name: e.target.value})}
                    placeholder="Enter account holder name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccount.bank_account_number}
                    onChange={(e) => setBankAccount({...bankAccount, bank_account_number: e.target.value})}
                    placeholder="Enter bank account number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={bankAccount.ifsc_code}
                    onChange={(e) => setBankAccount({...bankAccount, ifsc_code: e.target.value})}
                    placeholder="Enter IFSC code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankAccount.bank_name}
                    onChange={(e) => setBankAccount({...bankAccount, bank_name: e.target.value})}
                    placeholder="Enter bank name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={bankAccount.pan_number}
                    onChange={(e) => setBankAccount({...bankAccount, pan_number: e.target.value})}
                    placeholder="Enter PAN number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number</label>
                  <input
                    type="text"
                    value={bankAccount.aadhaar_number}
                    onChange={(e) => setBankAccount({...bankAccount, aadhaar_number: e.target.value})}
                    placeholder="Enter Aadhaar number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
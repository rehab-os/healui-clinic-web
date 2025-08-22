'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Form } from '../../../components/ui/form';
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
  Filter
} from 'lucide-react';

// Import database data
import machinesData from '../../../../../../../database/machines/machines.json';

// Constants for dropdowns
const SPECIALIZATIONS = [
  'orthopedic', 'neurological', 'pediatric', 'geriatric', 'sports',
  'cardiac', 'pulmonary', 'women_health', 'pain_management', 'rehabilitation'
];

const EXPERIENCE_LEVELS = ['fresher', 'junior', 'senior', 'expert'];

// Comprehensive technique categories from physiotherapy practice
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

// Map machine types from JSON to enum values
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

// Get machine names from database
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
  license_number: string;
  experience_level: string;
  years_of_experience: number;
  specializations: string[];
  bio: string;
  languages: string[];
  is_profile_complete: boolean;
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
  const { userData } = useAppSelector(state => state.user);
  const [profile, setProfile] = useState<ProfileData>({
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
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('profile');

  // Modal states
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);

  // Search states
  const [machineSearchQuery, setMachineSearchQuery] = useState('');
  const [selectedMachineCategory, setSelectedMachineCategory] = useState('');
  const [techniqueSearchQuery, setTechniqueSearchQuery] = useState('');

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getPhysiotherapistProfile();
      
      if (response.success && response.data) {
        setProfile({
          license_number: response.data.license_number || '',
          experience_level: response.data.experience_level || 'fresher',
          years_of_experience: response.data.years_of_experience || 0,
          specializations: response.data.specializations || [],
          bio: response.data.bio || '',
          languages: response.data.languages || [],
          is_profile_complete: response.data.is_profile_complete || false
        });
        setEducations(response.data.educations || []);
        setTechniques(response.data.techniques || []);
        setMachines(response.data.machines || []);
        setWorkshops(response.data.workshops || []);
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
      // Always use POST endpoint which handles both create and update
      const profileData = {
        license_number: profile.license_number,
        experience_level: profile.experience_level,
        years_of_experience: profile.years_of_experience,
        specializations: profile.specializations,
        bio: profile.bio,
        languages: profile.languages
      };
      const response = await ApiManager.createPhysiotherapistProfile(profileData);

      if (response.success) {
        setIsEditing(false);
        fetchProfile();
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Physiotherapist Profile</h1>
          <p className="text-gray-600 mt-1">Manage your professional profile and credentials</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="techniques">Techniques</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={profile.license_number}
                    onChange={(e) => setProfile({...profile, license_number: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select 
                    value={profile.experience_level} 
                    onValueChange={(value) => setProfile({...profile, experience_level: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>
                          {formatSpecialization(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="years">Years of Experience</Label>
                  <Input
                    id="years"
                    type="number"
                    value={profile.years_of_experience}
                    onChange={(e) => setProfile({...profile, years_of_experience: parseInt(e.target.value) || 0})}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isEditing ? (
                      <Select onValueChange={(value) => {
                        if (!profile.languages?.includes(value)) {
                          setProfile({...profile, languages: [...(profile.languages || []), value]});
                        }
                      }}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Add language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    {profile.languages?.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {lang}
                        {isEditing && (
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setProfile({
                              ...profile, 
                              languages: profile.languages?.filter((_, i) => i !== index) || []
                            })}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Specializations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {isEditing ? (
                    <Select onValueChange={(value) => {
                      if (!profile.specializations?.includes(value)) {
                        setProfile({...profile, specializations: [...(profile.specializations || []), value]});
                      }
                    }}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Add specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map(spec => (
                          <SelectItem key={spec} value={spec}>
                            {formatSpecialization(spec)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  {profile.specializations?.map((spec, index) => (
                    <Badge key={index} variant="default" className="flex items-center gap-1 bg-healui-physio text-white border-healui-physio hover:bg-healui-physio/90">
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
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
              <Dialog open={showEducationModal} onOpenChange={setShowEducationModal}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Education</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Institution Name</Label>
                      <Input
                        value={newEducation.institution_name}
                        onChange={(e) => setNewEducation({...newEducation, institution_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Degree Name</Label>
                      <Input
                        value={newEducation.degree_name}
                        onChange={(e) => setNewEducation({...newEducation, degree_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Education Type</Label>
                      <Select value={newEducation.education_type} onValueChange={(value) => setNewEducation({...newEducation, education_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{formatSpecialization(type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Education Level</Label>
                      <Select value={newEducation.education_level} onValueChange={(value) => setNewEducation({...newEducation, education_level: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{formatSpecialization(level)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newEducation.start_date}
                        onChange={(e) => setNewEducation({...newEducation, start_date: e.target.value})}
                      />
                    </div>
                    {!newEducation.is_current && (
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={newEducation.end_date || ''}
                          onChange={(e) => setNewEducation({...newEducation, end_date: e.target.value})}
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newEducation.is_current}
                          onChange={(e) => setNewEducation({...newEducation, is_current: e.target.checked})}
                        />
                        <span>Currently studying</span>
                      </label>
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newEducation.description || ''}
                        onChange={(e) => setNewEducation({...newEducation, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowEducationModal(false)}>Cancel</Button>
                    <Button onClick={handleAddEducation}>Add Education</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {educations?.map((edu, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{edu.degree_name}</h3>
                        <p className="text-sm text-gray-600">{edu.institution_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatSpecialization(edu.education_type)} • {formatSpecialization(edu.education_level)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similar structure for Techniques, Machines, and Workshops tabs */}
        <TabsContent value="techniques">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Techniques
              </CardTitle>
              <Dialog open={showTechniqueModal} onOpenChange={setShowTechniqueModal}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Technique
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Add Physiotherapy Technique</DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Search Section */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label>Search Techniques</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search for techniques..."
                          value={techniqueSearchQuery}
                          onChange={(e) => setTechniqueSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Technique Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                      {TECHNIQUE_CATEGORIES
                        .filter(technique => 
                          techniqueSearchQuery === '' || 
                          technique.toLowerCase().includes(techniqueSearchQuery.toLowerCase())
                        )
                        .map((technique, index) => (
                        <div 
                          key={index} 
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-healui-physio hover:bg-healui-physio/5 ${
                            newTechnique.technique_name === technique ? 'border-healui-physio bg-healui-physio/10' : ''
                          }`}
                          onClick={() => setNewTechnique({
                            ...newTechnique,
                            technique_name: technique,
                            category: technique.includes('manual') ? 'manual_therapy' : 
                                     technique.includes('exercise') ? 'exercise_therapy' :
                                     technique.includes('electro') ? 'electrotherapy' :
                                     technique.includes('tape') || technique.includes('taping') ? 'taping' :
                                     technique.includes('massage') ? 'massage_therapy' :
                                     technique.includes('mobilization') || technique.includes('manipulation') ? 'joint_techniques' :
                                     'manual_therapy'
                          })}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {formatSpecialization(technique)}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 capitalize">
                                {technique.includes('manual') ? 'Manual Therapy' : 
                                 technique.includes('exercise') ? 'Exercise Therapy' :
                                 technique.includes('electro') ? 'Electrotherapy' :
                                 technique.includes('tape') || technique.includes('taping') ? 'Taping Technique' :
                                 technique.includes('massage') ? 'Massage Therapy' :
                                 technique.includes('mobilization') || technique.includes('manipulation') ? 'Joint Techniques' :
                                 'Manual Therapy'}
                              </p>
                            </div>
                            {newTechnique.technique_name === technique && (
                              <div className="w-4 h-4 bg-healui-physio rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Custom Technique Input */}
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <Label>Or add a custom technique</Label>
                      <Input
                        placeholder="Enter custom technique name..."
                        value={newTechnique.technique_name.startsWith('custom_') ? newTechnique.technique_name.replace('custom_', '') : ''}
                        onChange={(e) => setNewTechnique({
                          ...newTechnique,
                          technique_name: e.target.value ? `custom_${e.target.value}` : '',
                          category: 'manual_therapy'
                        })}
                        className="mt-1"
                      />
                    </div>

                    {/* Selected Technique Details */}
                    {newTechnique.technique_name && (
                      <div className="p-4 bg-healui-physio/5 border border-healui-physio/20 rounded-lg">
                        <h3 className="font-semibold text-healui-physio mb-2">
                          Selected: {newTechnique.technique_name.startsWith('custom_') 
                            ? newTechnique.technique_name.replace('custom_', '') 
                            : formatSpecialization(newTechnique.technique_name)
                          }
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <Select value={newTechnique.category} onValueChange={(value) => setNewTechnique({...newTechnique, category: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual_therapy">Manual Therapy</SelectItem>
                                <SelectItem value="exercise_therapy">Exercise Therapy</SelectItem>
                                <SelectItem value="electrotherapy">Electrotherapy</SelectItem>
                                <SelectItem value="taping">Taping Technique</SelectItem>
                                <SelectItem value="massage_therapy">Massage Therapy</SelectItem>
                                <SelectItem value="joint_techniques">Joint Techniques</SelectItem>
                                <SelectItem value="soft_tissue">Soft Tissue</SelectItem>
                                <SelectItem value="specialized">Specialized Technique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Proficiency Level</Label>
                            <Select value={newTechnique.proficiency_level} onValueChange={(value) => setNewTechnique({...newTechnique, proficiency_level: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PROFICIENCY_LEVELS.map(level => (
                                  <SelectItem key={level} value={level}>{formatSpecialization(level)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Years of Practice (Optional)</Label>
                            <Input
                              type="number"
                              value={newTechnique.years_of_practice || ''}
                              onChange={(e) => setNewTechnique({...newTechnique, years_of_practice: parseInt(e.target.value) || 0})}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Certification Body (Optional)</Label>
                            <Input
                              value={newTechnique.certification_body || ''}
                              onChange={(e) => setNewTechnique({...newTechnique, certification_body: e.target.value})}
                              placeholder="e.g. IAOM, IPA, McKenzie"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                              value={newTechnique.description || ''}
                              onChange={(e) => setNewTechnique({...newTechnique, description: e.target.value})}
                              placeholder="Describe your experience or specialization with this technique..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => {
                      setShowTechniqueModal(false);
                      setTechniqueSearchQuery('');
                    }}>Cancel</Button>
                    <Button onClick={handleAddTechnique} disabled={!newTechnique.technique_name}>
                      Add Technique
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {techniques?.map((tech, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{tech.technique_name}</h3>
                    <p className="text-sm text-gray-600">{formatSpecialization(tech.category)}</p>
                    <Badge size="sm" variant="outline" className="mt-2">
                      {formatSpecialization(tech.proficiency_level)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Machines & Equipment
              </CardTitle>
              <Dialog open={showMachineModal} onOpenChange={setShowMachineModal}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Machine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Add Machine & Equipment</DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Search and Filter Section */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label>Search Machines</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search by name or usage..."
                              value={machineSearchQuery}
                              onChange={(e) => setMachineSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="w-64">
                          <Label>Filter by Category</Label>
                          <Select value={selectedMachineCategory} onValueChange={setSelectedMachineCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {MACHINE_CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Machine Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {AVAILABLE_MACHINES
                        .filter(machine => {
                          const matchesSearch = machineSearchQuery === '' || 
                            machine.name.toLowerCase().includes(machineSearchQuery.toLowerCase()) ||
                            machine.usedIn.some(use => use.toLowerCase().includes(machineSearchQuery.toLowerCase()));
                          const matchesCategory = selectedMachineCategory === '' || selectedMachineCategory === 'all' || machine.enumType === selectedMachineCategory;
                          return matchesSearch && matchesCategory;
                        })
                        .map((machine, index) => (
                        <div 
                          key={index} 
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-healui-physio hover:bg-healui-physio/5 ${
                            newMachine.machine_name === machine.name ? 'border-healui-physio bg-healui-physio/10' : ''
                          }`}
                          onClick={() => setNewMachine({
                            ...newMachine,
                            machine_name: machine.name,
                            category: machine.enumType
                          })}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{machine.name}</h4>
                              <p className="text-xs text-gray-500 mb-2">{machine.type}</p>
                              <div className="flex flex-wrap gap-1">
                                {machine.usedIn.slice(0, 3).map((use, useIndex) => (
                                  <Badge key={useIndex} variant="secondary" className="text-xs">
                                    {use}
                                  </Badge>
                                ))}
                                {machine.usedIn.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{machine.usedIn.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Machine Details */}
                    {newMachine.machine_name && (
                      <div className="p-4 bg-healui-physio/5 border border-healui-physio/20 rounded-lg">
                        <h3 className="font-semibold text-healui-physio mb-2">Selected: {newMachine.machine_name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Competency Level</Label>
                            <Select value={newMachine.competency_level} onValueChange={(value) => setNewMachine({...newMachine, competency_level: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COMPETENCY_LEVELS.map(level => (
                                  <SelectItem key={level} value={level}>{formatSpecialization(level)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Years of Experience</Label>
                            <Input
                              type="number"
                              value={newMachine.years_of_experience || ''}
                              onChange={(e) => setNewMachine({...newMachine, years_of_experience: parseInt(e.target.value) || 0})}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Manufacturer (Optional)</Label>
                            <Input
                              value={newMachine.manufacturer || ''}
                              onChange={(e) => setNewMachine({...newMachine, manufacturer: e.target.value})}
                              placeholder="e.g. Chattanooga, Enraf-Nonius"
                            />
                          </div>
                          <div>
                            <Label>Model (Optional)</Label>
                            <Input
                              value={newMachine.model || ''}
                              onChange={(e) => setNewMachine({...newMachine, model: e.target.value})}
                              placeholder="Model number or name"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={newMachine.is_certified || false}
                                onChange={(e) => setNewMachine({...newMachine, is_certified: e.target.checked})}
                              />
                              <span>I am certified to use this equipment</span>
                            </label>
                          </div>
                          {newMachine.is_certified && (
                            <div className="col-span-2">
                              <Label>Certification Details (Optional)</Label>
                              <Input
                                value={newMachine.certification_body || ''}
                                onChange={(e) => setNewMachine({...newMachine, certification_body: e.target.value})}
                                placeholder="Certification body or course name"
                              />
                            </div>
                          )}
                          <div className="col-span-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                              value={newMachine.notes || ''}
                              onChange={(e) => setNewMachine({...newMachine, notes: e.target.value})}
                              placeholder="Additional notes about your experience with this equipment..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => {
                      setShowMachineModal(false);
                      setMachineSearchQuery('');
                      setSelectedMachineCategory('');
                    }}>Cancel</Button>
                    <Button onClick={handleAddMachine} disabled={!newMachine.machine_name}>
                      Add Machine
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {machines?.map((machine, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{machine.machine_name}</h3>
                    <p className="text-sm text-gray-600">{formatSpecialization(machine.category)}</p>
                    <Badge size="sm" variant="outline" className="mt-2">
                      {formatSpecialization(machine.competency_level)}
                    </Badge>
                    {machine.is_certified && (
                      <Badge size="sm" variant="default" className="mt-2 ml-2">
                        Certified
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshops">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Workshops & Training
              </CardTitle>
              <Dialog open={showWorkshopModal} onOpenChange={setShowWorkshopModal}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Workshop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Workshop</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Workshop Name</Label>
                      <Input
                        value={newWorkshop.workshop_name}
                        onChange={(e) => setNewWorkshop({...newWorkshop, workshop_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Workshop Type</Label>
                      <Select value={newWorkshop.workshop_type} onValueChange={(value) => setNewWorkshop({...newWorkshop, workshop_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKSHOP_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{formatSpecialization(type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Organizer Name</Label>
                      <Input
                        value={newWorkshop.organizer_name}
                        onChange={(e) => setNewWorkshop({...newWorkshop, organizer_name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newWorkshop.start_date}
                          onChange={(e) => setNewWorkshop({...newWorkshop, start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={newWorkshop.end_date}
                          onChange={(e) => setNewWorkshop({...newWorkshop, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newWorkshop.is_online}
                          onChange={(e) => setNewWorkshop({...newWorkshop, is_online: e.target.checked})}
                        />
                        <span>Online Workshop</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowWorkshopModal(false)}>Cancel</Button>
                    <Button onClick={handleAddWorkshop}>Add Workshop</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workshops?.map((workshop, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{workshop.workshop_name}</h3>
                        <p className="text-sm text-gray-600">{workshop.organizer_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatSpecialization(workshop.workshop_type)} • {workshop.start_date} - {workshop.end_date}
                        </p>
                        {workshop.is_online && (
                          <Badge size="sm" variant="outline" className="mt-2">
                            Online
                          </Badge>
                        )}
                        {workshop.has_certificate && (
                          <Badge size="sm" variant="default" className="mt-2 ml-2">
                            Certified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AddTeamMemberModal from '../../../components/molecule/AddTeamMemberModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { 
  UserPlus,
  Users,
  Stethoscope,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Clock,
  Award,
  MapPin,
  Building,
  User
} from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'physiotherapist' | 'receptionist';
  is_admin: boolean;
  clinic_id: string;
  clinic_name: string;
  is_profile_complete: boolean;
  profile_completed_at?: Date;
  created_at: string;
  user_status: string;
}

interface GroupedMember {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  user_status: string;
  is_profile_complete: boolean;
  created_at: string;
  clinics: {
    clinic_id: string;
    clinic_name: string;
    role: 'physiotherapist' | 'receptionist';
    is_admin: boolean;
  }[];
}

interface TeamData {
  members: TeamMember[];
  total_count: number;
  physiotherapists_count: number;
  receptionists_count: number;
}

export default function TeamPage() {
  const { userData, currentClinic } = useAppSelector(state => state.user);
  const [teamData, setTeamData] = useState<TeamData>({
    members: [],
    total_count: 0,
    physiotherapists_count: 0,
    receptionists_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'physiotherapist' | 'receptionist'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, [currentClinic]);

  const fetchTeamMembers = async () => {
    if (!userData?.organization?.id) return;
    
    try {
      setLoading(true);
      const response = await ApiManager.getTeamMembers(
        userData.organization.id,
        currentClinic?.id
      );
      if (response.success) {
        setTeamData(response.data || {
          members: [],
          total_count: 0,
          physiotherapists_count: 0,
          receptionists_count: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group members by user ID
  const groupedMembers: GroupedMember[] = React.useMemo(() => {
    const grouped = new Map<string, GroupedMember>();
    
    teamData.members.forEach(member => {
      if (grouped.has(member.id)) {
        grouped.get(member.id)!.clinics.push({
          clinic_id: member.clinic_id,
          clinic_name: member.clinic_name,
          role: member.role,
          is_admin: member.is_admin
        });
      } else {
        grouped.set(member.id, {
          id: member.id,
          full_name: member.full_name,
          phone: member.phone,
          email: member.email,
          user_status: member.user_status,
          is_profile_complete: member.is_profile_complete,
          created_at: member.created_at,
          clinics: [{
            clinic_id: member.clinic_id,
            clinic_name: member.clinic_name,
            role: member.role,
            is_admin: member.is_admin
          }]
        });
      }
    });
    
    return Array.from(grouped.values());
  }, [teamData.members]);

  const filteredMembers = groupedMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.clinics.some(c => c.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.clinics.some(c => c.role === roleFilter);
    
    return matchesSearch && matchesRole;
  });

  const handleAddTeamMember = () => {
    setShowAddModal(true);
  };

  if (!userData?.organization?.is_owner && !currentClinic?.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 text-center">
              Only organization administrators and clinic administrators can manage team members.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            {currentClinic 
              ? `Managing ${currentClinic.name} team`
              : 'Managing all organization members'
            }
          </p>
        </div>
        <Button onClick={handleAddTeamMember} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{groupedMembers.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Physiotherapists</p>
                <p className="text-2xl font-bold text-gray-900">{teamData.physiotherapists_count}</p>
              </div>
              <div className="p-3 bg-healui-physio/10 rounded-lg">
                <Stethoscope className="h-6 w-6 text-healui-physio" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receptionists</p>
                <p className="text-2xl font-bold text-gray-900">{teamData.receptionists_count}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Complete Profiles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedMembers.filter(m => m.is_profile_complete).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or clinic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="physiotherapist">Physiotherapists</option>
              <option value="receptionist">Receptionists</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healui-physio"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' ? 'No team members found' : 'No team members yet'}
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your search terms or filters' 
                : 'Get started by adding your first team member'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && (
              <Button onClick={handleAddTeamMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddModal && (
        <AddTeamMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTeamMembers();
          }}
        />
      )}
    </div>
  );
}

interface TeamMemberCardProps {
  member: GroupedMember;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'physiotherapist':
        return 'bg-healui-physio/10 text-healui-physio border-healui-physio/20';
      case 'receptionist':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-healui-physio to-purple-600 flex items-center justify-center text-white font-semibold">
              {getInitials(member.full_name)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{member.full_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {member.is_profile_complete ? (
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Profile Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Profile Pending
                  </Badge>
                )}
                {member.user_status === 'ACTIVE' ? (
                  <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Member
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Member
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{member.phone}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Building className="h-4 w-4 mr-1" />
            Clinic Assignments ({member.clinics.length})
          </h4>
          <div className="space-y-2">
            {member.clinics.map((clinic) => (
              <div key={clinic.clinic_id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{clinic.clinic_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${getRoleColor(clinic.role)}`}>
                        {clinic.role === 'physiotherapist' ? (
                          <Stethoscope className="h-3 w-3 mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        {clinic.role}
                      </Badge>
                      {clinic.is_admin && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
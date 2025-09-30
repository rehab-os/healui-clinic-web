'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '../../../services/api';
import AddTeamMemberModal from '../../../components/molecule/AddTeamMemberModal';
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
  User,
  Loader2,
  AlertCircle
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
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg p-8 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center">
            Only organization administrators and clinic administrators can manage team members.
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
              <h1 className="text-2xl font-semibold text-gray-900">Team Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                {currentClinic 
                  ? `Managing ${currentClinic.name} team`
                  : 'Managing all organization members'
                }
              </p>
            </div>
            
            <button
              onClick={handleAddTeamMember}
              className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-semibold text-gray-900">{groupedMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-[#1e5f79]/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Physiotherapists</p>
                <p className="text-2xl font-semibold text-[#1e5f79]">{teamData.physiotherapists_count}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-[#1e5f79]/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Receptionists</p>
                <p className="text-2xl font-semibold text-green-600">{teamData.receptionists_count}</p>
              </div>
              <User className="h-8 w-8 text-green-600/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Complete Profiles</p>
                <p className="text-2xl font-semibold text-green-600">
                  {groupedMembers.filter(m => m.is_profile_complete).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or clinic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] transition-all"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="physiotherapist">Physiotherapists</option>
              <option value="receptionist">Receptionists</option>
            </select>
          </div>
        </div>

        {/* Team Members */}
        {loading ? (
          <div className="bg-white rounded-lg p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e5f79] mb-3" />
              <span className="text-sm text-gray-600">Loading team members...</span>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
              <button
                onClick={handleAddTeamMember}
                className="inline-flex items-center px-4 py-2 bg-[#1e5f79] text-white text-sm font-medium rounded-lg hover:bg-[#1e5f79]/90 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Team Member
              </button>
            )}
          </div>
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
        return 'bg-[#c8eaeb] text-[#1e5f79]';
      case 'receptionist':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusColor = (status: string, isComplete: boolean) => {
    if (isComplete) {
      return 'bg-green-50 text-green-700';
    }
    return 'bg-[#eff8ff] text-[#1e5f79]';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        {/* Header with Avatar and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-[#1e5f79] flex items-center justify-center text-white font-semibold">
              {getInitials(member.full_name)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{member.full_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  member.is_profile_complete 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-[#eff8ff] text-[#1e5f79]'
                }`}>
                  {member.is_profile_complete ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Complete</>
                  ) : (
                    <><Clock className="h-3 w-3 mr-1" />Pending</>
                  )}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  member.user_status === 'ACTIVE' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  {member.user_status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
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

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{member.phone}</span>
          </div>
        </div>

        {/* Clinic Assignments */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Building className="h-4 w-4 mr-1" />
            Clinic Assignments ({member.clinics.length})
          </h4>
          <div className="space-y-2">
            {member.clinics.map((clinic) => (
              <div key={clinic.clinic_id} className="p-3 bg-[#eff8ff] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{clinic.clinic_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(clinic.role)}`}>
                        {clinic.role === 'physiotherapist' ? (
                          <Stethoscope className="h-3 w-3 mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        {clinic.role}
                      </span>
                      {clinic.is_admin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
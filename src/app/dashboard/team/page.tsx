'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import ApiManager from '@/services/api/api.service';
import AddTeamMemberModal from '../../../components/features/team/AddTeamMemberModal';
import {
  UserPlus,
  Users,
  Stethoscope,
  Phone,
  Mail,
  Shield,
  Search,
  Building,
  User,
  Loader2,
  AlertCircle,
  Plus,
  XCircle,
  Crown
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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

  const ownerUserId = userData?.organization?.is_owner ? userData.user_id : null;

  const filteredMembers = groupedMembers
    .filter(member => {
      const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.clinics.some(c => c.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'all' || member.clinics.some(c => c.role === roleFilter);

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Owner always on top
      if (ownerUserId && a.id === ownerUserId) return -1;
      if (ownerUserId && b.id === ownerUserId) return 1;
      return 0;
    });

  if (!userData?.organization?.is_owner && !currentClinic?.is_admin) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg p-8 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only organization administrators and clinic administrators can manage team members.
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
          <h1 className="text-base font-semibold text-gray-900">Team</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-gray-100 text-brand-teal' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 text-brand-teal hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile: expandable search + filter */}
        {showMobileSearch && (
          <div className="sm:hidden px-4 pb-3 space-y-2 border-t border-gray-100">
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team..."
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
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value="all">All Roles</option>
              <option value="physiotherapist">Physiotherapists</option>
              <option value="receptionist">Receptionists</option>
            </select>
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
                  placeholder="Search team..."
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

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
              >
                <option value="all">All Roles</option>
                <option value="physiotherapist">Physiotherapists</option>
                <option value="receptionist">Receptionists</option>
              </select>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-brand-teal text-white inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Team Table */}
        {loading ? (
          <div className="bg-white rounded-lg p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal mb-3" />
              <span className="text-sm text-gray-600">Loading team...</span>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' ? 'No team members found' : 'No team members yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Get started by adding your first team member'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary inline-flex items-center px-4 py-2"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Team Member
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Member count */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                        Phone
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Clinic
                      </th>
                      <th className="px-4 py-2.5">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <MemberRow key={member.id} member={member} ownerUserId={ownerUserId} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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

interface MemberRowProps {
  member: GroupedMember;
  ownerUserId: string | null;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, ownerUserId }) => {
  const isOwner = ownerUserId != null && member.id === ownerUserId;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Primary role (first clinic assignment)
  const primaryRole = member.clinics[0]?.role;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Member name + role */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${isOwner ? 'bg-indigo-600' : 'bg-brand-teal'}`}>
            {getInitials(member.full_name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{member.full_name}</span>
              {isOwner ? (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-100 rounded flex-shrink-0 hidden sm:inline-flex items-center gap-0.5">
                  <Crown className="h-2.5 w-2.5" />
                  Owner
                </span>
              ) : null}
            </div>
            {/* Mobile subtitle: role + phone + owner/admin tag */}
            <div className="sm:hidden mt-0.5 flex items-center gap-2 text-xs text-gray-500">
              <span className={`inline-flex items-center gap-0.5 ${primaryRole === 'physiotherapist' ? 'text-brand-teal' : 'text-green-600'}`}>
                {primaryRole === 'physiotherapist' ? <Stethoscope className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {primaryRole === 'physiotherapist' ? 'Physio' : 'Reception'}
              </span>
              <span className="text-gray-300">|</span>
              <span>{member.phone}</span>
              {isOwner && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-0.5 text-indigo-600 font-medium">
                    <Crown className="h-3 w-3" />
                    Owner
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Phone + role badge — hidden on mobile */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <div>
          <span className="text-sm text-gray-600">{member.phone}</span>
          <div className="mt-0.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
              primaryRole === 'physiotherapist' ? 'text-brand-teal' : 'text-green-600'
            }`}>
              {primaryRole === 'physiotherapist' ? <Stethoscope className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {primaryRole === 'physiotherapist' ? 'Physiotherapist' : 'Receptionist'}
            </span>
          </div>
        </div>
      </td>

      {/* Clinic — hidden on mobile + tablet */}
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {isOwner ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-indigo-600 bg-indigo-50 rounded font-medium">
              Admin of all clinics
            </span>
          ) : (
            member.clinics.map((clinic) => (
              <span
                key={clinic.clinic_id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded"
              >
                <Building className="h-3 w-3 text-gray-400" />
                {clinic.clinic_name}
                {clinic.is_admin && (
                  <Shield className="h-2.5 w-2.5 text-orange-500 ml-0.5" />
                )}
              </span>
            ))
          )}
        </div>
      </td>

      {/* Spacer for alignment */}
      <td className="px-4 py-3 text-right">
      </td>
    </tr>
  );
};

'use client';

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCurrentClinic, setCurrentContext } from '../../store/slices/userSlice';
import { 
  ChevronDown, 
  Check, 
  Building2, 
  Shield, 
  Stethoscope,
  User,
  UserCheck,
  Star,
  Heart,
  Activity,
  Users
} from 'lucide-react';

const ContextSwitcher: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userData, currentClinic, currentContext } = useAppSelector(state => state.user);
  const [isOpen, setIsOpen] = useState(false);

  if (!userData) {
    return null;
  }

  const handleClinicChange = (clinic: typeof currentClinic) => {
    if (clinic) {
      dispatch(setCurrentClinic(clinic));
      setIsOpen(false);
    }
  };

  const handleMyPracticeSelect = () => {
    dispatch(setCurrentContext('my-practice'));
    setIsOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'physiotherapist':
        return <Activity className="h-3 w-3" />;
      case 'receptionist':
        return <Users className="h-3 w-3" />;
      case 'manager':
        return <Star className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getClinicIcon = (clinicName: string, isAdmin: boolean = false) => {
    // Determine clinic type based on name or other properties
    const name = clinicName.toLowerCase();
    
    if (name.includes('physio') || name.includes('therapy') || name.includes('rehab')) {
      return <Activity className="h-4 w-4 text-brand-teal" />;
    } else if (name.includes('sports') || name.includes('athletic')) {
      return <Heart className="h-4 w-4 text-brand-teal" />;
    } else if (name.includes('wellness') || name.includes('health')) {
      return <Stethoscope className="h-4 w-4 text-brand-teal" />;
    } else {
      return <Building2 className="h-4 w-4 text-brand-teal" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-brand-white border border-gray-200 rounded-md hover:bg-brand-teal/5 hover:border-brand-teal/30 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <p className="text-xs sm:text-sm font-semibold text-brand-black truncate max-w-[80px] sm:max-w-[150px] lg:max-w-[200px]">
                {currentContext === 'my-practice' 
                  ? 'My Practice' 
                  : currentClinic?.name || userData.organization?.name || 'Select Clinic'
                }
              </p>
              {/* Show blue shield for admins only */}
              {currentContext !== 'my-practice' && (
                (userData.organization?.is_owner || currentClinic?.is_admin) && (
                  <Shield className="h-3 w-3 text-blue-600" />
                )
              )}
            </div>
          </div>
        </div>
        <ChevronDown 
          className={`h-3 w-3 sm:h-4 sm:w-4 text-brand-black/50 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[280px] sm:w-[320px] bg-brand-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden backdrop-blur-sm">
          <div className="p-0">
            {userData.organization && (
              <>
                {userData.organization.is_owner && (
                  <>
                    <div className="px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-brand-black/60 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100 flex items-center space-x-2">
                      <Building2 className="h-3.5 w-3.5 text-brand-black/60" />
                      <span>Organization</span>
                    </div>
                    <button
                      onClick={() => {
                        dispatch(setCurrentClinic(null));
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-brand-teal/5 transition-all duration-200 ${
                        !currentClinic && currentContext !== 'my-practice' ? 'bg-brand-teal/10 border-l-3 border-brand-teal' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <p className="text-base font-medium text-brand-black">
                              {userData.organization.name}
                            </p>
                            <Shield className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      {!currentClinic && currentContext !== 'my-practice' && <Check className="h-4 w-4 text-brand-teal" />}
                    </button>
                    <div className="border-t border-gray-100"></div>
                  </>
                )}

                <div className="px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-brand-black/60 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100 flex items-center space-x-2">
                  <Building2 className="h-3.5 w-3.5 text-brand-black/60" />
                  <span>Clinics</span>
                </div>
                {userData.organization.clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => handleClinicChange(clinic)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-brand-teal/5 transition-all duration-200 ${
                  currentClinic?.id === clinic.id ? 'bg-brand-teal/10 border-l-3 border-brand-teal' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <p className="text-base font-medium text-brand-black">
                        {clinic.name}
                      </p>
                      {clinic.is_admin && (
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
                {currentClinic?.id === clinic.id && (
                  <Check className="h-4 w-4 text-brand-teal" />
                )}
              </button>
                ))}
              </>
            )}

            {userData.organization && (
              <div className="border-t border-gray-100"></div>
            )}
            <div className="px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-brand-black/60 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100 flex items-center space-x-2">
              <UserCheck className="h-3.5 w-3.5 text-brand-black/60" />
              <span>Personal Practice</span>
            </div>
            <button
              onClick={handleMyPracticeSelect}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-brand-teal/5 transition-all duration-200 ${
                currentContext === 'my-practice' ? 'bg-brand-teal/10 border-l-3 border-brand-teal' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-left">
                  <p className="text-base font-medium text-brand-black">
                    My Practice
                  </p>
                </div>
              </div>
              {currentContext === 'my-practice' && (
                <Check className="h-4 w-4 text-brand-teal" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher;
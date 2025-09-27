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
  UserCheck
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
        return <Stethoscope className="h-3 w-3" />;
      case 'receptionist':
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-white border border-border-color rounded-lg hover:bg-healui-physio/5 transition-all duration-200"
      >
        <div className="flex items-center space-x-1 sm:space-x-2">
          {currentContext === 'my-practice' ? (
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-text-gray" />
          ) : (
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-text-gray" />
          )}
          <div className="text-left">
            <p className="text-xs sm:text-sm font-medium text-text-dark truncate max-w-20 sm:max-w-none">
              {currentContext === 'my-practice' 
                ? 'My Practice' 
                : currentClinic?.name || userData.organization?.name || 'My Practice'
              }
            </p>
            <p className="text-xs text-text-light hidden sm:block">
              {currentContext === 'my-practice' ? (
                <span className="flex items-center space-x-1">
                  <Stethoscope className="h-3 w-3" />
                  <span>Personal Practice</span>
                </span>
              ) : userData.organization.is_owner ? (
                <span className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Organization Admin</span>
                </span>
              ) : currentClinic ? (
                <span className="flex items-center space-x-1">
                  {getRoleIcon(currentClinic.role)}
                  <span>{currentClinic.role}</span>
                </span>
              ) : (
                'Select a clinic'
              )}
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`h-3 w-3 sm:h-4 sm:w-4 text-text-light transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 sm:left-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-physio border border-border-color z-50">
          <div className="p-2">
            {userData.organization && (
              <>
                {userData.organization.is_owner && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-text-light uppercase tracking-wider">
                      Organization
                    </div>
                    <button
                      onClick={() => {
                        dispatch(setCurrentClinic(null));
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-healui-physio/5 transition-all duration-200 ${
                        !currentClinic ? 'bg-healui-physio/10' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-4 w-4 text-text-gray" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-text-dark">
                            {userData.organization.name}
                          </p>
                          <p className="text-xs text-text-light flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>Organization Admin</span>
                          </p>
                        </div>
                      </div>
                      {!currentClinic && <Check className="h-4 w-4 text-healui-physio" />}
                    </button>
                    <div className="my-2 border-t border-border-color"></div>
                  </>
                )}

                <div className="px-3 py-2 text-xs font-medium text-text-light uppercase tracking-wider">
                  Clinics
                </div>
                {userData.organization.clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => handleClinicChange(clinic)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-healui-physio/5 transition-all duration-200 ${
                  currentClinic?.id === clinic.id ? 'bg-healui-physio/10' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-4 w-4 text-text-gray" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-dark">
                      {clinic.name}
                    </p>
                    <p className="text-xs text-text-light flex items-center space-x-1">
                      {getRoleIcon(clinic.role)}
                      <span>{clinic.role}</span>
                      {clinic.is_admin && (
                        <>
                          <span className="text-text-light">&quot;</span>
                          <span className="text-healui-physio">Clinic Admin</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {currentClinic?.id === clinic.id && (
                  <Check className="h-4 w-4 text-healui-physio" />
                )}
              </button>
                ))}
              </>
            )}

            {userData.organization && (
              <div className="my-2 border-t border-border-color"></div>
            )}
            <div className="px-3 py-2 text-xs font-medium text-text-light uppercase tracking-wider">
              Personal Practice
            </div>
            <button
              onClick={handleMyPracticeSelect}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-healui-physio/5 transition-all duration-200 ${
                currentContext === 'my-practice' ? 'bg-healui-physio/10' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <UserCheck className="h-4 w-4 text-text-gray" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-dark">
                    My Practice
                  </p>
                  <p className="text-xs text-text-light flex items-center space-x-1">
                    <Stethoscope className="h-3 w-3" />
                    <span>Personal Practice</span>
                  </p>
                </div>
              </div>
              {currentContext === 'my-practice' && (
                <Check className="h-4 w-4 text-healui-physio" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher;
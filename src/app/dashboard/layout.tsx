'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/auth.slice';
import Header from '../../components/molecule/Header';
import ApiManager from '../../services/api';
import firebaseAuthService from '../../services/firebase-auth';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings,
  Building2,
  UserPlus,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { userData, currentClinic, currentContext } = useAppSelector(state => state.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && !userData) {
        try {
          await ApiManager.getMe();
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [isAuthenticated, userData]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Patients',
      href: '/dashboard/patients',
      icon: Users,
      show: currentContext !== 'my-practice' && currentClinic !== null && (
        currentClinic?.is_admin || 
        currentClinic?.role === 'receptionist' || 
        currentClinic?.role === 'manager'
      ),
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
      show: currentContext === 'my-practice' || currentClinic !== null,
    },
    {
      name: 'Team',
      href: '/dashboard/team',
      icon: UserPlus,
      show: userData?.organization?.is_owner === true || currentClinic?.is_admin === true,
    },
    {
      name: 'Clinics',
      href: '/dashboard/clinics',
      icon: Building2,
      show: userData?.organization?.is_owner === true,
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      show: true,
    },
    {
      name: 'Availability',
      href: '/dashboard/availability',
      icon: Clock,
      show: true,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      show: true,
    },
  ];

  const filteredNavItems = navigationItems.filter(item => item.show);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await firebaseAuthService.signOut();
      
      // Clear Redux state and cookies
      dispatch(logout());
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear local state
      dispatch(logout());
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healui-physio mx-auto"></div>
          <p className="mt-4 text-text-gray font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isMenuOpen={isSidebarOpen}
      />
      
      <div className="flex h-[calc(100vh-60px)] relative">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static top-0 lg:top-0 bottom-0 left-0 z-50 bg-white border-r border-border-color transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-sm h-screen lg:h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}>
          {/* Toggle Button - Positioned on the right edge of sidebar */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              hidden lg:flex items-center justify-center w-6 h-8 bg-white border border-border-color rounded-r-lg shadow-sm
              absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 hover:bg-healui-physio/10 hover:border-healui-physio/30 z-40
              ${isCollapsed ? 'right-[-12px]' : 'right-[-12px]'}
            `}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-text-light" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-text-light" />
            )}
          </button>
          
          <div className="h-full flex flex-col overflow-hidden">
            {/* Healui.ai Branding - Only show on tablet and mobile, not desktop */}
            <div className={`lg:hidden border-b border-border-color transition-all duration-300 ${isCollapsed ? 'py-4 px-2' : 'py-5 px-4'}`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                  {isCollapsed ? (
                    <h1 className="text-xl font-mono font-light tracking-tight">
                      <span className="text-healui-primary font-medium">h</span>
                    </h1>
                  ) : (
                    <h1 className="text-2xl font-mono font-light tracking-tight">
                      <span className="text-gray-800">healui</span>
                      <span className="text-healui-primary font-medium">.ai</span>
                    </h1>
                  )}
                </div>
                {/* Mobile collapse/expand button - only show on mobile */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-healui-physio/10 transition-all duration-200"
                  aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-text-gray" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 text-text-gray" />
                  )}
                </button>
              </div>
            </div>

            <nav className={`flex-1 space-y-1 transition-all duration-300 pt-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div key={item.name} className="relative group">
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center py-3 text-sm font-medium rounded-lg transition-all duration-200 relative
                        ${isCollapsed ? 'px-3 justify-center' : 'px-4'}
                        ${isActive 
                          ? 'bg-gradient-to-r from-healui-physio/10 to-healui-primary/10 text-healui-primary' 
                          : 'text-text-gray hover:text-text-dark hover:bg-gray-50'
                        }
                        ${isActive && !isCollapsed ? 'border-r-2 border-healui-physio' : ''}
                      `}
                    >
                      <item.icon className={`
                        h-5 w-5 transition-colors flex-shrink-0
                        ${isCollapsed ? 'mr-0' : 'mr-3'}
                        ${isActive ? 'text-healui-physio' : 'text-text-light group-hover:text-text-gray'}
                      `} />
                      <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                        isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                      }`}>
                        {item.name}
                      </span>
                      
                      {/* Active indicator for collapsed state */}
                      {isActive && isCollapsed && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-healui-physio rounded-l-full"></div>
                      )}
                    </Link>
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {item.name}
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-r-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className={`py-4 border-t border-border-color transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
              <div className={`bg-gray-50 rounded-lg transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'} mb-3`}>
                <div className="text-xs text-text-light">
                  {currentContext === 'my-practice' ? (
                    <div className={`transition-all duration-300 ${isCollapsed ? 'text-center' : ''}`}>
                      {isCollapsed ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-healui-physio rounded-full flex items-center justify-center text-white font-bold text-xs">
                            MP
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-text-dark text-sm truncate">My Practice</p>
                          <p className="text-healui-physio font-medium truncate">Personal Practice</p>
                        </>
                      )}
                    </div>
                  ) : currentClinic ? (
                    <div className={`transition-all duration-300 ${isCollapsed ? 'text-center' : ''}`}>
                      {isCollapsed ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-healui-physio rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {currentClinic.name.charAt(0)}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-text-dark text-sm truncate">{currentClinic.name}</p>
                          <p className="text-healui-physio font-medium truncate">{currentClinic.role}</p>
                        </>
                      )}
                    </div>
                  ) : userData?.organization?.is_owner ? (
                    <div className={`transition-all duration-300 ${isCollapsed ? 'text-center' : ''}`}>
                      {isCollapsed ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-healui-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {userData.organization.name.charAt(0)}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-text-dark text-sm truncate">{userData.organization.name}</p>
                          <p className="text-healui-physio font-medium truncate">Organization Admin</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={`transition-all duration-300 ${isCollapsed ? 'text-center' : ''}`}>
                      {isCollapsed ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                            ?
                          </div>
                        </div>
                      ) : (
                        <p className="text-text-gray">Select a clinic to continue</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Logout Button */}
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className={`
                    group flex items-center w-full py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isCollapsed ? 'px-3 justify-center' : 'px-4'} 
                    text-red-600 hover:text-red-700 hover:bg-red-50
                  `}
                >
                  <LogOut className={`
                    h-5 w-5 transition-colors flex-shrink-0
                    ${isCollapsed ? 'mr-0' : 'mr-3'}
                  `} />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}>
                    Sign Out
                  </span>
                </button>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    Sign Out
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-r-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="py-2">
            <div className="max-w-full mx-auto px-3">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
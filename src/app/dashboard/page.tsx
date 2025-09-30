'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Activity,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Building,
  UserCheck,
  Loader2
} from 'lucide-react';
import { loadClinicDashboard, loadOrganizationDashboard } from '../../store/actions/analytics.actions';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { userData, currentClinic } = useAppSelector((state) => state.user);
  const { data: analyticsData, loading, error } = useAppSelector((state) => state.analytics);

  // Dashboard context logic - based on context switcher selection
  const organizationId = userData?.organization?.id;
  const clinicId = currentClinic?.id;
  
  // Dashboard mode: 'organization' if no clinic selected, 'clinic' if clinic selected
  const dashboardMode = currentClinic ? 'clinic' : 'organization';
  const canViewOrganization = userData?.organization?.is_owner || false;

  // Load analytics data when context changes
  useEffect(() => {
    if (dashboardMode === 'organization' && organizationId && canViewOrganization) {
      dispatch(loadOrganizationDashboard(organizationId));
    } else if (dashboardMode === 'clinic' && clinicId) {
      dispatch(loadClinicDashboard(clinicId));
    }
  }, [dispatch, dashboardMode, organizationId, clinicId, canViewOrganization]);

  // Helper function to format comparison percentages
  const formatComparison = (value: number) => {
    const formatted = Math.abs(value).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  // Helper function to get trend color
  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-healui-physio' : 'text-red-500';
  };

  // Generate stats cards based on dashboard context and available data
  const getStatsCards = () => {
    if (dashboardMode === 'organization' && analyticsData.organizationOverview) {
      const overview = analyticsData.organizationOverview;
      return [
        {
          title: 'Total Clinics',
          value: overview.totalClinics.toString(),
          change: '',
          trend: 'neutral',
          icon: Building,
          color: 'blue',
        },
        {
          title: 'Total Patients',
          value: overview.totalPatients.toString(),
          change: '',
          trend: 'neutral',
          icon: Users,
          color: 'green',
        },
        {
          title: 'Active Cases',
          value: overview.totalActiveCases.toString(),
          change: '',
          trend: 'neutral',
          icon: Activity,
          color: 'orange',
        },
        {
          title: 'Physiotherapists',
          value: overview.totalPhysiotherapists.toString(),
          change: '',
          trend: 'neutral',
          icon: UserCheck,
          color: 'purple',
        },
      ];
    } else if (dashboardMode === 'clinic' && analyticsData.clinicPatients && analyticsData.quickStats) {
      const patients = analyticsData.clinicPatients.today;
      const appointments = analyticsData.clinicAppointments;
      const quickStats = analyticsData.quickStats;
      
      return [
        {
          title: 'Today vs Yesterday',
          value: `${appointments?.today?.total || 0} / ${appointments?.tomorrow?.total || 0}`,
          change: patients.yesterdayComparison ? formatComparison(patients.yesterdayComparison) : '',
          trend: (patients.yesterdayComparison || 0) >= 0 ? 'up' : 'down',
          icon: Calendar,
          color: 'blue',
        },
        {
          title: 'This Month',
          value: `${appointments?.thisMonth?.total || 0}`,
          change: appointments?.thisMonth?.trend ? formatComparison(appointments.thisMonth.trend) : '',
          trend: (appointments?.thisMonth?.trend || 0) >= 0 ? 'up' : 'down',
          icon: TrendingUp,
          color: 'purple',
        },
        {
          title: 'Completed Today',
          value: (appointments?.today?.completed || 0).toString(),
          change: `${appointments?.today?.pending || 0} pending`,
          trend: 'neutral',
          icon: CheckCircle,
          color: 'green',
        },
        {
          title: 'Tomorrow',
          value: (appointments?.tomorrow?.total || 0).toString(),
          change: `${appointments?.tomorrow?.confirmed || 0} confirmed`,
          trend: 'neutral',
          icon: Clock,
          color: 'orange',
        },
      ];
    }
    
    // Fallback loading state
    return [
      {
        title: 'Loading...',
        value: '...',
        change: '',
        trend: 'neutral',
        icon: Loader2,
        color: 'blue',
      },
    ];
  };

  const statsCards = getStatsCards();

  // Get upcoming appointments from analytics data or fallback
  const getUpcomingAppointments = () => {
    if (analyticsData.clinicAppointments?.today) {
      // This is a simplified version - ideally we'd have individual appointment data
      return [
        {
          id: 1,
          patient: 'Loading appointments...',
          time: 'TBD',
          type: 'Please check appointments page',
          status: 'pending',
          duration: '0 min',
        },
      ];
    }
    return [];
  };

  // Get recent activities from analytics data
  const getRecentActivities = () => {
    if (analyticsData.recentActivities) {
      return analyticsData.recentActivities.slice(0, 5).map(activity => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        time: new Date(activity.timestamp).toLocaleString(),
        icon: activity.action.includes('patient') ? Users : 
              activity.action.includes('appointment') ? CheckCircle : Activity,
      }));
    }
    return [];
  };

  const upcomingAppointments = getUpcomingAppointments();
  const recentActivities = getRecentActivities();

  const getColorClasses = (color: string, type: 'bg' | 'text' = 'bg') => {
    const colors = {
      blue: type === 'bg' ? 'bg-healui-primary/10' : 'text-healui-primary',
      purple: type === 'bg' ? 'bg-healui-accent/10' : 'text-healui-accent',
      green: type === 'bg' ? 'bg-healui-physio/10' : 'text-healui-physio',
      orange: type === 'bg' ? 'bg-healui-secondary/10' : 'text-healui-secondary',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (dashboardMode === 'organization' && !canViewOrganization) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card-base text-center">
          <div className="w-16 h-16 bg-healui-physio/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-healui-physio" />
          </div>
          <h2 className="text-xl font-display font-semibold text-text-dark mb-3">Access Denied</h2>
          <p className="text-text-gray mb-6">
            You don't have permission to view organization-level analytics.
          </p>
        </div>
      </div>
    );
  }

  if (dashboardMode === 'clinic' && !currentClinic) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
        <div className="card-base text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-healui-physio/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-healui-physio" />
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold text-text-dark mb-3">No Clinic Selected</h2>
          <p className="text-text-gray mb-6 text-sm sm:text-base">
            Please select a clinic from the context switcher in the header to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Simple Welcome */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Welcome back, Dr. {userData?.name || 'Doctor'}
              </h1>
            </div>
            
            {/* Date & Time */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
              <div className="text-right">
                <div className="text-sm sm:text-base font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
              
              {/* Loading Indicator */}
              {(loading.clinicPatients || loading.organizationOverview) && (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-healui-physio" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Clear & Readable Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsCards.map((stat, index) => (
          <div key={stat.title || index} className="bg-white border border-border-color rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 ${getColorClasses(stat.color)} rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${getColorClasses(stat.color, 'text')}`} />
              </div>
              {stat.change && (
                <span className={`text-sm font-medium flex items-center ${getTrendColor(stat.trend === 'up' ? 1 : stat.trend === 'down' ? -1 : 0)}`}>
                  {stat.trend === 'up' ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : stat.trend === 'down' ? (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  ) : null}
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-text-dark mb-2">{stat.value}</div>
            <div className="text-sm text-text-gray font-medium">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {dashboardMode === 'organization' ? (
            <div className="bg-white border border-border-color rounded">
              <div className="px-2 py-1 border-b border-border-color flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-dark">
                  Clinics ({analyticsData.organizationOverview?.totalClinics || 0})
                </h3>
                <div className="flex items-center space-x-2 text-xs text-text-gray">
                  <span>{analyticsData.organizationOverview?.totalPatients || 0}p</span>
                  <span>{analyticsData.organizationOverview?.totalPhysiotherapists || 0}pt</span>
                  <button className="text-healui-physio">→</button>
                </div>
              </div>
              <div className="divide-y divide-border-color">
                {loading.organizationClinics ? (
                  <div className="px-6 py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-healui-physio mx-auto mb-2" />
                    <p className="text-text-gray">Loading clinics data...</p>
                  </div>
                ) : analyticsData.organizationClinics && analyticsData.organizationClinics.length > 0 ? (
                  analyticsData.organizationClinics.map((clinic) => (
                    <div key={clinic.clinicId} className="px-6 py-4 hover:bg-healui-physio/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-physio flex items-center justify-center text-sm font-semibold text-white">
                            {clinic.clinicName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-dark">{clinic.clinicName}</p>
                            <p className="text-sm text-text-gray">{clinic.totalPatients} patients • {clinic.totalPhysiotherapists} physiotherapists</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-text-dark">{clinic.activeCases} active cases</p>
                          <div className="flex items-center justify-end space-x-2 mt-1">
                            <span className={`text-xs font-medium ${getTrendColor(clinic.monthlyGrowth)}`}>
                              {clinic.monthlyGrowth >= 0 ? '+' : ''}{clinic.monthlyGrowth.toFixed(1)}% growth
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-text-gray">
                    No clinics data available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border-color rounded">
              <div className="px-3 py-2 border-b border-border-color">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-dark">Today's Summary</h3>
                  <button className="text-xs text-healui-physio flex items-center">
                    <span className="hidden sm:inline">More</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                {loading.clinicAppointments ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-healui-physio mx-auto mb-2" />
                    <p className="text-text-gray">Loading appointment data...</p>
                  </div>
                ) : analyticsData.clinicAppointments ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-healui-physio/10 rounded-lg">
                      <div className="text-2xl font-bold text-healui-physio">{analyticsData.clinicAppointments.today.total}</div>
                      <div className="text-sm text-text-gray">Total Today</div>
                    </div>
                    <div className="text-center p-4 bg-green-100 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analyticsData.clinicAppointments.today.completed}</div>
                      <div className="text-sm text-text-gray">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-100 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{analyticsData.clinicAppointments.today.pending}</div>
                      <div className="text-sm text-text-gray">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{analyticsData.clinicAppointments.today.cancelled}</div>
                      <div className="text-sm text-text-gray">Cancelled</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-gray">
                    No appointment data available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-border-color rounded-lg">
            <div className="px-4 py-3 border-b border-border-color flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-dark">Recent Activity</h3>
              <span className="text-sm text-text-gray">{recentActivities.length}</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.recentActivities ? (
                <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin text-healui-physio mx-auto" /></div>
              ) : recentActivities.length > 0 ? (
                recentActivities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="px-4 py-3 hover:bg-healui-physio/5 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="h-2 w-2 rounded-full bg-healui-physio flex-shrink-0 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-dark text-sm">{activity.action}</div>
                        <div className="text-text-gray text-sm mt-1">{activity.description}</div>
                        <div className="text-text-light text-xs mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-text-gray">No recent activities available</div>
              )}
            </div>
          </div>
          
          {/* Live Metrics - Only show real data with proper descriptions */}
          {(analyticsData.quickStats || analyticsData.clinicPatients) && (
            <div className="bg-white border border-border-color rounded-lg">
              <div className="px-4 py-3 border-b border-border-color">
                <h3 className="text-base font-semibold text-text-dark">Live Metrics</h3>
              </div>
              <div className="p-4 grid grid-cols-1 gap-3">
                {analyticsData.quickStats?.activePatientsNow !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-lg text-green-700 font-bold">{analyticsData.quickStats.activePatientsNow}</div>
                    <div className="text-sm text-green-600 font-medium">Patients Currently Active</div>
                    <div className="text-xs text-green-500 mt-1">In session or checked in</div>
                  </div>
                )}
                {analyticsData.quickStats?.pendingAppointments !== undefined && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-lg text-yellow-700 font-bold">{analyticsData.quickStats.pendingAppointments}</div>
                    <div className="text-sm text-yellow-600 font-medium">Appointments Waiting</div>
                    <div className="text-xs text-yellow-500 mt-1">Scheduled for today</div>
                  </div>
                )}
                {analyticsData.quickStats?.completedToday !== undefined && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-lg text-blue-700 font-bold">{analyticsData.quickStats.completedToday}</div>
                    <div className="text-sm text-blue-600 font-medium">Sessions Completed</div>
                    <div className="text-xs text-blue-500 mt-1">Finished today</div>
                  </div>
                )}
                {analyticsData.clinicPatients?.today.new !== undefined && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-lg text-purple-700 font-bold">{analyticsData.clinicPatients.today.new}</div>
                    <div className="text-sm text-purple-600 font-medium">New Patient Registrations</div>
                    <div className="text-xs text-purple-500 mt-1">Registered today</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          
        </div>
      </div>

        {/* Error Display */}
        {(error.clinicPatients || error.organizationOverview || error.recentActivities) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Error Loading Dashboard Data</h4>
                <div className="mt-2 text-sm text-red-700">
                  {error.clinicPatients && <p>• Patient analytics: {error.clinicPatients}</p>}
                  {error.organizationOverview && <p>• Organization overview: {error.organizationOverview}</p>}
                  {error.recentActivities && <p>• Recent activities: {error.recentActivities}</p>}
                </div>
                <button 
                  onClick={() => {
                    if (dashboardMode === 'organization' && organizationId) {
                      dispatch(loadOrganizationDashboard(organizationId));
                    } else if (dashboardMode === 'clinic' && clinicId) {
                      dispatch(loadClinicDashboard(clinicId));
                    }
                  }}
                  className="mt-3 text-sm text-red-600 hover:text-red-500 font-medium underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
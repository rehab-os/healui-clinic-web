'use client';

import React from 'react';
import { useAppSelector } from '../../store/hooks';
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
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const { userData, currentClinic } = useAppSelector((state) => state.user);

  const statsCards = [
    {
      title: 'Total Patients',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Appointments Today',
      value: '18',
      change: '-5%',
      trend: 'down',
      icon: Calendar,
      color: 'purple',
    },
    {
      title: 'Revenue (Month)',
      value: '$45,678',
      change: '+23%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Active Treatments',
      value: '89',
      change: '+8%',
      trend: 'up',
      icon: Activity,
      color: 'orange',
    },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: 'John Smith',
      time: '09:00 AM',
      type: 'Initial Assessment',
      status: 'confirmed',
      duration: '60 min',
    },
    {
      id: 2,
      patient: 'Sarah Johnson',
      time: '10:30 AM',
      type: 'Follow-up',
      status: 'pending',
      duration: '30 min',
    },
    {
      id: 3,
      patient: 'Michael Brown',
      time: '11:30 AM',
      type: 'Treatment Session',
      status: 'confirmed',
      duration: '45 min',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'New patient registered',
      description: 'Emma Wilson joined the clinic',
      time: '15 minutes ago',
      icon: Users,
    },
    {
      id: 2,
      action: 'Treatment plan updated',
      description: 'ACL Recovery Program for John Smith',
      time: '1 hour ago',
      icon: Activity,
    },
    {
      id: 3,
      action: 'Appointment completed',
      description: 'Sarah Johnson - Follow-up session',
      time: '2 hours ago',
      icon: CheckCircle,
    },
  ];

  const getColorClasses = (color: string, type: 'bg' | 'text' = 'bg') => {
    const colors = {
      blue: type === 'bg' ? 'bg-healui-primary/10' : 'text-healui-primary',
      purple: type === 'bg' ? 'bg-healui-accent/10' : 'text-healui-accent',
      green: type === 'bg' ? 'bg-healui-physio/10' : 'text-healui-physio',
      orange: type === 'bg' ? 'bg-healui-secondary/10' : 'text-healui-secondary',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!currentClinic && !userData?.organization?.is_owner) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card-base text-center">
          <div className="w-16 h-16 bg-healui-physio/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-healui-physio" />
          </div>
          <h2 className="text-xl font-display font-semibold text-text-dark mb-3">No Clinic Selected</h2>
          <p className="text-text-gray mb-6">
            Please select a clinic from the context switcher in the header to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-dark mb-2">
          Welcome back, {userData?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-text-gray text-lg">
          {currentClinic ? `${currentClinic.name} Dashboard` : 'Organization Overview'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <div key={stat.title} className="card-base hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${getColorClasses(stat.color)} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${getColorClasses(stat.color, 'text')}`} />
              </div>
              <span className={`text-sm font-medium flex items-center ${
                stat.trend === 'up' ? 'text-healui-physio' : 'text-red-500'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-display font-bold text-text-dark">{stat.value}</h3>
            <p className="text-sm text-text-gray mt-2 font-medium">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 card-base p-0">
          <div className="px-6 py-4 border-b border-border-color">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-text-dark">Today's Appointments</h2>
              <button className="text-sm text-healui-physio hover:text-healui-primary font-medium flex items-center transition-colors">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-border-color">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="px-6 py-4 hover:bg-healui-physio/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-physio flex items-center justify-center text-sm font-semibold text-white">
                      {appointment.patient.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-dark">{appointment.patient}</p>
                      <p className="text-sm text-text-gray">{appointment.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-dark">{appointment.time}</p>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-text-light" />
                      <span className="text-xs text-text-gray">{appointment.duration}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' 
                          ? 'bg-healui-physio/20 text-healui-physio' 
                          : 'bg-healui-secondary/20 text-healui-secondary'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card-base p-0">
          <div className="px-6 py-4 border-b border-border-color">
            <h2 className="text-xl font-display font-semibold text-text-dark">Recent Activities</h2>
          </div>
          <div className="divide-y divide-border-color">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-healui-physio/5 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-healui-physio/10 rounded-lg">
                    <activity.icon className="h-4 w-4 text-healui-physio" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-dark">{activity.action}</p>
                    <p className="text-sm text-text-gray mt-1">{activity.description}</p>
                    <p className="text-xs text-text-light mt-2">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-physio rounded-lg p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-healui-physio/20 to-healui-primary/20 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold mb-2">Quick Actions ⚡</h3>
            <p className="text-white/90 text-base">
              {currentClinic 
                ? 'Manage your clinic operations efficiently' 
                : 'Manage your organization and clinics'
              }
            </p>
          </div>
          <div className="flex space-x-3">
            {currentClinic ? (
              <>
                <button className="btn-primary bg-white text-healui-physio hover:bg-gray-50 px-6 py-3">
                  New Patient
                </button>
                <button className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-3">
                  Schedule Appointment
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary bg-white text-healui-physio hover:bg-gray-50 px-6 py-3">
                  Add Clinic
                </button>
                <button className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-3">
                  Invite Staff
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
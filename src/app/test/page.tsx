'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Users,
  Activity,
  Package,
  UserPlus,
  Settings,
  ChevronDown,
  Plus,
  Edit,
  BarChart3,
  Sparkles,
  Brain,
  Heart,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Upload,
  Mic,
  Bot,
  Stethoscope,
  FileText,
  DollarSign,
  PieChart,
  Home,
  Building2,
  UserCheck,
  ClipboardList,
  Zap,
  Shield,
  Wifi,
  Volume2,
  Bell,
  LogOut,
  X,
  Eye,
  Send,
  Menu,
  ChevronRight,
  ArrowUp,
  Target,
  Briefcase,
  ChartBar,
  ChartPie,
  TrendingDown,
  Star,
  Phone,
  Mail,
  MapPin,
  Check,
} from 'lucide-react';

// Custom Progress Ring Component
const ProgressRing = ({
  progress,
  size = 60,
  strokeWidth = 6,
  color = 'blue',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-blue-500',
    purple: 'stroke-purple-500',
    green: 'stroke-green-500',
    yellow: 'stroke-yellow-500',
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-gray-200"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className={`${colorClasses[color]} transition-all duration-500 ease-out`}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

// Custom Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div
          className={`relative ${sizeClasses[size]} w-full transform transition-all duration-300 scale-100 opacity-100`}
        >
          <div className="glass-card rounded-2xl p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Select Component
const Select = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/70 px-4 py-2.5 text-left transition-all hover:bg-white/80 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-600" />}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl bg-white/95 backdrop-blur-xl shadow-xl border border-white/20">
          <div className="p-2">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <div key={option.value}>
                {option.group && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {option.group}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors ${
                    value === option.value
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Static Data
const organizations = [{ id: 1, name: 'NeuroFlow Medical Group', clinics: 5 }];

const clinics = [
  { id: 1, name: 'Downtown Rehabilitation Center', patients: 342, staff: 12 },
  { id: 2, name: 'Westside Physical Therapy', patients: 218, staff: 8 },
  { id: 3, name: 'North Shore Wellness', patients: 156, staff: 6 },
  { id: 4, name: 'Central Medical Rehab', patients: 289, staff: 10 },
  { id: 5, name: 'East End Therapy Center', patients: 195, staff: 7 },
];

const patients = [
  {
    id: 1,
    name: 'John Doe',
    age: 45,
    condition: 'Lower Back Pain',
    nextAppointment: '2025-07-05',
    status: 'active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 32,
    condition: 'Knee Rehabilitation',
    nextAppointment: '2025-07-03',
    status: 'active',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    age: 58,
    condition: 'Shoulder Recovery',
    nextAppointment: '2025-07-04',
    status: 'improving',
  },
  {
    id: 4,
    name: 'Maria Garcia',
    age: 28,
    condition: 'Sports Injury',
    nextAppointment: '2025-07-06',
    status: 'new',
  },
];

const staff = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    role: 'Lead Physiotherapist',
    patients: 45,
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Mark Thompson',
    role: 'Senior Therapist',
    patients: 38,
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Lisa Rodriguez',
    role: 'Rehabilitation Specialist',
    patients: 32,
    rating: 4.7,
  },
  {
    id: 4,
    name: 'James Wilson',
    role: 'Physical Therapist',
    patients: 28,
    rating: 4.6,
  },
];

const inventory = [
  {
    id: 1,
    name: 'Resistance Bands',
    quantity: 45,
    minStock: 20,
    status: 'good',
  },
  { id: 2, name: 'Therapy Balls', quantity: 12, minStock: 15, status: 'low' },
  { id: 3, name: 'Foam Rollers', quantity: 28, minStock: 10, status: 'good' },
  { id: 4, name: 'TENS Units', quantity: 8, minStock: 5, status: 'good' },
];

export default function RehabOSDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [context, setContext] = useState('organization');
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [addClinicOpen, setAddClinicOpen] = useState(false);
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextSwitch = (value) => {
    if (value === 'organization') {
      setContext('organization');
      setSelectedClinic(null);
    } else {
      const clinic = clinics.find((c) => c.id === parseInt(value));
      setContext('clinic');
      setSelectedClinic(clinic);
    }
  };

  const contextOptions = [
    { value: 'organization', label: 'Organization Admin', group: 'Admin' },
    ...clinics.map((clinic) => ({
      value: clinic.id.toString(),
      label: clinic.name,
      group: 'Clinics',
    })),
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
            sans-serif;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .glass-card-hover {
          transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        .glass-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .glass-input {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .gradient-bg {
          background: linear-gradient(135deg, #0066ff 0%, #7c3aed 100%);
        }

        .gradient-text {
          background: linear-gradient(135deg, #0066ff 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ai-agent {
          background: linear-gradient(135deg, #7c3aed 0%, #0066ff 100%);
          box-shadow: 0 0 40px rgba(124, 58, 237, 0.4);
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95);
          }
        }

        .pulse-animation {
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="glass-card fixed top-0 z-40 w-full border-b border-white/20">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-lg p-2 hover:bg-gray-100/50 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="ai-agent rounded-xl p-2">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="gradient-text text-2xl font-bold">Rehab OS</h1>
                </div>

                {/* Context Switcher */}
                <div className="hidden lg:block">
                  <Select
                    value={
                      context === 'organization'
                        ? 'organization'
                        : selectedClinic?.id.toString()
                    }
                    onChange={handleContextSwitch}
                    options={contextOptions}
                    placeholder="Select context"
                    icon={context === 'organization' ? Building2 : Building}
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="group relative rounded-xl p-2.5 hover:bg-gray-100/50 transition-all">
                  <Bell className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                </button>

                {/* Profile Menu */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-100/50 transition-all"
                  >
                    <div className="gradient-bg h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold">
                      JD
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        John Doe
                      </p>
                      <p className="text-xs text-gray-500">Admin</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-600 transition-transform ${
                        profileMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/95 backdrop-blur-xl shadow-xl border border-white/20 py-2">
                      <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50">
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50">
                        <Shield className="h-4 w-4" />
                        Privacy
                      </button>
                      <hr className="my-2 border-gray-200/50" />
                      <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Context Switcher */}
        <div className="fixed top-16 z-30 w-full glass-card border-b border-white/20 p-4 lg:hidden">
          <Select
            value={
              context === 'organization'
                ? 'organization'
                : selectedClinic?.id.toString()
            }
            onChange={handleContextSwitch}
            options={contextOptions}
            placeholder="Select context"
            icon={context === 'organization' ? Building2 : Building}
          />
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:mt-16`}
        >
          <div className="glass-card h-full border-r border-white/20 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'gradient-bg text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <Home className="h-5 w-5" />
                Overview
              </button>

              {context === 'organization' ? (
                <>
                  <button
                    onClick={() => setActiveTab('clinics')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                      activeTab === 'clinics'
                        ? 'gradient-bg text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <Building className="h-5 w-5" />
                    Clinics
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                      activeTab === 'analytics'
                        ? 'gradient-bg text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    Analytics
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                      activeTab === 'patients'
                        ? 'gradient-bg text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    Patients
                  </button>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                      activeTab === 'staff'
                        ? 'gradient-bg text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <UserCheck className="h-5 w-5" />
                    Staff
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                      activeTab === 'inventory'
                        ? 'gradient-bg text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    Inventory
                  </button>
                </>
              )}
            </nav>

            {/* AI Assistant Button */}
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                className="w-full rounded-xl border border-purple-200 bg-purple-50/50 p-3 backdrop-blur transition-all hover:bg-purple-100/50"
              >
                <div className="flex items-center gap-3">
                  <div className="ai-agent rounded-lg p-2">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-purple-700">
                      AI Assistant
                    </p>
                    <p className="text-xs text-purple-600">
                      {aiAssistantOpen ? 'Active' : 'Click to activate'}
                    </p>
                  </div>
                  {aiAssistantOpen && (
                    <div className="pulse-animation">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`mt-16 transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64' : ''
          } lg:ml-64 ${context !== 'organization' ? 'lg:mt-16' : 'lg:mt-16'}`}
        >
          <div className="min-h-screen p-4 lg:p-8 mt-16 lg:mt-0">
            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="gradient-text text-3xl font-bold">
                  {context === 'organization'
                    ? 'Organization Dashboard'
                    : selectedClinic?.name}
                </h2>
                <p className="mt-1 text-gray-600">
                  {context === 'organization'
                    ? 'Manage all your clinics and organization settings'
                    : 'Clinic management and operations'}
                </p>
              </div>

              {context === 'organization' && activeTab === 'clinics' && (
                <button
                  onClick={() => setAddClinicOpen(true)}
                  className="gradient-bg flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  Add Clinic
                </button>
              )}

              {context === 'clinic' && activeTab === 'patients' && (
                <button
                  onClick={() => setAddPatientOpen(true)}
                  className="gradient-bg flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <UserPlus className="h-5 w-5" />
                  Add Patient
                </button>
              )}
            </div>

            {/* Content Based on Active Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* AI Insights Card */}
                <div className="glass-card rounded-2xl p-6 border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="ai-agent rounded-xl p-3">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-purple-700">
                          AI Insights
                        </h3>
                        <p className="text-sm text-purple-600">
                          Powered by NeuroFlow AI
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      Live Analysis
                    </span>
                  </div>

                  <div className="rounded-xl bg-purple-100/30 p-4 backdrop-blur">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-purple-900">
                          Today's Insights
                        </h4>
                        <ul className="space-y-1 text-sm text-purple-700">
                          <li>
                            • Patient recovery rates are 23% above industry
                            average
                          </li>
                          <li>
                            • Inventory optimization can save $2,400 this
                            quarter
                          </li>
                          <li>
                            • 3 patients show accelerated improvement patterns
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="glass-card glass-card-hover rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Total Patients
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          1,200
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            +12%
                          </span>
                          <span className="text-gray-500">this month</span>
                        </div>
                      </div>
                      <div className="relative">
                        <ProgressRing progress={75} color="blue" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card glass-card-hover rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Active Sessions
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          89
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <Activity className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-yellow-600">
                            In progress
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <ProgressRing progress={89} color="purple" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card glass-card-hover rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Recovery Rate
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          94%
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            Above average
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <ProgressRing progress={94} color="green" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card glass-card-hover rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Revenue MTD
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          $124k
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            +18%
                          </span>
                          <span className="text-gray-500">vs last</span>
                        </div>
                      </div>
                      <div className="relative">
                        <ProgressRing progress={82} color="yellow" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-yellow-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      Recent Activity
                    </h3>
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                      Live Feed
                    </span>
                  </div>

                  <div className="relative space-y-6">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>

                    <div className="relative flex gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 ring-4 ring-white">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          New patient onboarded
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Maria Garcia joined Downtown Rehabilitation Center
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          2 minutes ago
                        </p>
                      </div>
                    </div>

                    <div className="relative flex gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          Therapy session completed
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          John Doe completed session with Dr. Sarah Chen
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          15 minutes ago
                        </p>
                      </div>
                    </div>

                    <div className="relative flex gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 ring-4 ring-white">
                        <Package className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          Inventory alert
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Therapy Balls running low at Westside Physical Therapy
                        </p>
                        <p className="mt-1 text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 ring-4 ring-white">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          AI recommendation
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Recovery pattern detected for 3 patients
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {context === 'organization' && activeTab === 'clinics' && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="glass-card glass-card-hover rounded-xl p-6"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-xl bg-blue-100 p-3">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <button className="rounded-lg p-1 hover:bg-gray-100/50 transition-colors">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      {clinic.name}
                    </h3>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Patients</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                          {clinic.patients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Staff</span>
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-sm font-semibold text-purple-700">
                          {clinic.staff}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Capacity</span>
                        <span className="font-medium text-gray-900">75%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {context === 'organization' && activeTab === 'analytics' && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="glass-card rounded-xl p-6">
                  <h3 className="mb-6 text-lg font-bold text-gray-900">
                    Performance Overview
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Patient Satisfaction
                        </span>
                        <span className="font-semibold text-gray-900">96%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[96%] rounded-full bg-green-500 transition-all duration-500"></div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Treatment Success Rate
                        </span>
                        <span className="font-semibold text-gray-900">94%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[94%] rounded-full bg-blue-500 transition-all duration-500"></div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Staff Utilization</span>
                        <span className="font-semibold text-gray-900">82%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[82%] rounded-full bg-purple-500 transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h3 className="mb-6 text-lg font-bold text-gray-900">
                    Financial Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            Monthly Revenue
                          </p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            $485,230
                          </p>
                        </div>
                        <div className="rounded-lg bg-green-100 p-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            Avg. Session Value
                          </p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            $125
                          </p>
                        </div>
                        <div className="rounded-lg bg-blue-100 p-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h3 className="mb-6 text-lg font-bold text-gray-900">
                    AI Predictions
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-purple-50 p-4">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-900">
                            Next Month Forecast
                          </h4>
                          <p className="mt-1 text-sm text-purple-700">
                            Expected 15% increase in patient volume based on
                            current trends
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-yellow-50 p-4">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-900">
                            Optimization Opportunity
                          </h4>
                          <p className="mt-1 text-sm text-yellow-700">
                            Schedule optimization could increase capacity by 20%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {context === 'clinic' && activeTab === 'patients' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      className="glass-input rounded-xl border border-white/20 pl-10 pr-4 py-2.5 w-full sm:w-80 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50/70 transition-colors">
                      <Filter className="h-4 w-4" />
                      Filter
                    </button>
                    <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50/70 transition-colors">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200/50">
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Patient
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Age
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Condition
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Next Appointment
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50">
                        {patients.map((patient) => (
                          <tr
                            key={patient.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="gradient-bg h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {patient.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                                <span className="font-medium text-gray-900">
                                  {patient.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {patient.age}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {patient.condition}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {patient.nextAppointment}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  patient.status === 'active'
                                    ? 'bg-blue-100 text-blue-700'
                                    : patient.status === 'improving'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {patient.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <button className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                                  <Eye className="h-4 w-4 text-gray-600" />
                                </button>
                                <button className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                                  <Edit className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {context === 'clinic' && activeTab === 'staff' && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="glass-card glass-card-hover rounded-xl p-6 text-center"
                  >
                    <div className="mx-auto mb-4 gradient-bg h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{member.role}</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Patients</span>
                        <span className="font-semibold text-gray-900">
                          {member.patients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rating</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-900">
                            {member.rating}
                          </span>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    <button className="mt-6 w-full rounded-xl border border-blue-200 bg-blue-50/50 py-2.5 font-medium text-blue-700 hover:bg-blue-100/50 transition-colors">
                      View Schedule
                    </button>
                  </div>
                ))}
              </div>
            )}

            {context === 'clinic' && activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      className="glass-input rounded-xl border border-white/20 pl-10 pr-4 py-2.5 w-full sm:w-80 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50/70 transition-colors">
                      <Upload className="h-4 w-4" />
                      Import
                    </button>
                    <button className="gradient-bg flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card glass-card-hover rounded-xl p-6"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div
                          className={`rounded-xl p-3 ${
                            item.status === 'low'
                              ? 'bg-yellow-100'
                              : 'bg-green-100'
                          }`}
                        >
                          <Package
                            className={`h-6 w-6 ${
                              item.status === 'low'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          />
                        </div>
                        {item.status === 'low' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                            Low Stock
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-gray-600">Stock Level</span>
                          <span className="font-medium text-gray-900">
                            {item.quantity} / {item.minStock * 2}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.status === 'low'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${
                                (item.quantity / (item.minStock * 2)) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Floating AI Assistant Button */}
        {!aiAssistantOpen && (
          <button
            onClick={() => setAiAssistantOpen(true)}
            className="fixed bottom-6 right-6 gradient-bg rounded-full p-4 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all float-animation"
          >
            <Bot className="h-6 w-6" />
          </button>
        )}

        {/* AI Assistant Panel */}
        {aiAssistantOpen && (
          <div className="fixed right-0 top-16 bottom-0 w-96 glass-card border-l border-white/20 p-6 shadow-2xl transition-all">
            <div className="flex h-full flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="ai-agent rounded-xl p-2">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      NeuroFlow AI
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      Online
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setAiAssistantOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-gray-100/50 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                <div className="rounded-xl bg-purple-50/50 p-4 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">
                        AI Assistant
                      </h4>
                      <p className="mt-1 text-sm text-purple-700">
                        Hello! I'm your AI assistant. I can help you with:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-purple-600">
                        <li>• Patient treatment recommendations</li>
                        <li>• Schedule optimization</li>
                        <li>• Inventory predictions</li>
                        <li>• Performance insights</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-100 p-4">
                  <p className="text-sm text-gray-700">
                    Based on today's data, I recommend checking on John Doe's
                    recovery progress. His metrics show faster than expected
                    improvement.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    className="glass-input w-full rounded-xl border border-white/20 pl-4 pr-10 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 hover:bg-gray-100/50 transition-colors">
                    <Mic className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <button className="ai-agent rounded-xl p-3 text-white hover:shadow-lg transition-all">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal
          isOpen={addClinicOpen}
          onClose={() => setAddClinicOpen(false)}
          title="Add New Clinic"
        >
          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Clinic Name
              </label>
              <input
                type="text"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter clinic name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter clinic address"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter email address"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setAddClinicOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 font-medium text-gray-700 hover:bg-gray-50/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="gradient-bg flex-1 rounded-xl py-2.5 font-medium text-white shadow-lg hover:shadow-xl transition-all"
              >
                Add Clinic
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={editOrgOpen}
          onClose={() => setEditOrgOpen(false)}
          title="Edit Organization"
        >
          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                defaultValue="NeuroFlow Medical Group"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Admin Email
              </label>
              <input
                type="email"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                defaultValue="admin@neuroflow.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
                placeholder="Enter organization description"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditOrgOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 font-medium text-gray-700 hover:bg-gray-50/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="gradient-bg flex-1 rounded-xl py-2.5 font-medium text-white shadow-lg hover:shadow-xl transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={addPatientOpen}
          onClose={() => setAddPatientOpen(false)}
          title="Add New Patient"
          size="lg"
        >
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                type="tel"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter contact number"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Primary Condition
              </label>
              <textarea
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
                placeholder="Describe the primary condition"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Medical History
              </label>
              <textarea
                className="glass-input w-full rounded-xl border border-white/20 px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
                placeholder="Enter relevant medical history"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setAddPatientOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 font-medium text-gray-700 hover:bg-gray-50/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="gradient-bg flex-1 rounded-xl py-2.5 font-medium text-white shadow-lg hover:shadow-xl transition-all"
              >
                Add Patient
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

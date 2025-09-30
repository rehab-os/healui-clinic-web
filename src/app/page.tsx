'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { Loader2, Brain, Activity, Users, BarChart3, Shield, Zap, Clock, CheckCircle } from 'lucide-react';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* SEO-Optimized Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            World's First <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI-Powered</span><br />
            Physiotherapy EMR Software
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Revolutionary AI-based EMR software transforming physiotherapy care through intelligent automation, 
            smart documentation, and advanced clinical analytics for modern physio practices.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-lg transition-all">
              Start Free Trial
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">1000+</div>
              <div className="text-gray-600">Physiotherapists</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">50,000+</div>
              <div className="text-gray-600">Patients Managed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features for AI Physiotherapy EMR */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced AI Features for Physiotherapy EMR
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the future of physiotherapy practice management with our intelligent AI-powered EMR system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="bg-blue-600 p-3 rounded-lg w-fit mb-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Documentation</h3>
              <p className="text-gray-600">Automated physiotherapy note-taking with intelligent SOAP note generation and clinical decision support.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="bg-purple-600 p-3 rounded-lg w-fit mb-4">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Patient Management</h3>
              <p className="text-gray-600">Intelligent patient scheduling, treatment tracking, and automated follow-up reminders for optimal care.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="bg-green-600 p-3 rounded-lg w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Clinical Analytics</h3>
              <p className="text-gray-600">Real-time insights into patient outcomes, treatment efficacy, and practice performance metrics.</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
              <div className="bg-orange-600 p-3 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Clinic Management</h3>
              <p className="text-gray-600">Centralized management of multiple physiotherapy clinics with role-based access control.</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
              <div className="bg-red-600 p-3 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">HIPAA Compliant Security</h3>
              <p className="text-gray-600">Enterprise-grade security with end-to-end encryption and compliance with healthcare regulations.</p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl">
              <div className="bg-teal-600 p-3 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automated Billing</h3>
              <p className="text-gray-600">AI-powered billing automation with insurance claim processing and revenue optimization.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Our AI Physiotherapy EMR */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Healui.ai is the Future of Physiotherapy EMR
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of physiotherapists who trust our AI-powered EMR to enhance patient care and streamline their practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/10 p-4 rounded-full w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Save 75% Documentation Time</h3>
              <p className="text-blue-100">AI automatically generates comprehensive physiotherapy notes, reducing documentation time from hours to minutes.</p>
            </div>

            <div className="text-center">
              <div className="bg-white/10 p-4 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Improve Patient Outcomes</h3>
              <p className="text-blue-100">Data-driven insights and AI recommendations help optimize treatment plans and improve recovery rates.</p>
            </div>

            <div className="text-center">
              <div className="bg-white/10 p-4 rounded-full w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Increase Revenue by 40%</h3>
              <p className="text-blue-100">Automated billing, reduced no-shows, and optimized scheduling boost practice profitability.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator while redirecting */}
      <div className="fixed bottom-8 right-8">
        <div className="bg-white shadow-lg rounded-full p-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    </div>
  );
}
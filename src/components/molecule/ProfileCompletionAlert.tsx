'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  User, 
  GraduationCap, 
  Stethoscope, 
  MapPin, 
  DollarSign, 
  Settings,
  ArrowRight,
  Info,
  ExternalLink
} from 'lucide-react';
import ApiManager from '../../services/api';

interface ProfileCompletionStatus {
  isComplete: boolean;
  marketplaceActive: boolean;
  missingFields: {
    category: string;
    fields: string[];
    description: string;
    icon: React.ReactNode;
  }[];
}

interface ProfileCompletionAlertProps {
  compact?: boolean;
  showDetailsButton?: boolean;
  onNavigateToProfile?: () => void;
}

export default function ProfileCompletionAlert({ 
  compact = false, 
  showDetailsButton = true,
  onNavigateToProfile 
}: ProfileCompletionAlertProps) {
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiManager.getPhysiotherapistProfile();
      
      if (response.success && response.data) {
        const profile = response.data;
        const missingFields: ProfileCompletionStatus['missingFields'] = [];

        // Check basic profile information
        const basicMissing: string[] = [];
        if (!profile.license_number) basicMissing.push('License number');
        if (!profile.experience_level) basicMissing.push('Experience level');
        if (!profile.years_of_experience) basicMissing.push('Years of experience');
        if (!profile.specializations || profile.specializations.length === 0) basicMissing.push('Specializations');
        if (!profile.bio) basicMissing.push('Professional bio');
        if (!profile.languages || profile.languages.length === 0) basicMissing.push('Languages spoken');
        if (!profile.user?.full_name) basicMissing.push('Full name');

        if (basicMissing.length > 0) {
          missingFields.push({
            category: 'Basic Information',
            fields: basicMissing,
            description: 'Essential profile details required for patients to find and trust you',
            icon: <User className="h-4 w-4" />
          });
        }

        // Check practice settings
        const practiceMissing: string[] = [];
        if (!profile.practice_address) practiceMissing.push('Practice address');
        if (!profile.service_areas) practiceMissing.push('Service areas');
        if (!profile.consultation_fee) practiceMissing.push('Consultation fee');
        if (!profile.online_consultation_available && !profile.home_visit_available) {
          practiceMissing.push('At least one service type (online or home visit)');
        }
        if (profile.home_visit_available && !profile.home_visit_fee) {
          practiceMissing.push('Home visit fee');
        }

        if (practiceMissing.length > 0) {
          missingFields.push({
            category: 'Practice Settings',
            fields: practiceMissing,
            description: 'Service details and pricing information for marketplace visibility',
            icon: <Settings className="h-4 w-4" />
          });
        }

        // Check education (need at least one)
        if (!profile.education || profile.education.length === 0) {
          missingFields.push({
            category: 'Education',
            fields: ['At least one education qualification'],
            description: 'Educational background to establish credibility',
            icon: <GraduationCap className="h-4 w-4" />
          });
        }

        // Check techniques (need at least one)
        if (!profile.techniques || profile.techniques.length === 0) {
          missingFields.push({
            category: 'Skills & Techniques',
            fields: ['At least one technique or skill'],
            description: 'Treatment methods and specializations you offer',
            icon: <Stethoscope className="h-4 w-4" />
          });
        }

        setStatus({
          isComplete: missingFields.length === 0,
          marketplaceActive: profile.marketplace_active || false,
          missingFields
        });
      } else {
        setError('Failed to load profile information');
      }
    } catch (err: any) {
      console.error('Error checking profile completion:', err);
      setError(err.message || 'Failed to check profile completion');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status) return null;

  // If profile is complete and marketplace active, don't show anything
  if (status.isComplete && status.marketplaceActive) {
    return null;
  }

  if (compact) {
    return (
      <Alert variant={status.isComplete ? "default" : "destructive"} className="border-l-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Profile {status.isComplete ? 'Review Required' : 'Incomplete'}</span>
          <Badge variant={status.marketplaceActive ? "default" : "destructive"} className="ml-2">
            {status.marketplaceActive ? 'Marketplace Active' : 'Not Visible in Marketplace'}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2">
          {status.isComplete 
            ? 'Your profile meets requirements but marketplace visibility may be pending.'
            : `${status.missingFields.reduce((total, category) => total + category.fields.length, 0)} items need attention to appear in marketplace.`
          }
          {showDetailsButton && (
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto ml-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </Button>
          )}
        </AlertDescription>
        
        {showDetails && (
          <div className="mt-4 space-y-3">
            {status.missingFields.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  {category.icon}
                  <span>{category.category}</span>
                </div>
                <ul className="ml-6 space-y-1">
                  {category.fields.map((field, fieldIndex) => (
                    <li key={fieldIndex} className="text-sm text-gray-600 flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {onNavigateToProfile && (
              <Button size="sm" onClick={onNavigateToProfile} className="mt-3">
                Complete Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </Alert>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Marketplace Profile Status
          </CardTitle>
          <Badge variant={status.marketplaceActive ? "default" : "destructive"}>
            {status.marketplaceActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
          <Info className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-800">
              {status.isComplete 
                ? 'Profile Review in Progress' 
                : 'Profile Incomplete'
              }
            </p>
            <p className="text-sm text-orange-700 mt-1">
              {status.isComplete 
                ? 'Your profile is complete but marketplace activation may be pending. Please contact support if this persists.'
                : `Your profile is not visible in the marketplace. Complete the ${status.missingFields.reduce((total, category) => total + category.fields.length, 0)} missing items below to activate your marketplace presence.`
              }
            </p>
          </div>
        </div>

        {status.missingFields.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Required Items</h4>
            {status.missingFields.map((category, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm text-gray-700">
                  {category.icon}
                  <span>{category.category}</span>
                  <Badge variant="outline" className="ml-auto">
                    {category.fields.length} missing
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 ml-6">{category.description}</p>
                <ul className="ml-6 space-y-2">
                  {category.fields.map((field, fieldIndex) => (
                    <li key={fieldIndex} className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>{field}</span>
                    </li>
                  ))}
                </ul>
                {index < status.missingFields.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {onNavigateToProfile && (
          <div className="flex gap-3 pt-2">
            <Button onClick={onNavigateToProfile} className="flex-1">
              Complete Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={checkProfileCompletion}>
              Refresh Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
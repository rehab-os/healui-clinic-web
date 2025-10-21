'use client';

import React from 'react';
import { 
  Target, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Activity,
  ChevronDown,
  ChevronUp,
  Edit,
  Shield,
  Calendar,
  CheckCircle,
  Award,
  User
} from 'lucide-react';
import { VisitCondition } from '../../types/condition-types';
import ConditionEditModal from './ConditionEditModal';
import VisitConditionEditModal from './VisitConditionEditModal';
import type { PatientConditionResponseDto, VisitConditionResponseDto } from '../../lib/types';

interface VisitConditionContextProps {
  visitConditions: VisitCondition[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  showActions?: boolean;
  onConditionUpdated?: () => void; // Callback to refresh data
}

const VisitConditionContext: React.FC<VisitConditionContextProps> = ({
  visitConditions,
  loading = false,
  error = null,
  className = '',
  showActions = true,
  onConditionUpdated
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  // Modal states
  const [showConditionModal, setShowConditionModal] = React.useState(false);
  const [showVisitModal, setShowVisitModal] = React.useState(false);
  const [selectedCondition, setSelectedCondition] = React.useState<PatientConditionResponseDto | null>(null);
  const [selectedVisitCondition, setSelectedVisitCondition] = React.useState<VisitConditionResponseDto | null>(null);

  // Handler functions
  const handleEditCondition = (visitCondition: any) => {
    setSelectedCondition(visitCondition.condition);
    setShowConditionModal(true);
  };

  const handleEditVisitCondition = (visitCondition: any) => {
    setSelectedVisitCondition(visitCondition);
    setShowVisitModal(true);
  };

  const handleConditionUpdated = () => {
    setShowConditionModal(false);
    setSelectedCondition(null);
    if (onConditionUpdated) {
      onConditionUpdated();
    }
  };

  const handleVisitConditionUpdated = () => {
    setShowVisitModal(false);
    setSelectedVisitCondition(null);
    if (onConditionUpdated) {
      onConditionUpdated();
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="w-full h-8 bg-gray-100 rounded animate-pulse"></div>
          <div className="w-3/4 h-6 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">Failed to load visit conditions</span>
        </div>
      </div>
    );
  }

  if (!visitConditions || visitConditions.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <Target className="h-4 w-4 mr-2 text-gray-500" />
            Visit Focus
          </h3>
        </div>
        <p className="text-sm text-gray-500">No specific conditions identified for this visit</p>
      </div>
    );
  }

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'PRIMARY':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SECONDARY':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MAINTENANCE':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFocusIcon = (focus: string) => {
    switch (focus) {
      case 'PRIMARY':
        return <AlertCircle className="h-3 w-3" />;
      case 'SECONDARY':
        return <Clock className="h-3 w-3" />;
      case 'MAINTENANCE':
        return <Activity className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MILD':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MODERATE':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'SEVERE':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'MILD':
        return <Shield className="h-3 w-3" />;
      case 'MODERATE':
        return <AlertCircle className="h-3 w-3" />;
      case 'SEVERE':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <Target className="h-4 w-4 mr-2 text-healui-physio" />
            Visit Focus
            <span className="ml-2 text-xs text-gray-500">
              ({visitConditions.length} condition{visitConditions.length !== 1 ? 's' : ''})
            </span>
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? 
              <ChevronUp className="h-4 w-4 text-gray-500" /> : 
              <ChevronDown className="h-4 w-4 text-gray-500" />
            }
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {visitConditions.map((visitCondition) => (
              <div
                key={visitCondition.id}
                className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                {/* Condition Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {visitCondition.condition_name || 
                         `Condition ${visitCondition.neo4j_condition_id}`}
                      </h4>
                      
                      {/* Severity Level Badge */}
                      {visitCondition.condition?.severity_level && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(visitCondition.condition.severity_level)}`}>
                          {getSeverityIcon(visitCondition.condition.severity_level)}
                          <span className="ml-1">{visitCondition.condition.severity_level}</span>
                        </span>
                      )}
                      
                      {/* Discharge Status Badge */}
                      {visitCondition.condition?.discharged_at && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-100 border border-green-200">
                          <CheckCircle className="h-3 w-3" />
                          <span className="ml-1">Discharged</span>
                        </span>
                      )}
                      
                      {/* Protocol Badge */}
                      {visitCondition.condition?.current_protocol_id && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200">
                          <Award className="h-3 w-3" />
                          <span className="ml-1">{visitCondition.condition.current_protocol_id}</span>
                        </span>
                      )}
                    </div>
                    
                    {visitCondition.body_region && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {visitCondition.body_region}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getFocusColor(visitCondition.treatment_focus)}`}>
                      {getFocusIcon(visitCondition.treatment_focus)}
                      <span className="ml-1">{visitCondition.treatment_focus}</span>
                    </span>
                    
                    {/* Action Buttons */}
                    {showActions && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEditCondition(visitCondition)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Update condition status & severity"
                        >
                          <TrendingUp className="h-3 w-3 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEditVisitCondition(visitCondition)}
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                          title="Update visit plan & goals"
                        >
                          <Target className="h-3 w-3 text-green-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chief Complaint */}
                {visitCondition.chief_complaint && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Chief Complaint:</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {visitCondition.chief_complaint}
                    </p>
                  </div>
                )}

                {/* Severity Scale */}
                {visitCondition.severity_scale && (
                  <div className="mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-700">Severity:</span>
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-0.5">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < visitCondition.severity_scale! 
                                  ? 'bg-red-500' 
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {visitCondition.severity_scale}/10
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Condition Information */}
                <div className="space-y-2">
                  {/* Status Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        visitCondition.condition?.status === 'ACTIVE' 
                          ? 'bg-blue-100 text-blue-800'
                          : visitCondition.condition?.status === 'CHRONIC'
                          ? 'bg-orange-100 text-orange-800'
                          : visitCondition.condition?.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {visitCondition.condition?.status || 'ACTIVE'}
                      </span>
                    </div>
                    {visitCondition.condition?.onset_date && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Onset: {new Date(visitCondition.condition.onset_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Assessment and Discharge Info */}
                  <div className="flex items-center justify-between text-xs">
                    {visitCondition.condition?.last_assessment_date && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                          Last assessed: {new Date(visitCondition.condition.last_assessment_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {visitCondition.condition?.discharged_at && visitCondition.condition?.dischargedBy && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <User className="h-3 w-3" />
                        <span>
                          By: {visitCondition.condition.dischargedBy.full_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Discharge Summary */}
                  {visitCondition.condition?.discharge_summary && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-green-700 mb-1">
                        <CheckCircle className="h-3 w-3" />
                        Discharge Summary:
                      </div>
                      <p className="text-xs text-green-600">
                        {visitCondition.condition.discharge_summary}
                      </p>
                    </div>
                  )}

                  {/* Next Visit Plan */}
                  {visitCondition.next_visit_plan && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-1">
                        <Calendar className="h-3 w-3" />
                        Next Visit Plan:
                      </div>
                      <p className="text-xs text-blue-600">
                        {visitCondition.next_visit_plan}
                      </p>
                    </div>
                  )}
                </div>

                {/* Condition Description */}
                {visitCondition.condition?.description && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      {visitCondition.condition.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConditionEditModal
        isOpen={showConditionModal}
        onClose={() => setShowConditionModal(false)}
        condition={selectedCondition}
        onConditionUpdated={handleConditionUpdated}
      />

      <VisitConditionEditModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        visitCondition={selectedVisitCondition}
        onVisitConditionUpdated={handleVisitConditionUpdated}
      />
    </div>
  );
};

export default VisitConditionContext;
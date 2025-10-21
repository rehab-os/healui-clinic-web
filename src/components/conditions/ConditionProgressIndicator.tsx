'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { VisitCondition, ConditionGoal } from '../../types/condition-types';

interface ProgressData {
  current_severity?: number;
  previous_severity?: number;
  pain_level?: number;
  functional_improvement?: number;
  goals_achieved?: number;
  total_goals?: number;
  last_assessment_date?: string;
}

interface ConditionProgressIndicatorProps {
  visitCondition: VisitCondition;
  progressData?: ProgressData;
  goals?: ConditionGoal[];
  loading?: boolean;
  className?: string;
}

const ConditionProgressIndicator: React.FC<ConditionProgressIndicatorProps> = ({
  visitCondition,
  progressData,
  goals = [],
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="w-full h-3 bg-gray-100 rounded animate-pulse"></div>
          <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse"></div>
          <div className="w-1/2 h-3 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const calculateSeverityTrend = () => {
    if (!progressData?.current_severity || !progressData?.previous_severity) {
      return null;
    }
    const diff = progressData.current_severity - progressData.previous_severity;
    if (diff < -1) return 'improving';
    if (diff > 1) return 'worsening';
    return 'stable';
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string | null) => {
    switch (trend) {
      case 'improving':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'worsening':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'stable':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getTrendMessage = (trend: string | null) => {
    switch (trend) {
      case 'improving':
        return 'Condition is improving';
      case 'worsening':
        return 'Condition needs attention';
      case 'stable':
        return 'Condition is stable';
      default:
        return 'Progress tracking active';
    }
  };

  const severityTrend = calculateSeverityTrend();
  const goalsAchieved = goals.filter(goal => goal.status === 'ACHIEVED').length;
  const goalsInProgress = goals.filter(goal => goal.status === 'IN_PROGRESS').length;
  const goalProgress = goals.length > 0 ? (goalsAchieved / goals.length) * 100 : 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-healui-physio" />
            Progress Tracking
          </h4>
          {progressData?.last_assessment_date && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              Last update: {new Date(progressData.last_assessment_date).toLocaleDateString()}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {visitCondition.condition_name || 
           `Condition ${visitCondition.neo4j_condition_id}`}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Trend Indicator */}
        <div className={`p-3 rounded-lg border ${getTrendColor(severityTrend)}`}>
          <div className="flex items-center space-x-2 mb-2">
            {getTrendIcon(severityTrend)}
            <span className="text-sm font-medium">
              {getTrendMessage(severityTrend)}
            </span>
          </div>
          {progressData && (
            <div className="text-xs space-y-1">
              {progressData.current_severity && (
                <div className="flex justify-between">
                  <span>Current severity:</span>
                  <span className="font-medium">{progressData.current_severity}/10</span>
                </div>
              )}
              {progressData.pain_level && (
                <div className="flex justify-between">
                  <span>Pain level:</span>
                  <span className="font-medium">{progressData.pain_level}/10</span>
                </div>
              )}
              {progressData.functional_improvement !== undefined && (
                <div className="flex justify-between">
                  <span>Functional improvement:</span>
                  <span className="font-medium">{progressData.functional_improvement}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goals Progress */}
        {goals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-gray-700 flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Treatment Goals
              </h5>
              <span className="text-xs text-gray-500">
                {goalsAchieved}/{goals.length} achieved
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-healui-physio h-2 rounded-full transition-all duration-300"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>

            {/* Goal Status Summary */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-medium text-green-700">{goalsAchieved}</div>
                <div className="text-green-600">Achieved</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-700">{goalsInProgress}</div>
                <div className="text-blue-600">In Progress</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">{goals.length - goalsAchieved - goalsInProgress}</div>
                <div className="text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Goals */}
        {goals.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Goals</h5>
            <div className="space-y-2">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-start space-x-2 p-2 rounded bg-gray-50">
                  <div className="flex-shrink-0 mt-0.5">
                    {goal.status === 'ACHIEVED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : goal.status === 'IN_PROGRESS' ? (
                      <Activity className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {goal.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        goal.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                        goal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {goal.priority}
                      </span>
                      {goal.target_date && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(goal.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {goals.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  + {goals.length - 3} more goals
                </p>
              )}
            </div>
          </div>
        )}

        {/* Treatment Focus Indicator */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Treatment Focus:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              visitCondition.treatment_focus === 'PRIMARY' 
                ? 'bg-red-100 text-red-800'
                : visitCondition.treatment_focus === 'SECONDARY'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {visitCondition.treatment_focus}
            </span>
          </div>
          
          {visitCondition.severity_scale && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Visit Severity:</span>
                <span className="font-medium">{visitCondition.severity_scale}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className={`h-1.5 rounded-full ${
                    visitCondition.severity_scale <= 3 ? 'bg-green-500' :
                    visitCondition.severity_scale <= 6 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(visitCondition.severity_scale / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* No Data State */}
        {!progressData && goals.length === 0 && (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">No progress data available</p>
            <p className="text-xs text-gray-400">
              Progress tracking will appear here as treatment continues
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionProgressIndicator;
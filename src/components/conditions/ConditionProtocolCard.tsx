'use client';

import React from 'react';
import { 
  Activity, 
  Clock, 
  Target, 
  TrendingUp, 
  PlayCircle,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap,
  MoreVertical,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { ConditionProtocol, VisitCondition } from '../../types/condition-types';

interface ConditionProtocolCardProps {
  visitCondition: VisitCondition;
  protocol?: ConditionProtocol;
  loading?: boolean;
  error?: string | null;
  onViewProtocol?: (protocolId: string) => void;
  onEditProtocol?: (protocolId: string) => void;
  onDownloadProtocol?: (protocolId: string) => void;
  className?: string;
}

const ConditionProtocolCard: React.FC<ConditionProtocolCardProps> = ({
  visitCondition,
  protocol,
  loading = false,
  error = null,
  onViewProtocol,
  onEditProtocol,
  onDownloadProtocol,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full h-3 bg-gray-100 rounded animate-pulse"></div>
          <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-red-700">Protocol Loading Error</span>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'PRIMARY':
        return 'bg-red-500';
      case 'SECONDARY':
        return 'bg-yellow-500';
      case 'MAINTENANCE':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-8 ${getFocusColor(visitCondition.treatment_focus)} rounded-full`}></div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {visitCondition.condition_name || 
                 `Condition ${visitCondition.neo4j_condition_id}`}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {visitCondition.treatment_focus} Treatment
                {visitCondition.body_region && 
                  ` • ${visitCondition.body_region}`
                }
              </p>
            </div>
          </div>
          
          {protocol && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      onViewProtocol?.(protocol.id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      onEditProtocol?.(protocol.id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Protocol
                  </button>
                  <button
                    onClick={() => {
                      onDownloadProtocol?.(protocol.id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Protocol Content */}
      <div className="p-4">
        {protocol ? (
          <div className="space-y-3">
            {/* Protocol Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {protocol.duration_weeks ? `${protocol.duration_weeks} weeks` : 'Ongoing'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Frequency</p>
                  <p className="text-sm font-medium text-gray-900">
                    {protocol.frequency_per_week ? `${protocol.frequency_per_week}x/week` : 'As needed'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Phase */}
            {protocol.phase && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Current Phase</p>
                    <p className="text-sm text-blue-900">{protocol.phase}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {protocol.exercises && protocol.exercises.length > 0 && (
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-green-600 font-medium">{protocol.exercises.length}</p>
                  <p className="text-xs text-green-700">Exercises</p>
                </div>
              )}
              
              {protocol.modalities && protocol.modalities.length > 0 && (
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 font-medium">{protocol.modalities.length}</p>
                  <p className="text-xs text-purple-700">Modalities</p>
                </div>
              )}
              
              {protocol.goals && protocol.goals.length > 0 && (
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-xs text-orange-600 font-medium">{protocol.goals.length}</p>
                  <p className="text-xs text-orange-700">Goals</p>
                </div>
              )}
            </div>

            {/* Expandable Details */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-left text-xs text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center py-2 border-t border-gray-100"
            >
              {isExpanded ? 'Show Less' : 'Show More Details'}
            </button>

            {isExpanded && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {/* Protocol Description */}
                {protocol.description && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-1">Description</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">{protocol.description}</p>
                  </div>
                )}

                {/* Top Goals */}
                {protocol.goals && protocol.goals.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Current Goals</h5>
                    <div className="space-y-1">
                      {protocol.goals.slice(0, 3).map((goal) => (
                        <div key={goal.id} className="flex items-start space-x-2">
                          <CheckCircle className={`h-3 w-3 mt-0.5 ${
                            goal.status === 'ACHIEVED' ? 'text-green-500' :
                            goal.status === 'IN_PROGRESS' ? 'text-blue-500' :
                            'text-gray-400'
                          }`} />
                          <p className="text-xs text-gray-600 flex-1">{goal.description}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            goal.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                            goal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {goal.priority}
                          </span>
                        </div>
                      ))}
                      {protocol.goals.length > 3 && (
                        <p className="text-xs text-gray-500">+ {protocol.goals.length - 3} more goals</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Exercises */}
                {protocol.exercises && protocol.exercises.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Key Exercises</h5>
                    <div className="space-y-1">
                      {protocol.exercises.slice(0, 3).map((exercise) => (
                        <div key={exercise.id} className="flex items-center space-x-2 text-xs">
                          <PlayCircle className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700">{exercise.name}</span>
                          {exercise.sets && exercise.reps && (
                            <span className="text-gray-500">
                              {exercise.sets}×{exercise.reps}
                            </span>
                          )}
                        </div>
                      ))}
                      {protocol.exercises.length > 3 && (
                        <p className="text-xs text-gray-500 ml-5">+ {protocol.exercises.length - 3} more exercises</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* No Protocol State */
          <div className="text-center py-6">
            <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">No protocol assigned</p>
            <p className="text-xs text-gray-400">
              Treatment protocols will appear here when assigned to this condition
            </p>
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default ConditionProtocolCard;
import React from 'react';
import { X, Clock, Target, Dumbbell, Wrench, AlertTriangle, ChevronRight, Activity } from 'lucide-react';

interface Exercise {
  exercise_id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  frequency: string;
  intensity?: string;
  resistance?: string;
  progression?: string;
  variations?: string[];
}

interface Phase {
  phase_number: number;
  phase_name: string;
  duration_weeks: string;
  goals: string[];
  precautions?: string[];
  exercises: Exercise[];
  equipment_required?: string[];
  modalities?: string[];
  criteria_to_progress?: Record<string, string>;
}

interface TreatmentProtocol {
  total_duration_weeks: string;
  phases: Phase[];
}

interface ConditionProtocol {
  name: string;
  snomed_ct?: string;
  icd10?: string;
  body_region: string;
  specialty: string;
  prevalence_rank?: number;
  typical_age_range?: string;
  gender_ratio?: string;
  chronicity?: string;
  treatment_protocol?: TreatmentProtocol;
}

interface ProtocolViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  condition: ConditionProtocol | null;
  loading?: boolean;
}

const ProtocolViewerModal: React.FC<ProtocolViewerModalProps> = ({
  isOpen,
  onClose,
  condition,
  loading = false
}) => {
  if (!isOpen) return null;

  const formatGoal = (goal: string) => {
    return goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPrecaution = (precaution: string) => {
    return precaution.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatModality = (modality: string) => {
    return modality.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-healui-physio to-healui-primary text-white">
          <div>
            <h2 className="text-xl font-bold">Treatment Protocol</h2>
            <p className="text-healui-physio/80 text-sm">
              {condition?.name || 'Loading...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healui-physio"></div>
            </div>
          ) : !condition ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No condition data available</p>
              </div>
            </div>
          ) : !condition.treatment_protocol ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Protocol Not Available</h3>
                <p className="text-gray-500">No treatment protocol exists for this condition</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Condition Overview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Body Region:</span>
                    <p className="capitalize">{condition.body_region}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Duration:</span>
                    <p>{condition.treatment_protocol.total_duration_weeks} weeks</p>
                  </div>
                  {condition.typical_age_range && (
                    <div>
                      <span className="font-medium text-gray-600">Typical Age:</span>
                      <p>{condition.typical_age_range}</p>
                    </div>
                  )}
                  {condition.chronicity && (
                    <div>
                      <span className="font-medium text-gray-600">Chronicity:</span>
                      <p>{condition.chronicity}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Protocol Phases */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-healui-physio" />
                  Treatment Phases ({condition.treatment_protocol.phases.length} phases)
                </h3>

                {condition.treatment_protocol.phases.map((phase, index) => (
                  <div key={phase.phase_number} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Phase Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-healui-physio/10 to-healui-primary/10 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-healui-physio text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {phase.phase_number}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{phase.phase_name}</h4>
                            <p className="text-sm text-gray-600">Duration: {phase.duration_weeks} weeks</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Goals */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1 text-green-600" />
                          Goals
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {phase.goals.map((goal, goalIndex) => (
                            <span
                              key={goalIndex}
                              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                            >
                              {formatGoal(goal)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Precautions */}
                      {phase.precautions && phase.precautions.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1 text-yellow-600" />
                            Precautions
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {phase.precautions.map((precaution, precautionIndex) => (
                              <span
                                key={precautionIndex}
                                className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                              >
                                {formatPrecaution(precaution)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exercises */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Dumbbell className="w-4 h-4 mr-1 text-blue-600" />
                          Exercises ({phase.exercises.length})
                        </h5>
                        <div className="grid gap-3">
                          {phase.exercises.map((exercise, exerciseIndex) => (
                            <div
                              key={exercise.exercise_id}
                              className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h6 className="font-medium text-blue-900">{exercise.name}</h6>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  {exercise.exercise_id}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {exercise.sets && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Sets:</span> {exercise.sets}
                                  </div>
                                )}
                                {exercise.reps && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Reps:</span> {exercise.reps}
                                  </div>
                                )}
                                {exercise.duration_seconds && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Duration:</span> {exercise.duration_seconds}s
                                  </div>
                                )}
                                <div>
                                  <span className="text-blue-700 font-medium">Frequency:</span> {exercise.frequency}
                                </div>
                                {exercise.intensity && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Intensity:</span> {exercise.intensity}
                                  </div>
                                )}
                                {exercise.resistance && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Resistance:</span> {exercise.resistance}
                                  </div>
                                )}
                                {exercise.progression && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Progression:</span> {exercise.progression}
                                  </div>
                                )}
                              </div>

                              {exercise.variations && exercise.variations.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-blue-700 font-medium text-sm">Variations:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {exercise.variations.map((variation, varIndex) => (
                                      <span
                                        key={varIndex}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                      >
                                        {variation}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Equipment & Modalities */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phase.equipment_required && phase.equipment_required.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Wrench className="w-4 h-4 mr-1 text-purple-600" />
                              Equipment Required
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {phase.equipment_required.map((equipment, eqIndex) => (
                                <span
                                  key={eqIndex}
                                  className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                                >
                                  {equipment}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {phase.modalities && phase.modalities.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Activity className="w-4 h-4 mr-1 text-indigo-600" />
                              Modalities
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {phase.modalities.map((modality, modIndex) => (
                                <span
                                  key={modIndex}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                                >
                                  {formatModality(modality)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progression Criteria */}
                      {phase.criteria_to_progress && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-1 text-orange-600" />
                            Criteria to Progress
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {Object.entries(phase.criteria_to_progress).map(([criteria, value]) => (
                              <div key={criteria} className="p-2 bg-orange-50 border border-orange-200 rounded">
                                <span className="text-orange-800 font-medium text-sm">
                                  {formatGoal(criteria)}:
                                </span>
                                <span className="text-orange-700 ml-1 text-sm">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolViewerModal;
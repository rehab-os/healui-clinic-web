import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, AlertTriangle, Stethoscope, Clock, Activity, FileText } from 'lucide-react';
import ApiManager from '../../services/api';
import ConditionSelector from '../molecule/ConditionSelector';
import type { 
  PatientConditionResponseDto,
  Neo4jConditionResponseDto,
  CreatePatientConditionDto,
  CreateVisitConditionDto,
  ConditionType,
  TreatmentFocus
} from '../../lib/types';

interface AddConditionToVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: string;
  patientId: string;
  existingConditionIds: string[]; // Neo4j condition IDs already in visit
  onConditionAdded: () => void;
}

interface SymptomData {
  chief_complaint: string;
}


const AddConditionToVisitModal: React.FC<AddConditionToVisitModalProps> = ({
  isOpen,
  onClose,
  visitId,
  patientId,
  existingConditionIds,
  onConditionAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  
  // Existing patient conditions
  const [patientConditions, setPatientConditions] = useState<PatientConditionResponseDto[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(false);
  
  // New condition creation
  const [selectedNewConditions, setSelectedNewConditions] = useState<Neo4jConditionResponseDto[]>([]);
  const [newConditionType, setNewConditionType] = useState<ConditionType>('ACUTE');
  const [newConditionDescription, setNewConditionDescription] = useState('');
  
  // Symptom data for each condition
  const [symptomData, setSymptomData] = useState<Record<string, SymptomData>>({});

  useEffect(() => {
    if (isOpen) {
      loadPatientConditions();
      setError('');
      setMode('existing');
      setSymptomData({});
    }
  }, [isOpen, patientId]);

  const loadPatientConditions = async () => {
    setLoadingConditions(true);
    try {
      const response = await ApiManager.getPatientConditions(patientId);
      if (response.success) {
        const activeConditions = (response.data || []).filter(
          (condition: PatientConditionResponseDto) => 
            condition.status === 'ACTIVE' && 
            !existingConditionIds.includes(condition.neo4j_condition_id)
        );
        setPatientConditions(activeConditions);
      }
    } catch (err) {
      console.error('Failed to load patient conditions:', err);
      setError('Failed to load patient conditions');
    } finally {
      setLoadingConditions(false);
    }
  };

  const initializeSymptomData = (conditionId: string, conditionName: string): SymptomData => {
    return {
      chief_complaint: `Assessment for ${conditionName}`
    };
  };

  const updateSymptomData = (conditionId: string, updates: Partial<SymptomData>) => {
    setSymptomData(prev => ({
      ...prev,
      [conditionId]: { ...prev[conditionId], ...updates }
    }));
  };

  const addExistingCondition = (condition: PatientConditionResponseDto) => {
    const symptoms = initializeSymptomData(condition.neo4j_condition_id, condition.condition_name);
    setSymptomData(prev => ({
      ...prev,
      [condition.neo4j_condition_id]: symptoms
    }));
  };

  const removeCondition = (conditionId: string) => {
    setSymptomData(prev => {
      const newData = { ...prev };
      delete newData[conditionId];
      return newData;
    });
  };

  const addNewCondition = (condition: Neo4jConditionResponseDto) => {
    const symptoms = initializeSymptomData(condition.condition_id, condition.condition_name);
    setSymptomData(prev => ({
      ...prev,
      [condition.condition_id]: symptoms
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const conditionsToAdd = Object.keys(symptomData);
      
      if (conditionsToAdd.length === 0) {
        setError('Please select at least one condition');
        setLoading(false);
        return;
      }

      // Validate symptom data
      for (const conditionId of conditionsToAdd) {
        const data = symptomData[conditionId];
        if (!data.chief_complaint.trim()) {
          setError('Please provide chief complaint for all conditions');
          setLoading(false);
          return;
        }
      }

      // Process new conditions first (create patient conditions)
      const newConditionsToCreate = selectedNewConditions.filter(condition => 
        conditionsToAdd.includes(condition.condition_id)
      );

      const createdPatientConditions: Record<string, string> = {};

      for (const condition of newConditionsToCreate) {
        const symptoms = symptomData[condition.condition_id];
        
        const createData: CreatePatientConditionDto = {
          neo4j_condition_id: condition.condition_id,
          description: newConditionDescription || condition.description,
          condition_type: newConditionType
        };

        const response = await ApiManager.createPatientCondition(patientId, createData);
        if (response.success && response.data) {
          createdPatientConditions[condition.condition_id] = response.data.id;
        } else {
          throw new Error(`Failed to create patient condition for ${condition.condition_name}`);
        }
      }

      // Now create visit conditions for all selected conditions
      const visitConditionPromises = conditionsToAdd.map(async (conditionId) => {
        const symptoms = symptomData[conditionId];
        
        // Find patient condition ID
        let patientConditionId = createdPatientConditions[conditionId];
        if (!patientConditionId) {
          const existingCondition = patientConditions.find(c => c.neo4j_condition_id === conditionId);
          patientConditionId = existingCondition?.id;
        }

        if (!patientConditionId) {
          throw new Error(`Could not find patient condition ID for ${conditionId}`);
        }

        const visitConditionData: CreateVisitConditionDto = {
          patient_condition_id: patientConditionId,
          treatment_focus: 'PRIMARY',
          chief_complaint: symptoms.chief_complaint
        };

        return ApiManager.addConditionToVisit(visitId, visitConditionData);
      });

      const results = await Promise.all(visitConditionPromises);
      
      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        throw new Error(`Failed to add ${failedResults.length} condition(s) to visit`);
      }

      console.log(`✅ Successfully added ${conditionsToAdd.length} condition(s) to visit`);
      onConditionAdded();
      onClose();
      
    } catch (err: any) {
      console.error('Error adding conditions to visit:', err);
      setError(err.message || 'Failed to add conditions to visit');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSymptomData({});
    setSelectedNewConditions([]);
    setNewConditionDescription('');
    setNewConditionType('ACUTE');
    setError('');
  };

  if (!isOpen) return null;

  const selectedConditions = Object.keys(symptomData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="glass rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border-color">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-text-dark">Add Condition to Visit</h2>
            <p className="text-sm text-text-light">Select conditions to treat in this appointment</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-healui-physio/10 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5 text-text-light" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center border border-red-200">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('existing')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'existing'
                    ? 'bg-healui-physio text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Stethoscope className="w-4 h-4 inline mr-2" />
                Existing Conditions
              </button>
              <button
                onClick={() => setMode('new')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'new'
                    ? 'bg-healui-physio text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Conditions
              </button>
            </div>
          </div>

          {mode === 'existing' ? (
            /* Existing Patient Conditions */
            <div className="space-y-4">
              <h3 className="font-medium text-text-dark">Patient's Active Conditions</h3>
              
              {loadingConditions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healui-physio mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading conditions...</p>
                </div>
              ) : patientConditions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No available conditions to add</p>
                  <p className="text-sm">All active conditions are already in this visit</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {patientConditions.map((condition) => {
                    const isSelected = selectedConditions.includes(condition.neo4j_condition_id);
                    
                    return (
                      <div key={condition.id} className="border border-border-color rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-5 h-5 text-healui-physio" />
                            <div>
                              <h4 className="font-medium text-text-dark">{condition.condition_name}</h4>
                              {condition.body_region && (
                                <p className="text-sm text-gray-500">{condition.body_region}</p>
                              )}
                            </div>
                          </div>
                          {!isSelected ? (
                            <button
                              onClick={() => addExistingCondition(condition)}
                              className="px-3 py-1.5 bg-healui-physio text-white rounded-lg text-sm font-medium hover:bg-healui-physio/90 transition-colors"
                            >
                              Add to Visit
                            </button>
                          ) : (
                            <button
                              onClick={() => removeCondition(condition.neo4j_condition_id)}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        {isSelected && (
                          <SymptomDataForm
                            conditionId={condition.neo4j_condition_id}
                            conditionName={condition.condition_name}
                            symptomData={symptomData[condition.neo4j_condition_id]}
                            onUpdate={(updates) => updateSymptomData(condition.neo4j_condition_id, updates)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* New Conditions */
            <div className="space-y-4">
              <h3 className="font-medium text-text-dark">Add New Conditions</h3>
              
              <div style={{ zIndex: 9999, position: 'relative' }}>
                <ConditionSelector
                  patientId={patientId}
                  selectedConditions={selectedNewConditions}
                  onConditionsChange={setSelectedNewConditions}
                  multiple={true}
                  showSearch={true}
                  showBodyRegionFilter={true}
                  placeholder="Search for conditions to add..."
                  excludeConditionIds={existingConditionIds}
                />
              </div>

              {selectedNewConditions.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition Type
                      </label>
                      <select
                        value={newConditionType}
                        onChange={(e) => setNewConditionType(e.target.value as ConditionType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20"
                      >
                        <option value="ACUTE">Acute</option>
                        <option value="CHRONIC">Chronic</option>
                        <option value="RECURRING">Recurring</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Description
                      </label>
                      <input
                        type="text"
                        value={newConditionDescription}
                        onChange={(e) => setNewConditionDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20"
                        placeholder="Optional description..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedNewConditions.map((condition) => {
                      const isConfigured = selectedConditions.includes(condition.condition_id);
                      
                      return (
                        <div key={condition.condition_id} className="border border-border-color rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Plus className="w-5 h-5 text-healui-physio" />
                              <div>
                                <h4 className="font-medium text-text-dark">{condition.condition_name}</h4>
                                <p className="text-sm text-gray-500">{condition.body_region}</p>
                              </div>
                            </div>
                            {!isConfigured ? (
                              <button
                                onClick={() => addNewCondition(condition)}
                                className="px-3 py-1.5 bg-healui-physio text-white rounded-lg text-sm font-medium hover:bg-healui-physio/90 transition-colors"
                              >
                                Configure
                              </button>
                            ) : (
                              <button
                                onClick={() => removeCondition(condition.condition_id)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          {isConfigured && (
                            <SymptomDataForm
                              conditionId={condition.condition_id}
                              conditionName={condition.condition_name}
                              symptomData={symptomData[condition.condition_id]}
                              onUpdate={(updates) => updateSymptomData(condition.condition_id, updates)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-color flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedConditions.length > 0 && (
              <span>{selectedConditions.length} condition(s) configured</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="btn-secondary px-6 py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedConditions.length === 0}
              className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : `Add ${selectedConditions.length} Condition(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Symptom Data Form Component
interface SymptomDataFormProps {
  conditionId: string;
  conditionName: string;
  symptomData: SymptomData;
  onUpdate: (updates: Partial<SymptomData>) => void;
}

const SymptomDataForm: React.FC<SymptomDataFormProps> = ({
  conditionId,
  conditionName,
  symptomData,
  onUpdate
}) => {
  return (
    <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
      {/* Just Chief Complaint */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          What's the main concern for this visit?
        </label>
        <textarea
          value={symptomData.chief_complaint}
          onChange={(e) => onUpdate({ chief_complaint: e.target.value })}
          rows={2}
          placeholder={`Describe the main issue with ${conditionName} for today's visit...`}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio"
        />
      </div>
    </div>
  );
};

export default AddConditionToVisitModal;
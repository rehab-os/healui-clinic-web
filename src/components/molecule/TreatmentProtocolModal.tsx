'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Target, Activity, Utensils, FileText, Download, Save, Printer } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { downloadTreatmentProtocolPDF, printTreatmentProtocol } from '../../utils/pdfGenerator';

// Import database JSON files
import jointsData from '../../../database/joint_structures.json';
import tendonsData from '../../../database/tendons.json';
import neuralsData from '../../../database/neural_structure.json';
import neckExercisesData from '../../../database/excercises/neck_excercise.json';

// Define head and neck muscles subset to avoid large import
const musclesData = [
  { id: "m001", name: "Sternocleidomastoid" },
  { id: "m002", name: "Trapezius (Upper)" },
  { id: "m003", name: "Levator Scapulae" },
  { id: "m004", name: "Scalenes" },
  { id: "m005", name: "Suboccipital Muscles" },
  { id: "m006", name: "Deep Neck Flexors" },
  { id: "m007", name: "Semispinalis Capitis" },
  { id: "m008", name: "Splenius Capitis" },
  { id: "m009", name: "Rectus Capitis" },
  { id: "m010", name: "Longus Colli" }
];

interface TreatmentProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth: string;
    gender: string;
    address?: string;
  } | null;
}

interface Exercise {
  name: string;
  description: string;
  sets: string;
  frequency: string;
  customReps?: number;
  customSets?: number;
  customTime?: number;
  customNotes?: string;
}

interface AffectedArea {
  category: 'muscles' | 'joints' | 'tendons' | 'neural';
  id: string;
  name: string;
  selected: boolean;
}

const TreatmentProtocolModal: React.FC<TreatmentProtocolModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const { currentClinic } = useAppSelector(state => state.user);
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<AffectedArea[]>([]);
  const [availableAreas, setAvailableAreas] = useState<AffectedArea[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [nutritionRecommendations, setNutritionRecommendations] = useState<string>('');
  const [protocolTitle, setProtocolTitle] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Initialize available areas from database
  useEffect(() => {
    const areas: AffectedArea[] = [];
    
    // Add muscles (focusing on head and neck)
    musclesData.forEach((muscle: any) => {
      areas.push({
        category: 'muscles',
        id: muscle.id,
        name: muscle.name,
        selected: false,
      });
    });

    // Add joints
    jointsData.slice(0, 5).forEach((joint: any) => {
      areas.push({
        category: 'joints',
        id: joint.id,
        name: joint.name,
        selected: false,
      });
    });

    // Add tendons
    tendonsData.slice(0, 5).forEach((tendon: any) => {
      areas.push({
        category: 'tendons',
        id: tendon.id,
        name: tendon.name,
        selected: false,
      });
    });

    // Add neural structures
    neuralsData.slice(0, 5).forEach((neural: any) => {
      areas.push({
        category: 'neural',
        id: neural.id,
        name: neural.name,
        selected: false,
      });
    });

    setAvailableAreas(areas);
  }, []);

  // Handle area selection
  const toggleAreaSelection = (areaId: string, category: string) => {
    const updatedAreas = availableAreas.map(area => {
      if (area.id === areaId && area.category === category) {
        const newSelected = !area.selected;
        
        // Update selected areas array
        if (newSelected) {
          setSelectedAreas(prev => [...prev, { ...area, selected: true }]);
        } else {
          setSelectedAreas(prev => prev.filter(selected => 
            !(selected.id === areaId && selected.category === category)
          ));
        }
        
        return { ...area, selected: newSelected };
      }
      return area;
    });
    
    setAvailableAreas(updatedAreas);
  };

  // Handle exercise selection
  const addExercise = (exercise: any) => {
    const newExercise: Exercise = {
      name: exercise.name,
      description: exercise.description,
      sets: exercise.sets,
      frequency: exercise.frequency,
      customReps: 10,
      customSets: 3,
      customTime: 30,
      customNotes: '',
    };
    
    setSelectedExercises(prev => [...prev, newExercise]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    setSelectedExercises(prev => prev.map((exercise, i) => {
      if (i === index) {
        return { ...exercise, [field]: value };
      }
      return exercise;
    }));
  };

  // Generate and download protocol
  const downloadProtocol = () => {
    if (!patient) return;
    
    const protocol = {
      patient: patient,
      clinic: currentClinic || {},
      protocolTitle: protocolTitle || 'Treatment Protocol',
      selectedAreas,
      selectedExercises,
      nutritionRecommendations,
      generalNotes,
      createdDate: new Date().toLocaleDateString(),
    };

    downloadTreatmentProtocolPDF(protocol);
  };

  // Print protocol
  const printProtocol = () => {
    if (!patient) return;
    
    const protocol = {
      patient: patient,
      clinic: currentClinic || {},
      protocolTitle: protocolTitle || 'Treatment Protocol',
      selectedAreas,
      selectedExercises,
      nutritionRecommendations,
      generalNotes,
      createdDate: new Date().toLocaleDateString(),
    };

    printTreatmentProtocol(protocol);
  };

  // Generate nutrition recommendations based on selected areas
  const generateNutritionRecommendations = () => {
    const recommendations = [];
    
    if (selectedAreas.some(area => area.category === 'muscles')) {
      recommendations.push('• Adequate protein intake (1.2-1.6g per kg body weight) for muscle recovery');
      recommendations.push('• Include anti-inflammatory foods: berries, leafy greens, fatty fish');
    }
    
    if (selectedAreas.some(area => area.category === 'joints')) {
      recommendations.push('• Omega-3 fatty acids for joint health (fish, walnuts, flaxseeds)');
      recommendations.push('• Vitamin D and calcium for bone health');
    }
    
    if (selectedAreas.some(area => area.category === 'neural')) {
      recommendations.push('• B-vitamins for nerve health (B1, B6, B12)');
      recommendations.push('• Magnesium for muscle and nerve function');
    }
    
    recommendations.push('• Stay well hydrated (8-10 glasses of water daily)');
    recommendations.push('• Limit processed foods and added sugars');
    
    setNutritionRecommendations(recommendations.join('\n'));
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-healui-physio/10 rounded-lg">
              <Target className="h-6 w-6 text-healui-physio" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-text-dark">
                Treatment Protocol
              </h2>
              <p className="text-sm text-text-light">
                Patient: {patient.full_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Step indicator */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-healui-physio text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 1: Select Affected Areas
                </h3>
                <p className="text-sm text-gray-600">
                  Choose the anatomical structures that need attention in this treatment protocol.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Muscles */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Muscles
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableAreas.filter(area => area.category === 'muscles').map((muscle) => (
                      <label key={muscle.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={muscle.selected}
                          onChange={() => toggleAreaSelection(muscle.id, muscle.category)}
                          className="w-4 h-4 text-healui-physio border-gray-300 rounded focus:ring-healui-physio"
                        />
                        <span className="text-sm text-gray-700">{muscle.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Joints */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    Joint Structures
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableAreas.filter(area => area.category === 'joints').map((joint) => (
                      <label key={joint.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={joint.selected}
                          onChange={() => toggleAreaSelection(joint.id, joint.category)}
                          className="w-4 h-4 text-healui-physio border-gray-300 rounded focus:ring-healui-physio"
                        />
                        <span className="text-sm text-gray-700">{joint.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tendons */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">
                    Tendons
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableAreas.filter(area => area.category === 'tendons').map((tendon) => (
                      <label key={tendon.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tendon.selected}
                          onChange={() => toggleAreaSelection(tendon.id, tendon.category)}
                          className="w-4 h-4 text-healui-physio border-gray-300 rounded focus:ring-healui-physio"
                        />
                        <span className="text-sm text-gray-700">{tendon.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Neural */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-3">
                    Neural Structures
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableAreas.filter(area => area.category === 'neural').map((neural) => (
                      <label key={neural.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={neural.selected}
                          onChange={() => toggleAreaSelection(neural.id, neural.category)}
                          className="w-4 h-4 text-healui-physio border-gray-300 rounded focus:ring-healui-physio"
                        />
                        <span className="text-sm text-gray-700">{neural.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {selectedAreas.length > 0 && (
                <div className="mt-6 p-4 bg-healui-physio/5 rounded-lg">
                  <h4 className="font-semibold text-healui-physio mb-2">Selected Areas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAreas.map((area) => (
                      <span
                        key={`${area.category}-${area.id}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-healui-physio text-white"
                      >
                        {area.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 2: Select Neck Exercises
                </h3>
                <p className="text-sm text-gray-600">
                  Choose appropriate neck exercises and customize their parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Exercises */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Available Exercises</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {neckExercisesData.map((exercise, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:border-healui-physio transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-2">{exercise.name}</h5>
                            <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
                            <div className="flex space-x-4 text-xs text-gray-500">
                              <span>Sets: {exercise.sets}</span>
                              <span>Frequency: {exercise.frequency}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => addExercise(exercise)}
                            className="ml-4 p-2 text-healui-physio hover:bg-healui-physio hover:text-white rounded-lg transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Exercises */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">
                    Selected Exercises ({selectedExercises.length})
                  </h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedExercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="p-4 bg-healui-physio/5 border border-healui-physio/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                          <button
                            onClick={() => removeExercise(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
                        
                        {/* Custom Parameters */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={exercise.customReps}
                              onChange={(e) => updateExercise(index, 'customReps', parseInt(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Sets
                            </label>
                            <input
                              type="number"
                              value={exercise.customSets}
                              onChange={(e) => updateExercise(index, 'customSets', parseInt(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Time (sec)
                            </label>
                            <input
                              type="number"
                              value={exercise.customTime}
                              onChange={(e) => updateExercise(index, 'customTime', parseInt(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
                            />
                          </div>
                        </div>
                        
                        {/* Custom Notes */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Exercise Notes
                          </label>
                          <textarea
                            value={exercise.customNotes}
                            onChange={(e) => updateExercise(index, 'customNotes', e.target.value)}
                            placeholder="Add specific notes for this exercise..."
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {selectedExercises.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No exercises selected yet</p>
                        <p className="text-sm">Choose from available exercises on the left</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 3: Nutrition Recommendations
                </h3>
                <p className="text-sm text-gray-600">
                  Add nutritional guidance to support the treatment protocol.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Utensils className="h-5 w-5 text-healui-physio" />
                    <span className="font-medium text-gray-900">Nutrition Recommendations</span>
                  </div>
                  <button
                    onClick={generateNutritionRecommendations}
                    className="px-4 py-2 bg-healui-physio text-white rounded-lg hover:bg-healui-physio/90 transition-colors text-sm"
                  >
                    Generate Recommendations
                  </button>
                </div>

                <div className="mb-6">
                  <textarea
                    value={nutritionRecommendations}
                    onChange={(e) => setNutritionRecommendations(e.target.value)}
                    placeholder="Enter nutrition recommendations based on the selected areas and exercises..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-healui-physio focus:border-healui-physio resize-none"
                  />
                </div>

                {/* Nutrition Tips */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">General Nutrition Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• Focus on anti-inflammatory foods for injury recovery</li>
                    <li>• Ensure adequate protein for tissue repair (1.2-1.6g per kg body weight)</li>
                    <li>• Include foods rich in vitamins C and E for tissue healing</li>
                    <li>• Stay hydrated to support metabolic processes</li>
                    <li>• Consider timing of meals around exercise sessions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 4: Review & Export
                </h3>
                <p className="text-sm text-gray-600">
                  Review the complete treatment protocol and export as PDF.
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-6">
                {/* Protocol Title and Notes */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Protocol Details</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Protocol Title
                      </label>
                      <input
                        type="text"
                        value={protocolTitle}
                        onChange={(e) => setProtocolTitle(e.target.value)}
                        placeholder="e.g., Neck Pain Management Protocol"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-healui-physio focus:border-healui-physio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        General Notes
                      </label>
                      <textarea
                        value={generalNotes}
                        onChange={(e) => setGeneralNotes(e.target.value)}
                        placeholder="Add any general notes or instructions for the patient..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-healui-physio focus:border-healui-physio resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-healui-physio/5 border border-healui-physio/20 rounded-lg p-4">
                  <h4 className="font-semibold text-healui-physio mb-4">Protocol Summary</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Patient Information</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li><strong>Name:</strong> {patient.full_name}</li>
                        <li><strong>Phone:</strong> {patient.phone}</li>
                        <li><strong>Email:</strong> {patient.email || 'Not provided'}</li>
                        <li><strong>Date:</strong> {new Date().toLocaleDateString()}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Clinic Information</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li><strong>Clinic:</strong> {currentClinic?.name || 'N/A'}</li>
                        <li><strong>Address:</strong> {currentClinic?.address || 'N/A'}</li>
                        <li><strong>Phone:</strong> {currentClinic?.contact_phone || 'N/A'}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Affected Areas */}
                {selectedAreas.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Affected Areas ({selectedAreas.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAreas.map((area) => (
                        <span
                          key={`${area.category}-${area.id}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-healui-physio/10 text-healui-physio"
                        >
                          {area.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Exercises */}
                {selectedExercises.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Exercises ({selectedExercises.length})</h4>
                    <div className="space-y-3">
                      {selectedExercises.map((exercise, index) => (
                        <div key={index} className="border-l-4 border-healui-physio pl-4">
                          <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                          <div className="flex space-x-4 text-xs text-gray-500">
                            <span>Reps: {exercise.customReps}</span>
                            <span>Sets: {exercise.customSets}</span>
                            <span>Duration: {exercise.customTime}s</span>
                          </div>
                          {exercise.customNotes && (
                            <p className="text-xs text-gray-600 mt-1 italic">Note: {exercise.customNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutrition */}
                {nutritionRecommendations && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Nutrition Recommendations</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {nutritionRecommendations}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Step {currentStep} of 4</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-healui-physio text-white rounded-lg hover:bg-healui-physio/90 transition-colors"
              >
                Next
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={printProtocol}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={downloadProtocol}
                  className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentProtocolModal;
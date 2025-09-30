'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Target, Activity, Utensils, FileText, Download, Printer, User, Phone, Mail, Stethoscope, AlertCircle, Info, Pill, Loader2 } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { store } from '../../store/store';
import { downloadTreatmentProtocolPDF, printTreatmentProtocol } from '../../utils/pdfGenerator';
import { format, parseISO } from 'date-fns';
import { AnatomySearchSelect } from './AnatomySearchSelect';
import { 
    createAndLoadTreatmentProtocol, 
    updateAndReloadTreatmentProtocol,
    loadProtocolForVisit,
    finalizeTreatmentProtocol,
    sendTreatmentProtocolToPatient,
    generateTreatmentProtocolPDF
} from '../../store/actions/treatment-protocol.actions';
import { closeProtocolModal } from '../../store/slices/treatment-protocol.slice';
import { 
    CreateTreatmentProtocolDto, 
    StructureType, 
    ProtocolStatus 
} from '../../lib/types';

// Import database JSON files
import neckExercisesData from '../../../database/excercises/neck_excercise.json';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface TreatmentProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: string;
  patient: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth: string;
    gender: string;
    address?: string;
  } | null;
  visitHistory?: any[];
  currentComplaint?: string;
  nutritionData?: {
    bloodTests?: {
      test: string;
      reason: string;
    }[];
    recommendedFoods: {
      category: string;
      items: string[];
      reason: string;
    }[];
    avoidFoods: {
      item: string;
      reason: string;
    }[];
    supplements: {
      name: string;
      dosage: string;
      reason: string;
    }[];
    generalAdvice?: {
      advice: string;
      reason: string;
    }[];
    precautions?: {
      precaution: string;
      reason: string;
    }[];
    hydration: string;
    generalGuidelines: string[];
  };
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
  id: string;
  name: string;
  type: 'muscle' | 'joint' | 'tendon' | 'ligament' | 'neural';
  region: string;
  details?: any;
  selected?: boolean;
}

const TreatmentProtocolModal: React.FC<TreatmentProtocolModalProps> = ({
  isOpen,
  onClose,
  visitId,
  patient,
  visitHistory = [],
  currentComplaint = '',
  nutritionData = null,
}) => {
  const dispatch = useAppDispatch();
  const { currentClinic } = useAppSelector(state => state.user);
  const { 
    currentProtocol, 
    loading, 
    error,
    existsCache 
  } = useAppSelector(state => state.treatmentProtocol);
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<any[]>([]); // Updated to handle anatomy structures
  // availableAreas no longer needed - AnatomySearchSelect handles this
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [nutritionRecommendations, setNutritionRecommendations] = useState<string>('');
  const [protocolTitle, setProtocolTitle] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [showExplanations, setShowExplanations] = useState(true);
  const [lastSavedProtocolId, setLastSavedProtocolId] = useState<string | null>(null);
  
  // Editable nutrition data states
  const [editableBloodTests, setEditableBloodTests] = useState<string[]>([]);
  const [editableRecommendedFoods, setEditableRecommendedFoods] = useState<string[]>([]);
  const [editableFoodsToAvoid, setEditableFoodsToAvoid] = useState<string[]>([]);
  const [editableSupplements, setEditableSupplements] = useState<string[]>([]);
  const [editableGeneralAdvice, setEditableGeneralAdvice] = useState<string[]>([]);
  const [editablePrecautions, setEditablePrecautions] = useState<string[]>([]);
  
  // Determine if we're editing an existing protocol
  const isEditing = !!currentProtocol;

  // Load existing protocol when modal opens
  useEffect(() => {
    if (isOpen && visitId) {
      dispatch(loadProtocolForVisit(visitId));
    }
  }, [isOpen, visitId, dispatch]);

  // Populate form when currentProtocol is loaded
  useEffect(() => {
    // Skip updating form if we just saved and this is an update to the same protocol
    if (currentProtocol && lastSavedProtocolId === currentProtocol.id) {
      console.log('Skipping form update - maintaining local state after save');
      return;
    }
    
    if (currentProtocol) {
      console.log('Syncing form with protocol from Redux:', currentProtocol.protocol_title);
      setProtocolTitle(currentProtocol.protocol_title);
      setGeneralNotes(currentProtocol.general_notes || '');
      setNutritionRecommendations(currentProtocol.additional_manual_notes || '');
      setShowExplanations(currentProtocol.show_explanations);
      
      // Set selected areas
      if (currentProtocol.affected_areas) {
        setSelectedAreas(currentProtocol.affected_areas.map(area => ({
          id: area.structure_id || area.id,
          name: area.structure_name,
          type: area.structure_type,
          category: area.structure_category,
          selected: true
        })));
      }
      
      // Set selected exercises
      if (currentProtocol.exercises) {
        setSelectedExercises(currentProtocol.exercises.map(ex => ({
          name: ex.exercise_name,
          description: ex.exercise_description || '',
          sets: ex.custom_sets.toString(),
          frequency: ex.frequency || '',
          customReps: ex.custom_reps,
          customSets: ex.custom_sets,
          customTime: ex.custom_duration_seconds,
          customNotes: ex.custom_notes || '',
        })));
      }
      
      // Set nutrition recommendations if available
      if (currentProtocol.recommendations) {
        const rec = currentProtocol.recommendations;
        setEditableBloodTests(rec.blood_tests || []);
        setEditableRecommendedFoods(rec.recommended_foods || []);
        setEditableFoodsToAvoid(rec.foods_to_avoid || []);
        setEditableSupplements(rec.supplements || []);
        setEditableGeneralAdvice(rec.general_advice || []);
        setEditablePrecautions(rec.precautions || []);
      }
    } else {
      // Reset form for new protocol
      setProtocolTitle('');
      setGeneralNotes('');
      setNutritionRecommendations('');
      setShowExplanations(true);
      setSelectedAreas([]);
      setSelectedExercises([]);
      setCurrentStep(1);
    }
  }, [currentProtocol?.id]); // Only re-run when protocol ID changes (new protocol loaded)

  // AnatomySearchSelect now handles the data loading

  // Initialize editable nutrition data when nutritionData changes
  useEffect(() => {
    if (nutritionData) {
      // Blood tests - handle both array of strings and array of objects
      const bloodTests = Array.isArray(nutritionData.bloodTests) 
        ? nutritionData.bloodTests.map(test => {
            if (typeof test === 'string') return test;
            return showExplanations ? `${test.test} (${test.reason})` : test.test;
          })
        : [];
      setEditableBloodTests(bloodTests);

      // Recommended foods - handle both simple arrays and complex structure
      const recommendedFoods = Array.isArray(nutritionData.recommendedFoods)
        ? nutritionData.recommendedFoods.length > 0 && typeof nutritionData.recommendedFoods[0] === 'object' && nutritionData.recommendedFoods[0].items
          ? nutritionData.recommendedFoods.flatMap(category =>
              category.items.map(item => 
                showExplanations ? `${item} (${category.reason})` : item
              )
            )
          : nutritionData.recommendedFoods // Simple string array
        : [];
      setEditableRecommendedFoods(recommendedFoods);

      // Foods to avoid - handle both array of strings and array of objects
      const foodsToAvoid = Array.isArray(nutritionData.avoidFoods)
        ? nutritionData.avoidFoods.map(food => {
            if (typeof food === 'string') return food;
            return showExplanations ? `${food.item} (${food.reason})` : food.item;
          })
        : [];
      setEditableFoodsToAvoid(foodsToAvoid);

      // Supplements - handle both array of strings and array of objects
      const supplements = Array.isArray(nutritionData.supplements)
        ? nutritionData.supplements.map(supplement => {
            if (typeof supplement === 'string') return supplement;
            return showExplanations 
              ? `${supplement.name} - ${supplement.dosage} (${supplement.reason})`
              : `${supplement.name} - ${supplement.dosage}`;
          })
        : [];
      setEditableSupplements(supplements);

      // General advice - handle both array of strings and array of objects
      const generalAdvice = Array.isArray(nutritionData.generalAdvice)
        ? nutritionData.generalAdvice.map(advice => {
            if (typeof advice === 'string') return advice;
            return showExplanations ? `${advice.advice} (${advice.reason})` : advice.advice;
          })
        : [];
      setEditableGeneralAdvice(generalAdvice);

      // Precautions - handle both array of strings and array of objects
      const precautions = Array.isArray(nutritionData.precautions)
        ? nutritionData.precautions.map(precaution => {
            if (typeof precaution === 'string') return precaution;
            return showExplanations ? `${precaution.precaution} (${precaution.reason})` : precaution.precaution;
          })
        : [];
      setEditablePrecautions(precautions);
    }
  }, [nutritionData, showExplanations]);

  // Anatomy selection handlers
  const handleAnatomyStructureSelect = (structure: any) => {
    console.log('Selecting anatomy structure:', structure);
    // Check if structure is already selected
    const isAlreadySelected = selectedAreas.some(s => 
      s.name === structure.name && s.type === structure.type
    );
    
    if (!isAlreadySelected) {
      setSelectedAreas(prev => [...prev, structure]);
    }
  };

  const handleAnatomyStructureRemove = (structureName: string) => {
    setSelectedAreas(prev => prev.filter(s => s.name !== structureName));
  };

  // Helper functions for managing editable lists
  const addItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string = '') => {
    setList([...list, item]);
  };

  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const updateItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    const updatedList = [...list];
    updatedList[index] = value;
    setList(updatedList);
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

  // Save protocol (create or update)
  const saveProtocol = async () => {
    if (!patient || !visitId) {
      notifications.show({
        title: 'Error',
        message: 'Missing patient or visit information',
        color: 'red',
      });
      return;
    }

    try {
      const protocolData: CreateTreatmentProtocolDto = {
        visit_id: visitId,
        protocol_title: protocolTitle || 'Treatment Protocol',
        current_complaint: currentComplaint,
        general_notes: generalNotes,
        additional_manual_notes: nutritionRecommendations,
        show_explanations: showExplanations,
        exercises: selectedExercises.map((exercise, index) => ({
          exercise_name: exercise.name,
          exercise_description: exercise.description,
          custom_reps: exercise.customReps || 10,
          custom_sets: exercise.customSets || 3,
          custom_duration_seconds: exercise.customTime || 30,
          custom_notes: exercise.customNotes,
          frequency: exercise.frequency,
          order_index: index,
        })),
        affected_areas: selectedAreas.map(area => {
          console.log('Mapping affected area:', area);
          
          // Map the type to the expected enum values
          let structureType: StructureType;
          switch (area.type?.toLowerCase()) {
            case 'muscle':
              structureType = 'muscles' as StructureType;
              break;
            case 'joint':
              structureType = 'joints' as StructureType;
              break;
            case 'tendon':
            case 'ligament': // Ligaments also map to tendons category
              structureType = 'tendons' as StructureType;
              break;
            case 'neural':
              structureType = 'neural' as StructureType;
              break;
            default:
              console.warn('Unknown structure type:', area.type, 'defaulting to tendons');
              structureType = 'tendons' as StructureType;
          }
          
          const mappedArea = {
            structure_name: area.name,
            structure_type: structureType,
            structure_category: structureType,
            structure_id: area.id || (() => {
              console.log('Generating UUID for area:', area.name);
              const uuid = generateUUID();
              console.log('Generated UUID:', uuid);
              return uuid;
            })(),
          };
          console.log('Mapped to:', mappedArea);
          return mappedArea;
        }),
        recommendations: {
          blood_tests: editableBloodTests.filter(test => test.trim()),
          recommended_foods: editableRecommendedFoods.filter(food => food.trim()),
          foods_to_avoid: editableFoodsToAvoid.filter(food => food.trim()),
          supplements: editableSupplements.filter(supplement => supplement.trim()),
          general_advice: editableGeneralAdvice.filter(advice => advice.trim()),
          precautions: editablePrecautions.filter(precaution => precaution.trim()),
          hydration_notes: nutritionData?.hydration || '',
          general_guidelines: nutritionData?.generalGuidelines || [],
          additional_notes: nutritionRecommendations,
        },
      };

      console.log('=== COMPLETE PROTOCOL DATA BEING SENT ===');
      console.log(JSON.stringify(protocolData, null, 2));
      console.log('=== END PROTOCOL DATA ===');

      let savedProtocol;
      if (isEditing && currentProtocol) {
        // Update existing protocol
        const result = await dispatch(updateAndReloadTreatmentProtocol(currentProtocol.id, protocolData) as any);
        savedProtocol = result;
        console.log('Updated protocol result:', result);
      } else {
        // Create new protocol
        const result = await dispatch(createAndLoadTreatmentProtocol(protocolData) as any);
        savedProtocol = result;
        console.log('Created protocol result:', result);
      }
      
      console.log('SaveProtocol - saved protocol:', savedProtocol);
      console.log('Comparing titles:');
      console.log('- Sent title:', protocolTitle);
      console.log('- Received title:', savedProtocol?.protocol_title);
      
      // Check if backend returned different data than what we sent
      if (savedProtocol?.protocol_title !== protocolTitle) {
        console.warn('⚠️ Backend returned different title than what was sent!');
        console.warn(`Sent: "${protocolTitle}" | Received: "${savedProtocol?.protocol_title}"`);
      }
      
      // Mark this protocol as just saved to prevent form reset
      if (savedProtocol?.id) {
        setLastSavedProtocolId(savedProtocol.id);
      }
      
      // Show enhanced success notification
      notifications.show({
        id: 'protocol-save-success',
        title: '✅ Protocol Saved!',
        message: isEditing 
          ? `"${protocolTitle}" has been updated successfully` 
          : `"${protocolTitle}" has been saved as draft`,
        color: 'green',
        autoClose: 4000,
        withCloseButton: true,
        styles: (theme) => ({
          root: {
            backgroundColor: '#f0f9ff',
            borderColor: '#22c55e',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '12px',
          },
          title: {
            color: '#166534',
            fontWeight: 600,
            fontSize: '16px',
          },
          description: {
            color: '#166534',
            fontSize: '14px',
          },
          icon: {
            backgroundColor: '#22c55e',
            color: 'white',
          },
        }),
      });
      
      // The saved protocol should now be in Redux state via the action
      // Return the saved protocol
      return savedProtocol;
    } catch (error: any) {
      console.error('Error saving protocol:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save protocol. Please try again.',
        color: 'red',
      });
      // Error handling is done in Redux
      throw error;
    }
  };

  // Save and send protocol workflow
  const saveAndSendProtocol = async () => {
    try {
      console.log('Starting save and send workflow...');
      
      // First save the protocol
      const savedProtocol = await saveProtocol();
      console.log('Protocol saved:', savedProtocol);
      
      // Get the current protocol from Redux state after save
      const protocolToProcess = savedProtocol || currentProtocol;
      console.log('Protocol to process:', protocolToProcess);

      if (protocolToProcess?.id) {
        // Finalize the protocol if it's in draft status
        if (protocolToProcess.status === ProtocolStatus.DRAFT) {
          console.log('Finalizing protocol...');
          const finalizedProtocol = await dispatch(finalizeTreatmentProtocol(protocolToProcess.id));
          console.log('Protocol finalized:', finalizedProtocol);
          
          // Send to patient after finalization
          if (finalizedProtocol) {
            console.log('Sending protocol to patient...');
            await dispatch(sendTreatmentProtocolToPatient(protocolToProcess.id));
            console.log('Protocol sent successfully!');
            
            notifications.show({
              id: 'protocol-send-success',
              title: '🚀 Protocol Sent!',
              message: `"${protocolTitle}" has been finalized and sent to ${patient?.full_name}`,
              color: 'green',
              autoClose: 5000,
              withCloseButton: true,
              styles: (theme) => ({
                root: {
                  backgroundColor: '#f0f9ff',
                  borderColor: '#3b82f6',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderRadius: '12px',
                },
                title: {
                  color: '#1e40af',
                  fontWeight: 600,
                  fontSize: '16px',
                },
                description: {
                  color: '#1e40af',
                  fontSize: '14px',
                },
                icon: {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                },
              }),
            });
          }
        } else {
          // Already finalized, just send
          console.log('Protocol already finalized, sending to patient...');
          await dispatch(sendTreatmentProtocolToPatient(protocolToProcess.id));
          console.log('Protocol sent successfully!');
          
          notifications.show({
            id: 'protocol-send-only-success',
            title: '📧 Protocol Sent!',
            message: `Treatment protocol sent to ${patient?.full_name} successfully`,
            color: 'green',
            autoClose: 4000,
            withCloseButton: true,
            styles: (theme) => ({
              root: {
                backgroundColor: '#f0f9ff',
                borderColor: '#3b82f6',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderRadius: '12px',
              },
              title: {
                color: '#1e40af',
                fontWeight: 600,
                fontSize: '16px',
              },
              description: {
                color: '#1e40af',
                fontSize: '14px',
              },
              icon: {
                backgroundColor: '#3b82f6',
                color: 'white',
              },
            }),
          });
        }
      } else {
        console.error('No protocol ID found after save');
        notifications.show({
          title: 'Error',
          message: 'Failed to save protocol. Please check the form and try again.',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error in save and send workflow:', error);
      notifications.show({
        title: 'Error',
        message: 'An error occurred during the save and send process. Please try again.',
        color: 'red',
      });
    }
  };

  // Generate and download protocol
  const downloadProtocol = async () => {
    if (!patient || !currentProtocol) return;
    
    try {
      await dispatch(generateTreatmentProtocolPDF(currentProtocol.id));
      // Handle PDF download - this depends on backend implementation
    } catch (error) {
      console.error('Error downloading protocol:', error);
    }
  };

  // Print protocol
  const printProtocol = () => {
    if (!patient || !currentProtocol) return;
    
    const protocol = {
      patient: patient,
      clinic: currentClinic || {},
      protocolTitle: protocolTitle || 'Treatment Protocol',
      selectedAreas,
      selectedExercises,
      nutritionRecommendations,
      generalNotes,
      // Use edited data instead of original nutritionData
      editedNutritionData: {
        bloodTests: editableBloodTests.filter(test => test.trim()),
        recommendedFoods: editableRecommendedFoods.filter(food => food.trim()),
        foodsToAvoid: editableFoodsToAvoid.filter(food => food.trim()),
        supplements: editableSupplements.filter(supplement => supplement.trim()),
        generalAdvice: editableGeneralAdvice.filter(advice => advice.trim()),
        precautions: editablePrecautions.filter(precaution => precaution.trim()),
        hydration: nutritionData?.hydration || '',
        generalGuidelines: nutritionData?.generalGuidelines || [],
      },
      showExplanations,
      visitHistory,
      currentComplaint,
      createdDate: new Date().toLocaleDateString(),
    };

    printTreatmentProtocol(protocol);
  };

  // Finalize protocol
  const finalizeProtocol = async () => {
    if (!currentProtocol) return;
    
    try {
      await dispatch(finalizeTreatmentProtocol(currentProtocol.id));
    } catch (error) {
      console.error('Error finalizing protocol:', error);
    }
  };

  // Send protocol to patient
  const sendProtocolToPatient = async () => {
    if (!currentProtocol) return;
    
    try {
      await dispatch(sendTreatmentProtocolToPatient(currentProtocol.id));
    } catch (error) {
      console.error('Error sending protocol to patient:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    // Reset the saved protocol ID so form syncs properly next time
    setLastSavedProtocolId(null);
    dispatch(closeProtocolModal());
    onClose();
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

  // Show error if visitId is missing
  if (!visitId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 lg:flex lg:items-center lg:justify-center z-50 lg:p-4">
        <div className="bg-white lg:rounded-lg shadow-xl w-full lg:max-w-md h-full lg:h-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Treatment Protocol</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-2">No visit selected</p>
            <p className="text-sm text-gray-600">
              Please open the treatment protocol from a specific visit in the appointments page.
            </p>
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 lg:flex lg:items-center lg:justify-center z-50 lg:p-4">
      <div className="bg-white lg:rounded-lg shadow-xl w-full lg:max-w-6xl h-full lg:h-[90vh] flex flex-col overflow-hidden safe-top safe-bottom">
        {/* Header */}
        <div className="bg-gradient-to-r from-healui-physio to-healui-primary text-white">
          <div className="px-4 sm:px-6 py-4">
            {/* Error Display */}
            {(error.creating || error.updating || error.current) && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                {error.creating || error.updating || error.current}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              {/* Title Section */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                  <Target className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Treatment Protocol
                </h1>
              </div>
              
              {/* Right Section */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Progress Indicator */}
                <div className="hidden sm:flex items-center space-x-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          currentStep >= step
                            ? 'bg-white text-healui-physio shadow-lg'
                            : 'bg-white/20 text-white/60'
                        }`}
                      >
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`h-0.5 w-6 mx-1 ${
                          currentStep > step ? 'bg-white' : 'bg-white/30'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Mobile Progress */}
                <div className="sm:hidden bg-white/20 backdrop-blur rounded-full px-3 py-1">
                  <span className="text-sm font-semibold">{currentStep}/4</span>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-2 lg:p-2 -mr-2 lg:mr-0 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 lg:h-5 lg:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading.current ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-healui-physio" />
                <p className="text-gray-600">Loading treatment protocol...</p>
              </div>
            </div>
          ) : (
            <>
            {currentStep === 1 && (
            <div className="h-full p-4 lg:p-6 overflow-y-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Step 1: Select Affected Areas
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Search and select the anatomical structures (muscles, joints, etc.) that need attention in this treatment protocol.
                </p>
              </div>

              <AnatomySearchSelect
                selectedStructures={selectedAreas}
                onStructureSelect={handleAnatomyStructureSelect}
                onStructureRemove={handleAnatomyStructureRemove}
                structureType="all"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="h-full p-4 lg:p-6 overflow-y-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Step 2: Select Neck Exercises
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Choose appropriate neck exercises and customize their parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Available Exercises */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Available Exercises</h4>
                  <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                    {neckExercisesData.map((exercise, index) => (
                      <div
                        key={index}
                        className="p-2 sm:p-4 border border-gray-200 rounded-lg hover:border-healui-physio transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base truncate">{exercise.name}</h5>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{exercise.description}</p>
                            <div className="flex space-x-2 sm:space-x-4 text-xs text-gray-500">
                              <span>Sets: {exercise.sets}</span>
                              <span>Freq: {exercise.frequency}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => addExercise(exercise)}
                            className="ml-2 sm:ml-4 p-1.5 sm:p-2 text-healui-physio hover:bg-healui-physio hover:text-white rounded-lg transition-colors flex-shrink-0"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Exercises */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">
                    Selected Exercises ({selectedExercises.length})
                  </h4>
                  <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto">
                    {selectedExercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="p-2 sm:p-4 bg-healui-physio/5 border border-healui-physio/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base flex-1 min-w-0 truncate pr-2">{exercise.name}</h5>
                          <button
                            onClick={() => removeExercise(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{exercise.description}</p>
                        
                        {/* Custom Parameters */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={exercise.customReps}
                              onChange={(e) => updateExercise(index, 'customReps', parseInt(e.target.value))}
                              className="w-full px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
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
                              className="w-full px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Time (s)
                            </label>
                            <input
                              type="number"
                              value={exercise.customTime}
                              onChange={(e) => updateExercise(index, 'customTime', parseInt(e.target.value))}
                              className="w-full px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio"
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
                            placeholder="Add specific notes..."
                            rows={2}
                            className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-healui-physio focus:border-healui-physio resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {selectedExercises.length === 0 && (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <Activity className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                        <p className="text-sm sm:text-base">No exercises selected yet</p>
                        <p className="text-xs sm:text-sm">Choose from available exercises above</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="h-full p-4 lg:p-6 overflow-y-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Step 3: Edit Treatment Recommendations
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Review and modify nutrition, blood tests, advice and precautions. Add/remove points as needed.
                </p>
              </div>

              <div className="max-w-6xl mx-auto space-y-6">
                {/* Toggle for explanations */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-healui-physio" />
                      <span className="text-sm font-medium text-gray-900">Prescription Format</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showExplanations}
                        onChange={(e) => setShowExplanations(e.target.checked)}
                        className="w-4 h-4 text-healui-physio border-gray-300 rounded focus:ring-healui-physio"
                      />
                      <span className="text-sm text-gray-700">Include explanations in prescription</span>
                    </label>
                  </div>
                </div>

                {/* Blood Tests Section */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-yellow-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Recommended Blood Tests
                    </h4>
                    <button
                      onClick={() => addItem(editableBloodTests, setEditableBloodTests)}
                      className="flex items-center px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableBloodTests.map((test, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-yellow-900">•</span>
                        <input
                          type="text"
                          value={test}
                          onChange={(e) => updateItem(editableBloodTests, setEditableBloodTests, index, e.target.value)}
                          placeholder="Blood test recommendation..."
                          className="flex-1 px-2 py-1 text-sm border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        />
                        <button
                          onClick={() => removeItem(editableBloodTests, setEditableBloodTests, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Foods Section */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-green-900 flex items-center">
                      <Utensils className="h-4 w-4 mr-2" />
                      Recommended Foods for Recovery
                    </h4>
                    <button
                      onClick={() => addItem(editableRecommendedFoods, setEditableRecommendedFoods)}
                      className="flex items-center px-2 py-1 text-xs bg-green-200 text-green-800 rounded hover:bg-green-300 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableRecommendedFoods.map((food, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-green-900">•</span>
                        <input
                          type="text"
                          value={food}
                          onChange={(e) => updateItem(editableRecommendedFoods, setEditableRecommendedFoods, index, e.target.value)}
                          placeholder="Recommended food..."
                          className="flex-1 px-2 py-1 text-sm border border-green-300 rounded focus:ring-green-500 focus:border-green-500 bg-white"
                        />
                        <button
                          onClick={() => removeItem(editableRecommendedFoods, setEditableRecommendedFoods, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foods to Avoid Section */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-red-900 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Foods to Avoid
                    </h4>
                    <button
                      onClick={() => addItem(editableFoodsToAvoid, setEditableFoodsToAvoid)}
                      className="flex items-center px-2 py-1 text-xs bg-red-200 text-red-800 rounded hover:bg-red-300 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableFoodsToAvoid.map((food, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-red-900">•</span>
                        <input
                          type="text"
                          value={food}
                          onChange={(e) => updateItem(editableFoodsToAvoid, setEditableFoodsToAvoid, index, e.target.value)}
                          placeholder="Food to avoid..."
                          className="flex-1 px-2 py-1 text-sm border border-red-300 rounded focus:ring-red-500 focus:border-red-500 bg-white"
                        />
                        <button
                          onClick={() => removeItem(editableFoodsToAvoid, setEditableFoodsToAvoid, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplements Section */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-purple-900 flex items-center">
                      <Pill className="h-4 w-4 mr-2" />
                      Recommended Supplements
                    </h4>
                    <button
                      onClick={() => addItem(editableSupplements, setEditableSupplements)}
                      className="flex items-center px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded hover:bg-purple-300 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableSupplements.map((supplement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-purple-900">•</span>
                        <input
                          type="text"
                          value={supplement}
                          onChange={(e) => updateItem(editableSupplements, setEditableSupplements, index, e.target.value)}
                          placeholder="Supplement with dosage..."
                          className="flex-1 px-2 py-1 text-sm border border-purple-300 rounded focus:ring-purple-500 focus:border-purple-500 bg-white"
                        />
                        <button
                          onClick={() => removeItem(editableSupplements, setEditableSupplements, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Advice Section */}
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-emerald-900 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      General Recovery Advice
                    </h4>
                    <button
                      onClick={() => addItem(editableGeneralAdvice, setEditableGeneralAdvice)}
                      className="flex items-center px-2 py-1 text-xs bg-emerald-200 text-emerald-800 rounded hover:bg-emerald-300 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableGeneralAdvice.map((advice, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-emerald-900">•</span>
                        <input
                          type="text"
                          value={advice}
                          onChange={(e) => updateItem(editableGeneralAdvice, setEditableGeneralAdvice, index, e.target.value)}
                          placeholder="General advice..."
                          className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        />
                        <button
                          onClick={() => removeItem(editableGeneralAdvice, setEditableGeneralAdvice, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precautions Section */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-orange-900 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Important Precautions
                    </h4>
                    <button
                      onClick={() => addItem(editablePrecautions, setEditablePrecautions)}
                      className="flex items-center px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded hover:bg-orange-300 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editablePrecautions.map((precaution, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-orange-900">•</span>
                        <input
                          type="text"
                          value={precaution}
                          onChange={(e) => updateItem(editablePrecautions, setEditablePrecautions, index, e.target.value)}
                          placeholder="Important precaution..."
                          className="flex-1 px-2 py-1 text-sm border border-orange-300 rounded focus:ring-orange-500 focus:border-orange-500 bg-white"
                        />
                        <button
                          onClick={() => removeItem(editablePrecautions, setEditablePrecautions, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manual Additional Notes */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Manual Notes</h4>
                  <textarea
                    value={nutritionRecommendations}
                    onChange={(e) => setNutritionRecommendations(e.target.value)}
                    placeholder="Add any additional notes or custom recommendations..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-healui-physio focus:border-healui-physio resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="h-full p-4 lg:p-6 overflow-y-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Step 4: Review & Export
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Review the complete treatment protocol and export as PDF.
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {/* Protocol Title and Notes */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Protocol Details</h4>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Protocol Title
                      </label>
                      <input
                        type="text"
                        value={protocolTitle}
                        onChange={(e) => setProtocolTitle(e.target.value)}
                        placeholder="e.g., Neck Pain Management Protocol"
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-healui-physio focus:border-healui-physio"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        General Notes
                      </label>
                      <textarea
                        value={generalNotes}
                        onChange={(e) => setGeneralNotes(e.target.value)}
                        placeholder="Add any general notes or instructions for the patient..."
                        rows={3}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-healui-physio focus:border-healui-physio resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-healui-physio/5 border border-healui-physio/20 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-healui-physio mb-3 sm:mb-4 text-sm sm:text-base">Protocol Summary</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Patient Information</h5>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <li><strong>Name:</strong> {patient.full_name}</li>
                        <li><strong>Phone:</strong> {patient.phone}</li>
                        <li><strong>Email:</strong> {patient.email || 'Not provided'}</li>
                        <li><strong>Date:</strong> {new Date().toLocaleDateString()}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Clinic Information</h5>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <li><strong>Clinic:</strong> {currentClinic?.name || 'N/A'}</li>
                        <li><strong>Address:</strong> {currentClinic?.address || 'N/A'}</li>
                        <li><strong>Phone:</strong> {currentClinic?.contact_phone || 'N/A'}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Affected Areas */}
                {selectedAreas.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Affected Areas ({selectedAreas.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAreas.map((area) => (
                        <span
                          key={`${area.category}-${area.id}`}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-healui-physio/10 text-healui-physio"
                        >
                          {area.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Exercises */}
                {selectedExercises.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Exercises ({selectedExercises.length})</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {selectedExercises.map((exercise, index) => (
                        <div key={index} className="border-l-4 border-healui-physio pl-3 sm:pl-4">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base">{exercise.name}</h5>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">{exercise.description}</p>
                          <div className="flex space-x-2 sm:space-x-4 text-xs text-gray-500">
                            <span>Reps: {exercise.customReps}</span>
                            <span>Sets: {exercise.customSets}</span>
                            <span>Duration: {exercise.customTime}s</span>
                          </div>
                          {exercise.customNotes && (
                            <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">Note: {exercise.customNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edited Treatment Recommendations Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Treatment Recommendations Summary</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Blood Tests */}
                    {editableBloodTests.filter(test => test.trim()).length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h5 className="font-medium text-yellow-800 mb-2 text-sm">Blood Tests ({editableBloodTests.filter(test => test.trim()).length})</h5>
                        <div className="space-y-1">
                          {editableBloodTests.filter(test => test.trim()).map((test, idx) => (
                            <div key={idx} className="text-xs text-gray-700">• {test}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Recommended Foods */}
                    {editableRecommendedFoods.filter(food => food.trim()).length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h5 className="font-medium text-green-800 mb-2 text-sm">Recommended Foods ({editableRecommendedFoods.filter(food => food.trim()).length})</h5>
                        <div className="space-y-1">
                          {editableRecommendedFoods.filter(food => food.trim()).map((food, idx) => (
                            <div key={idx} className="text-xs text-gray-700">• {food}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Foods to Avoid */}
                    {editableFoodsToAvoid.filter(food => food.trim()).length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <h5 className="font-medium text-red-800 mb-2 text-sm">Foods to Avoid ({editableFoodsToAvoid.filter(food => food.trim()).length})</h5>
                        <div className="space-y-1">
                          {editableFoodsToAvoid.filter(food => food.trim()).map((food, idx) => (
                            <div key={idx} className="text-xs text-gray-700">• {food}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Supplements */}
                    {editableSupplements.filter(supplement => supplement.trim()).length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <h5 className="font-medium text-purple-800 mb-2 text-sm">Supplements ({editableSupplements.filter(supplement => supplement.trim()).length})</h5>
                        <div className="space-y-1">
                          {editableSupplements.filter(supplement => supplement.trim()).map((supplement, idx) => (
                            <div key={idx} className="text-xs text-gray-700">• {supplement}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* General Advice */}
                    {editableGeneralAdvice.filter(advice => advice.trim()).length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <h5 className="font-medium text-emerald-800 mb-2 text-sm">General Advice ({editableGeneralAdvice.filter(advice => advice.trim()).length})</h5>
                        <div className="space-y-1">
                          {editableGeneralAdvice.filter(advice => advice.trim()).map((advice, idx) => (
                            <div key={idx} className="text-xs text-gray-700">• {advice}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Precautions */}
                    {editablePrecautions.filter(precaution => precaution.trim()).length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <h5 className="font-medium text-orange-800 mb-2 text-sm">Precautions ({editablePrecautions.filter(precaution => precaution.trim()).length})</h5>
                        <div className="space-y-1">
                          {editablePrecautions.filter(precaution => precaution.trim()).map((precaution, idx) => (
                            <div key={idx} className="text-xs text-gray-700">• {precaution}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Manual Notes */}
                {nutritionRecommendations && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Additional Manual Notes</h4>
                    <div className="text-xs sm:text-sm text-gray-600 whitespace-pre-line">
                      {nutritionRecommendations}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <span>Step {currentStep} of 4</span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  console.log('Next button clicked, moving from step', currentStep, 'to', currentStep + 1);
                  setCurrentStep(currentStep + 1);
                }}
                className="px-4 sm:px-6 py-2 bg-healui-physio text-white rounded-lg hover:bg-healui-physio/90 transition-colors text-xs sm:text-sm"
              >
                Next
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Save as Draft Button */}
                <button
                  type="button"
                  onClick={saveProtocol}
                  disabled={loading.creating || loading.updating}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                >
                  {(loading.creating || loading.updating) ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Save as Draft
                </button>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const savedProtocol = await saveProtocol();
                      // Use the saved protocol or current protocol from state
                      const protocolToFinalize = savedProtocol || currentProtocol;
                      if (protocolToFinalize?.status === ProtocolStatus.DRAFT && protocolToFinalize?.id) {
                        await dispatch(finalizeTreatmentProtocol(protocolToFinalize.id));
                        notifications.show({
                          id: 'protocol-finalize-success',
                          title: '🎯 Protocol Finalized!',
                          message: `"${protocolTitle}" has been saved and finalized successfully`,
                          color: 'green',
                          autoClose: 4000,
                          withCloseButton: true,
                          styles: (theme) => ({
                            root: {
                              backgroundColor: '#f0f9ff',
                              borderColor: '#f59e0b',
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderRadius: '12px',
                            },
                            title: {
                              color: '#92400e',
                              fontWeight: 600,
                              fontSize: '16px',
                            },
                            description: {
                              color: '#92400e',
                              fontSize: '14px',
                            },
                            icon: {
                              backgroundColor: '#f59e0b',
                              color: 'white',
                            },
                          }),
                        });
                      }
                    } catch (error) {
                      console.error('Error saving and finalizing protocol:', error);
                      notifications.show({
                        title: 'Error',
                        message: 'Failed to save protocol. Please try again.',
                        color: 'red',
                      });
                    }
                  }}
                  disabled={loading.creating || loading.updating || loading.finalizing}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                >
                  {(loading.creating || loading.updating || loading.finalizing) ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Save
                </button>

                {/* Save and Send Button */}
                <button
                  type="button"
                  onClick={saveAndSendProtocol}
                  disabled={loading.creating || loading.updating || loading.finalizing || loading.sendingToPatient}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-healui-physio text-white rounded-lg hover:bg-healui-physio/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                >
                  {(loading.creating || loading.updating || loading.finalizing || loading.sendingToPatient) ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Save & Send
                </button>

                {/* Additional Options for existing protocols */}
                {currentProtocol && (
                  <>
                    <button
                      onClick={printProtocol}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Print
                    </button>
                    <button
                      onClick={downloadProtocol}
                      disabled={loading.generatingPDF}
                      className="inline-flex items-center justify-center px-3 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                    >
                      {loading.generatingPDF ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      )}
                      {loading.generatingPDF ? 'Generating...' : 'Download PDF'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentProtocolModal;
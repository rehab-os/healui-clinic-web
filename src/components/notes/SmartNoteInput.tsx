'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mic, FileText, Sparkles, CheckCircle, AlertCircle, 
  Edit3, RotateCcw, Save, X, ChevronDown, ChevronUp, Stethoscope 
} from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import ApiManager from '../../services/api';
import type { VisitConditionResponseDto } from '../../lib/types';

interface SmartNoteInputProps {
  visitId: string;
  onNoteCreated?: () => void;
  onCancel?: () => void;
  defaultNoteType?: 'SOAP' | 'BAP' | 'Progress';
  // Optional: pre-select a specific condition
  preSelectedVisitConditionId?: string;
  // Enable/disable condition-aware mode
  enableConditionMode?: boolean;
}

type InputMode = 'audio' | 'text' | 'review';
type NoteType = 'SOAP' | 'BAP' | 'Progress';

interface NoteData {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  behavior?: string;
  progressNote?: string;
}

export default function SmartNoteInput({ 
  visitId, 
  onNoteCreated, 
  onCancel,
  defaultNoteType = 'SOAP',
  preSelectedVisitConditionId,
  enableConditionMode = true
}: SmartNoteInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [noteType, setNoteType] = useState<NoteType>(defaultNoteType);
  const [roughText, setRoughText] = useState('');
  const [generatedNote, setGeneratedNote] = useState<NoteData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Condition-aware state
  const [visitConditions, setVisitConditions] = useState<VisitConditionResponseDto[]>([]);
  const [selectedVisitConditionId, setSelectedVisitConditionId] = useState<string | null>(preSelectedVisitConditionId || null);
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [useConditionMode, setUseConditionMode] = useState(enableConditionMode && !!preSelectedVisitConditionId);

  // Load visit conditions on mount
  useEffect(() => {
    if (enableConditionMode) {
      loadVisitConditions();
    }
  }, [visitId, enableConditionMode]);

  const loadVisitConditions = async () => {
    setLoadingConditions(true);
    try {
      const response = await ApiManager.getVisitConditions(visitId);
      if (response.success && response.data) {
        const conditions = response.data || [];
        setVisitConditions(conditions);
        
        // Auto-enable condition mode if conditions exist and no pre-selection
        if (conditions.length > 0 && !preSelectedVisitConditionId) {
          setUseConditionMode(true);
          // Auto-select first condition if only one exists
          if (conditions.length === 1) {
            setSelectedVisitConditionId(conditions[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load visit conditions:', err);
      // Gracefully fall back to visit-level notes
      setUseConditionMode(false);
    } finally {
      setLoadingConditions(false);
    }
  };

  const handleAudioRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    setError(null);
    
    try {
      setIsTranscribing(true);
      
      // Determine file extension based on blob type
      let filename = 'recording';
      let mimeType = blob.type;
      
      if (blob.type.includes('webm')) {
        filename = 'recording.webm';
        // Convert webm to wav format that the API accepts
        // For now, we'll send webm and update the backend to support it
        // Alternatively, we can use a library to convert client-side
      } else if (blob.type.includes('wav')) {
        filename = 'recording.wav';
      } else if (blob.type.includes('mp3')) {
        filename = 'recording.mp3';
      } else if (blob.type.includes('m4a')) {
        filename = 'recording.m4a';
      } else {
        // Default to webm if type is not recognized
        filename = 'recording.webm';
        mimeType = 'audio/webm';
      }
      
      const audioFile = new File([blob], filename, { type: mimeType });
      
      const response = await ApiManager.transcribeAudio(audioFile);
      
      if (response.success && response.data?.transcription) {
        setRoughText(response.data.transcription);
        setInputMode('text');
        
        // Automatically generate note from transcription
        await generateSmartNote(response.data.transcription);
      } else {
        setError(response.message || 'Failed to transcribe audio. Please try again.');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to transcribe audio. Please try again.';
      setError(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateSmartNote = async (text?: string) => {
    const inputText = text || roughText;
    
    if (!inputText.trim()) {
      setError('Please provide some text or record audio first.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const response = await ApiManager.generateNote({
        transcription: inputText,
        noteType: noteType
      });

      if (response.success && response.data) {
        setGeneratedNote(response.data.note);
        setInputMode('review');
      } else {
        setError('Failed to generate note. Please try again.');
      }
    } catch (err) {
      console.error('Note generation error:', err);
      setError('Failed to generate note. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!generatedNote) {
      setError('No note to save.');
      return;
    }

    // Validate condition selection if in condition mode
    if (useConditionMode && !selectedVisitConditionId) {
      setError('Please select a condition for this note.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const notePayload = {
        visit_id: visitId,
        note_type: noteType,
        note_data: generatedNote,
        additional_notes: additionalNotes,
        treatment_codes: [],
        treatment_details: {},
        goals: {},
        outcome_measures: {},
        // Add visit condition if selected
        ...(useConditionMode && selectedVisitConditionId && {
          visit_condition_id: selectedVisitConditionId
        })
      };

      const response = await ApiManager.createNote(notePayload);

      if (response.success) {
        onNoteCreated?.();
      } else {
        setError('Failed to save note. Please try again.');
      }
    } catch (err) {
      console.error('Save note error:', err);
      setError('Failed to save note. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setInputMode('text');
    setRoughText('');
    setGeneratedNote(null);
    setAdditionalNotes('');
    setError(null);
    setAudioBlob(null);
    // Don't reset condition selection, but reset mode if no pre-selection
    if (!preSelectedVisitConditionId) {
      setSelectedVisitConditionId(visitConditions.length === 1 ? visitConditions[0].id : null);
    }
  };

  const renderNoteFields = () => {
    if (!generatedNote) return null;

    const fields = noteType === 'SOAP' 
      ? ['subjective', 'objective', 'assessment', 'plan']
      : noteType === 'BAP' 
      ? ['behavior', 'assessment', 'plan']
      : ['progressNote'];

    return (
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-text-dark capitalize">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <textarea
              value={generatedNote[field as keyof NoteData] || ''}
              onChange={(e) => setGeneratedNote({
                ...generatedNote,
                [field]: e.target.value
              })}
              rows={3}
              className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio text-sm"
              placeholder={`Enter ${field}...`}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {inputMode !== 'review' && (
        <>
          {/* Note Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-dark mb-3">Note Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['SOAP', 'BAP', 'Progress'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNoteType(type)}
                  className={`p-3 border rounded-lg transition-all duration-200 ${
                    noteType === type
                      ? 'border-healui-physio bg-healui-physio/10 text-healui-physio'
                      : 'border-border-color hover:border-border-color'
                  }`}
                >
                  <div className="font-medium">{type === 'Progress' ? 'Progress Note' : type}</div>
                  <div className="text-xs mt-1 text-text-light">
                    {type === 'SOAP' && 'Subjective, Objective, Assessment, Plan'}
                    {type === 'BAP' && 'Behavior, Assessment, Plan'}
                    {type === 'Progress' && 'Progress documentation'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Condition Selection */}
          {enableConditionMode && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-text-dark">
                  Note Target
                </label>
                {visitConditions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseConditionMode(!useConditionMode)}
                    className="text-xs text-healui-physio hover:text-healui-physio/80 font-medium transition-colors"
                  >
                    {useConditionMode ? 'Switch to Visit-Level' : 'Switch to Condition-Based'}
                  </button>
                )}
              </div>
              
              {loadingConditions ? (
                <div className="p-3 border border-border-color rounded-lg bg-gray-50">
                  <div className="animate-pulse flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              ) : visitConditions.length === 0 ? (
                <div className="p-3 border border-border-color rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">No conditions found for this visit. Note will be created at visit level.</p>
                </div>
              ) : useConditionMode ? (
                <div>
                  <div className="space-y-2">
                    {visitConditions.map((condition) => (
                      <label key={condition.id} className="flex items-center p-3 border border-border-color rounded-lg hover:bg-healui-physio/5 cursor-pointer transition-all duration-200">
                        <input
                          type="radio"
                          name="visitCondition"
                          value={condition.id}
                          checked={selectedVisitConditionId === condition.id}
                          onChange={(e) => setSelectedVisitConditionId(e.target.value)}
                          className="mr-3 text-healui-physio focus:ring-healui-physio/20"
                        />
                        <div className="flex items-center flex-1">
                          <Stethoscope className="h-4 w-4 mr-2 text-healui-physio" />
                          <div>
                            <span className="font-medium text-text-dark text-sm">
                              {condition.condition_name}
                            </span>
                            <div className="text-xs text-text-light mt-1">
                              {condition.treatment_focus} • {condition.chief_complaint || 'No specific complaint noted'}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {!selectedVisitConditionId && (
                    <p className="text-xs text-red-600 mt-2">Please select a condition for this note.</p>
                  )}
                </div>
              ) : (
                <div className="p-3 border border-border-color rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-700">
                    <strong>Visit-Level Note:</strong> This note will be associated with the entire visit rather than a specific condition.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Input Mode Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                inputMode === 'text'
                  ? 'bg-healui-primary text-white'
                  : 'bg-gray-100 text-text-dark hover:bg-healui-physio/10'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Type or Paste</span>
            </button>
            <button
              onClick={() => setInputMode('audio')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                inputMode === 'audio'
                  ? 'bg-healui-primary text-white'
                  : 'bg-gray-100 text-text-dark hover:bg-healui-physio/10'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>Record Audio</span>
            </button>
          </div>

          {/* Input Area */}
          {inputMode === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">
                  Describe the visit (any format)
                </label>
                <textarea
                  value={roughText}
                  onChange={(e) => setRoughText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio text-sm"
                  placeholder="Type or paste your notes here in any format. You can include patient complaints, observations, treatments provided, and plans. Our AI will structure it into the selected note format."
                />
                <p className="mt-2 text-xs text-text-light">
                  Write naturally - include symptoms, findings, assessments, and treatment plans in any order.
                </p>
              </div>
              
              <button
                onClick={() => generateSmartNote()}
                disabled={!roughText.trim() || isProcessing}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-healui-primary text-white rounded-lg hover:bg-healui-physio transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Generating {noteType} Note...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate {noteType} Note</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="py-8">
              <AudioRecorder
                onRecordingComplete={handleAudioRecordingComplete}
                isTranscribing={isTranscribing}
                disabled={isProcessing}
              />
            </div>
          )}
        </>
      )}

      {inputMode === 'review' && generatedNote && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-text-dark">Review Generated Note</h4>
            <button
              onClick={resetForm}
              className="flex items-center space-x-1 text-sm text-text-gray hover:text-text-dark"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Start Over</span>
            </button>
          </div>

          <div className="bg-healui-physio/10 border border-healui-primary/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-healui-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-healui-primary">AI-Generated {noteType} Note</p>
                <p className="text-xs text-healui-physio mt-1">
                  Review and edit the generated note before saving. You are responsible for accuracy.
                </p>
                {useConditionMode && selectedVisitConditionId && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Stethoscope className="h-3 w-3 text-healui-physio" />
                    <span className="text-xs text-healui-physio font-medium">
                      Condition: {visitConditions.find(c => c.id === selectedVisitConditionId)?.condition_name || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {renderNoteFields()}

          {/* Additional Options */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-text-gray hover:text-text-dark"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>Additional Notes & Options</span>
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio text-sm"
                    placeholder="Any additional observations or notes..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setInputMode('text')}
              className="px-4 py-2 text-text-dark hover:text-text-dark transition-all duration-200"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSaveNote}
              disabled={isSaving || (useConditionMode && !selectedVisitConditionId)}
              className="flex items-center space-x-2 px-6 py-2 bg-healui-physio text-white rounded-lg hover:bg-healui-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
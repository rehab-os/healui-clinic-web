'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { DiagnosticResponse } from '@/services/ai/diagnostic.service';

interface ConditionConfirmModeProps {
  selectedCondition: {
    condition_id: string;
    condition_name: string;
    confidence_score: number;
    supporting_evidence: string[];
    clinical_reasoning: string;
  };
  diagnosisResult: DiagnosticResponse;
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  completedAssessments: any[];
  patientId: string;
  sessionId?: string | null;
  draftConditionId?: string;
  onComplete: (result: any) => void;
  onBack: () => void;
}

export default function ConditionConfirmMode({
  selectedCondition,
  diagnosisResult,
  extractedFields,
  gapAnswers,
  completedAssessments,
  patientId,
  sessionId,
  draftConditionId,
  onComplete,
  onBack,
}: ConditionConfirmModeProps) {
  const [isSaving, setIsSaving] = useState(false);

  const merged = { ...extractedFields, ...gapAnswers };
  const confidence = Math.round(selectedCondition.confidence_score * 100);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. Finalize the voice session — merges fields, derives chief_complaint, marks session COMPLETED
      const { ClinicalDxVoiceService } = await import('@/services/api/clinical-dx-voice.service');
      if (sessionId) {
        const finalizeResult = await ClinicalDxVoiceService.finalize(
          sessionId,
          extractedFields,
          gapAnswers,
          merged.pain_location,
        );
        // Use derived chief_complaint from backend if we don't have one
        if (finalizeResult?.data?.fields?.chief_complaint && !merged.chief_complaint) {
          merged.chief_complaint = finalizeResult.data.fields.chief_complaint;
        }
      }

      // 2. Save the patient condition
      const { default: ApiManager } = await import('@/services/api/api.service');

      const conditionPayload = {
        condition_id: selectedCondition.condition_id,
        condition_name: selectedCondition.condition_name,
        diagnosis_method: 'CLINICAL_ONLY',

        // No symptom dx in voice flow
        symptom_dx_data: null,
        symptom_dx_completed: false,
        symptom_dx_completed_at: null,
        symptom_dx_filled_by: null,

        // Clinical dx data from voice
        clinical_dx_data: {
          session_id: sessionId || `voice_${Date.now()}`,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          responses: merged,
          activated_pathways: [],
          skipped_sections: [],
          red_flags_detected: (() => {
            const flags = merged.red_flag_screening;
            if (!Array.isArray(flags)) return [];
            return flags.filter((f: string) => f !== 'none');
          })(),
          referral_findings: [],
          selected_pain_regions: (() => {
            const loc = merged.pain_location;
            if (!Array.isArray(loc)) return [];
            return loc.map((l: any) => {
              if (typeof l === 'object' && l?.mainRegion) {
                const side = l.laterality && l.laterality !== 'center' ? `_${l.laterality}` : '';
                return l.mainRegion.replace(/-/g, '_') + side;
              }
              return String(l);
            });
          })(),
          completion_percentage: 100,
          source: 'voice_clinical_dx',
        },
        clinical_dx_completed: true,
        clinical_dx_completed_at: new Date().toISOString(),

        // Clinical assessments captured during test recommendations
        clinical_assessments_data: completedAssessments.map((a: any) => ({
          assessment_id: a.assessment_id || a.id,
          assessment_name: a.assessment_name || a.name,
          category: a.category || 'GENERAL',
          completed_at: a.completed_at || a.timestamp || new Date().toISOString(),
          form_data: a.form_data || a,
          findings_summary: a.findings_summary || null,
        })),

        // AI differential diagnosis
        clinical_dx_differential: {
          generated_at: new Date().toISOString(),
          conditions: diagnosisResult.differential_diagnosis?.map((d) => ({
            condition_id: d.condition_id,
            condition_name: d.condition_name,
            confidence_score: d.confidence_score,
            supporting_evidence: d.supporting_evidence || [],
            clinical_reasoning: d.clinical_reasoning || '',
          })) || [],
          treatment_urgency: diagnosisResult.treatment_urgency || 'MODERATE',
        },

        // Final selected diagnosis
        final_diagnosis: {
          selected_condition_id: selectedCondition.condition_id,
          selected_condition_name: selectedCondition.condition_name,
          selection_method: 'AI_SUGGESTED',
          ai_confidence_score: selectedCondition.confidence_score,
          confirmed_at: new Date().toISOString(),
        },

        // Quick access fields
        chief_complaint: merged.chief_complaint || null,
        vas_score: merged.vas_score ?? null,
        urgency_level: diagnosisResult.treatment_urgency?.toUpperCase() || 'MODERATE',
        diagnosis_status: 'COMPLETE',
      };

      if (draftConditionId) {
        await ApiManager.updatePatientCondition(patientId, draftConditionId, conditionPayload);
      } else {
        await ApiManager.createPatientCondition(patientId, conditionPayload as any);
      }

      toast.success('Condition saved', {
        description: `${selectedCondition.condition_name} has been added to patient conditions.`,
      });

      onComplete({
        diagnosis: selectedCondition,
        diagnosisResult,
        conditionPayload,
      });
    } catch (error) {
      console.error('Error saving condition:', error);
      toast.error('Failed to save condition', {
        description: 'Please try again.',
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-6"
        >
          {/* Success icon */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Confirm Diagnosis</h2>
            <p className="text-sm text-gray-500 mt-1">Review and save to patient record</p>
          </div>

          {/* Selected condition card */}
          <div className="bg-white border border-teal-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{selectedCondition.condition_name}</h3>
              <span className={`text-sm font-bold ${
                confidence >= 70 ? 'text-teal-600' :
                confidence >= 40 ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {confidence}%
              </span>
            </div>

            {selectedCondition.clinical_reasoning && (
              <p className="text-sm text-gray-600">{selectedCondition.clinical_reasoning}</p>
            )}

            {selectedCondition.supporting_evidence?.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-1">
                <p className="text-xs font-medium text-gray-500">Supporting evidence</p>
                {selectedCondition.supporting_evidence.map((ev, i) => (
                  <p key={i} className="text-xs text-gray-500">• {ev}</p>
                ))}
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-gray-900">
                {Object.keys(merged).length}
              </p>
              <p className="text-xs text-gray-500">Fields captured</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-gray-900">
                {completedAssessments.length}
              </p>
              <p className="text-xs text-gray-500">Tests done</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {diagnosisResult.treatment_urgency || 'Moderate'}
              </p>
              <p className="text-xs text-gray-500">Urgency</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save to Patient Record'
          )}
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full" size="sm" disabled={isSaving}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Diagnosis
        </Button>
      </div>
    </div>
  );
}

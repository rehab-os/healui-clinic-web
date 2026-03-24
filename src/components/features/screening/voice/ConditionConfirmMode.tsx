'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import type { DiagnosticResponse } from '@/services/ai/diagnostic.service';

interface ImagingRequest {
  modality: string;
  label: string;
  patient_label: string;
  indication_label: string;
  referral_text: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

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
  imagingRequests?: ImagingRequest[];
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
  imagingRequests = [],
  patientId,
  sessionId,
  draftConditionId,
  onComplete,
  onBack,
}: ConditionConfirmModeProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { userData } = useAppSelector(state => state.user);

  const merged = { ...extractedFields, ...gapAnswers };
  const confidence = Math.round(selectedCondition.confidence_score * 100);
  const hasImaging = imagingRequests.length > 0;

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. Finalize the voice session
      const { ClinicalDxVoiceService } = await import('@/services/api/clinical-dx-voice.service');
      if (sessionId) {
        const finalizeResult = await ClinicalDxVoiceService.finalize(
          sessionId,
          extractedFields,
          gapAnswers,
          merged.pain_location,
        );
        if (finalizeResult?.data?.fields?.chief_complaint && !merged.chief_complaint) {
          merged.chief_complaint = finalizeResult.data.fields.chief_complaint;
        }
      }

      // 2. Build imaging orders with ORDERED status
      const imagingOrders = imagingRequests.map((req) => ({
        modality: req.modality,
        label: req.label,
        patient_label: req.patient_label,
        indication_label: req.indication_label,
        referral_text: req.referral_text,
        urgency: req.urgency,
        ordered_at: new Date().toISOString(),
        status: 'ORDERED' as const,
        ordered_by_user_id: userData?.user_id || null,
      }));

      // 3. Save the patient condition
      const { default: ApiManager } = await import('@/services/api/api.service');

      const conditionPayload = {
        condition_id: hasImaging ? null : selectedCondition.condition_id,
        condition_name: hasImaging ? null : selectedCondition.condition_name,
        diagnosis_method: 'CLINICAL_ONLY',

        symptom_dx_data: null,
        symptom_dx_completed: false,
        symptom_dx_completed_at: null,
        symptom_dx_filled_by: null,

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

        clinical_assessments_data: completedAssessments.map((a: any) => ({
          assessment_id: a.assessment_id || a.id,
          assessment_name: a.assessment_name || a.name,
          category: a.category || 'GENERAL',
          completed_at: a.completed_at || a.timestamp || new Date().toISOString(),
          form_data: a.form_data || a,
          findings_summary: a.findings_summary || null,
        })),

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

        // Final diagnosis: only set when NO imaging needed (confirmed immediately)
        // When imaging ordered: null — will be set after imaging results confirm
        final_diagnosis: hasImaging ? null : {
          selected_condition_id: selectedCondition.condition_id,
          selected_condition_name: selectedCondition.condition_name,
          selection_method: 'AI_SUGGESTED',
          ai_confidence_score: selectedCondition.confidence_score,
          confirmed_at: new Date().toISOString(),
        },

        // Provisional diagnosis: set when imaging ordered (physio's working guess)
        provisional_diagnosis: hasImaging ? {
          condition_name: selectedCondition.condition_name,
          condition_id: selectedCondition.condition_id,
          source: 'DIFFERENTIAL' as const,
          set_at: new Date().toISOString(),
          set_by_user_id: userData?.user_id || null,
        } : null,

        // Imaging orders (populated only when physio selected imaging)
        imaging_orders: hasImaging ? imagingOrders : [],

        chief_complaint: merged.chief_complaint || null,
        vas_score: merged.vas_score ?? null,
        urgency_level: diagnosisResult.treatment_urgency?.toUpperCase() || 'MODERATE',

        // IMAGING_ORDERED = assessment saved but awaiting imaging results before final dx confirmed
        // COMPLETE = full assessment done, no imaging pending
        diagnosis_status: hasImaging ? 'IMAGING_ORDERED' : 'COMPLETE',
      };

      if (draftConditionId) {
        await ApiManager.updatePatientCondition(patientId, draftConditionId, conditionPayload);
      } else {
        await ApiManager.createPatientCondition(patientId, conditionPayload as any);
      }

      toast.success(hasImaging ? 'Assessment saved — imaging ordered' : 'Condition saved', {
        description: hasImaging
          ? `${selectedCondition.condition_name} saved. Return when imaging results are ready to confirm final diagnosis.`
          : `${selectedCondition.condition_name} has been added to patient conditions.`,
      });

      onComplete({
        diagnosis: selectedCondition,
        diagnosisResult,
        conditionPayload,
        imagingOrdered: hasImaging,
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
          {/* Icon + title */}
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              hasImaging ? 'bg-amber-50' : 'bg-teal-100'
            }`}>
              {hasImaging
                ? <Scan className="w-8 h-8 text-amber-500" />
                : <Check className="w-8 h-8 text-teal-600" />
              }
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {hasImaging ? 'Save & Order Imaging' : 'Confirm Diagnosis'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {hasImaging
                ? 'Assessment saved. Return once imaging results are ready.'
                : 'Review and save to patient record'}
            </p>
          </div>

          {/* Imaging notice */}
          {hasImaging && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Imaging Ordered</p>
              {imagingRequests.map((img, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-amber-800">{img.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    img.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                    img.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {img.urgency}
                  </span>
                </div>
              ))}
              <p className="text-xs text-amber-600 mt-1">
                The working diagnosis below will be confirmed once results are reviewed.
              </p>
            </div>
          )}

          {/* Selected condition card */}
          <div className="bg-white border border-teal-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {hasImaging ? 'Working Diagnosis' : 'Confirmed Diagnosis'}
              </h3>
              <span className={`text-sm font-bold ${
                confidence >= 70 ? 'text-teal-600' :
                confidence >= 40 ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {confidence}%
              </span>
            </div>
            <p className="text-sm text-gray-800 font-medium">{selectedCondition.condition_name}</p>

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
          className={`w-full ${hasImaging ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : hasImaging ? (
            <>
              <Scan className="w-4 h-4 mr-2" />
              Save & Order Imaging
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

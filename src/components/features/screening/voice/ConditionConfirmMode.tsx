'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import type { DiagnosticResponse } from '@/services/ai/diagnostic.service';
import type { ADLData } from './ADLMode';

const extractBodyRegion = (painLocation: any): string => {
  if (!Array.isArray(painLocation) || painLocation.length === 0) return '';
  const first = painLocation[0];
  if (typeof first === 'object' && first?.mainRegion) {
    return first.mainRegion.replace(/-/g, '_');
  }
  return String(first).replace(/-/g, '_');
};

const extractLaterality = (painLocation: any): string => {
  if (!Array.isArray(painLocation) || painLocation.length === 0) return 'not_applicable';
  const first = painLocation[0];
  if (typeof first === 'object' && first?.laterality) {
    if (first.laterality === 'center') return 'midline';
    if (first.laterality === 'both') return 'bilateral';
    return first.laterality;
  }
  return 'not_applicable';
};

interface ImagingRequest {
  modality: string;
  label: string;
  patient_label: string;
  indication_label: string;
  referral_text: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

interface ConditionConfirmModeProps {
  selectedConditions: {
    condition_id: string;
    condition_name: string;
    confidence_score: number;
    supporting_evidence: string[];
    clinical_reasoning: string;
  }[];
  diagnosisResult: DiagnosticResponse;
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  completedAssessments: any[];
  imagingRequests?: ImagingRequest[];
  adlData?: ADLData | null;
  patientId: string;
  sessionId?: string | null;
  draftConditionId?: string;
  onComplete: (result: any) => void;
  onBack: () => void;
}

export default function ConditionConfirmMode({
  selectedConditions,
  diagnosisResult,
  extractedFields,
  gapAnswers,
  completedAssessments,
  imagingRequests = [],
  adlData,
  patientId,
  sessionId,
  draftConditionId,
  onComplete,
  onBack,
}: ConditionConfirmModeProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { userData } = useAppSelector(state => state.user);

  const merged = { ...extractedFields, ...gapAnswers };
  const primaryCondition = selectedConditions[0];
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

      // 3. Create Episode with all assessment data
      const { default: ApiManager } = await import('@/services/api/api.service');

      const primaryFinalDiagnosis = hasImaging ? null : {
        selected_condition_id: primaryCondition.condition_id,
        selected_condition_name: primaryCondition.condition_name,
        selection_method: 'AI_SUGGESTED',
        ai_confidence_score: primaryCondition.confidence_score,
        confirmed_at: new Date().toISOString(),
      };

      const episodePayload = {
        patient_id: patientId,
        body_region: extractBodyRegion(merged.pain_location),
        laterality: extractLaterality(merged.pain_location) as any,
        diagnosis_method: 'CLINICAL_ONLY' as const,
        diagnosis_status: (hasImaging ? 'IMAGING_ORDERED' : 'COMPLETE') as any,

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

        imaging_orders: hasImaging ? imagingOrders : [],

        provisional_diagnosis: hasImaging ? {
          condition_name: primaryCondition.condition_name,
          condition_id: primaryCondition.condition_id,
          source: 'DIFFERENTIAL' as const,
          set_at: new Date().toISOString(),
          set_by_user_id: userData?.user_id || null,
        } : undefined,

        adl_data: adlData || null,
        chief_complaint: merged.chief_complaint || null,
        vas_score: merged.vas_score ?? null,
        urgency_level: diagnosisResult.treatment_urgency?.toUpperCase() || 'MODERATE',
      };

      let episodeId: string;
      try {
        const episodeResponse = await ApiManager.createEpisode(episodePayload);
        episodeId = episodeResponse.data.id;
      } catch (episodeError) {
        console.error('Error creating episode:', episodeError);
        toast.error('Failed to create episode', {
          description: 'Please try again.',
        });
        setIsSaving(false);
        return;
      }

      // 4. Create/update PatientConditions for all selected conditions
      const conditionsToSave = selectedConditions.map((cond, idx) => ({
        condition_id: hasImaging ? null : cond.condition_id,
        condition_name: hasImaging ? null : cond.condition_name,
        body_region: extractBodyRegion(merged.pain_location),
        laterality: extractLaterality(merged.pain_location),
        episode_id: episodeId,
        is_primary: idx === 0,
        diagnosis_status: hasImaging ? 'IMAGING_ORDERED' : 'COMPLETE',
        final_diagnosis: hasImaging ? null : {
          selected_condition_id: cond.condition_id,
          selected_condition_name: cond.condition_name,
          selection_method: 'AI_SUGGESTED',
          ai_confidence_score: cond.confidence_score,
          confirmed_at: new Date().toISOString(),
        },
      }));

      // First condition: update the draft if it exists
      if (draftConditionId) {
        await ApiManager.updatePatientCondition(patientId, draftConditionId, conditionsToSave[0]);
        await ApiManager.addConditionToEpisode(episodeId, {
          patient_condition_id: draftConditionId,
          is_primary: true,
          final_diagnosis: conditionsToSave[0].final_diagnosis,
        });
      } else {
        const newPrimary = await ApiManager.createPatientCondition(patientId, conditionsToSave[0] as any);
        if (newPrimary?.data?.id) {
          await ApiManager.addConditionToEpisode(episodeId, {
            patient_condition_id: newPrimary.data.id,
            is_primary: true,
            final_diagnosis: conditionsToSave[0].final_diagnosis,
          });
        }
      }

      // Additional conditions: create new PatientConditions
      for (let i = 1; i < conditionsToSave.length; i++) {
        try {
          const newCondition = await ApiManager.createPatientCondition(patientId, conditionsToSave[i] as any);
          if (newCondition?.data?.id) {
            await ApiManager.addConditionToEpisode(episodeId, {
              patient_condition_id: newCondition.data.id,
              is_primary: false,
              final_diagnosis: conditionsToSave[i].final_diagnosis,
            });
          }
        } catch (err) {
          console.error(`Failed to create secondary condition ${conditionsToSave[i].condition_name}:`, err);
        }
      }

      toast.success(hasImaging ? 'Assessment saved — imaging ordered' : 'Conditions saved', {
        description: hasImaging
          ? `${selectedConditions.length} condition${selectedConditions.length > 1 ? 's' : ''} saved. Return when imaging results are ready.`
          : `${selectedConditions.length} condition${selectedConditions.length > 1 ? 's' : ''} added to patient record.`,
      });

      onComplete({
        diagnoses: selectedConditions,
        diagnosisResult,
        episodeId,
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
                : `${selectedConditions.length} condition${selectedConditions.length > 1 ? 's' : ''} — review and save`}
            </p>
          </div>

          {/* Body region + laterality badge */}
          {(() => {
            const region = extractBodyRegion(merged.pain_location);
            const lat = extractLaterality(merged.pain_location);
            if (!region) return null;
            const regionLabel = region.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            const latLabel = lat === 'bilateral' ? 'Both Sides' : lat === 'left' ? 'Left' : lat === 'right' ? 'Right' : '';
            return (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                  {regionLabel}
                </span>
                {latLabel && (
                  <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100">
                    {latLabel}
                  </span>
                )}
              </div>
            );
          })()}

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

          {/* Selected conditions */}
          <div className="space-y-3">
            {selectedConditions.map((cond, idx) => {
              const confidence = Math.round(cond.confidence_score * 100);
              const isPrimary = idx === 0;
              return (
                <div key={cond.condition_id} className={`border rounded-xl p-4 space-y-2 ${
                  isPrimary ? 'border-teal-200 bg-white' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {cond.condition_name}
                      </h3>
                      {isPrimary && (
                        <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                          Primary
                        </span>
                      )}
                      {!isPrimary && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          Secondary
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${
                      confidence >= 70 ? 'text-teal-600' :
                      confidence >= 40 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {confidence}%
                    </span>
                  </div>
                  {isPrimary && cond.clinical_reasoning && (
                    <p className="text-sm text-gray-600">{cond.clinical_reasoning}</p>
                  )}
                </div>
              );
            })}
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

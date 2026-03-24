'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Scan, ChevronDown, ChevronUp,
  Loader2, FileText, Activity, Stethoscope, Upload, Eye, Trash2, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ImageUploadModal from './ImageUploadModal';
import { PatientDocumentService } from '@/services/api/patient-document.service';
import { aiDiagnosticService } from '@/services/ai/diagnostic.service';
import { buildDiagnosticPayload } from '@/services/ai/voice-diagnostic-payload';
import type { PatientDocumentResponseDto } from '@/lib/types';

interface ImagingOrder {
  modality: string;
  label: string;
  patient_label: string;
  indication_label: string;
  referral_text: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  ordered_at: string;
  status: 'ORDERED' | 'RESULTS_RECEIVED' | 'CANCELLED';
  results_notes?: string;
  results_received_at?: string;
  ordered_by_user_id?: string;
}

interface DifferentialCondition {
  condition_id: string;
  condition_name: string;
  confidence_score: number;
  supporting_evidence: string[];
  clinical_reasoning: string;
}

interface ResumeAssessmentScreenProps {
  patientId: string;
  patientName?: string;
  condition: {
    id: string;
    condition_name: string;
    chief_complaint?: string;
    vas_score?: number;
    urgency_level?: string;
    imaging_orders?: ImagingOrder[];
    clinical_dx_differential?: {
      conditions: DifferentialCondition[];
      treatment_urgency?: string;
    };
    clinical_dx_data?: {
      responses?: Record<string, any>;
      red_flags_detected?: string[];
      selected_pain_regions?: string[];
    };
    final_diagnosis?: {
      selected_condition_id: string;
      selected_condition_name: string;
      ai_confidence_score?: number;
    };
    provisional_diagnosis?: {
      condition_name: string;
      condition_id?: string | null;
      source: 'DIFFERENTIAL' | 'MANUAL';
      set_at: string;
    };
  };
  onComplete: () => void;
  onClose: () => void;
}

export default function ResumeAssessmentScreen({
  patientId,
  patientName,
  condition,
  onComplete,
  onClose,
}: ResumeAssessmentScreenProps) {
  const [showSubjective, setShowSubjective] = useState(false);
  const [showObjective, setShowObjective] = useState(false);
  const [imagingFindings, setImagingFindings] = useState<Record<string, string>>({});
  const [selectedConditionId, setSelectedConditionId] = useState<string>(
    condition.final_diagnosis?.selected_condition_id || ''
  );
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updatedDifferentials, setUpdatedDifferentials] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, PatientDocumentResponseDto[]>>({});

  const differentials = condition.clinical_dx_differential?.conditions || [];
  const imagingOrders = condition.imaging_orders || [];

  // Load existing uploaded documents for each imaging order (or general docs)
  useEffect(() => {
    const loadDocs = async () => {
      if (imagingOrders.length > 0) {
        for (const order of imagingOrders) {
          try {
            const res = await PatientDocumentService.listByImagingOrder(
              patientId, condition.id, order.label
            );
            if (res.success && res.data?.length > 0) {
              setUploadedDocs(prev => ({ ...prev, [order.label]: res.data }));
            }
          } catch (err) { console.warn('Failed to load documents for', order.label, err); }
        }
      } else {
        // No specific orders — load all docs for this condition
        try {
          const res = await PatientDocumentService.list(patientId, condition.id);
          if (res.success && res.data?.length > 0) {
            setUploadedDocs(prev => ({ ...prev, '_general': res.data }));
          }
        } catch (err) { console.warn('Failed to load condition documents', err); }
      }
    };
    loadDocs();
  }, [patientId, condition.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const responses = condition.clinical_dx_data?.responses || {};

  const activeDifferentials = updatedDifferentials || differentials;
  const selectedDiff = activeDifferentials.find((d: any) => d.condition_id === selectedConditionId);

  const handleConfirm = async () => {
    if (!selectedConditionId) {
      toast.error('Please select a final diagnosis');
      return;
    }

    setIsSaving(true);
    try {
      const { default: ApiManager } = await import('@/services/api/api.service');

      // Update imaging orders with results (text findings or uploaded docs mark as received)
      const updatedOrders: ImagingOrder[] = imagingOrders.map((order) => {
        const hasFindings = !!imagingFindings[order.label];
        const hasDocs = (uploadedDocs[order.label]?.length || 0) > 0;
        const received = hasFindings || hasDocs;
        return {
          ...order,
          status: received ? 'RESULTS_RECEIVED' : order.status,
          results_notes: imagingFindings[order.label] || order.results_notes,
          results_received_at: received
            ? new Date().toISOString()
            : order.results_received_at,
        } as ImagingOrder;
      });

      const payload = {
        diagnosis_status: 'COMPLETE',
        condition_name: selectedDiff?.condition_name || selectedConditionId,
        condition_id: selectedConditionId,
        imaging_orders: updatedOrders,
        final_diagnosis: {
          selected_condition_id: selectedConditionId,
          selected_condition_name: selectedDiff?.condition_name || selectedConditionId,
          selection_method: 'AI_SUGGESTED',
          ai_confidence_score: selectedDiff?.confidence_score,
          clinician_notes: clinicianNotes || undefined,
          confirmed_at: new Date().toISOString(),
        },
      };

      const result = await ApiManager.updatePatientCondition(patientId, condition.id, payload);

      if (!result.success) throw new Error(result.message || 'Failed to complete assessment');

      toast.success('Assessment completed', {
        description: `${selectedDiff?.condition_name} confirmed as final diagnosis.`,
      });

      setIsSaving(false);
      onComplete();
    } catch (err: any) {
      toast.error('Failed to save', { description: err.message || 'Please try again.' });
      setIsSaving(false);
    }
  };

  const handleGenerateDiagnosis = async () => {
    setIsGenerating(true);
    try {
      // Build imaging findings from the text inputs
      const findings = imagingOrders.length > 0
        ? imagingOrders
            .filter(order => imagingFindings[order.label])
            .map(order => ({
              modality: order.modality,
              region: condition.clinical_dx_data?.selected_pain_regions?.[0] || 'general',
              findings_text: imagingFindings[order.label],
            }))
        : imagingFindings['_general']
          ? [{ modality: 'Imaging', region: 'general', findings_text: imagingFindings['_general'] }]
          : [];

      if (findings.length === 0) {
        toast.error('Please enter imaging findings first');
        setIsGenerating(false);
        return;
      }

      // Build payload with original responses + imaging findings
      const payload = await buildDiagnosticPayload(
        condition.clinical_dx_data?.responses || {},
        {},
        [],
        findings,
      );

      const result = await aiDiagnosticService.getDifferentialDiagnosis(payload);
      setUpdatedDifferentials(result.differential_diagnosis || []);

      // Auto-select top condition
      if (result.differential_diagnosis?.length > 0) {
        setSelectedConditionId(result.differential_diagnosis[0].condition_id);
      }
    } catch (err: any) {
      toast.error('Failed to generate diagnosis', { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400">Complete Assessment</p>
          {patientName && <p className="text-sm font-medium text-gray-700">{patientName}</p>}
        </div>
        <div className="w-7" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-5">

          {/* Part 1 summary — read only */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Part 1 Assessment Summary</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded font-medium uppercase tracking-wide">
                  Read Only
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="px-4 pb-3 flex gap-4 text-xs text-gray-500">
              {condition.vas_score != null && (
                <span>VAS <strong className="text-gray-700">{condition.vas_score}/10</strong></span>
              )}
              {condition.urgency_level && (
                <span>Urgency <strong className="text-gray-700 capitalize">{condition.urgency_level.toLowerCase()}</strong></span>
              )}
              {condition.chief_complaint && (
                <span className="truncate">"{condition.chief_complaint}"</span>
              )}
            </div>

            {/* Provisional Diagnosis */}
            {condition.provisional_diagnosis && (
              <div className="mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded font-bold uppercase tracking-wide">Provisional</span>
                <span className="text-sm font-medium text-amber-900">{condition.provisional_diagnosis.condition_name}</span>
                {condition.provisional_diagnosis.source === 'MANUAL' && (
                  <span className="text-[10px] text-amber-600">(manually entered)</span>
                )}
              </div>
            )}

            {/* Subjective accordion */}
            <button
              onClick={() => setShowSubjective(!showSubjective)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left bg-white border-t border-gray-100 hover:bg-gray-50"
            >
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Subjective History
              </span>
              {showSubjective ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {showSubjective && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 space-y-1.5 border-t border-gray-100 bg-white">
                    {[
                      ['Pain Location', responses.pain_location?.map((l: any) => `${l.laterality !== 'center' ? l.laterality + ' ' : ''}${l.mainRegion}`).join(', ')],
                      ['Onset', responses.onset_nature],
                      ['Duration', responses.symptom_onset ? new Date(responses.symptom_onset).toLocaleDateString() : undefined],
                      ['Nature', Array.isArray(responses.pain_nature) ? responses.pain_nature.join(', ') : responses.pain_nature],
                      ['Radiation', responses.pain_radiation ? (responses.radiation_pattern || 'Yes') : 'No'],
                      ['Aggravating', Array.isArray(responses.aggravating_factors) ? responses.aggravating_factors.join(', ') : responses.aggravating_factors],
                      ['24h pattern', responses.behavior_24hr],
                      ['Red flags', condition.clinical_dx_data?.red_flags_detected?.join(', ')],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string} className="flex gap-2 text-xs">
                        <span className="text-gray-400 w-20 shrink-0">{label}</span>
                        <span className="text-gray-700">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Objective accordion */}
            <button
              onClick={() => setShowObjective(!showObjective)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left bg-white border-t border-gray-100 hover:bg-gray-50"
            >
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                Objective Findings
              </span>
              {showObjective ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {showObjective && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 space-y-1.5 border-t border-gray-100 bg-white">
                    {[
                      ['Swelling', responses.obs_swelling],
                      ['Posture', responses.obs_posture],
                      ['Gait', responses.obs_gait],
                      ['Temperature', responses.obs_temperature],
                      ['Deformity', responses.obs_deformity],
                    ].filter(([, v]) => v && v !== 'normal' && v !== 'None').map(([label, value]) => (
                      <div key={label as string} className="flex gap-2 text-xs">
                        <span className="text-gray-400 w-20 shrink-0">{label}</span>
                        <span className="text-gray-700 capitalize">{value as string}</span>
                      </div>
                    ))}
                    {Object.entries(responses).filter(([k, v]) => k.startsWith('tend_') && v).length > 0 && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-gray-400 w-20 shrink-0">Tenderness</span>
                        <span className="text-gray-700">
                          {Object.entries(responses)
                            .filter(([k, v]) => k.startsWith('tend_') && v)
                            .map(([k, v]) => `${k.replace('tend_', '')} (${v})`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {Object.keys(responses).filter(k => k.endsWith('_active')).length === 0 && (
                      <p className="text-xs text-gray-400 italic">Objective examination was skipped</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Imaging ordered */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-800">
                Imaging Results
              </h3>
            </div>

            {imagingOrders.length > 0 ? imagingOrders.map((order, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{order.label}</p>
                    <p className="text-xs text-gray-500">{order.indication_label}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                    order.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.urgency}
                  </span>
                </div>
                {/* Uploaded documents */}
                {(uploadedDocs[order.label]?.length || 0) > 0 && (
                  <div className="space-y-1.5">
                    {uploadedDocs[order.label].map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                        <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-xs text-teal-800 truncate flex-1">{doc.title}</span>
                        <button
                          onClick={async () => {
                            try {
                              const res = await PatientDocumentService.getViewUrl(patientId, doc.id);
                              if (res.success) window.open(res.data.view_url, '_blank');
                            } catch { toast.error('Failed to open document'); }
                          }}
                          className="p-1 hover:bg-teal-100 rounded text-teal-600"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await PatientDocumentService.delete(patientId, doc.id);
                              setUploadedDocs(prev => ({
                                ...prev,
                                [order.label]: prev[order.label].filter(d => d.id !== doc.id),
                              }));
                              toast.success('Document removed');
                            } catch { toast.error('Failed to delete'); }
                          }}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadTarget(order.label)}
                  className="w-full text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Report
                </Button>

                <Textarea
                  value={imagingFindings[order.label] || ''}
                  onChange={(e) => setImagingFindings(prev => ({ ...prev, [order.label]: e.target.value }))}
                  placeholder={`Enter findings from ${order.label} report…\ne.g. L4-L5 disc herniation with mild right paracentral protrusion`}
                  className="text-sm resize-none min-h-[80px]"
                />
              </div>
            )) : (
              /* No specific imaging orders — show generic upload */
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-gray-500">No specific imaging orders recorded. You can still upload imaging results.</p>

                {/* Uploaded documents (generic) */}
                {(uploadedDocs['_general']?.length || 0) > 0 && (
                  <div className="space-y-1.5">
                    {uploadedDocs['_general'].map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                        <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-xs text-teal-800 truncate flex-1">{doc.title}</span>
                        <button
                          onClick={async () => {
                            try {
                              const res = await PatientDocumentService.getViewUrl(patientId, doc.id);
                              if (res.success) window.open(res.data.view_url, '_blank');
                            } catch { toast.error('Failed to open document'); }
                          }}
                          className="p-1 hover:bg-teal-100 rounded text-teal-600"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadTarget('_general')}
                  className="w-full text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Imaging Report
                </Button>

                <Textarea
                  value={imagingFindings['_general'] || ''}
                  onChange={(e) => setImagingFindings(prev => ({ ...prev, '_general': e.target.value }))}
                  placeholder="Enter imaging findings…"
                  className="text-sm resize-none min-h-[80px]"
                />
              </div>
            )}
          </div>

          {/* Final diagnosis selection */}
          <div className="space-y-3">
            {/* Generate button — shown when no updated differentials yet */}
            {!updatedDifferentials && (
              <div className="space-y-3">
                <Button
                  onClick={handleGenerateDiagnosis}
                  disabled={isGenerating}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with imaging findings…
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Generate Updated Diagnosis
                    </>
                  )}
                </Button>

                {/* Show old differential as reference (collapsed) */}
                {differentials.length > 0 && (
                  <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-600">
                      View initial differential (before imaging)
                    </summary>
                    <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200">
                      {differentials.map((d, i) => (
                        <p key={i} className="text-gray-400">
                          {d.condition_name} — {Math.round(d.confidence_score * 100)}%
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Updated differential list — shown after generation */}
            {updatedDifferentials && (
              <>
                <h3 className="text-sm font-semibold text-gray-800">Updated Diagnosis</h3>
                <p className="text-xs text-gray-500">
                  Based on clinical assessment + imaging findings.
                </p>

                <div className="space-y-2">
                  {updatedDifferentials.map((d: any) => {
                    const isSelected = d.condition_id === selectedConditionId;
                    const pct = Math.round(d.confidence_score * 100);
                    return (
                      <button
                        key={d.condition_id}
                        onClick={() => setSelectedConditionId(d.condition_id)}
                        className={`w-full text-left rounded-xl border p-4 transition-all ${
                          isSelected
                            ? 'border-teal-400 bg-teal-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-teal-800' : 'text-gray-800'}`}>
                            {d.condition_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${
                              pct >= 70 ? 'text-teal-600' : pct >= 40 ? 'text-amber-600' : 'text-gray-400'
                            }`}>{pct}%</span>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                        {isSelected && d.clinical_reasoning && (
                          <p className="text-xs text-teal-700 mt-1">{d.clinical_reasoning}</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Re-generate option */}
                <button
                  onClick={() => { setUpdatedDifferentials(null); setSelectedConditionId(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Re-generate diagnosis
                </button>

                {/* Optional clinical notes */}
                <Textarea
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  placeholder="Additional clinical notes (optional)…"
                  className="text-sm resize-none min-h-[60px]"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white">
        <Button
          onClick={handleConfirm}
          disabled={isSaving || !selectedConditionId}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Final Diagnosis
            </>
          )}
        </Button>
      </div>

      {/* Upload modal */}
      <ImageUploadModal
        open={!!uploadTarget}
        onClose={() => setUploadTarget(null)}
        onUploadComplete={(doc) => {
          if (uploadTarget) {
            setUploadedDocs(prev => ({
              ...prev,
              [uploadTarget]: [...(prev[uploadTarget] || []), doc],
            }));
          }
          setUploadTarget(null);
        }}
        patientId={patientId}
        conditionId={condition.id}
        imagingOrderLabel={uploadTarget || ''}
      />
    </div>
  );
}

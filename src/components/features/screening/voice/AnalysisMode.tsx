'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Hand, Zap, Eye, ClipboardCheck, Ruler } from 'lucide-react';
// Examination data — ROM, palpation, neuro, girth, effusion
import examinationData from '@/data/clinical/entities/clinical_examination.json';
// Special tests — 56 assessments + region_assessment_map
import assessmentData from '@/data/clinical/entities/clinical_assessments_quick.json';

// ─────────────────────────────────────────────
// JSON-driven types
// ─────────────────────────────────────────────
type GirthPoint     = { key: string; label: string; unit: string; note: string };
type RomMovement    = { key: string; label: string; normal: number; unit: string };
type NeuroMap       = { dermatomes: string[]; myotomes: Record<string, string>; reflexes: string[] };
type EffusionTest   = { key: string; label: string; options: string[] };

const cd  = examinationData as any;   // examination: ROM, palpation, neuro, girth
const cda = assessmentData  as any;   // special tests + region_assessment_map

// ─────────────────────────────────────────────
// Region detection — uses region_alias_map from JSON
// ─────────────────────────────────────────────
function detectRegion(fields: Record<string, any>): string | null {
  const loc = fields.pain_location;
  if (!loc) return null;

  const locations = Array.isArray(loc) ? loc : [loc];
  const locStr = locations.map((l: any) =>
    typeof l === 'object' && l?.mainRegion ? l.mainRegion : String(l),
  ).join(' ').toLowerCase();

  const hasRadiation  = fields.pain_radiation === true;
  const hasNeuralSigns = fields.sensation_screening === true || fields.weakness_screening === true;
  const radPattern    = fields.radiation_pattern;

  if ((locStr.includes('lower-leg') || locStr.includes('foot')) &&
      (hasRadiation || hasNeuralSigns || radPattern === 'down_leg')) return 'lumbar';
  if ((locStr.includes('forearm') || locStr.includes('hand') || locStr.includes('upper-arm')) &&
      (hasRadiation || hasNeuralSigns || radPattern === 'down_arm')) return 'cervical';

  const aliasMap = (cd.msk?.region_alias_map ?? cda.region_alias_map) as Record<string, string>;
  for (const [key, canonical] of Object.entries(aliasMap)) {
    if (locStr.includes(key.toLowerCase())) return canonical;
  }

  if (locStr.includes('shoulder')) return 'shoulder';
  if (locStr.includes('knee'))     return 'knee';
  if (locStr.includes('ankle'))    return 'ankle';
  if (locStr.includes('foot'))     return 'foot';
  if (locStr.includes('hip') || locStr.includes('thigh')) return 'hip';
  if (locStr.includes('wrist'))    return 'wrist';
  if (locStr.includes('hand') || locStr.includes('finger')) return 'hand';
  if (locStr.includes('elbow'))    return 'elbow';

  return null;
}

const REGION_LABELS: Record<string, string> = {
  lumbar: 'Lumbar Spine', cervical: 'Cervical Spine', thoracic: 'Thoracic Spine',
  shoulder: 'Shoulder', elbow: 'Elbow', wrist: 'Wrist', hand: 'Wrist / Hand',
  hip: 'Hip', knee: 'Knee', ankle: 'Ankle', foot: 'Ankle / Foot',
};

// ─────────────────────────────────────────────
// Props & section types
// ─────────────────────────────────────────────
interface AnalysisModeProps {
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  onComplete: (analysisAnswers: Record<string, any>) => void;
  onSkip: () => void;
}

type Section = 'observation' | 'tenderness' | 'rom' | 'measurements' | 'tests' | 'neuro';

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function AnalysisMode({ extractedFields, gapAnswers, onComplete, onSkip }: AnalysisModeProps) {
  const mergedFields = { ...extractedFields, ...gapAnswers };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const region = useMemo(() => detectRegion(mergedFields), []);

  // ── All data from single source ──
  // Read from clinical_examination.json (msk domain)
  const msk = cd.msk ?? {};
  const tendernessPoints: string[]    = region ? (msk.region_palpation_map?.[region]?.tenderness_points ?? []) : [];
  const palpationTissueOptions: string[] = region ? (msk.region_palpation_map?.[region]?.tissue_quality_options ?? []) : [];
  const accessoryMovements: any[]     = region ? (msk.region_palpation_map?.[region]?.accessory_movements ?? []) : [];
  const romMovements: RomMovement[]   = region ? (msk.region_joint_map?.[region]      ?? []) : [];
  const neuroData: NeuroMap | null    = region ? (msk.region_neuro_map?.[region]      ?? null) : null;
  const girthPoints: GirthPoint[]     = region ? (msk.region_girth_map?.[region]      ?? []) : [];
  const effusionTests: EffusionTest[] = region ? (msk.effusion_tests?.[region]         ?? []) : [];
  const showGrip: boolean             = (msk.grip_strength_regions as string[] ?? []).includes(region ?? '');
  const endFeelOptions: string[]      = (cd.universal_scales?.end_feel_options ?? []).map((e: any) => e.label ?? e);
  const tendernessGrades              = cd.universal_scales?.tenderness_grading?.grades ?? [];

  // Read from clinical_assessments_quick.json (special tests)
  const assessmentIds: string[]       = region ? (cda.region_assessment_map?.[region] ?? []) : [];
  const allAssessments = cda.assessments as Record<string, any>;
  const regionTests = assessmentIds
    .map(id => ({ id, ...allAssessments[id] }))
    .filter(t => t.name && t.quick_type !== 'measurement');

  const showNeuro        = (mergedFields.sensation_screening === true || mergedFields.weakness_screening === true) && !!neuroData;
  const showMeasurements = girthPoints.length > 0 || showGrip || effusionTests.length > 0;

  const [activeSection, setActiveSection] = useState<Section>('observation');
  const [answers, setAnswers]             = useState<Record<string, any>>({});

  const set    = (key: string, value: any) => setAnswers(prev => ({ ...prev, [key]: value }));
  const toggle = (listKey: string, item: string) => {
    const cur: string[] = answers[listKey] ?? [];
    set(listKey, cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item]);
  };

  const tendernessSelected: string[] = answers['tenderness_points'] ?? [];

  const allSections = [
    { id: 'observation'  as Section, label: 'Observation',   icon: <Eye className="w-3.5 h-3.5" />,            show: true },
    { id: 'tenderness'   as Section, label: 'Tenderness',    icon: <Hand className="w-3.5 h-3.5" />,           show: tendernessPoints.length > 0 },
    { id: 'rom'          as Section, label: 'ROM',            icon: <Activity className="w-3.5 h-3.5" />,       show: romMovements.length > 0 },
    { id: 'measurements' as Section, label: 'Measurements',  icon: <Ruler className="w-3.5 h-3.5" />,          show: showMeasurements },
    { id: 'tests'        as Section, label: 'Special Tests', icon: <ClipboardCheck className="w-3.5 h-3.5" />, show: regionTests.length > 0 },
    { id: 'neuro'        as Section, label: 'Neuro',          icon: <Zap className="w-3.5 h-3.5" />,           show: showNeuro },
  ];
  const sections = allSections.filter(s => s.show);

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-0.5">Analysis — Objective Findings</p>
        <h3 className="text-[15px] text-gray-800 font-medium">
          {region ? (REGION_LABELS[region] ?? region) : 'No region detected'}
        </h3>
        {!region && (
          <p className="text-[11px] text-gray-400 mt-0.5">Fill in what you can observe</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pt-3 pb-2 flex-shrink-0 overflow-x-auto no-scrollbar">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all border ${
              activeSection === s.id
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s.icon}{s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3">

        {/* ── Observation ── */}
        {activeSection === 'observation' && (
          <motion.div key="obs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <ChipSelector label="Temperature" options={['Hot', 'Warm', 'Normal', 'Cool']}
              value={answers['obs_temperature']} onChange={v => set('obs_temperature', v)} />
            <ChipSelector label="Swelling" options={['None', 'Mild', 'Moderate', 'Severe']}
              value={answers['obs_swelling']} onChange={v => set('obs_swelling', v)} />
            <ChipSelector label="Posture" options={['Normal', 'Antalgic lean', 'Scoliosis', 'Hyperkyphosis', 'Hyperlordosis']}
              value={answers['obs_posture']} onChange={v => set('obs_posture', v)} />
            <ChipSelector label="Gait" options={['Normal', 'Antalgic', 'Limping', 'Unable to weight bear']}
              value={answers['obs_gait']} onChange={v => set('obs_gait', v)} />
            <ChipSelector label="Muscle wasting" options={['None visible', 'Mild', 'Moderate', 'Marked']}
              value={answers['obs_muscle_wasting']} onChange={v => set('obs_muscle_wasting', v)} />
            <ChipSelector label="Deformity" options={['None', 'Mild', 'Significant']}
              value={answers['obs_deformity']} onChange={v => set('obs_deformity', v)} />
          </motion.div>
        )}

        {/* ── Tenderness + Palpation ── */}
        {activeSection === 'tenderness' && (
          <motion.div key="tend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Tenderness grading per point */}
            <div>
              <p className="text-[11px] text-gray-500 font-medium mb-1">Tenderness on palpation</p>
              <p className="text-[10px] text-gray-400 mb-3">
                0 = None · 1+ = Mild · 2+ = Grimace · 3+ = Withdraws
              </p>
              <div className="space-y-2">
                {tendernessPoints.map(point => {
                  const grade = answers[`tend_${point}`] as number | undefined;
                  return (
                    <div key={point} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-[12px] text-gray-600 flex-1">{point}</span>
                      <div className="flex gap-1.5">
                        {tendernessGrades.map((g: any) => (
                          <button
                            key={g.value}
                            onClick={() => set(`tend_${point}`, g.value)}
                            className={`w-9 h-8 rounded-lg text-[11px] font-medium border transition-all ${
                              grade === g.value
                                ? g.value === 0 ? 'bg-gray-100 text-gray-600 border-gray-300'
                                  : g.value === 1 ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : g.value === 2 ? 'bg-orange-50 text-orange-700 border-orange-300'
                                  : 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {g.chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tissue quality */}
            {palpationTissueOptions.length > 0 && (
              <ChipSelector
                label="Tissue quality"
                options={palpationTissueOptions}
                value={answers['tissue_quality']}
                onChange={v => set('tissue_quality', v)}
              />
            )}

            {/* Accessory movements — spine only */}
            {accessoryMovements.map((am: any) => (
              <div key={am.key} className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-3">
                <p className="text-[12px] text-gray-700 font-medium">{am.label}</p>
                {am.clinical_note && (
                  <p className="text-[10px] text-gray-400">{am.clinical_note}</p>
                )}
                {am.levels?.map((level: string) => (
                  <div key={level} className="space-y-1.5">
                    <p className="text-[11px] text-gray-500">{level}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ChipSelector
                        label="Stiffness"
                        options={cd.universal_scales?.accessory_movement_stiffness ?? ['Normal', 'Slightly stiff', 'Stiff', 'Very stiff']}
                        value={answers[`${am.key}_${level}_stiff`]}
                        onChange={v => set(`${am.key}_${level}_stiff`, v)}
                      />
                      <ChipSelector
                        label="Pain"
                        options={cd.universal_scales?.accessory_movement_pain ?? ['None', 'Familiar pain', 'Different pain', 'Severe pain']}
                        value={answers[`${am.key}_${level}_pain`]}
                        onChange={v => set(`${am.key}_${level}_pain`, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── ROM ── */}
        {activeSection === 'rom' && (
          <motion.div key="rom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <p className="text-[11px] text-gray-400">Active and passive range — enter degrees, select end feel</p>
            {romMovements.map(mov => (
              <RomRow
                key={mov.key}
                movement={mov}
                endFeelOptions={endFeelOptions}
                activeValue={answers[`${mov.key}_active`]}
                passiveValue={answers[`${mov.key}_passive`]}
                endFeel={answers[`${mov.key}_end_feel`]}
                onActive={v => set(`${mov.key}_active`, v)}
                onPassive={v => set(`${mov.key}_passive`, v)}
                onEndFeel={v => set(`${mov.key}_end_feel`, v)}
              />
            ))}
          </motion.div>
        )}

        {/* ── Measurements ── */}
        {activeSection === 'measurements' && (
          <motion.div key="meas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Girth */}
            {girthPoints.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">Girth / Circumference</p>
                <p className="text-[11px] text-gray-400 mb-3">Compare affected vs unaffected side (cm)</p>
                <div className="space-y-3">
                  {girthPoints.map(pt => (
                    <GirthRow
                      key={pt.key}
                      point={pt}
                      affectedValue={answers[`${pt.key}_affected`]}
                      unaffectedValue={answers[`${pt.key}_unaffected`]}
                      onAffected={v => set(`${pt.key}_affected`, v)}
                      onUnaffected={v => set(`${pt.key}_unaffected`, v)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Grip strength */}
            {showGrip && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">Grip Strength (Dynamometer)</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'grip_affected',   label: 'Affected side' },
                    { key: 'grip_unaffected', label: 'Unaffected side' },
                  ].map(side => (
                    <div key={side.key}>
                      <p className="text-[11px] text-gray-500 mb-1">{side.label}</p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" min={0} max={80}
                          value={answers[side.key] ?? ''}
                          onChange={e => { const n = Number(e.target.value); if (!isNaN(n) && n >= 0) set(side.key, n); }}
                          placeholder="—"
                          className="w-20 px-2 py-2 text-[13px] text-center rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:border-teal-400"
                        />
                        <span className="text-[12px] text-gray-400">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
                {answers['grip_affected'] && answers['grip_unaffected'] && (
                  <p className="text-[11px] text-teal-600 mt-2 font-medium">
                    Deficit: {Math.round((1 - answers['grip_affected'] / answers['grip_unaffected']) * 100)}%
                  </p>
                )}
              </div>
            )}

            {/* Effusion */}
            {effusionTests.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">Effusion Testing</p>
                <div className="space-y-3">
                  {effusionTests.map(test => (
                    <ChipSelector
                      key={test.key}
                      label={test.label}
                      options={test.options}
                      value={answers[test.key]}
                      onChange={v => set(test.key, v)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Special Tests ── */}
        {activeSection === 'tests' && (
          <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {regionTests.map(test => (
              <SpecialTestCard
                key={test.id}
                test={test}
                value={answers[`test_${test.id}`]}
                onChange={v => set(`test_${test.id}`, v)}
              />
            ))}
          </motion.div>
        )}

        {/* ── Neurological ── */}
        {activeSection === 'neuro' && neuroData && (
          <motion.div key="neuro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {neuroData.reflexes.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">Reflexes</p>
                <div className="space-y-3">
                  {neuroData.reflexes.map((r: string) => (
                    <ChipSelector key={r} label={`${r.charAt(0).toUpperCase() + r.slice(1)} reflex`}
                      options={['Normal', 'Reduced', 'Absent', 'Exaggerated']}
                      value={answers[`reflex_${r}`]} onChange={v => set(`reflex_${r}`, v)} />
                  ))}
                </div>
              </div>
            )}
            {neuroData.dermatomes.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">Dermatome Sensation</p>
                <div className="space-y-3">
                  {neuroData.dermatomes.map((lvl: string) => (
                    <ChipSelector key={lvl} label={lvl}
                      options={['Intact', 'Reduced', 'Absent', 'Hyperaesthetic']}
                      value={answers[`dermato_${lvl}`]} onChange={v => set(`dermato_${lvl}`, v)} />
                  ))}
                </div>
              </div>
            )}
            {Object.keys(neuroData.myotomes).length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">Myotome Strength</p>
                <div className="space-y-3">
                  {Object.entries(neuroData.myotomes as Record<string, string>).map(([lvl, muscle]) => (
                    <ChipSelector key={lvl} label={`${lvl} — ${muscle}`}
                      options={['5/5', '4/5', '3/5', '2/5', '1/5', '0/5']}
                      value={answers[`myotome_${lvl}`]} onChange={v => set(`myotome_${lvl}`, v)} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
        <button onClick={onSkip} className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors px-2">
          Skip
        </button>
        <button
          onClick={() => onComplete({ ...answers, analysis_region: region })}
          className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium transition-all flex items-center justify-center gap-2"
        >
          Continue to Diagnosis <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ChipSelector({ label, options, value, onChange }: {
  label: string; options: string[]; value: string | undefined; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[12px] text-gray-600 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`py-1.5 px-3 rounded-lg text-[12px] transition-all border ${
              value === opt
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function RomRow({ movement, endFeelOptions, activeValue, passiveValue, endFeel, onActive, onPassive, onEndFeel }: {
  movement: RomMovement;
  endFeelOptions: string[];
  activeValue?: number; passiveValue?: number; endFeel?: string;
  onActive: (v: number) => void; onPassive: (v: number) => void; onEndFeel: (v: string) => void;
}) {
  const active  = activeValue;
  const passive = passiveValue;
  const normal  = movement.normal;

  const activeReduced  = active  !== undefined && normal > 0 && active  < normal * 0.75;
  const passiveReduced = passive !== undefined && normal > 0 && passive < normal * 0.75;

  // Contractile issue: active < passive
  const contractileIssue = active !== undefined && passive !== undefined && active < passive - 10;

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-700 font-medium">{movement.label}</p>
        <span className="text-[10px] text-gray-400">Normal: {normal}{movement.unit}</span>
      </div>

      {/* Active + Passive inputs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Active', value: active,  reduced: activeReduced,  onChange: onActive },
          { label: 'Passive', value: passive, reduced: passiveReduced, onChange: onPassive },
        ].map(side => (
          <div key={side.label}>
            <p className="text-[10px] text-gray-400 mb-1">{side.label}</p>
            <div className="flex items-center gap-1">
              <input
                type="number" min={0} max={normal + 30}
                value={side.value ?? ''}
                onChange={e => { const n = Number(e.target.value); if (!isNaN(n) && n >= 0) side.onChange(n); }}
                placeholder="—"
                className={`w-16 px-2 py-1.5 text-[13px] text-center rounded-lg border focus:outline-none focus:border-teal-400 ${
                  side.reduced ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-700 bg-white'
                }`}
              />
              <span className="text-[11px] text-gray-400">{movement.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical note */}
      {contractileIssue && (
        <p className="text-[10px] text-amber-600 font-medium">Active &lt; Passive — suggests contractile tissue issue</p>
      )}
      {activeReduced && !contractileIssue && (
        <p className="text-[10px] text-amber-600">Range reduced (&lt;75% normal)</p>
      )}

      {/* Progress bar — active ROM vs normal */}
      {active !== undefined && normal > 0 && (
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${activeReduced ? 'bg-amber-400' : 'bg-teal-500'}`}
            animate={{ width: `${Math.min((active / normal) * 100, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* End feel */}
      <div>
        <p className="text-[10px] text-gray-400 mb-1">End feel</p>
        <div className="flex flex-wrap gap-1">
          {endFeelOptions.map(ef => (
            <button key={ef} onClick={() => onEndFeel(ef)}
              className={`py-1 px-2 rounded-md text-[11px] transition-all border ${
                endFeel === ef
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
              }`}
            >
              {ef}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GirthRow({ point, affectedValue, unaffectedValue, onAffected, onUnaffected }: {
  point: GirthPoint;
  affectedValue?: number; unaffectedValue?: number;
  onAffected: (v: number) => void; onUnaffected: (v: number) => void;
}) {
  const diff = affectedValue !== undefined && unaffectedValue !== undefined
    ? (affectedValue - unaffectedValue).toFixed(1)
    : null;
  const hasSwelling = diff !== null && parseFloat(diff) > 0.5;

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[12px] text-gray-700 font-medium">{point.label}</p>
          <p className="text-[10px] text-gray-400">{point.note}</p>
        </div>
        {diff !== null && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            hasSwelling ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-teal-50 text-teal-600 border border-teal-100'
          }`}>
            {parseFloat(diff) > 0 ? '+' : ''}{diff} cm
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Affected', value: affectedValue,   onChange: onAffected },
          { label: 'Unaffected', value: unaffectedValue, onChange: onUnaffected },
        ].map(side => (
          <div key={side.label}>
            <p className="text-[10px] text-gray-400 mb-1">{side.label}</p>
            <div className="flex items-center gap-1">
              <input
                type="number" min={0} max={120} step={0.1}
                value={side.value ?? ''}
                onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0) side.onChange(n); }}
                placeholder="—"
                className="w-20 px-2 py-1.5 text-[13px] text-center rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:border-teal-400"
              />
              <span className="text-[11px] text-gray-400">{point.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecialTestCard({ test, value, onChange }: { test: any; value?: string; onChange: (v: string) => void }) {
  const options: { value: string; chip: string; label: string; color: string }[] = test.result?.options ?? [];
  const colorMap: Record<string, string> = {
    green:  'bg-green-50  text-green-700  border-green-300',
    yellow: 'bg-amber-50  text-amber-700  border-amber-300',
    orange: 'bg-orange-50 text-orange-700 border-orange-300',
    red:    'bg-red-50    text-red-700    border-red-300',
  };

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
      <p className="text-[13px] text-gray-700 font-medium mb-0.5">{test.name}</p>
      {test.diagnostic_value && (
        <p className="text-[10px] text-gray-400 mb-2">{test.diagnostic_value}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt: any) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
              value === opt.value
                ? (colorMap[opt.color] ?? 'bg-teal-600 text-white border-teal-600')
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {opt.chip}{opt.label !== opt.chip ? ` ${opt.label}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

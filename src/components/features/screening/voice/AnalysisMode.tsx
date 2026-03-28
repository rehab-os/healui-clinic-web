'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Hand, Zap, Eye, ClipboardCheck, Ruler, ChevronDown, Check } from 'lucide-react';
// Examination data — ROM, palpation, neuro, girth, effusion
import examinationData from '@/data/clinical/entities/clinical_examination.json';
// Special tests — 56 assessments + region_assessment_map
import assessmentData from '@/data/clinical/entities/clinical_assessments_quick.json';
// ROM measurement types + pain responses + clinical significance
import romData from '@/data/clinical/entities/clinical_rom.json';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type GirthPoint   = { key: string; label: string; unit: string; note: string };
type RomMovement  = { key: string; label: string; normal: number; unit: string };
type NeuroMap     = { dermatomes: string[]; myotomes: Record<string, string>; reflexes: string[] };
type EffusionTest = { key: string; label: string; options: string[] };
type Section      = 'observation' | 'tenderness' | 'rom' | 'measurements' | 'tests' | 'neuro';

const cd  = examinationData as any;
const cda = assessmentData  as any;
const rd  = romData         as any;

// ─────────────────────────────────────────────
// Region detection
// ─────────────────────────────────────────────
function detectRegion(fields: Record<string, any>): string | null {
  const loc = fields.pain_location;
  if (!loc) return null;

  const locations = Array.isArray(loc) ? loc : [loc];
  const locStr = locations.map((l: any) =>
    typeof l === 'object' && l?.mainRegion ? l.mainRegion : String(l),
  ).join(' ').toLowerCase();

  const hasRadiation   = fields.pain_radiation === true;
  const hasNeuralSigns = fields.sensation_screening === true || fields.weakness_screening === true;
  const radPattern     = fields.radiation_pattern;

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
// Helpers
// ─────────────────────────────────────────────
function sectionSummary(section: Section, answers: Record<string, any>, meta: {
  tendernessPoints: string[];
  romMovements: RomMovement[];
  girthPoints: GirthPoint[];
  regionTests: any[];
}): string {
  switch (section) {
    case 'observation': {
      const parts = ['obs_temperature', 'obs_swelling', 'obs_posture', 'obs_gait']
        .map(k => answers[k]).filter(Boolean);
      return parts.length ? parts.slice(0, 2).join(' · ') : '';
    }
    case 'tenderness': {
      const graded = meta.tendernessPoints.filter(p =>
        answers[`tend_${p}`] !== undefined && answers[`tend_${p}`] > 0
      );
      return graded.length ? `${graded.length} point${graded.length > 1 ? 's' : ''} tender` : '';
    }
    case 'rom': {
      const measured = meta.romMovements.filter(m => answers[`${m.key}_active`] !== undefined);
      return measured.length ? `${measured.length}/${meta.romMovements.length} measured` : '';
    }
    case 'measurements': {
      const hasGirth = meta.girthPoints.some(p => answers[`${p.key}_affected`] !== undefined);
      const hasGrip  = answers['grip_affected'] !== undefined;
      if (hasGirth && hasGrip) return 'Girth + grip recorded';
      if (hasGirth) return 'Girth recorded';
      if (hasGrip) return `Grip: ${answers['grip_affected']} kg`;
      return '';
    }
    case 'tests': {
      const done = meta.regionTests.filter(t => answers[`test_${t.id}`] !== undefined);
      return done.length ? `${done.length}/${meta.regionTests.length} done` : '';
    }
    case 'neuro': {
      const keys = Object.keys(answers).filter(k =>
        k.startsWith('reflex_') || k.startsWith('dermato_') || k.startsWith('myotome_')
      );
      return keys.length ? `${keys.length} level${keys.length > 1 ? 's' : ''} tested` : '';
    }
    default: return '';
  }
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface AnalysisModeProps {
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  laterality?: 'left' | 'right' | 'bilateral' | 'midline' | 'not_applicable';
  onComplete: (analysisAnswers: Record<string, any>) => void;
  onSkip: () => void;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function AnalysisMode({ extractedFields, gapAnswers, laterality, onComplete, onSkip }: AnalysisModeProps) {
  const mergedFields = { ...extractedFields, ...gapAnswers };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const region = useMemo(() => detectRegion(mergedFields), []);

  const isBilateral = laterality === 'bilateral';
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const sideKey = (key: string) => isBilateral ? `${activeSide}_${key}` : key;

  const msk = cd.msk ?? {};
  const tendernessPoints: string[]     = region ? (msk.region_palpation_map?.[region]?.tenderness_points    ?? []) : [];
  const palpationTissueOptions: string[] = region ? (msk.region_palpation_map?.[region]?.tissue_quality_options ?? []) : [];
  const accessoryMovements: any[]      = region ? (msk.region_palpation_map?.[region]?.accessory_movements  ?? []) : [];
  const romMovements: RomMovement[]    = region ? (msk.region_joint_map?.[region]        ?? []) : [];
  const neuroData: NeuroMap | null     = region ? (msk.region_neuro_map?.[region]         ?? null) : null;
  const girthPoints: GirthPoint[]      = region ? (msk.region_girth_map?.[region]         ?? []) : [];
  const effusionTests: EffusionTest[]  = region ? (msk.effusion_tests?.[region]            ?? []) : [];
  const showGrip: boolean              = (msk.grip_strength_regions as string[] ?? []).includes(region ?? '');
  const endFeelOptions: string[]       = (cd.universal_scales?.end_feel_options ?? []).map((e: any) => e.label ?? e);
  const tendernessGrades               = cd.universal_scales?.tenderness_grading?.grades ?? [];
  const romMeasurementTypes            = rd.measurement_types ?? [];
  const romPainOptions: { key: string; label: string }[] = rd.pain_during_movement ?? [];
  const romMovementsData               = region ? (rd.movements?.[region] ?? {}) : {};

  const assessmentIds: string[]  = region ? (cda.region_assessment_map?.[region] ?? []) : [];
  const allAssessments           = cda.assessments as Record<string, any>;
  const regionTests              = assessmentIds
    .map(id => ({ id, ...allAssessments[id] }))
    .filter(t => t.name && t.quick_type !== 'measurement');

  const showNeuro        = (mergedFields.sensation_screening === true || mergedFields.weakness_screening === true) && !!neuroData;
  const showMeasurements = girthPoints.length > 0 || showGrip || effusionTests.length > 0;

  // ── Accordion state — set of expanded section IDs ──
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(new Set(['observation']));
  const [answers, setAnswers]                   = useState<Record<string, any>>({});

  const toggleSection = (s: Section) => setExpandedSections(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next;
  });

  const set = (key: string, value: any) => setAnswers(prev => ({ ...prev, [key]: value }));

  const allSections: { id: Section; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'observation',  label: 'Observation',   icon: <Eye className="w-4 h-4" />,           show: true },
    { id: 'tenderness',   label: 'Tenderness',    icon: <Hand className="w-4 h-4" />,          show: tendernessPoints.length > 0 },
    { id: 'rom',          label: 'ROM',            icon: <Activity className="w-4 h-4" />,      show: romMovements.length > 0 },
    { id: 'measurements', label: 'Measurements',  icon: <Ruler className="w-4 h-4" />,         show: showMeasurements },
    { id: 'tests',        label: 'Special Tests', icon: <ClipboardCheck className="w-4 h-4" />, show: regionTests.length > 0 },
    { id: 'neuro',        label: 'Neuro',          icon: <Zap className="w-4 h-4" />,           show: showNeuro },
  ];
  const sections = allSections.filter(s => s.show);

  const meta = { tendernessPoints, romMovements, girthPoints, regionTests };

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
        <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-0.5 font-medium">
          Examination — Objective Findings
        </p>
        <h3 className="text-base font-semibold text-gray-800">
          {region ? (REGION_LABELS[region] ?? region) : 'No region detected'}
          {isBilateral && <span className="text-[13px] text-gray-400 font-normal ml-1.5">(Both Sides)</span>}
        </h3>
        {!region && (
          <p className="text-[13px] text-gray-400 mt-0.5">Fill in what you can observe</p>
        )}
      </div>

      {/* Accordion sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map(section => {
          const isOpen    = expandedSections.has(section.id);
          const summary   = sectionSummary(section.id, answers, meta);
          const isDone    = summary.length > 0;

          return (
            <div key={section.id} className="border-b border-gray-100 bg-white">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className={`flex-shrink-0 ${isDone ? 'text-teal-500' : 'text-gray-400'}`}>
                  {isDone ? <Check className="w-4 h-4" /> : section.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-medium text-gray-800">{section.label}</span>
                  {!isOpen && summary && (
                    <span className="text-[12px] text-gray-400 ml-2">{summary}</span>
                  )}
                  {!isOpen && !summary && (
                    <span className="text-[12px] text-gray-300 ml-2">Not assessed</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Section content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-gray-50">

                      {/* ── Observation ── */}
                      {section.id === 'observation' && (
                        <>
                          <ChipSelector label="Temperature"    options={['Hot', 'Warm', 'Normal', 'Cool']}                                value={answers['obs_temperature']}    onChange={v => set('obs_temperature', v)} />
                          <ChipSelector label="Swelling"       options={['None', 'Mild', 'Moderate', 'Severe']}                           value={answers['obs_swelling']}       onChange={v => set('obs_swelling', v)} />
                          <ChipSelector label="Posture"        options={['Normal', 'Antalgic lean', 'Scoliosis', 'Hyperkyphosis', 'Hyperlordosis']} value={answers['obs_posture']} onChange={v => set('obs_posture', v)} />
                          <ChipSelector label="Gait"           options={['Normal', 'Antalgic', 'Limping', 'Unable to weight bear']}        value={answers['obs_gait']}          onChange={v => set('obs_gait', v)} />
                          <ChipSelector label="Muscle wasting" options={['None visible', 'Mild', 'Moderate', 'Marked']}                   value={answers['obs_muscle_wasting']} onChange={v => set('obs_muscle_wasting', v)} />
                          <ChipSelector label="Deformity"      options={['None', 'Mild', 'Significant']}                                  value={answers['obs_deformity']}      onChange={v => set('obs_deformity', v)} />
                        </>
                      )}

                      {/* ── Tenderness ── */}
                      {section.id === 'tenderness' && (
                        <>
                          <div>
                            <p className="text-[13px] text-gray-600 font-medium mb-1">Tenderness on palpation</p>
                            <p className="text-[12px] text-gray-400 mb-3">
                              0 = None · 1+ = Tender, no grimace · 2+ = Grimace · 3+ = Withdraws
                            </p>
                            {isBilateral && <SideSelector activeSide={activeSide} region={region} onChange={setActiveSide} />}
                            <div className="space-y-2">
                              {tendernessPoints.map(point => {
                                const grade = answers[sideKey(`tend_${point}`)] as number | undefined;
                                return (
                                  <div key={point} className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <span className="text-[13px] text-gray-700 flex-1">{point}</span>
                                    <div className="flex gap-1.5">
                                      {tendernessGrades.map((g: any) => (
                                        <button
                                          key={g.value}
                                          onClick={() => set(sideKey(`tend_${point}`), g.value)}
                                          className={`w-12 h-12 rounded-xl text-[13px] font-semibold border transition-all active:scale-[0.95] ${
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
                          {palpationTissueOptions.length > 0 && (
                            <ChipSelector label="Tissue quality" options={palpationTissueOptions}
                              value={answers['tissue_quality']} onChange={v => set('tissue_quality', v)} />
                          )}
                          {accessoryMovements.map((am: any) => (
                            <div key={am.key} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
                              <div>
                                <p className="text-[13px] text-gray-700 font-medium">{am.label}</p>
                                {am.clinical_note && <p className="text-[12px] text-gray-400 mt-0.5">{am.clinical_note}</p>}
                              </div>
                              {am.levels?.map((level: string) => (
                                <div key={level}>
                                  <p className="text-[12px] text-gray-500 font-medium mb-2">{level}</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <ChipSelector label="Stiffness"
                                      options={cd.universal_scales?.accessory_movement_stiffness ?? ['Normal', 'Slightly stiff', 'Stiff', 'Very stiff']}
                                      value={answers[`${am.key}_${level}_stiff`]}
                                      onChange={v => set(`${am.key}_${level}_stiff`, v)} />
                                    <ChipSelector label="Pain response"
                                      options={cd.universal_scales?.accessory_movement_pain ?? ['None', 'Familiar pain', 'Different pain', 'Severe pain']}
                                      value={answers[`${am.key}_${level}_pain`]}
                                      onChange={v => set(`${am.key}_${level}_pain`, v)} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </>
                      )}

                      {/* ── ROM ── */}
                      {section.id === 'rom' && (
                        <>
                          <p className="text-[13px] text-gray-500">
                            Select type, enter degrees, note pain and end feel
                          </p>
                          {isBilateral && <SideSelector activeSide={activeSide} region={region} onChange={setActiveSide} />}
                          {romMovements.map(mov => {
                            const movClinical = romMovementsData[
                              Object.keys(romMovementsData).find(k =>
                                romMovementsData[k].key === mov.key
                              ) ?? ''
                            ];
                            const sk = (suffix: string) => sideKey(`${mov.key}_${suffix}`);
                            return (
                              <RomCard
                                key={`${mov.key}_${isBilateral ? activeSide : 'single'}`}
                                movement={mov}
                                measurementTypes={romMeasurementTypes}
                                painOptions={romPainOptions}
                                endFeelOptions={endFeelOptions}
                                limitedSuggests={movClinical?.limited_suggests}
                                typeValue={answers[sk('type')]}
                                activeValue={answers[sk('active')]}
                                passiveValue={answers[sk('passive')]}
                                painValue={answers[sk('pain')]}
                                endFeel={answers[sk('end_feel')]}
                                onType={v => set(sk('type'), v)}
                                onActive={v => set(sk('active'), v)}
                                onPassive={v => set(sk('passive'), v)}
                                onPain={v => set(sk('pain'), v)}
                                onEndFeel={v => set(sk('end_feel'), v)}
                              />
                            );
                          })}
                        </>
                      )}

                      {/* ── Measurements ── */}
                      {section.id === 'measurements' && (
                        <>
                          {girthPoints.length > 0 && (
                            <div>
                              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-2 font-medium">Girth / Circumference</p>
                              <p className="text-[13px] text-gray-500 mb-3">
                                {isBilateral ? 'Compare left vs right side (cm)' : 'Compare affected vs unaffected side (cm)'}
                              </p>
                              <div className="space-y-3">
                                {girthPoints.map(pt => (
                                  <GirthRow key={pt.key} point={pt}
                                    affectedLabel={isBilateral ? 'Left' : 'Affected'}
                                    unaffectedLabel={isBilateral ? 'Right' : 'Unaffected'}
                                    affectedValue={answers[isBilateral ? `left_${pt.key}` : `${pt.key}_affected`]}
                                    unaffectedValue={answers[isBilateral ? `right_${pt.key}` : `${pt.key}_unaffected`]}
                                    onAffected={v => set(isBilateral ? `left_${pt.key}` : `${pt.key}_affected`, v)}
                                    onUnaffected={v => set(isBilateral ? `right_${pt.key}` : `${pt.key}_unaffected`, v)} />
                                ))}
                              </div>
                            </div>
                          )}
                          {showGrip && (() => {
                            const gripSides = isBilateral
                              ? [{ key: 'grip_left', label: 'Left side' }, { key: 'grip_right', label: 'Right side' }]
                              : [{ key: 'grip_affected', label: 'Affected side' }, { key: 'grip_unaffected', label: 'Unaffected side' }];
                            const gripKey1 = gripSides[0].key;
                            const gripKey2 = gripSides[1].key;
                            return (
                            <div>
                              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-3 font-medium">Grip Strength (Dynamometer)</p>
                              <div className="grid grid-cols-2 gap-3">
                                {gripSides.map(side => (
                                  <div key={side.key}>
                                    <p className="text-[13px] text-gray-600 mb-1.5">{side.label}</p>
                                    <div className="flex items-center gap-2">
                                      <input type="number" min={0} max={80}
                                        value={answers[side.key] ?? ''}
                                        onChange={e => { const n = Number(e.target.value); if (!isNaN(n) && n >= 0) set(side.key, n); }}
                                        placeholder="—"
                                        className="w-20 px-2 py-2 text-sm text-center rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:border-teal-400" />
                                      <span className="text-[13px] text-gray-400">kg</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {answers[gripKey1] && answers[gripKey2] && (
                                <p className="text-[13px] text-teal-600 mt-2 font-medium">
                                  Deficit: {Math.round((1 - Math.min(answers[gripKey1], answers[gripKey2]) / Math.max(answers[gripKey1], answers[gripKey2])) * 100)}%
                                </p>
                              )}
                            </div>
                            );
                          })()}
                          {effusionTests.length > 0 && (
                            <div>
                              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-3 font-medium">Effusion Testing</p>
                              <div className="space-y-3">
                                {effusionTests.map(test => (
                                  <ChipSelector key={test.key} label={test.label} options={test.options}
                                    value={answers[test.key]} onChange={v => set(test.key, v)} />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Special Tests ── */}
                      {section.id === 'tests' && (
                        <div className="space-y-3">
                          {isBilateral && <SideSelector activeSide={activeSide} region={region} onChange={setActiveSide} />}
                          {regionTests.map(test => (
                            <SpecialTestCard key={`${test.id}_${isBilateral ? activeSide : 'single'}`} test={test}
                              value={answers[sideKey(`test_${test.id}`)]}
                              onChange={v => set(sideKey(`test_${test.id}`), v)} />
                          ))}
                        </div>
                      )}

                      {/* ── Neurological ── */}
                      {section.id === 'neuro' && neuroData && (
                        <div className="space-y-5">
                          {isBilateral && <SideSelector activeSide={activeSide} region={region} onChange={setActiveSide} />}
                          {neuroData.reflexes.length > 0 && (
                            <div>
                              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-3 font-medium">Reflexes</p>
                              <div className="space-y-3">
                                {neuroData.reflexes.map((r: string) => (
                                  <ChipSelector key={`${r}_${isBilateral ? activeSide : 'single'}`}
                                    label={`${r.charAt(0).toUpperCase() + r.slice(1)} reflex`}
                                    options={['Normal', 'Reduced', 'Absent', 'Exaggerated']}
                                    value={answers[sideKey(`reflex_${r}`)]} onChange={v => set(sideKey(`reflex_${r}`), v)} />
                                ))}
                              </div>
                            </div>
                          )}
                          {neuroData.dermatomes.length > 0 && (
                            <div>
                              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-3 font-medium">Dermatome Sensation</p>
                              <div className="space-y-3">
                                {neuroData.dermatomes.map((lvl: string) => (
                                  <ChipSelector key={`${lvl}_${isBilateral ? activeSide : 'single'}`} label={lvl}
                                    options={['Intact', 'Reduced', 'Absent', 'Hyperaesthetic']}
                                    value={answers[sideKey(`dermato_${lvl}`)]} onChange={v => set(sideKey(`dermato_${lvl}`), v)} />
                                ))}
                              </div>
                            </div>
                          )}
                          {Object.keys(neuroData.myotomes).length > 0 && (
                            <div>
                              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-3 font-medium">Myotome Strength</p>
                              <div className="space-y-3">
                                {Object.entries(neuroData.myotomes as Record<string, string>).map(([lvl, muscle]) => (
                                  <ChipSelector key={`${lvl}_${isBilateral ? activeSide : 'single'}`} label={`${lvl} — ${muscle}`}
                                    options={['5/5', '4/5', '3/5', '2/5', '1/5', '0/5']}
                                    value={answers[sideKey(`myotome_${lvl}`)]} onChange={v => set(sideKey(`myotome_${lvl}`), v)} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3 flex-shrink-0">
        <button onClick={onSkip} className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors px-2">
          Skip
        </button>
        <button
          onClick={() => onComplete({ ...answers, analysis_region: region, analysis_laterality: laterality })}
          className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
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
      <p className="text-[13px] text-gray-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`py-2.5 px-4 min-h-[44px] rounded-xl text-[13px] transition-all border active:scale-[0.98] ${
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

// ── Stepper Input — replaces <input type="number"> for ROM ──
function StepperInput({ value, onChange, max = 180, step = 5, isReduced = false }: {
  value?: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
  isReduced?: boolean;
}) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, (value ?? 0) - step))}
        className={`w-11 h-12 rounded-l-xl border border-r-0 flex items-center justify-center text-xl font-light transition-all select-none ${
          value !== undefined
            ? 'border-gray-200 bg-white text-gray-600 active:bg-gray-100'
            : 'border-gray-100 bg-gray-50 text-gray-300'
        }`}
      >
        −
      </button>
      <button
        type="button"
        onClick={() => { if (value === undefined) onChange(0); }}
        className={`w-16 h-12 border-y flex items-center justify-center ${
          isReduced ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
        }`}
      >
        <span className={`text-[17px] font-mono font-bold ${
          value !== undefined
            ? isReduced ? 'text-amber-700' : 'text-gray-800'
            : 'text-gray-300'
        }`}>
          {value !== undefined ? value : '—'}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, (value ?? -step) + step))}
        className="w-11 h-12 rounded-r-xl border border-l-0 border-gray-200 bg-white text-gray-600 text-xl font-light active:bg-gray-100 flex items-center justify-center transition-all select-none"
      >
        +
      </button>
    </div>
  );
}

function RomCard({ movement, measurementTypes, painOptions, endFeelOptions, limitedSuggests,
  typeValue, activeValue, passiveValue, painValue, endFeel,
  onType, onActive, onPassive, onPain, onEndFeel }: {
  movement: RomMovement;
  measurementTypes: { key: string; label: string; abbr: string }[];
  painOptions: { key: string; label: string }[];
  endFeelOptions: string[];
  limitedSuggests?: string[];
  typeValue?: string;
  activeValue?: number;
  passiveValue?: number;
  painValue?: string;
  endFeel?: string;
  onType: (v: string) => void;
  onActive: (v: number) => void;
  onPassive: (v: number) => void;
  onPain: (v: string) => void;
  onEndFeel: (v: string) => void;
}) {
  const [showEndFeel, setShowEndFeel] = useState(false);

  const normal         = movement.normal;
  const isReduced      = activeValue !== undefined && normal > 0 && activeValue < normal * 0.75;
  const passiveReduced = passiveValue !== undefined && normal > 0 && passiveValue < normal * 0.75;
  const contractileHint = activeValue !== undefined && passiveValue !== undefined && activeValue < passiveValue - 10;
  const pct            = activeValue !== undefined && normal > 0 ? Math.min((activeValue / normal) * 100, 100) : 0;

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Movement title + live value */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[14px] text-gray-800 font-semibold">{movement.label}</p>
        <div className="flex items-center gap-1.5">
          {activeValue !== undefined && (
            <span className={`text-[14px] font-mono font-bold ${isReduced ? 'text-amber-600' : 'text-teal-600'}`}>
              {activeValue}{movement.unit}
            </span>
          )}
          <span className="text-[12px] text-gray-400 font-mono">/{normal}{movement.unit}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isReduced ? 'bg-amber-400' : 'bg-teal-500'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {activeValue !== undefined && (
          <p className={`text-[11px] mt-0.5 font-medium ${isReduced ? 'text-amber-600' : 'text-teal-600'}`}>
            {pct.toFixed(0)}% of normal{isReduced ? ' — reduced' : ' — WNL'}
          </p>
        )}
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Active ROM stepper — primary */}
        <div>
          <p className="text-[12px] text-gray-400 mb-2 font-medium">Active ROM</p>
          <StepperInput
            value={activeValue}
            onChange={onActive}
            max={normal + 30}
            isReduced={isReduced}
          />
        </div>

        {/* Passive ROM — shown only once active is measured */}
        {activeValue !== undefined && (
          <div>
            <p className="text-[12px] text-gray-400 mb-2 font-medium">Passive ROM</p>
            <StepperInput
              value={passiveValue}
              onChange={onPassive}
              max={normal + 30}
              isReduced={passiveReduced}
            />
          </div>
        )}

        {/* Contractile hint */}
        {contractileHint && (
          <p className="text-[12px] text-amber-600 font-medium">
            Active &lt; Passive — suggests contractile tissue issue
          </p>
        )}

        {/* Pain during movement */}
        <div>
          <p className="text-[12px] text-gray-400 mb-2">Pain during movement</p>
          <div className="flex flex-wrap gap-2">
            {painOptions.map(p => (
              <button key={p.key} onClick={() => onPain(p.key)}
                className={`py-2.5 px-4 min-h-[44px] rounded-xl text-[13px] border transition-all active:scale-[0.98] ${
                  painValue === p.key
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* End feel — collapsible to reduce density */}
        <div>
          <button
            type="button"
            onClick={() => setShowEndFeel(v => !v)}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors min-h-[36px]"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEndFeel ? 'rotate-180' : ''}`} />
            End feel{endFeel ? ` · ${endFeel}` : ''}
          </button>
          <AnimatePresence>
            {showEndFeel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-2">
                  {endFeelOptions.map(ef => (
                    <button key={ef} onClick={() => onEndFeel(ef)}
                      className={`py-2 px-3.5 rounded-xl text-[12px] border transition-all active:scale-[0.98] ${
                        endFeel === ef
                          ? 'bg-gray-700 text-white border-gray-700'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ef}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clinical hint when limited */}
        {isReduced && limitedSuggests && limitedSuggests.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <p className="text-[11px] text-amber-600 font-medium mb-0.5">Limitation suggests:</p>
            <p className="text-[12px] text-amber-700">{limitedSuggests.join(' · ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GirthRow({ point, affectedLabel = 'Affected', unaffectedLabel = 'Unaffected', affectedValue, unaffectedValue, onAffected, onUnaffected }: {
  point: GirthPoint;
  affectedLabel?: string; unaffectedLabel?: string;
  affectedValue?: number; unaffectedValue?: number;
  onAffected: (v: number) => void; onUnaffected: (v: number) => void;
}) {
  const diff       = affectedValue !== undefined && unaffectedValue !== undefined
    ? (affectedValue - unaffectedValue).toFixed(1) : null;
  const hasSwelling = diff !== null && Math.abs(parseFloat(diff)) > 0.5;

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[13px] text-gray-700 font-medium">{point.label}</p>
          <p className="text-[12px] text-gray-400">{point.note}</p>
        </div>
        {diff !== null && (
          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
            hasSwelling ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-teal-50 text-teal-600 border border-teal-100'
          }`}>
            {parseFloat(diff) > 0 ? '+' : ''}{diff} cm
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: affectedLabel,   value: affectedValue,   onChange: onAffected },
          { label: unaffectedLabel, value: unaffectedValue, onChange: onUnaffected },
        ].map(side => (
          <div key={side.label}>
            <p className="text-[12px] text-gray-400 mb-1">{side.label}</p>
            <div className="flex items-center gap-1.5">
              <input type="number" min={0} max={120} step={0.1}
                value={side.value ?? ''}
                onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0) side.onChange(n); }}
                placeholder="—"
                className="w-20 px-2 py-2 text-sm text-center rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:border-teal-400 font-mono" />
              <span className="text-[12px] text-gray-400">{point.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SideSelector({ activeSide, region, onChange }: {
  activeSide: 'left' | 'right';
  region: string | null;
  onChange: (s: 'left' | 'right') => void;
}) {
  const regionLabel = region ? (REGION_LABELS[region] ?? region) : '';
  return (
    <div className="flex gap-2 mb-4">
      {(['left', 'right'] as const).map(side => (
        <button
          key={side}
          onClick={() => onChange(side)}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
            activeSide === side
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          {side === 'left' ? 'Left' : 'Right'}{regionLabel ? ` ${regionLabel}` : ' Side'}
        </button>
      ))}
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
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
      <p className="text-[14px] text-gray-800 font-semibold mb-0.5">{test.name}</p>
      {test.diagnostic_value && (
        <p className="text-[12px] text-gray-400 mb-3">{test.diagnostic_value}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt: any) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl text-[13px] font-medium border transition-all active:scale-[0.98] ${
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

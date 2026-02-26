'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import quickData from '@/data/clinical/entities/clinical_assessments_quick.json';
import fullAssessmentsData from '@/data/clinical/entities/clinical_assessments.json';

// ── Types ──────────────────────────────────────────────────────
interface ResultOption {
  value: string;
  chip: string;
  label: string;
  semantic: 'negative' | 'positive' | 'equivocal';
  color: string;
}

interface KeyMetricSelect {
  field_key: string;
  type: 'select' | 'multi_select';
  label: string;
  options: { value: string; label: string }[];
  diagnostic_reason?: string;
}

interface KeyMetricNumber {
  field_key: string;
  type: 'number';
  label: string;
  unit: string;
  range: [number, number];
  diagnostic_reason?: string;
}

type KeyMetric = KeyMetricSelect | KeyMetricNumber;

interface GridColumn { key: string; label: string }
interface GridValueOption { value: string; chip: string; label: string; color: string }
interface GridRow { key: string; label: string; root?: string }

interface GridConfig {
  rows_from_screening?: boolean;
  rows_source?: string;
  rows?: GridRow[];
  all_rows?: GridRow[];
  row_label_includes_action?: boolean;
  columns: GridColumn[];
  value_options: GridValueOption[];
  default_value: string;
  tap_to_cycle: boolean;
}

interface MeasurementField {
  field_key: string;
  label: string;
  unit: string;
  range?: [number, number];
  normal?: number;
}

interface MeasurementConfig {
  fields?: MeasurementField[];
  joints_from_screening?: boolean;
  joints_source?: string;
  per_joint_fields?: { field_key: string; label: string; unit: string }[];
  show_normal_reference?: boolean;
  key_observation?: {
    field_key: string;
    label: string;
    options: { value: string; label: string }[];
  };
}

interface QuickAssessmentConfig {
  name: string;
  quick_type: 'binary' | 'graded' | 'binary_metric' | 'grid' | 'measurement' | 'decision_rule';
  result?: {
    field_key: string;
    options: ResultOption[];
  };
  key_metric?: KeyMetric | null;
  side?: { field_key: string; auto_from_screening: boolean } | null;
  grid_config?: GridConfig;
  measurement_config?: MeasurementConfig;
  screening_absorbs?: string[];
  voice_template?: string;
  diagnostic_value?: string;
}

interface ScreeningContext {
  side?: string | null;
  region?: string | null;
  painLocation?: string | null;
  vasScore?: number | null;
}

interface QuickAssessmentInputProps {
  assessmentId: string;
  screeningContext: ScreeningContext;
  relevanceScore?: number;
  onCapture: (assessmentId: string, data: Record<string, any>) => void;
  isActive: boolean;
  onExpand?: () => void;
  completedData?: Record<string, any> | null;
}

// ── Helpers ────────────────────────────────────────────────────
const semanticColors: Record<string, { bg: string; border: string; text: string; selected: string; selectedText: string }> = {
  green:  { bg: 'bg-emerald-50',  border: 'border-emerald-200',  text: 'text-emerald-700',  selected: 'bg-emerald-500',  selectedText: 'text-white' },
  yellow: { bg: 'bg-amber-50',    border: 'border-amber-200',    text: 'text-amber-700',    selected: 'bg-amber-500',    selectedText: 'text-white' },
  orange: { bg: 'bg-orange-50',   border: 'border-orange-200',   text: 'text-orange-700',   selected: 'bg-orange-500',   selectedText: 'text-white' },
  red:    { bg: 'bg-red-50',      border: 'border-red-200',      text: 'text-red-700',      selected: 'bg-red-500',      selectedText: 'text-white' },
  gray:   { bg: 'bg-gray-50',     border: 'border-gray-200',     text: 'text-gray-600',     selected: 'bg-gray-500',     selectedText: 'text-white' },
  blue:   { bg: 'bg-teal-50',     border: 'border-teal-200',     text: 'text-teal-700',     selected: 'bg-teal-500',     selectedText: 'text-white' },
};

const getGridCellColor = (value: string, options: GridValueOption[]): string => {
  const opt = options.find(o => o.value === value);
  if (!opt) return 'bg-gray-100 text-gray-600';
  const c = opt.color;
  if (c === 'green') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (c === 'yellow') return 'bg-amber-100 text-amber-700 border-amber-300';
  if (c === 'orange') return 'bg-orange-100 text-orange-700 border-orange-300';
  if (c === 'red') return 'bg-red-100 text-red-700 border-red-300';
  if (c === 'blue') return 'bg-teal-100 text-teal-700 border-teal-300';
  return 'bg-gray-100 text-gray-600 border-gray-300';
};

/** Resolve a body-map region key to the canonical key used in region_joint_map / region_neuro_map */
function resolveRegionKey(region: string | null): string | null {
  if (!region) return null;
  const aliasMap = (quickData as any).region_alias_map as Record<string, string> | undefined;
  // Direct match first
  const jointMap = (quickData as any).region_joint_map;
  if (jointMap?.[region]) return region;
  // Try alias
  const aliased = aliasMap?.[region];
  if (aliased && jointMap?.[aliased]) return aliased;
  // Normalize dashes/underscores
  const normalized = region.replace(/-/g, '_');
  if (jointMap?.[normalized]) return normalized;
  const normalizedDash = region.replace(/_/g, '-');
  if (jointMap?.[normalizedDash]) return normalizedDash;
  return null;
}

function resolveGridRows(
  config: GridConfig,
  region: string | null
): GridRow[] {
  // If rows are explicitly defined, use them
  if (config.rows && !config.rows_from_screening) return config.rows;
  if (config.all_rows && !config.rows_from_screening) return config.all_rows;

  // Resolve from region_neuro_map (uses aliases)
  if (config.rows_from_screening && config.rows_source && region) {
    // Try direct region, then alias, then normalized
    const candidates = [region];
    const aliasMap = (quickData as any).region_alias_map as Record<string, string> | undefined;
    if (aliasMap?.[region]) candidates.push(aliasMap[region]);
    candidates.push(region.replace(/-/g, '_'), region.replace(/_/g, '-'));

    for (const candidate of candidates) {
      const source = config.rows_source.replace('{region}', candidate);
      const parts = source.split('.');
      let data: any = quickData;
      for (const p of parts) {
        data = data?.[p];
      }

      if (Array.isArray(data) && data.length > 0) {
        return data.map((d: string) => ({ key: d, label: d }));
      }
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return Object.entries(data).map(([key, action]) => ({
          key,
          label: config.row_label_includes_action ? `${key} — ${action}` : key,
        }));
      }
    }
  }

  // Fallback to all_rows
  return config.all_rows || config.rows || [];
}

function resolveROMJoints(
  config: MeasurementConfig,
  region: string | null
): MeasurementField[] {
  if (config.fields) return config.fields;
  if (!config.joints_from_screening || !region) return [];

  const regionMap = (quickData as any).region_joint_map;
  const resolved = resolveRegionKey(region);
  const joints: any[] = resolved ? (regionMap?.[resolved] || []) : [];

  return joints.map((j: any) => ({
    field_key: j.key,
    label: j.label,
    unit: j.unit || '°',
    range: [0, j.normal > 0 ? j.normal * 1.2 : 10] as [number, number],
    normal: j.normal,
  }));
}

// ── Component ──────────────────────────────────────────────────
const QuickAssessmentInput: React.FC<QuickAssessmentInputProps> = ({
  assessmentId,
  screeningContext,
  relevanceScore,
  onCapture,
  isActive,
  onExpand,
  completedData,
}) => {
  const config = (quickData as any).assessments[assessmentId] as QuickAssessmentConfig | undefined;

  const [resultValue, setResultValue] = useState<string | null>(completedData?.result || null);
  const [keyMetricValue, setKeyMetricValue] = useState<any>(completedData?.key_metric || null);
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>(completedData?.key_metric || []);
  const [gridValues, setGridValues] = useState<Record<string, string>>(completedData?.grid || {});
  const [measurementValues, setMeasurementValues] = useState<Record<string, any>>(completedData?.measurements || {});
  const [note, setNote] = useState<string>(completedData?.note || '');
  const [showDetail, setShowDetail] = useState(false);
  const [showNote, setShowNote] = useState(!!completedData?.note);
  const [detailFormData, setDetailFormData] = useState<Record<string, any>>({});

  // Load full assessment fields for "Comprehensive" mode
  const fullAssessment = useMemo(() => {
    const a = (fullAssessmentsData as any).assessments?.[assessmentId];
    if (!a?.input_schema) return null;
    return a;
  }, [assessmentId]);

  const fullFields = useMemo(() => {
    if (!fullAssessment?.input_schema) return [];
    const primary = fullAssessment.input_schema.primary_fields || [];
    const secondary = fullAssessment.input_schema.secondary_fields || [];
    return [...primary, ...secondary];
  }, [fullAssessment]);

  const autoSide = useMemo(() => {
    if (!config?.side?.auto_from_screening) return null;
    const transform: Record<string, string> = { left: 'left', right: 'right', both: 'bilateral' };
    return screeningContext.side ? transform[screeningContext.side] || null : null;
  }, [config, screeningContext.side]);

  const resultSemantic = useMemo(() => {
    if (!resultValue || !config?.result) return null;
    const opt = config.result.options.find(o => o.value === resultValue);
    return opt?.semantic || null;
  }, [resultValue, config]);

  const isNegativeResult = resultSemantic === 'negative';
  const isPositiveResult = resultSemantic === 'positive';

  const buildCaptureData = useCallback(() => {
    const data: Record<string, any> = {};

    if (config?.result) {
      data[config.result.field_key] = resultValue;
    }
    if (config?.key_metric) {
      if (config.key_metric.type === 'multi_select') {
        data[config.key_metric.field_key] = multiSelectValues;
      } else {
        data[config.key_metric.field_key] = keyMetricValue;
      }
    }
    if (config?.side && autoSide) {
      data[config.side.field_key] = autoSide;
    }
    if (config?.grid_config) {
      Object.entries(gridValues).forEach(([k, v]) => { data[k] = v; });
    }
    if (config?.measurement_config) {
      Object.entries(measurementValues).forEach(([k, v]) => { data[k] = v; });
    }
    if (note) data.clinical_notes = note;
    // Merge comprehensive form data
    if (showDetail && Object.keys(detailFormData).length > 0) {
      Object.entries(detailFormData).forEach(([k, v]) => { data[k] = v; });
    }

    return data;
  }, [resultValue, keyMetricValue, multiSelectValues, gridValues, measurementValues, note, autoSide, config, showDetail, detailFormData]);

  // ── If completed, show as a simple row ─────────────────────────────
  if (completedData && !isActive) {
    const resultOpt = config?.result?.options.find(o => o.value === completedData.result);
    const sideLabel = autoSide === 'left' ? 'L' : autoSide === 'right' ? 'R' : autoSide === 'bilateral' ? 'B' : '';
    const resultColor = resultOpt?.semantic === 'negative' ? 'text-gray-500' : 'text-red-500';

    return (
      <div className="flex items-center gap-2.5 px-1 py-1">
        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-gray-700 flex-1">{config?.name}</span>
        <span className={`text-xs font-medium ${resultColor}`}>
          {resultOpt?.label || completedData.result}
        </span>
        {sideLabel && <span className="text-[10px] text-gray-400">{sideLabel}</span>}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="px-1 py-2 text-sm text-gray-400">
        No config for {assessmentId}
      </div>
    );
  }

  if (!isActive) {
    // Queued — just text, very light
    return (
      <div className="flex items-center gap-2.5 px-1 py-1 opacity-40">
        <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">·</span>
        <span className="text-sm text-gray-500">{config.name}</span>
      </div>
    );
  }

  // ── Active capture card ────────────────────────────────────
  const sideLabel = autoSide === 'left' ? 'L' : autoSide === 'right' ? 'R' : autoSide === 'bilateral' ? 'Bilateral' : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[15px] font-semibold text-gray-900 tracking-tight">{config.name}</h4>
            {sideLabel && (
              <span className="text-[11px] text-teal-600 font-medium">
                {sideLabel}
              </span>
            )}
          </div>
        </div>
        {config.diagnostic_value && (
          <p className="text-xs text-gray-400 mt-0.5">{config.diagnostic_value}</p>
        )}
      </div>

      {/* Result chips — binary / graded / binary_metric / decision_rule */}
      {config.result && (
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {config.result.options.map((opt) => {
              const isSelected = resultValue === opt.value;
              const colors = semanticColors[opt.color] || semanticColors.gray;

              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setResultValue(opt.value);
                    // Auto-submit for simple binary/graded with no key_metric
                    if (!config.key_metric && (config.quick_type === 'binary' || config.quick_type === 'graded')) {
                      setTimeout(() => {
                        const data: Record<string, any> = { [config.result!.field_key]: opt.value };
                        if (config.side && autoSide) data[config.side.field_key] = autoSide;
                        if (note) data.clinical_notes = note;
                        onCapture(assessmentId, data);
                      }, 200);
                    }
                  }}
                  className={`
                    rounded-md py-2 px-3.5 text-sm font-medium border transition-all duration-100
                    min-w-[64px] text-center
                    ${isSelected
                      ? `${colors.selected} ${colors.selectedText} border-transparent`
                      : `bg-white ${colors.border} ${colors.text} hover:bg-gray-50`
                    }
                  `}
                >
                  <div className="text-sm leading-none font-semibold">{opt.chip}</div>
                  <div className="text-[10px] mt-0.5 opacity-70 leading-none">{opt.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Key metric — shown when result is NOT negative (positive or equivocal) */}
      {config.key_metric && resultValue !== null && !isNegativeResult && (
        <div className="px-4 pb-3">
          {config.key_metric.type === 'number' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 font-medium">{config.key_metric.label}:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={keyMetricValue ?? ''}
                  onChange={e => setKeyMetricValue(e.target.value)}
                  min={(config.key_metric as KeyMetricNumber).range?.[0]}
                  max={(config.key_metric as KeyMetricNumber).range?.[1]}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-sm font-medium focus:ring-1 focus:ring-teal-400 focus:border-transparent"
                  placeholder="—"
                />
                <span className="text-sm text-gray-500">{(config.key_metric as KeyMetricNumber).unit}</span>
              </div>
              {(config.key_metric as KeyMetricNumber).diagnostic_reason && (
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {(config.key_metric as KeyMetricNumber).diagnostic_reason}
                </span>
              )}
            </div>
          )}

          {config.key_metric.type === 'select' && (
            <div>
              <label className="text-sm text-gray-600 font-medium block mb-1.5">{config.key_metric.label}:</label>
              <div className="flex flex-wrap gap-1.5">
                {(config.key_metric as KeyMetricSelect).options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setKeyMetricValue(opt.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      keyMetricValue === opt.value
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.key_metric.type === 'multi_select' && (
            <div>
              <label className="text-sm text-gray-600 font-medium block mb-1.5">{config.key_metric.label}:</label>
              <div className="flex flex-wrap gap-1.5">
                {(config.key_metric as KeyMetricSelect).options.map(opt => {
                  const isSelected = multiSelectValues.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setMultiSelectValues(prev =>
                          isSelected ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid — DTR, Dermatomes, Myotomes, CN Screen, Ribs */}
      {config.grid_config && (() => {
        const rows = resolveGridRows(config.grid_config, screeningContext.region || null);
        const cols = config.grid_config.columns;
        const valueOpts = config.grid_config.value_options;
        const defaultVal = config.grid_config.default_value;

        return (
          <div className="px-4 py-3">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-xs text-gray-400 font-medium text-left pb-2 pr-3 w-1/3"></th>
                  {cols.map(col => (
                    <th key={col.key} className="text-xs text-gray-400 font-semibold text-center pb-2 px-1">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key}>
                    <td className="text-sm text-gray-700 font-medium py-1 pr-3">{row.label}</td>
                    {cols.map(col => {
                      const cellKey = `${row.key}_${col.key}`;
                      const cellVal = gridValues[cellKey] || defaultVal;
                      const cellColor = getGridCellColor(cellVal, valueOpts);
                      const currentOpt = valueOpts.find(o => o.value === cellVal);

                      return (
                        <td key={col.key} className="py-1 px-1 text-center">
                          <button
                            onClick={() => {
                              const idx = valueOpts.findIndex(o => o.value === cellVal);
                              const nextIdx = (idx + 1) % valueOpts.length;
                              setGridValues(prev => ({
                                ...prev,
                                [cellKey]: valueOpts[nextIdx].value,
                              }));
                            }}
                            className={`w-12 h-10 rounded-md text-xs font-bold border transition-all hover:shadow-sm ${cellColor}`}
                            title={currentOpt?.label || cellVal}
                          >
                            {currentOpt?.chip || cellVal}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 mt-2">Tap cells to cycle values</p>
          </div>
        );
      })()}

      {/* Measurement — ROM, TMJ */}
      {config.measurement_config && (() => {
        const mc = config.measurement_config;
        const joints = resolveROMJoints(mc, screeningContext.region || null);
        const perJointFields = mc.per_joint_fields || [];

        // TMJ-style: explicit fields
        if (mc.fields) {
          return (
            <div className="px-4 py-3 space-y-3">
              {mc.fields.map(f => (
                <div key={f.field_key} className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 font-medium w-24">{f.label}</label>
                  <input
                    type="number"
                    value={measurementValues[f.field_key] ?? ''}
                    onChange={e => setMeasurementValues(prev => ({ ...prev, [f.field_key]: e.target.value }))}
                    min={f.range?.[0]}
                    max={f.range?.[1]}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-sm font-medium focus:ring-1 focus:ring-teal-400 focus:border-transparent"
                    placeholder={f.normal ? `${f.normal}` : '—'}
                  />
                  <span className="text-sm text-gray-500">{f.unit}</span>
                  {f.normal && (
                    <span className="text-xs text-gray-400">norm: {f.normal}{f.unit}</span>
                  )}
                </div>
              ))}
              {mc.key_observation && (
                <div>
                  <label className="text-sm text-gray-600 font-medium block mb-1.5">{mc.key_observation.label}:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {mc.key_observation.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setMeasurementValues(prev => ({ ...prev, [mc.key_observation!.field_key]: opt.value }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          measurementValues[mc.key_observation!.field_key] === opt.value
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // ROM-style: per-joint grid
        if (joints.length > 0 && perJointFields.length > 0) {
          return (
            <div className="px-4 py-3">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-xs text-gray-400 font-medium text-left pb-2 w-1/3"></th>
                    {perJointFields.map(f => (
                      <th key={f.field_key} className="text-xs text-gray-400 font-semibold text-center pb-2 px-1">
                        {f.label} ({f.unit})
                      </th>
                    ))}
                    {mc.show_normal_reference && (
                      <th className="text-xs text-gray-400 font-medium text-center pb-2 px-1">Norm</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {joints.map(joint => (
                    <tr key={joint.field_key}>
                      <td className="text-sm text-gray-700 font-medium py-1.5 pr-3">{joint.label}</td>
                      {perJointFields.map(f => {
                        const fieldKey = `${joint.field_key}_${f.field_key}`;
                        return (
                          <td key={f.field_key} className="py-1.5 px-1">
                            <input
                              type="number"
                              value={measurementValues[fieldKey] ?? ''}
                              onChange={e => setMeasurementValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                              className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-sm font-medium focus:ring-1 focus:ring-teal-400 focus:border-transparent"
                              placeholder="—"
                            />
                          </td>
                        );
                      })}
                      {mc.show_normal_reference && (
                        <td className="text-xs text-gray-400 text-center py-1.5">
                          {joint.normal}{joint.unit}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })()}

      {/* Comprehensive form — full fields from clinical_assessments.json */}
      {showDetail && fullFields.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">All Fields</p>
          <div className="space-y-3">
            {fullFields.map((field: any) => {
              // Check show_when visibility
              if (field.show_when) {
                const depVal = detailFormData[field.show_when.field];
                if (field.show_when.operator === '==' && depVal !== field.show_when.value) return null;
                if (field.show_when.operator === '!=' && depVal === field.show_when.value) return null;
                if (field.show_when.operator === 'in' && !field.show_when.values?.includes(depVal)) return null;
              }

              const val = detailFormData[field.field_name] ?? '';

              if (field.field_type === 'radio') {
                return (
                  <div key={field.field_name}>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {field.options?.map((opt: any) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDetailFormData(p => ({ ...p, [field.field_name]: opt.value }))}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                            val === opt.value
                              ? 'bg-teal-500 text-white border-teal-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (field.field_type === 'checkbox_group') {
                const selected: string[] = val || [];
                return (
                  <div key={field.field_name}>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {field.options?.map((opt: any) => {
                        const isSelected = selected.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const next = isSelected ? selected.filter((v: string) => v !== opt.value) : [...selected, opt.value];
                              setDetailFormData(p => ({ ...p, [field.field_name]: next }));
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-teal-500 text-white border-teal-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (field.field_type === 'number') {
                return (
                  <div key={field.field_name} className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-700 w-28 flex-shrink-0">{field.label}</label>
                    <input
                      type="number"
                      value={val}
                      onChange={e => setDetailFormData(p => ({ ...p, [field.field_name]: e.target.value }))}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      placeholder={field.placeholder || '—'}
                      className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-center text-sm font-medium focus:ring-1 focus:ring-teal-400 focus:border-transparent"
                    />
                    {field.min !== undefined && (
                      <span className="text-[10px] text-gray-400">{field.min}–{field.max}</span>
                    )}
                  </div>
                );
              }

              if (field.field_type === 'textarea') {
                return (
                  <div key={field.field_name}>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                    <textarea
                      value={val}
                      onChange={e => setDetailFormData(p => ({ ...p, [field.field_name]: e.target.value }))}
                      rows={2}
                      placeholder={field.placeholder || '...'}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-transparent resize-none"
                    />
                  </div>
                );
              }

              if (field.field_type === 'select') {
                return (
                  <div key={field.field_name}>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                    <select
                      value={val}
                      onChange={e => setDetailFormData(p => ({ ...p, [field.field_name]: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.field_type === 'checkbox') {
                return (
                  <label key={field.field_name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={e => setDetailFormData(p => ({ ...p, [field.field_name]: e.target.checked }))}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-gray-700">{field.label}</span>
                  </label>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {showDetail && fullFields.length === 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">No additional fields available for this assessment.</p>
        </div>
      )}

      {/* Note + Actions — hidden when result is negative (negative needs no extra data) */}
      <div className="px-4 pb-4 pt-1 space-y-2">
        {!isNegativeResult && (
          <>
            {showNote ? (
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Clinical note (optional)..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-transparent resize-none"
              />
            ) : resultValue ? (
              <button
                onClick={() => setShowNote(true)}
                className="text-xs text-gray-400 hover:text-teal-600 transition-colors"
              >
                + Add note
              </button>
            ) : null}
          </>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (onExpand) onExpand();
              setShowDetail(!showDetail);
            }}
            className="text-xs text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showDetail ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showDetail ? 'Hide detail' : 'Comprehensive'}
          </button>

          {/* Submit for types that need explicit submit (binary_metric, grid, measurement, decision_rule) */}
          {(config.quick_type === 'binary_metric' || config.quick_type === 'grid' || config.quick_type === 'measurement' || config.quick_type === 'decision_rule') && (
            <button
              onClick={() => onCapture(assessmentId, buildCaptureData())}
              disabled={!resultValue && config.quick_type !== 'grid' && config.quick_type !== 'measurement'}
              className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-md hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAssessmentInput;

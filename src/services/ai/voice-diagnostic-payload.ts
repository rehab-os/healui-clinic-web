/**
 * Builds the diagnostic payload from voice-extracted fields + gap answers.
 * Mirrors the shape of SmartScreeningEngine.prepareDiagnosticPayload()
 * so the same AI diagnostic APIs can be used.
 */

import type { DiagnosticRequest } from './diagnostic.service';

/**
 * Normalize pain_location from voice extraction format to regionMap keys.
 * Voice extracts: [{mainRegion: "lower-back", laterality: "center"}]
 * RegionMap expects: "lower_back", "shoulder_left", "knee_right", etc.
 */
function normalizePainLocations(painLocation: any): string[] {
  if (!painLocation) return [];
  const locations = Array.isArray(painLocation) ? painLocation : [painLocation];

  return locations.map((loc: any) => {
    if (typeof loc === 'object' && loc?.mainRegion) {
      // Convert hyphenated to underscore: "lower-back" → "lower_back"
      const region = loc.mainRegion.replace(/-/g, '_');
      const lat = loc.laterality;
      if (lat && lat !== 'center') {
        return `${region}_${lat}`; // "shoulder_left", "knee_right"
      }
      return region; // "lower_back", "neck"
    }
    return typeof loc === 'string' ? loc : String(loc);
  });
}

export async function buildDiagnosticPayload(
  extractedFields: Record<string, any>,
  gapAnswers: Record<string, any>,
  completedAssessments?: any[],
  imagingFindings?: Array<{ modality: string; region: string; findings_text: string }>,
): Promise<DiagnosticRequest> {
  const r = { ...extractedFields, ...gapAnswers };

  // Calculate chronicity
  let chronicity = 'unknown';
  if (r.symptom_onset) {
    const daysSince = Math.floor(
      (Date.now() - new Date(r.symptom_onset).getTime()) / (1000 * 60 * 60 * 24),
    );
    chronicity = daysSince <= 42 ? 'acute' : daysSince <= 84 ? 'subacute' : 'chronic';
  }

  // Inflammatory indicators
  const inflammatoryIndicators = [
    r.morning_stiffness_duration === 'more_60min',
    r.morning_stiffness_duration === 'all_day',
    r.behavior_24hr === 'morning_stiff',
  ].filter(Boolean).length;

  // Red flags
  const redFlagsScreened = r.red_flag_screening || [];
  const redFlagsDetected = Array.isArray(redFlagsScreened)
    ? redFlagsScreened.filter((f: string) => f !== 'none')
    : [];

  // Load and filter conditions by body region
  let availableConditions: any[] = [];
  try {
    const conditionsData = await import('../../data/agent/conditions.json');
    availableConditions = conditionsData.conditions || [];

    if (r.pain_location) {
      const normalizedLocations = normalizePainLocations(r.pain_location);

      const regionMap: Record<string, string[]> = {
        lower_back: ['lumbar_spine', 'lumbar'],
        upper_back: ['thoracic_spine', 'thoracic'],
        neck: ['cervical_spine', 'cervical'],
        shoulder_left: ['shoulder'],
        shoulder_right: ['shoulder'],
        shoulder_both: ['shoulder'],
        knee_left: ['knee'],
        knee_right: ['knee'],
        knee_both: ['knee'],
        hip_left: ['hip'],
        hip_right: ['hip'],
        hip_both: ['hip'],
        ankle_left: ['ankle'],
        ankle_right: ['ankle'],
        wrist_left: ['wrist'],
        wrist_right: ['wrist'],
        hand_left: ['wrist'],
        hand_right: ['wrist'],
        elbow_left: ['elbow'],
        elbow_right: ['elbow'],
        thigh_left: ['hip', 'knee'],
        thigh_right: ['hip', 'knee'],
        lower_leg_left: ['ankle', 'knee'],
        lower_leg_right: ['ankle', 'knee'],
        foot_left: ['ankle'],
        foot_right: ['ankle'],
      };

      const targetRegions: string[] = [];
      normalizedLocations.forEach((locKey) => {
        const mapped = regionMap[locKey.toLowerCase()];
        if (mapped) targetRegions.push(...mapped);
      });

      if (targetRegions.length > 0) {
        availableConditions = availableConditions.filter((c: any) =>
          targetRegions.some((region) => c.body_region?.toLowerCase().includes(region)),
        );
      }
    }

    availableConditions = availableConditions.slice(0, 50);
  } catch (error) {
    console.error('Failed to load conditions:', error);
  }

  // Include captured assessment data if available
  const assessmentFindings = completedAssessments?.reduce(
    (acc: Record<string, any>, a: any) => {
      acc[a.assessment_id || a.id] = a.form_data || a;
      return acc;
    },
    {} as Record<string, any>,
  );

  return {
    assessment_data: {
      clinicalFindings: {
        chief_complaint: r.chief_complaint,
        history: {
          onset_date: r.symptom_onset,
          chronicity,
          onset_nature: r.onset_nature,
          progression: r.symptom_progression,
          previous_episodes: r.previous_episodes,
          episode_comparison: r.previous_episode_comparison,
        },
        pain: {
          location: r.pain_location,
          nature: r.pain_nature,
          vas_score: r.vas_score,
          radiation: r.pain_radiation,
          radiation_pattern: r.radiation_pattern,
          timing: r.pain_timing,
          movement_relation: r.pain_movement,
          aggravating_factors: r.aggravating_factors,
          relieving_factors: r.relieving_factors,
        },
        behavior_pattern: {
          worst_time: r.behavior_24hr,
          morning_stiffness_duration: r.morning_stiffness_duration,
          night_pain_details: r.night_pain_details,
          inflammatory_pattern: inflammatoryIndicators >= 2,
        },
        motor: {
          weakness_screening: r.weakness_screening,
          weakness_location: r.weakness_location,
        },
        sensory: {
          sensation_screening: r.sensation_screening,
          sensation_type: r.sensation_type,
        },
        functional: {
          impact: r.functional_impact,
        },
        objective: {
          swelling: r.swelling_assessment,
          ...(assessmentFindings || {}),
        },
        red_flags: {
          screened: redFlagsScreened,
          detected: redFlagsDetected,
          requires_urgent_referral: redFlagsDetected.some(
            (f: string) =>
              f.includes('bowel_bladder') ||
              f.includes('saddle_numbness') ||
              f.includes('progressive_weakness'),
          ),
        },
        imaging_findings: imagingFindings || undefined,
      },
      source: 'voice_clinical_dx',
    },
    available_conditions: availableConditions.map((c: any) => ({
      id: c.id,
      name: c.name,
      body_region: c.body_region,
      specialty: c.specialty || 'musculoskeletal',
    })),
    request_type: 'differential_diagnosis',
    max_conditions: 5,
    confidence_threshold: 0.3,
  };
}

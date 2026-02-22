#!/usr/bin/env node
/**
 * Generate shoulder screening data for Bayesian engine.
 *
 * Produces: public/data/symptom-assessment/generated/shoulder.json
 *
 * Gap conditions (10 new):
 *   COND_093 - Brachial Plexus Injury
 *   COND_223 - Sternoclavicular Joint Dysfunction
 *   COND_224 - Pectoralis Minor Syndrome
 *   COND_277 - Little League Shoulder
 *   COND_297 - Clavicle Fracture (Post-Healing/Post-Surgical)
 *   COND_293 - Humeral Shaft Fracture (Post-Immobilization/Post-Surgical)
 *   COND_299 - Proximal Humerus Fracture (Post-Immobilization/Post-Surgical)
 *   COND_305 - Coracoclavicular Ligament Tear
 *   COND_334 - Sternoclavicular Joint Sprain
 *   COND_343 - Pectoralis Major Strain
 *
 * Sparse enrichment (2):
 *   COND_221 - Scapular Dyskinesis (5 -> 10 symptoms)
 *   COND_225 - Biceps Tendon Rupture (4 -> 10 symptoms)
 */

const fs = require('fs');
const path = require('path');

// === PRIOR PROBABILITIES ===
// All 26 shoulder conditions ranked by prevalence
const shoulderConditions = [
  { id: 'COND_011', rank: 5 },
  { id: 'COND_002', rank: 8 },
  { id: 'COND_020', rank: 26 },
  { id: 'COND_001', rank: 28 },
  { id: 'COND_044', rank: 31 },
  { id: 'COND_073', rank: 61 },
  { id: 'COND_093', rank: 92 },
  { id: 'COND_101', rank: 101 },
  { id: 'COND_103', rank: 112 },
  { id: 'COND_102', rank: 118 },
  { id: 'COND_219', rank: 201 },
  { id: 'COND_221', rank: 204 },
  { id: 'COND_220', rank: 206 },
  { id: 'COND_217', rank: 211 },
  { id: 'COND_225', rank: 223 },
  { id: 'COND_222', rank: 238 },
  { id: 'COND_223', rank: 245 },
  { id: 'COND_224', rank: 250 },
  { id: 'COND_277', rank: 276 },
  { id: 'COND_297', rank: 284 },
  { id: 'COND_293', rank: 286 },
  { id: 'COND_299', rank: 296 },
  { id: 'COND_305', rank: 310 },
  { id: 'COND_322', rank: 319 },
  { id: 'COND_334', rank: 334 },
  { id: 'COND_343', rank: 343 },
];

// Calculate priors: raw = 1/rank, normalize to 0.95 (5% for "other")
const rawPriors = shoulderConditions.map(c => ({ id: c.id, raw: 1 / c.rank }));
const rawSum = rawPriors.reduce((s, c) => s + c.raw, 0);
const priors = {};
for (const c of rawPriors) {
  priors[c.id] = Math.round((c.raw / rawSum) * 0.95 * 10000) / 10000;
}
priors['other'] = 0.05;

// Adjust to ensure sum = 1.0
const priorSum = Object.values(priors).reduce((s, v) => s + v, 0);
const diff = 1.0 - priorSum;
if (Math.abs(diff) > 0.0001) {
  // Adjust the largest prior
  const largest = Object.keys(priors).reduce((a, b) => priors[a] > priors[b] ? a : b);
  priors[largest] = Math.round((priors[largest] + diff) * 10000) / 10000;
}

// === CPT TABLES (10 new conditions) ===
const cptTables = {
  'COND_093': {
    name: 'Brachial Plexus Injury (Erb\'s Palsy)',
    category: 'neurological',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_WAITER_TIP_POSTURE': { present: 0.92, absent: 0.08, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_SHOULDER_ABDUCTION_LOSS': { present: 0.90, absent: 0.10, weight: 0.92, category: 'pathognomonic' },
      'SYM_SHD_ELBOW_FLEXION_LOSS': { present: 0.88, absent: 0.12, weight: 0.90, category: 'pathognomonic' },
      'SYM_SHD_NECK_SHOULDER_TRACTION_TRAUMA': { present: 0.85, absent: 0.15, weight: 0.88, category: 'characteristic' },
      'SYM_SHD_NUMBNESS_LATERAL_ARM': { present: 0.80, absent: 0.20, weight: 0.82, category: 'characteristic' },
      'SYM_SHD_MULTI_NERVE_WEAKNESS': { present: 0.85, absent: 0.15, weight: 0.85, category: 'characteristic' },
      'SYM_SHD_FOREARM_SUPINATION_LOSS': { present: 0.70, absent: 0.30, weight: 0.72, category: 'common' },
      'SYMPTOM_ONSET_ACUTE': { present: 0.80, absent: 0.20, weight: 0.75, category: 'common' },
      'SYM_SHD_NECK_PAIN_ABSENT': { present: 0.30, absent: 0.70, weight: 0.70, category: 'inverse' },
    }
  },
  'COND_223': {
    name: 'Sternoclavicular Joint Dysfunction',
    category: 'musculoskeletal',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_SC_JOINT_TENDERNESS': { present: 0.95, absent: 0.05, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_SC_JOINT_SWELLING': { present: 0.80, absent: 0.20, weight: 0.88, category: 'pathognomonic' },
      'SYM_SHD_SC_PAIN_ARM_MOVEMENT': { present: 0.85, absent: 0.15, weight: 0.85, category: 'characteristic' },
      'SYM_SHD_SC_CREPITUS': { present: 0.60, absent: 0.40, weight: 0.75, category: 'characteristic' },
      'SYM_SHD_SC_SUBLUXATION': { present: 0.40, absent: 0.60, weight: 0.80, category: 'characteristic' },
      'SYM_SHD_SC_DEEP_BREATH_PAIN': { present: 0.55, absent: 0.45, weight: 0.68, category: 'common' },
      'SYMPTOM_PAIN_LYING_ON_SIDE': { present: 0.70, absent: 0.30, weight: 0.65, category: 'common' },
      'SYM_SHD_OVERHEAD_PAIN_ABSENT': { present: 0.35, absent: 0.65, weight: 0.65, category: 'inverse' },
    }
  },
  'COND_224': {
    name: 'Pectoralis Minor Syndrome',
    category: 'neurological',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_ARM_OVERHEAD_TINGLING': { present: 0.90, absent: 0.10, weight: 0.92, category: 'pathognomonic' },
      'SYM_SHD_RING_PINKY_PARESTHESIA': { present: 0.80, absent: 0.20, weight: 0.88, category: 'pathognomonic' },
      'SYM_SHD_ANTERIOR_CHEST_TENDERNESS': { present: 0.85, absent: 0.15, weight: 0.85, category: 'characteristic' },
      'SYM_SHD_FORWARD_SHOULDER_POSTURE': { present: 0.80, absent: 0.20, weight: 0.78, category: 'characteristic' },
      'SYM_SHD_OVERHEAD_WORK_AGGRAVATION': { present: 0.85, absent: 0.15, weight: 0.82, category: 'characteristic' },
      'SYM_SHD_ARM_HEAVINESS_FATIGUE': { present: 0.70, absent: 0.30, weight: 0.72, category: 'common' },
      'SYM_SHD_HAND_COLD_COLOR_CHANGE': { present: 0.40, absent: 0.60, weight: 0.68, category: 'common' },
      'SYM_SHD_NIGHT_ARM_NUMBNESS': { present: 0.65, absent: 0.35, weight: 0.68, category: 'common' },
      'SYM_SHD_DESK_SEDENTARY': { present: 0.75, absent: 0.25, weight: 0.65, category: 'common' },
    }
  },
  'COND_277': {
    name: 'Little League Shoulder',
    category: 'musculoskeletal',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_YOUTH_OVERHEAD_THROWER': { present: 0.95, absent: 0.05, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_THROWING_ARM_PAIN': { present: 0.95, absent: 0.05, weight: 0.93, category: 'pathognomonic' },
      'SYM_SHD_PROXIMAL_HUMERUS_TENDERNESS': { present: 0.88, absent: 0.12, weight: 0.90, category: 'pathognomonic' },
      'SYM_SHD_GRADUAL_ONSET_THROWING': { present: 0.85, absent: 0.15, weight: 0.82, category: 'characteristic' },
      'SYM_SHD_DECREASED_VELOCITY': { present: 0.75, absent: 0.25, weight: 0.78, category: 'characteristic' },
      'SYM_SHD_RECENT_GROWTH_SPURT': { present: 0.70, absent: 0.30, weight: 0.78, category: 'characteristic' },
      'SYM_SHD_OVERUSE_HIGH_VOLUME': { present: 0.80, absent: 0.20, weight: 0.75, category: 'characteristic' },
      'SYM_SHD_REST_PAIN_ADVANCED': { present: 0.35, absent: 0.65, weight: 0.60, category: 'common' },
    }
  },
  'COND_297': {
    name: 'Clavicle Fracture (Post-Healing/Post-Surgical)',
    category: 'post_surgical',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_CLAVICLE_FRACTURE_HISTORY': { present: 0.98, absent: 0.02, weight: 0.98, category: 'pathognomonic' },
      'SYM_SHD_CLAVICLE_SITE_PAIN': { present: 0.90, absent: 0.10, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_CLAVICLE_BUMP_DEFORMITY': { present: 0.82, absent: 0.18, weight: 0.92, category: 'pathognomonic' },
      'SYM_SHD_STRAP_PRESSURE_PAIN': { present: 0.75, absent: 0.25, weight: 0.85, category: 'characteristic' },
      'SYMPTOM_LIMITED_ROM': { present: 0.72, absent: 0.28, weight: 0.78, category: 'characteristic' },
      'SYMPTOM_WEAKNESS': { present: 0.68, absent: 0.32, weight: 0.65, category: 'common' },
      'SYMPTOM_NUMBNESS_TINGLING': { present: 0.25, absent: 0.75, weight: 0.80, category: 'common' },
      'SYM_SHD_ARM_FATIGUE_SUSTAINED_USE': { present: 0.60, absent: 0.40, weight: 0.55, category: 'common' },
    }
  },
  'COND_293': {
    name: 'Humeral Shaft Fracture (Post-Immobilization/Post-Surgical)',
    category: 'post_surgical',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_HUMERAL_SHAFT_FRACTURE_HISTORY': { present: 0.98, absent: 0.02, weight: 0.98, category: 'pathognomonic' },
      'SYM_SHD_MID_ARM_PAIN': { present: 0.85, absent: 0.15, weight: 0.92, category: 'pathognomonic' },
      'SYM_SHD_WRIST_DROP': { present: 0.15, absent: 0.85, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_DORSAL_HAND_NUMBNESS': { present: 0.20, absent: 0.80, weight: 0.88, category: 'characteristic' },
      'SYM_SHD_SHOULDER_STIFFNESS_POST_FX': { present: 0.72, absent: 0.28, weight: 0.75, category: 'characteristic' },
      'SYM_SHD_ELBOW_STIFFNESS_POST_FX': { present: 0.68, absent: 0.32, weight: 0.78, category: 'characteristic' },
      'SYMPTOM_WEAKNESS': { present: 0.75, absent: 0.25, weight: 0.60, category: 'common' },
      'SYM_SHD_FRACTURE_SITE_INSTABILITY': { present: 0.15, absent: 0.85, weight: 0.90, category: 'characteristic' },
    }
  },
  'COND_299': {
    name: 'Proximal Humerus Fracture (Post-Immobilization/Post-Surgical)',
    category: 'post_surgical',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_PROX_HUMERUS_FX_HISTORY': { present: 0.98, absent: 0.02, weight: 0.98, category: 'pathognomonic' },
      'SYM_SHD_SEVERE_SHOULDER_STIFFNESS': { present: 0.88, absent: 0.12, weight: 0.90, category: 'pathognomonic' },
      'SYM_SHD_PROX_SHOULDER_PAIN': { present: 0.82, absent: 0.18, weight: 0.85, category: 'characteristic' },
      'SYM_SHD_DELTOID_WEAKNESS': { present: 0.70, absent: 0.30, weight: 0.82, category: 'characteristic' },
      'SYM_SHD_DELTOID_BADGE_NUMBNESS': { present: 0.25, absent: 0.75, weight: 0.88, category: 'characteristic' },
      'SYMPTOM_NIGHT_PAIN': { present: 0.75, absent: 0.25, weight: 0.60, category: 'common' },
      'SYM_SHD_SUBACROMIAL_CATCHING': { present: 0.45, absent: 0.55, weight: 0.75, category: 'characteristic' },
      'SYM_SHD_INITIAL_IMPROVEMENT_THEN_WORSE': { present: 0.20, absent: 0.80, weight: 0.85, category: 'characteristic' },
    }
  },
  'COND_305': {
    name: 'Coracoclavicular Ligament Tear',
    category: 'musculoskeletal',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_AC_BUMP_STEPOFF': { present: 0.88, absent: 0.12, weight: 0.95, category: 'pathognomonic' },
      'SYMPTOM_TOP_SHOULDER_PAIN': { present: 0.92, absent: 0.08, weight: 0.90, category: 'pathognomonic' },
      'SYM_SHD_DIRECT_SHOULDER_BLOW': { present: 0.85, absent: 0.15, weight: 0.92, category: 'pathognomonic' },
      'SYMPTOM_PAIN_CROSS_BODY': { present: 0.80, absent: 0.20, weight: 0.85, category: 'characteristic' },
      'SYM_SHD_ARM_SUPPORT_POSTURE': { present: 0.82, absent: 0.18, weight: 0.78, category: 'characteristic' },
      'SYM_SHD_PAIN_LIFTING_OVERHEAD': { present: 0.78, absent: 0.22, weight: 0.72, category: 'characteristic' },
      'SYM_SHD_CLAVICLE_INSTABILITY_FEELING': { present: 0.60, absent: 0.40, weight: 0.80, category: 'characteristic' },
      'SYMPTOM_PAIN_LYING_ON_SIDE': { present: 0.75, absent: 0.25, weight: 0.50, category: 'common' },
    }
  },
  'COND_334': {
    name: 'Sternoclavicular Joint Sprain',
    category: 'musculoskeletal',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_SC_JOINT_TENDERNESS': { present: 0.92, absent: 0.08, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_SC_JOINT_SWELLING': { present: 0.75, absent: 0.25, weight: 0.90, category: 'pathognomonic' },
      'SYM_SHD_SC_PAIN_ARM_MOVEMENT': { present: 0.85, absent: 0.15, weight: 0.80, category: 'characteristic' },
      'SYM_SHD_DIRECT_CHEST_SHOULDER_TRAUMA': { present: 0.80, absent: 0.20, weight: 0.75, category: 'characteristic' },
      'SYMPTOM_PAIN_LYING_ON_SIDE': { present: 0.70, absent: 0.30, weight: 0.65, category: 'common' },
      'SYM_SHD_SC_DEEP_BREATH_PAIN': { present: 0.55, absent: 0.45, weight: 0.68, category: 'common' },
      'SYM_SHD_SC_CLICKING': { present: 0.55, absent: 0.45, weight: 0.60, category: 'common' },
      'SYM_SHD_DYSPHAGIA_DYSPNEA': { present: 0.05, absent: 0.95, weight: 0.95, category: 'inverse' },
    }
  },
  'COND_343': {
    name: 'Pectoralis Major Strain',
    category: 'musculoskeletal',
    body_regions: ['shoulder'],
    symptom_probabilities: {
      'SYM_SHD_CHEST_PUSH_PAIN': { present: 0.92, absent: 0.08, weight: 0.95, category: 'pathognomonic' },
      'SYM_SHD_CHEST_MUSCLE_TENDERNESS': { present: 0.88, absent: 0.12, weight: 0.85, category: 'characteristic' },
      'SYM_SHD_RESISTED_ADDUCTION_PAIN': { present: 0.82, absent: 0.18, weight: 0.80, category: 'characteristic' },
      'SYM_SHD_WEIGHT_TRAINING_ONSET': { present: 0.75, absent: 0.25, weight: 0.78, category: 'characteristic' },
      'SYM_SHD_MILD_CHEST_SWELLING': { present: 0.50, absent: 0.50, weight: 0.65, category: 'common' },
      'SYM_SHD_DEEP_BREATH_CHEST_PAIN': { present: 0.45, absent: 0.55, weight: 0.55, category: 'common' },
      'SYM_SHD_IR_WEAKNESS_MILD': { present: 0.60, absent: 0.40, weight: 0.60, category: 'common' },
      'SYM_SHD_NO_CHEST_DEFORMITY': { present: 0.10, absent: 0.90, weight: 0.70, category: 'inverse' },
    }
  },
};

// === SPARSE ENRICHMENT ===
const sparseEnrichment = {
  'COND_221': {
    // Scapular Dyskinesis: existing 5 symptoms, add 5 new
    'SYM_SHD_DYNAMIC_SCAPULAR_PROMINENCE': { present: 0.85, absent: 0.15, weight: 0.90, category: 'pathognomonic' },
    'SYM_SHD_PERISCAPULAR_PAIN': { present: 0.75, absent: 0.25, weight: 0.80, category: 'characteristic' },
    'SYM_SHD_SHOULDER_SHRUGGING': { present: 0.70, absent: 0.30, weight: 0.78, category: 'characteristic' },
    'SYM_SHD_SCAPULOTHORACIC_CREPITUS': { present: 0.50, absent: 0.50, weight: 0.70, category: 'characteristic' },
    'SYM_SHD_OVERHEAD_FATIGUE': { present: 0.65, absent: 0.35, weight: 0.60, category: 'common' },
  },
  'COND_225': {
    // Biceps Tendon Rupture: existing 4 symptoms, add 6 new
    'SYM_SHD_POPEYE_DEFORMITY': { present: 0.70, absent: 0.30, weight: 0.95, category: 'pathognomonic' },
    'SYMPTOM_AUDIBLE_POP': { present: 0.75, absent: 0.25, weight: 0.90, category: 'pathognomonic' },
    'SYM_SHD_ECCHYMOSIS_TRACKING': { present: 0.65, absent: 0.35, weight: 0.80, category: 'characteristic' },
    'SYM_SHD_SUPINATION_WEAKNESS': { present: 0.60, absent: 0.40, weight: 0.78, category: 'characteristic' },
    'SYM_SHD_ELBOW_FLEXION_WEAKNESS': { present: 0.55, absent: 0.45, weight: 0.72, category: 'characteristic' },
    'SYM_SHD_BICEPS_CRAMPING': { present: 0.45, absent: 0.55, weight: 0.55, category: 'common' },
  },
};

// === QUESTIONS ===
const questions = {
  // --- COND_093: Brachial Plexus Injury ---
  'DIFF_SHD_001': {
    id: 'DIFF_SHD_001', phase: 'differential',
    text: 'After your injury, are you unable to lift your arm out to the side AND unable to bend your elbow — both at the same time?',
    patient_guidance: 'Try to raise your arm sideways like you\'re making a "T" shape, then try to bend your elbow to bring your hand to your shoulder. Can you do both movements?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SHOULDER_ABDUCTION_LOSS', 'SYM_SHD_ELBOW_FLEXION_LOSS'],
    diagnostic_weight: 0.92, information_gain_potential: 1.4, red_flag: true,
    clinical_note: 'Combined shoulder abduction + elbow flexion loss is hallmark of upper trunk brachial plexus injury'
  },
  'DIFF_SHD_002': {
    id: 'DIFF_SHD_002', phase: 'differential',
    text: 'Do you have numbness or loss of feeling on the outer part of your upper arm and forearm?',
    patient_guidance: 'Run your fingertips along the outside of your upper arm and the top of your forearm. Does the skin feel numb, tingly, or different from the other arm?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_NUMBNESS_LATERAL_ARM'],
    diagnostic_weight: 0.82, information_gain_potential: 1.1, red_flag: false,
    clinical_note: 'C5-C6 sensory distribution loss specific to brachial plexus injury'
  },
  'DIFF_SHD_003': {
    id: 'DIFF_SHD_003', phase: 'differential',
    text: 'Did this happen during a specific accident where your head was pushed one way and your shoulder the other way?',
    patient_guidance: 'Think about the moment of injury — was there a fall from a motorcycle, a tackle, or a forceful pulling apart of your neck and shoulder?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_NECK_SHOULDER_TRACTION_TRAUMA'],
    diagnostic_weight: 0.88, information_gain_potential: 1.2, red_flag: false,
    clinical_note: 'Traction mechanism responsible for 70-80% of adult brachial plexus injuries'
  },
  'DIFF_SHD_004': {
    id: 'DIFF_SHD_004', phase: 'differential',
    text: 'Does your arm hang limply at your side, turned inward, as if you were a waiter holding a tip?',
    patient_guidance: 'Let your arm hang naturally. Does it hang with the forearm turned inward and the palm facing behind you, and you can\'t easily change this position?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_WAITER_TIP_POSTURE'],
    diagnostic_weight: 0.95, information_gain_potential: 1.5, red_flag: true,
    clinical_note: 'Waiter\'s tip posture is virtually diagnostic of C5-C6 brachial plexus injury'
  },
  'DIFF_SHD_005': {
    id: 'DIFF_SHD_005', phase: 'differential',
    text: 'Does the weakness affect your shoulder, elbow, AND forearm all at the same time — not just one area?',
    patient_guidance: 'Check: Can you lift your arm at the shoulder? Bend at the elbow? Turn your palm up? If all three are weak, that\'s important.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_MULTI_NERVE_WEAKNESS', 'SYM_SHD_FOREARM_SUPINATION_LOSS'],
    diagnostic_weight: 0.85, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Multi-nerve territory weakness differentiates plexus injury from single-nerve or rotator cuff pathology'
  },

  // --- COND_223: SC Joint Dysfunction ---
  'DIFF_SHD_006': {
    id: 'DIFF_SHD_006', phase: 'differential',
    text: 'Is your pain located right where your collarbone meets your breastbone — at the base of your throat?',
    patient_guidance: 'Feel where your collarbone starts, near the center of your chest at the base of your throat. Can you point to the pain with one finger at that spot?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SC_JOINT_TENDERNESS'],
    diagnostic_weight: 0.95, information_gain_potential: 1.5, red_flag: false,
    clinical_note: 'Pinpoint SC joint tenderness is virtually diagnostic due to unique anatomical location'
  },
  'DIFF_SHD_007': {
    id: 'DIFF_SHD_007', phase: 'differential',
    text: 'Can you see or feel a bump, swelling, or the collarbone sticking out at the front of your chest near your throat?',
    patient_guidance: 'Look in a mirror and compare both sides where your collarbones meet your breastbone. Is one side more swollen or raised than the other?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SC_JOINT_SWELLING'],
    diagnostic_weight: 0.88, information_gain_potential: 1.2, red_flag: false,
    clinical_note: 'Visible SC joint prominence from subluxation or swelling is highly specific'
  },
  'DIFF_SHD_008': {
    id: 'DIFF_SHD_008', phase: 'differential',
    text: 'Does the pain get worse when you reach across your body (like reaching for a seatbelt) or take a deep breath?',
    patient_guidance: 'Try slowly reaching your arm across to the opposite shoulder, as if grabbing a seatbelt. Then take a deep breath. Does either make the pain at your inner collarbone worse?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SC_PAIN_ARM_MOVEMENT', 'SYM_SHD_SC_DEEP_BREATH_PAIN'],
    diagnostic_weight: 0.85, information_gain_potential: 1.1, red_flag: false,
    clinical_note: 'Cross-body + deep breath provocation differentiates SC joint from AC joint pathology'
  },

  // --- COND_224: Pectoralis Minor Syndrome ---
  'DIFF_SHD_009': {
    id: 'DIFF_SHD_009', phase: 'differential',
    text: 'When you raise your arm overhead — like reaching for a high shelf — do you get numbness, tingling, or pins-and-needles in your hand or fingers?',
    patient_guidance: 'Raise your arm straight up as high as you can and hold for 30 seconds. Stop immediately if you feel sharp pain, instability, or dizziness. Do you notice any tingling in your hand?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_ARM_OVERHEAD_TINGLING'],
    diagnostic_weight: 0.92, information_gain_potential: 1.4, red_flag: false,
    clinical_note: 'Hyperabduction provocation reproduces neurovascular compression under pec minor'
  },
  'DIFF_SHD_010': {
    id: 'DIFF_SHD_010', phase: 'differential',
    text: 'Is the numbness or tingling mainly in your ring finger and pinky finger, rather than your thumb and index finger?',
    patient_guidance: 'Pay attention to which fingers feel tingly or numb. Is it your ring finger and little finger? Or your thumb and index finger?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_RING_PINKY_PARESTHESIA'],
    diagnostic_weight: 0.88, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Ulnar distribution (ring/pinky) differentiates pec minor syndrome from carpal tunnel (median nerve)'
  },
  'DIFF_SHD_011': {
    id: 'DIFF_SHD_011', phase: 'differential',
    text: 'Do you spend long hours at a desk or computer, and have others told you that you tend to round your shoulders forward?',
    patient_guidance: 'Think about your typical posture. Do your shoulders roll forward? Do you spend many hours typing, driving, or sitting?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_FORWARD_SHOULDER_POSTURE', 'SYM_SHD_DESK_SEDENTARY'],
    diagnostic_weight: 0.78, information_gain_potential: 0.9, red_flag: false,
    clinical_note: 'Chronic forward posture shortens pec minor, predisposing to neurovascular compression'
  },
  'DIFF_SHD_012': {
    id: 'DIFF_SHD_012', phase: 'differential',
    text: 'Do your symptoms worsen with prolonged overhead activities, like painting a ceiling, shelving items, or sleeping with your arm above your head?',
    patient_guidance: 'Think about times your arm is raised for a while. Does the numbness or tingling increase?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_OVERHEAD_WORK_AGGRAVATION', 'SYM_SHD_NIGHT_ARM_NUMBNESS'],
    diagnostic_weight: 0.82, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Sustained overhead positioning reproduces pec minor compression'
  },

  // --- COND_277: Little League Shoulder ---
  'DIFF_SHD_013': {
    id: 'DIFF_SHD_013', phase: 'differential',
    text: 'Are you between 11 and 16 years old and playing a throwing sport like baseball, cricket, or softball?',
    patient_guidance: 'This condition only occurs in young athletes with growing bones who throw regularly.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_YOUTH_OVERHEAD_THROWER'],
    diagnostic_weight: 0.95, information_gain_potential: 1.5, red_flag: false,
    clinical_note: 'Demographic gate question — Little League shoulder occurs exclusively in skeletally immature throwing athletes'
  },
  'DIFF_SHD_014': {
    id: 'DIFF_SHD_014', phase: 'differential',
    text: 'Does your shoulder hurt during or right after throwing, and did the pain come on gradually over weeks — not from one specific throw?',
    patient_guidance: 'Think about when the pain started. Was it a slow build-up over many practices, not a single moment where something snapped?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_THROWING_ARM_PAIN', 'SYM_SHD_GRADUAL_ONSET_THROWING'],
    diagnostic_weight: 0.93, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Throwing-specific gradual onset is hallmark of growth plate stress injury'
  },
  'DIFF_SHD_015': {
    id: 'DIFF_SHD_015', phase: 'differential',
    text: 'Have you noticed a loss of throwing speed or accuracy, and have you been throwing a lot — such as playing on multiple teams?',
    patient_guidance: 'Have coaches or you noticed your throws aren\'t as fast or accurate? Have you been pitching year-round or on more than one team?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_DECREASED_VELOCITY', 'SYM_SHD_OVERUSE_HIGH_VOLUME'],
    diagnostic_weight: 0.78, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Decreased performance + high volume = classic Little League shoulder risk profile'
  },

  // --- COND_297: Clavicle Fracture Post-Healing ---
  'DIFF_SHD_016': {
    id: 'DIFF_SHD_016', phase: 'differential',
    text: 'Have you been diagnosed with a broken collarbone that was treated with either surgery or a sling?',
    patient_guidance: 'This question is about your medical history. Have you previously had a clavicle (collarbone) fracture?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_CLAVICLE_FRACTURE_HISTORY'],
    diagnostic_weight: 0.98, information_gain_potential: 1.5, red_flag: false,
    clinical_note: 'Essential gating question for post-fracture rehabilitation diagnosis'
  },
  'DIFF_SHD_017': {
    id: 'DIFF_SHD_017', phase: 'differential',
    text: 'Do you feel a noticeable bump or raised area along your collarbone, or does pressing directly on it cause pain where it was broken?',
    patient_guidance: 'Run your fingers along your collarbone. Can you feel a bump, ridge, or tender spot at the old fracture site?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_CLAVICLE_SITE_PAIN', 'SYM_SHD_CLAVICLE_BUMP_DEFORMITY'],
    diagnostic_weight: 0.92, information_gain_potential: 1.2, red_flag: false,
    clinical_note: 'Site-specific tenderness and palpable callus/hardware are pathognomonic post-clavicle fracture'
  },
  'DIFF_SHD_018': {
    id: 'DIFF_SHD_018', phase: 'differential',
    text: 'Do seatbelts, backpack straps, or anything pressing against the front of your shoulder cause discomfort or irritation?',
    patient_guidance: 'Think about wearing a seatbelt or carrying a bag with a strap over your shoulder. Does the pressure bother you?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_STRAP_PRESSURE_PAIN'],
    diagnostic_weight: 0.85, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Hardware prominence or malunion callus causes unique strap/pressure sensitivity'
  },

  // --- COND_293: Humeral Shaft Fracture Post-Immobilization ---
  'DIFF_SHD_019': {
    id: 'DIFF_SHD_019', phase: 'differential',
    text: 'Have you been diagnosed with a broken upper arm bone (humerus shaft fracture) that was treated with a brace, cast, or surgery?',
    patient_guidance: 'This question is about your medical history — a fracture in the middle part of your upper arm bone.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_HUMERAL_SHAFT_FRACTURE_HISTORY'],
    diagnostic_weight: 0.98, information_gain_potential: 1.5, red_flag: false,
    clinical_note: 'Essential gating question for post-humeral shaft fracture rehabilitation'
  },
  'DIFF_SHD_020': {
    id: 'DIFF_SHD_020', phase: 'differential',
    text: 'Do you have difficulty lifting your hand or fingers upward at the wrist, or numbness on the back of your hand?',
    patient_guidance: 'Try to bend your wrist upward (like revving a motorcycle). Can you do it? Also check if the back of your hand feels numb.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_WRIST_DROP', 'SYM_SHD_DORSAL_HAND_NUMBNESS'],
    diagnostic_weight: 0.95, information_gain_potential: 1.4, red_flag: true,
    clinical_note: 'Radial nerve palsy occurs in ~12% of humeral shaft fractures — highly specific complication'
  },
  'DIFF_SHD_021': {
    id: 'DIFF_SHD_021', phase: 'differential',
    text: 'Do you have stiffness in both your shoulder AND your elbow since the fracture?',
    patient_guidance: 'Check both joints: Can you raise your arm overhead? Can you fully straighten and bend your elbow? Is one or both stiff?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SHOULDER_STIFFNESS_POST_FX', 'SYM_SHD_ELBOW_STIFFNESS_POST_FX'],
    diagnostic_weight: 0.78, information_gain_potential: 1.1, red_flag: false,
    clinical_note: 'Dual-joint stiffness is characteristic of mid-shaft fracture — fracture between both joints'
  },

  // --- COND_299: Proximal Humerus Fracture Post-Immobilization ---
  'DIFF_SHD_022': {
    id: 'DIFF_SHD_022', phase: 'differential',
    text: 'Have you been diagnosed with a broken shoulder (proximal humerus fracture) that was treated with surgery or a sling?',
    patient_guidance: 'This is about a fracture near the top of your upper arm bone, close to the shoulder joint.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_PROX_HUMERUS_FX_HISTORY'],
    diagnostic_weight: 0.98, information_gain_potential: 1.5, red_flag: false,
    clinical_note: 'Essential gating question for post-proximal humerus fracture rehabilitation'
  },
  'DIFF_SHD_023': {
    id: 'DIFF_SHD_023', phase: 'differential',
    text: 'Since your shoulder fracture, do you have significant stiffness making it hard to raise your arm, reach behind your back, or rotate your arm outward?',
    patient_guidance: 'Try these movements: 1) Raise arm overhead. 2) Reach behind your back. 3) Rotate your arm outward. Stop immediately if you feel sharp pain, instability, or dizziness. Are any very restricted?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SEVERE_SHOULDER_STIFFNESS'],
    diagnostic_weight: 0.90, information_gain_potential: 1.2, red_flag: false,
    clinical_note: 'Multi-directional shoulder stiffness is the most common post-proximal humerus fracture complication'
  },
  'DIFF_SHD_024': {
    id: 'DIFF_SHD_024', phase: 'differential',
    text: 'Do you notice weakness when trying to lift your arm out to the side, or any numbness on the outside of your upper arm?',
    patient_guidance: 'Try to raise your arm sideways. Does it feel noticeably weak? Also touch the outer part of your upper arm — does it feel numb?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_DELTOID_WEAKNESS', 'SYM_SHD_DELTOID_BADGE_NUMBNESS'],
    diagnostic_weight: 0.82, information_gain_potential: 1.1, red_flag: false,
    clinical_note: 'Axillary nerve injury occurs in 20-30% of proximal humerus fractures'
  },

  // --- COND_305: Coracoclavicular Ligament Tear ---
  'DIFF_SHD_025': {
    id: 'DIFF_SHD_025', phase: 'differential',
    text: 'Did your shoulder pain start after a direct blow to the tip of your shoulder, or a fall landing on the point of your shoulder?',
    patient_guidance: 'Think about the injury — did something hit the very top of your shoulder, or did you fall directly onto it?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_DIRECT_SHOULDER_BLOW'],
    diagnostic_weight: 0.92, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Direct axial force to acromion is the classic mechanism for AC joint separation with CC ligament tear'
  },
  'DIFF_SHD_026': {
    id: 'DIFF_SHD_026', phase: 'differential',
    text: 'Can you see or feel a bump on the very top of your shoulder where your collarbone meets your shoulder blade? Does pressing there cause sharp pain?',
    patient_guidance: 'Look in a mirror at the top of your shoulder. Is there a visible bump or step-off? Gently press on that spot — is it very tender?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_AC_BUMP_STEPOFF', 'SYMPTOM_TOP_SHOULDER_PAIN'],
    diagnostic_weight: 0.95, information_gain_potential: 1.4, red_flag: false,
    clinical_note: 'Piano key sign (elevated clavicle) and point tenderness at AC joint are pathognomonic for CC tear'
  },
  'DIFF_SHD_027': {
    id: 'DIFF_SHD_027', phase: 'differential',
    text: 'Does reaching your arm across your body toward the opposite shoulder cause a sharp increase in pain at the top of your shoulder?',
    patient_guidance: 'Slowly bring your arm across your chest toward the opposite shoulder. Stop immediately if you feel sharp pain, instability, or dizziness. Does this reproduce your pain at the very top of the shoulder?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYMPTOM_PAIN_CROSS_BODY'],
    diagnostic_weight: 0.85, information_gain_potential: 1.1, red_flag: false,
    clinical_note: 'Cross-body adduction test has ~77% sensitivity for AC joint pathology'
  },

  // --- COND_334: SC Joint Sprain ---
  'DIFF_SHD_028': {
    id: 'DIFF_SHD_028', phase: 'differential',
    text: 'Is your pain at the very front of your chest where the collarbone meets the breastbone, and did it start after a direct hit to your chest or shoulder?',
    patient_guidance: 'Feel the center of your upper chest where the collarbone starts. Is that exactly where it hurts? Was there a collision, fall, or direct blow?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SC_JOINT_TENDERNESS', 'SYM_SHD_DIRECT_CHEST_SHOULDER_TRAUMA'],
    diagnostic_weight: 0.90, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'SC joint sprain: location-specific pain + traumatic mechanism'
  },
  'DIFF_SHD_029': {
    id: 'DIFF_SHD_029', phase: 'differential',
    text: 'Do you have any difficulty breathing or swallowing since the injury?',
    patient_guidance: 'These are important warning signs that need immediate medical attention.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_DYSPHAGIA_DYSPNEA'],
    diagnostic_weight: 0.95, information_gain_potential: 1.5, red_flag: true,
    clinical_note: 'RED FLAG: Dysphagia/dyspnea suggests posterior SC dislocation — medical emergency'
  },

  // --- COND_343: Pectoralis Major Strain ---
  'DIFF_SHD_030': {
    id: 'DIFF_SHD_030', phase: 'differential',
    text: 'Do you have pain in your chest muscle that gets worse when you push something, do a push-up, or press with your arms?',
    patient_guidance: 'Think about pushing movements — push-ups, pushing a door, pushing yourself up from a chair. Does any of these cause pain in your chest muscle?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_CHEST_PUSH_PAIN', 'SYM_SHD_RESISTED_ADDUCTION_PAIN'],
    diagnostic_weight: 0.95, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Push/press pain is the hallmark of pec major strain'
  },
  'DIFF_SHD_031': {
    id: 'DIFF_SHD_031', phase: 'differential',
    text: 'Did this pain start during exercise like bench pressing, push-ups, or lifting something heavy?',
    patient_guidance: 'Think about when the pain first started. Were you doing a specific physical activity?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_WEIGHT_TRAINING_ONSET'],
    diagnostic_weight: 0.78, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Activity-specific onset during pressing exercises is typical of pec strain'
  },
  'DIFF_SHD_032': {
    id: 'DIFF_SHD_032', phase: 'differential',
    text: 'Is your chest muscle painful but still looks the same shape as the other side — no visible lump, bunching, or large bruise going down your arm?',
    patient_guidance: 'Look in a mirror and compare both sides of your chest. Do they look the same shape? Is there bruising only on your chest, not extending into your arm?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_NO_CHEST_DEFORMITY', 'SYM_SHD_MILD_CHEST_SWELLING'],
    diagnostic_weight: 0.70, information_gain_potential: 0.9, red_flag: false,
    clinical_note: 'Absence of deformity differentiates mild pec strain from complete tear (COND_217)'
  },

  // --- COND_221: Scapular Dyskinesis (enrichment questions) ---
  'DIFF_SHD_033': {
    id: 'DIFF_SHD_033', phase: 'differential',
    text: 'When you raise your arms overhead, can you see or feel your shoulder blade poking out or sticking away from your back?',
    patient_guidance: 'Ask someone to watch your back, or use a mirror. Raise both arms slowly. Does one shoulder blade stick out more than the other? Stop immediately if you feel sharp pain, instability, or dizziness.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_DYNAMIC_SCAPULAR_PROMINENCE'],
    diagnostic_weight: 0.90, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Dynamic scapular prominence during arm elevation is the defining feature of dyskinesis'
  },
  'DIFF_SHD_034': {
    id: 'DIFF_SHD_034', phase: 'differential',
    text: 'Do you notice that you hunch or shrug your shoulder upward when you try to lift your arm, even though you don\'t intend to?',
    patient_guidance: 'Try raising your arm slowly in front of a mirror. Does your shoulder hike up toward your ear? Compare both sides.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SHOULDER_SHRUGGING'],
    diagnostic_weight: 0.78, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Compensatory upper trapezius shrugging indicates scapular stabilizer weakness'
  },
  'DIFF_SHD_035': {
    id: 'DIFF_SHD_035', phase: 'differential',
    text: 'Do you hear or feel snapping, clicking, or grinding between your shoulder blade and your ribcage when moving your arm?',
    patient_guidance: 'Move your arm in circles or raise it up and down. Do you feel a grinding or snapping sensation at the back of your shoulder, near your shoulder blade?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SCAPULOTHORACIC_CREPITUS'],
    diagnostic_weight: 0.70, information_gain_potential: 0.9, red_flag: false,
    clinical_note: 'Scapulothoracic crepitus (snapping scapula) is associated with dyskinesis'
  },
  'DIFF_SHD_036': {
    id: 'DIFF_SHD_036', phase: 'differential',
    text: 'Do you have aching pain between your shoulder blade and spine that gets worse with repetitive arm use?',
    patient_guidance: 'Feel along the inner edge of your shoulder blade, near your spine. Is it achy or tender? Does it worsen with repeated arm movements?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_PERISCAPULAR_PAIN', 'SYM_SHD_OVERHEAD_FATIGUE'],
    diagnostic_weight: 0.80, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Periscapular pain from stabilizer fatigue is characteristic of scapular dyskinesis'
  },

  // --- COND_225: Biceps Tendon Rupture (enrichment questions) ---
  'DIFF_SHD_037': {
    id: 'DIFF_SHD_037', phase: 'differential',
    text: 'When you bend your elbow and flex your biceps, does the muscle look bunched up or different compared to your other arm — like a "Popeye" muscle?',
    patient_guidance: 'Stand in front of a mirror, bend both elbows and flex your biceps. Does one side have an unusual bulge or look shorter/bunched up compared to the other?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_POPEYE_DEFORMITY'],
    diagnostic_weight: 0.95, information_gain_potential: 1.5, red_flag: false,
    clinical_note: 'Popeye deformity (retracted biceps belly) is pathognomonic for biceps tendon rupture'
  },
  'DIFF_SHD_038': {
    id: 'DIFF_SHD_038', phase: 'differential',
    text: 'Did you feel or hear a sudden pop or snap in your arm, followed by bruising that spread down your arm toward your elbow?',
    patient_guidance: 'Think about the moment the pain started. Was there a sudden pop? Did bruising appear and move down your arm over the next few days?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYMPTOM_AUDIBLE_POP', 'SYM_SHD_ECCHYMOSIS_TRACKING'],
    diagnostic_weight: 0.90, information_gain_potential: 1.3, red_flag: false,
    clinical_note: 'Audible pop + gravity-dependent ecchymosis strongly suggests tendon rupture'
  },
  'DIFF_SHD_039': {
    id: 'DIFF_SHD_039', phase: 'differential',
    text: 'Do you have noticeable weakness when trying to turn a doorknob, use a screwdriver, or twist open a jar lid?',
    patient_guidance: 'Try turning a doorknob or opening a jar. Is there clear weakness or difficulty with the twisting motion? Compare with your other hand.',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SUPINATION_WEAKNESS', 'SYM_SHD_ELBOW_FLEXION_WEAKNESS'],
    diagnostic_weight: 0.78, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Supination weakness is the primary functional deficit; more pronounced in distal ruptures'
  },

  // --- Guided Mini-Tests (shared across conditions) ---
  'DIFF_SHD_040': {
    id: 'DIFF_SHD_040', phase: 'differential',
    text: 'Raise your arm forward as high as you can. Where does it stop?',
    patient_guidance: 'Stand and slowly raise your arm straight in front of you, as high as possible. Stop immediately if you feel sharp pain, instability, or dizziness. How far did you get — waist, shoulder height, overhead, or all the way up?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYMPTOM_LIMITED_ROM', 'SYM_SHD_SEVERE_SHOULDER_STIFFNESS'],
    diagnostic_weight: 0.78, information_gain_potential: 0.8, red_flag: false,
    clinical_note: 'Forward flexion range screening — guided mini-test'
  },
  'DIFF_SHD_041': {
    id: 'DIFF_SHD_041', phase: 'differential',
    text: 'Reach behind your back as if tucking in a shirt. How far can you go?',
    patient_guidance: 'Try to reach behind your lower back, as if you were tucking in a shirt. Stop immediately if you feel sharp pain, instability, or dizziness. Can you reach your lower back, mid-back, or barely at all?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYMPTOM_LIMITED_ROM'],
    diagnostic_weight: 0.75, information_gain_potential: 0.8, red_flag: false,
    clinical_note: 'Internal rotation + extension screening — guided mini-test for capsular restriction'
  },
  'DIFF_SHD_042': {
    id: 'DIFF_SHD_042', phase: 'differential',
    text: 'Hold a water bottle at arm\'s length straight out to the side for 10 seconds. Any pain or weakness?',
    patient_guidance: 'Hold a small water bottle or similar light object. Raise your arm straight out to the side at shoulder height and hold for 10 seconds. Stop immediately if you feel sharp pain, instability, or dizziness. Any pain or shakiness?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYMPTOM_WEAKNESS', 'SYM_SHD_DELTOID_WEAKNESS'],
    diagnostic_weight: 0.80, information_gain_potential: 0.9, red_flag: false,
    clinical_note: 'Sustained abduction with light load screens for deltoid and rotator cuff weakness'
  },
  'DIFF_SHD_043': {
    id: 'DIFF_SHD_043', phase: 'differential',
    text: 'Slowly raise your arm out to the side in an arc. Does the pain come on at a specific angle — like between chest and shoulder height — then go away above it?',
    patient_guidance: 'Raise your arm from your side in a wide arc. Stop immediately if you feel sharp pain, instability, or dizziness. Does the pain appear at a certain point and then lessen as you go higher?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYMPTOM_PAINFUL_ARC', 'SYM_SHD_SUBACROMIAL_CATCHING'],
    diagnostic_weight: 0.82, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Painful arc (60-120 degrees) suggests subacromial impingement or rotator cuff pathology'
  },

  // --- Additional coverage questions ---
  'DIFF_SHD_044': {
    id: 'DIFF_SHD_044', phase: 'differential',
    text: 'Does your arm feel heavy or fatigue quickly when doing overhead tasks?',
    patient_guidance: 'Think about reaching above your head for things, hanging laundry, or working above shoulder height. Does your arm tire out faster than expected?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_ARM_HEAVINESS_FATIGUE', 'SYM_SHD_ARM_FATIGUE_SUSTAINED_USE'],
    diagnostic_weight: 0.72, information_gain_potential: 0.8, red_flag: false,
    clinical_note: 'Arm heaviness/fatigue can indicate vascular TOS or muscular deconditioning'
  },
  'DIFF_SHD_045': {
    id: 'DIFF_SHD_045', phase: 'differential',
    text: 'Does your hand feel cold or change color (pale or blue) when you raise your arm overhead?',
    patient_guidance: 'Raise your arm above your head for about 30 seconds and look at your hand. Does it look paler or bluer than the other hand?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_HAND_COLD_COLOR_CHANGE'],
    diagnostic_weight: 0.68, information_gain_potential: 0.9, red_flag: true,
    clinical_note: 'Vascular compromise with arm elevation — suggests thoracic outlet or pec minor syndrome'
  },
  'DIFF_SHD_046': {
    id: 'DIFF_SHD_046', phase: 'differential',
    text: 'Is the pain at your upper arm bone — the middle section between shoulder and elbow — rather than at the shoulder joint itself?',
    patient_guidance: 'Point to exactly where it hurts. Is it the middle part of your upper arm (the bone), not the shoulder joint or the elbow?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_MID_ARM_PAIN'],
    diagnostic_weight: 0.92, information_gain_potential: 1.2, red_flag: false,
    clinical_note: 'Mid-shaft pain differentiates humeral shaft fracture rehab from shoulder joint pathology'
  },
  'DIFF_SHD_047': {
    id: 'DIFF_SHD_047', phase: 'differential',
    text: 'Do you feel movement, clicking, or a sense that something is loose at the old fracture site in your arm?',
    patient_guidance: 'Gently feel along your upper arm or collarbone where the fracture was. Does it feel like there\'s movement where there shouldn\'t be?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_FRACTURE_SITE_INSTABILITY', 'SYM_SHD_SC_SUBLUXATION', 'SYM_SHD_SC_CREPITUS'],
    diagnostic_weight: 0.90, information_gain_potential: 1.2, red_flag: true,
    clinical_note: 'Movement at fracture site may indicate nonunion — warrants medical review'
  },
  'DIFF_SHD_048': {
    id: 'DIFF_SHD_048', phase: 'differential',
    text: 'Did your shoulder pain initially improve after the fracture, but then start getting worse again weeks or months later?',
    patient_guidance: 'Think about the timeline since your fracture. Did things get better for a while, and then start worsening again unexpectedly?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_INITIAL_IMPROVEMENT_THEN_WORSE'],
    diagnostic_weight: 0.85, information_gain_potential: 1.1, red_flag: true,
    clinical_note: 'Initial improvement then worsening suggests avascular necrosis — red flag'
  },
  'DIFF_SHD_049': {
    id: 'DIFF_SHD_049', phase: 'differential',
    text: 'Do you feel the collarbone at the top of your shoulder is loose or shifting around when you move your arm?',
    patient_guidance: 'Move your arm while feeling the top of your shoulder. Does the collarbone feel like it\'s popping in and out or shifting?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_CLAVICLE_INSTABILITY_FEELING', 'SYM_SHD_ARM_SUPPORT_POSTURE'],
    diagnostic_weight: 0.80, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Subjective clavicle instability at AC joint suggests CC ligament disruption'
  },
  'DIFF_SHD_050': {
    id: 'DIFF_SHD_050', phase: 'differential',
    text: 'Do you tend to hold your injured arm close to your body and support your elbow with your other hand?',
    patient_guidance: 'Notice how you naturally hold your arm. Do you cradle it or keep it pressed to your side for comfort?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_ARM_SUPPORT_POSTURE'],
    diagnostic_weight: 0.78, information_gain_potential: 0.8, red_flag: false,
    clinical_note: 'Protective arm support posture characteristic of AC joint separation'
  },
  'DIFF_SHD_051': {
    id: 'DIFF_SHD_051', phase: 'differential',
    text: 'Do you wake up with numbness or tingling in your arm, especially if you sleep with your arm above your head?',
    patient_guidance: 'Pay attention to your arm when you wake up. Is it numb or tingly? Does this happen more when you\'ve slept with your arm raised?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_NIGHT_ARM_NUMBNESS'],
    diagnostic_weight: 0.68, information_gain_potential: 0.8, red_flag: false,
    clinical_note: 'Night-time arm numbness from sustained pec minor compression during sleep'
  },
  'DIFF_SHD_052': {
    id: 'DIFF_SHD_052', phase: 'differential',
    text: 'Have you had a recent growth spurt, and is the pain on the outer part of your upper arm, not inside the shoulder joint?',
    patient_guidance: 'If you are a young athlete: have you grown noticeably taller recently? Feel where the pain is — is it on the outside of your upper arm bone, rather than deep inside the shoulder?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_RECENT_GROWTH_SPURT', 'SYM_SHD_PROXIMAL_HUMERUS_TENDERNESS'],
    diagnostic_weight: 0.78, information_gain_potential: 0.9, red_flag: false,
    clinical_note: 'Growth spurt + proximal humeral tenderness = key Little League shoulder pattern'
  },
  'DIFF_SHD_053': {
    id: 'DIFF_SHD_053', phase: 'differential',
    text: 'Is your main issue that you have no neck pain at all — just arm and shoulder weakness after an accident?',
    patient_guidance: 'Think about your neck. Is it pain-free and mobile? Is the problem entirely in your arm/shoulder being weak?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_NECK_PAIN_ABSENT'],
    diagnostic_weight: 0.70, information_gain_potential: 0.9, red_flag: false,
    clinical_note: 'Absence of neck pain differentiates brachial plexus injury from cervical radiculopathy'
  },
  'DIFF_SHD_054': {
    id: 'DIFF_SHD_054', phase: 'differential',
    text: 'Is there tenderness below your collarbone on the front of your chest, near your armpit area?',
    patient_guidance: 'Press gently on the front of your chest just below your collarbone, near where your arm meets your chest. Is it tender?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_ANTERIOR_CHEST_TENDERNESS', 'SYM_SHD_CHEST_MUSCLE_TENDERNESS'],
    diagnostic_weight: 0.85, information_gain_potential: 1.0, red_flag: false,
    clinical_note: 'Anterior chest/subcoracoid tenderness suggests pec minor syndrome or pec strain'
  },
  'DIFF_SHD_055': {
    id: 'DIFF_SHD_055', phase: 'differential',
    text: 'Does your chest hurt when you take a deep breath or cough?',
    patient_guidance: 'Take a deep breath in and notice if you feel pain in your chest. Also try coughing — any pain?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_DEEP_BREATH_CHEST_PAIN'],
    diagnostic_weight: 0.55, information_gain_potential: 0.7, red_flag: false,
    clinical_note: 'Respiratory pain provocation suggests chest wall or pec involvement'
  },
  'DIFF_SHD_056': {
    id: 'DIFF_SHD_056', phase: 'differential',
    text: 'Do you feel a clicking sound at the inner end of your collarbone when you move your arm?',
    patient_guidance: 'Place your fingers at the base of your throat where the collarbone starts. Move your arm up and down. Do you feel clicking or popping?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_SC_CLICKING'],
    diagnostic_weight: 0.60, information_gain_potential: 0.7, red_flag: false,
    clinical_note: 'SC joint crepitus/clicking differentiates from other shoulder conditions'
  },
  'DIFF_SHD_057': {
    id: 'DIFF_SHD_057', phase: 'differential',
    text: 'Do you notice your biceps muscle cramping or bunching up on its own?',
    patient_guidance: 'Does the front of your upper arm cramp, twitch, or feel like the muscle is bunching up without you trying to flex it?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_BICEPS_CRAMPING'],
    diagnostic_weight: 0.55, information_gain_potential: 0.7, red_flag: false,
    clinical_note: 'Biceps cramping/spasm from disrupted musculotendinous unit suggests rupture'
  },
  'DIFF_SHD_058': {
    id: 'DIFF_SHD_058', phase: 'differential',
    text: 'Does lifting your arm overhead cause pain at the very top of your shoulder, where you can feel a bony bump?',
    patient_guidance: 'Slowly raise your arm above your head. Do you feel pain specifically at the bony point on top of your shoulder?',
    type: 'yes_no', body_regions: ['shoulder'],
    tests_symptoms: ['SYM_SHD_PAIN_LIFTING_OVERHEAD', 'SYMPTOM_OVERHEAD_PAIN'],
    diagnostic_weight: 0.72, information_gain_potential: 0.8, red_flag: false,
    clinical_note: 'Top-of-shoulder overhead pain suggests AC joint or CC ligament pathology'
  },
};

// === CROSS-REGION LINKS ===
const crossRegionLinks = {
  shoulder: {
    referred_from: [
      { region: 'cervical_spine', conditions: ['COND_132', 'COND_130'], symptom_pattern: 'Shoulder pain with neck movement, dermatomal numbness/tingling (C5-C6 pattern)' },
      { region: 'thoracic_spine', conditions: ['COND_241'], symptom_pattern: 'Upper back/chest wall pain mimicking shoulder pain' },
    ],
    refers_to: [
      { region: 'elbow', conditions: ['COND_093', 'COND_293'], symptom_pattern: 'Elbow flexion loss or stiffness from brachial plexus/humeral shaft pathology' },
      { region: 'wrist_hand', conditions: ['COND_093', 'COND_224'], symptom_pattern: 'Wrist drop (radial nerve) or ring/pinky numbness (ulnar, pec minor syndrome)' },
      { region: 'cervical_spine', conditions: ['COND_297', 'COND_305'], symptom_pattern: 'Trapezius/neck pain from altered clavicle/scapular mechanics' },
    ]
  }
};

// === SYMPTOM DEFINITIONS ===
const symptomDefinitions = {
  // Brachial Plexus
  'SYM_SHD_WAITER_TIP_POSTURE': { name: 'Waiter\'s Tip Posture', description: 'Arm hangs limply at side, internally rotated, forearm pronated', question_type: 'patient_report' },
  'SYM_SHD_SHOULDER_ABDUCTION_LOSS': { name: 'Shoulder Abduction Loss', description: 'Cannot lift arm away from body', question_type: 'functional_task' },
  'SYM_SHD_ELBOW_FLEXION_LOSS': { name: 'Elbow Flexion Loss', description: 'Cannot bend elbow to bring hand to shoulder', question_type: 'functional_task' },
  'SYM_SHD_NECK_SHOULDER_TRACTION_TRAUMA': { name: 'Neck-Shoulder Traction Trauma', description: 'Forceful separation of neck and shoulder during injury', question_type: 'patient_report' },
  'SYM_SHD_NUMBNESS_LATERAL_ARM': { name: 'Lateral Arm/Forearm Numbness', description: 'Numbness on outer arm and forearm (C5-C6 distribution)', question_type: 'patient_report' },
  'SYM_SHD_MULTI_NERVE_WEAKNESS': { name: 'Multi-Nerve Territory Weakness', description: 'Weakness affects shoulder, elbow, and forearm simultaneously', question_type: 'patient_report' },
  'SYM_SHD_FOREARM_SUPINATION_LOSS': { name: 'Forearm Supination Loss', description: 'Cannot turn palm upward', question_type: 'functional_task' },
  'SYM_SHD_NECK_PAIN_ABSENT': { name: 'Absence of Neck Pain', description: 'No significant neck pain — differentiates from cervical radiculopathy', question_type: 'patient_report' },

  // SC Joint
  'SYM_SHD_SC_JOINT_TENDERNESS': { name: 'SC Joint Tenderness', description: 'Point tenderness where collarbone meets breastbone', question_type: 'patient_report' },
  'SYM_SHD_SC_JOINT_SWELLING': { name: 'SC Joint Swelling/Bump', description: 'Visible swelling or bony prominence at inner collarbone', question_type: 'patient_report' },
  'SYM_SHD_SC_PAIN_ARM_MOVEMENT': { name: 'SC Pain with Arm Movement', description: 'Pain at inner collarbone worsens with arm elevation or cross-body reach', question_type: 'patient_report' },
  'SYM_SHD_SC_CREPITUS': { name: 'SC Joint Crepitus', description: 'Grinding or clicking at inner collarbone', question_type: 'patient_report' },
  'SYM_SHD_SC_SUBLUXATION': { name: 'SC Joint Subluxation', description: 'Collarbone visibly pops out then back in', question_type: 'patient_report' },
  'SYM_SHD_SC_DEEP_BREATH_PAIN': { name: 'SC Pain with Deep Breath', description: 'Pain at inner collarbone worsens with deep breathing', question_type: 'patient_report' },
  'SYM_SHD_OVERHEAD_PAIN_ABSENT': { name: 'Absence of Overhead Pain', description: 'Overhead pain minimal compared to cross-body — differentiates from subacromial', question_type: 'patient_report' },
  'SYM_SHD_DYSPHAGIA_DYSPNEA': { name: 'Difficulty Swallowing/Breathing', description: 'RED FLAG: posterior SC dislocation compressing trachea/esophagus', question_type: 'patient_report' },
  'SYM_SHD_DIRECT_CHEST_SHOULDER_TRAUMA': { name: 'Direct Chest/Shoulder Trauma', description: 'Injury from direct blow to chest or shoulder area', question_type: 'patient_report' },
  'SYM_SHD_SC_CLICKING': { name: 'SC Joint Clicking', description: 'Clicking or popping at inner collarbone during movement', question_type: 'patient_report' },

  // Pectoralis Minor Syndrome
  'SYM_SHD_ARM_OVERHEAD_TINGLING': { name: 'Arm Overhead Tingling', description: 'Hand/finger numbness when arm raised overhead', question_type: 'guided_mini_test' },
  'SYM_SHD_RING_PINKY_PARESTHESIA': { name: 'Ring/Pinky Finger Paresthesia', description: 'Numbness primarily in ring and pinky fingers (ulnar distribution)', question_type: 'patient_report' },
  'SYM_SHD_ANTERIOR_CHEST_TENDERNESS': { name: 'Anterior Chest Wall Tenderness', description: 'Pain below collarbone on front of chest', question_type: 'patient_report' },
  'SYM_SHD_FORWARD_SHOULDER_POSTURE': { name: 'Forward Shoulder Posture', description: 'Rounded shoulders from prolonged sitting', question_type: 'patient_report' },
  'SYM_SHD_OVERHEAD_WORK_AGGRAVATION': { name: 'Overhead Work Aggravation', description: 'Symptoms worsen with prolonged overhead activity', question_type: 'patient_report' },
  'SYM_SHD_ARM_HEAVINESS_FATIGUE': { name: 'Arm Heaviness/Fatigue', description: 'Arm feels heavy or fatigues quickly overhead', question_type: 'patient_report' },
  'SYM_SHD_HAND_COLD_COLOR_CHANGE': { name: 'Hand Cold/Color Change', description: 'Hand feels cold or changes color with arm elevation', question_type: 'patient_report' },
  'SYM_SHD_NIGHT_ARM_NUMBNESS': { name: 'Night Arm Numbness', description: 'Waking with arm numbness, especially with arm overhead', question_type: 'patient_report' },
  'SYM_SHD_DESK_SEDENTARY': { name: 'Desk/Sedentary Occupation', description: 'Prolonged desk work or seated occupation', question_type: 'patient_report' },

  // Little League Shoulder
  'SYM_SHD_YOUTH_OVERHEAD_THROWER': { name: 'Youth Overhead Thrower', description: 'Age 11-16, actively in throwing sport', question_type: 'patient_report' },
  'SYM_SHD_THROWING_ARM_PAIN': { name: 'Throwing Arm Pain', description: 'Shoulder pain during or after throwing', question_type: 'patient_report' },
  'SYM_SHD_PROXIMAL_HUMERUS_TENDERNESS': { name: 'Proximal Humerus Tenderness', description: 'Tenderness on outer/upper arm bone', question_type: 'patient_report' },
  'SYM_SHD_GRADUAL_ONSET_THROWING': { name: 'Gradual Onset from Throwing', description: 'Pain came on gradually over weeks of throwing', question_type: 'patient_report' },
  'SYM_SHD_DECREASED_VELOCITY': { name: 'Decreased Throwing Velocity', description: 'Loss of throwing speed or accuracy', question_type: 'patient_report' },
  'SYM_SHD_RECENT_GROWTH_SPURT': { name: 'Recent Growth Spurt', description: 'Noticeable height growth in past 6 months', question_type: 'patient_report' },
  'SYM_SHD_OVERUSE_HIGH_VOLUME': { name: 'High Throwing Volume', description: 'Multiple teams, year-round play, excessive innings', question_type: 'patient_report' },
  'SYM_SHD_REST_PAIN_ADVANCED': { name: 'Rest Pain (Advanced)', description: 'Pain even at rest — advanced stage', question_type: 'patient_report' },

  // Clavicle Fracture Post-Healing
  'SYM_SHD_CLAVICLE_FRACTURE_HISTORY': { name: 'Clavicle Fracture History', description: 'Previous diagnosed clavicle fracture', question_type: 'patient_report' },
  'SYM_SHD_CLAVICLE_SITE_PAIN': { name: 'Clavicle Site Pain', description: 'Tenderness at previous fracture site along collarbone', question_type: 'patient_report' },
  'SYM_SHD_CLAVICLE_BUMP_DEFORMITY': { name: 'Clavicle Bump/Deformity', description: 'Palpable bump or ridge at fracture site', question_type: 'patient_report' },
  'SYM_SHD_STRAP_PRESSURE_PAIN': { name: 'Strap Pressure Pain', description: 'Pain from seatbelts, backpack straps pressing on collarbone', question_type: 'patient_report' },
  'SYM_SHD_ARM_FATIGUE_SUSTAINED_USE': { name: 'Arm Fatigue with Sustained Use', description: 'Rapid arm fatigue from altered scapular mechanics', question_type: 'patient_report' },

  // Humeral Shaft Fracture Post
  'SYM_SHD_HUMERAL_SHAFT_FRACTURE_HISTORY': { name: 'Humeral Shaft Fracture History', description: 'Previous diagnosed humeral shaft fracture', question_type: 'patient_report' },
  'SYM_SHD_MID_ARM_PAIN': { name: 'Mid-Arm Pain', description: 'Pain at mid-upper arm (between shoulder and elbow)', question_type: 'patient_report' },
  'SYM_SHD_WRIST_DROP': { name: 'Wrist Drop', description: 'Cannot extend wrist upward (radial nerve palsy)', question_type: 'functional_task' },
  'SYM_SHD_DORSAL_HAND_NUMBNESS': { name: 'Dorsal Hand Numbness', description: 'Numbness on back of hand (radial nerve)', question_type: 'patient_report' },
  'SYM_SHD_SHOULDER_STIFFNESS_POST_FX': { name: 'Shoulder Stiffness Post-Fracture', description: 'Difficulty raising arm after fracture', question_type: 'patient_report' },
  'SYM_SHD_ELBOW_STIFFNESS_POST_FX': { name: 'Elbow Stiffness Post-Fracture', description: 'Difficulty straightening/bending elbow', question_type: 'patient_report' },
  'SYM_SHD_FRACTURE_SITE_INSTABILITY': { name: 'Fracture Site Instability', description: 'Movement or clicking at fracture site (possible nonunion)', question_type: 'patient_report' },

  // Proximal Humerus Fracture Post
  'SYM_SHD_PROX_HUMERUS_FX_HISTORY': { name: 'Proximal Humerus Fracture History', description: 'Previous diagnosed proximal humerus fracture', question_type: 'patient_report' },
  'SYM_SHD_SEVERE_SHOULDER_STIFFNESS': { name: 'Severe Shoulder Stiffness', description: 'Significant multi-directional shoulder restriction', question_type: 'functional_task' },
  'SYM_SHD_PROX_SHOULDER_PAIN': { name: 'Proximal Shoulder Pain', description: 'Pain at top/front of shoulder at fracture site', question_type: 'patient_report' },
  'SYM_SHD_DELTOID_WEAKNESS': { name: 'Deltoid Weakness', description: 'Weakness lifting arm away from body (axillary nerve)', question_type: 'functional_task' },
  'SYM_SHD_DELTOID_BADGE_NUMBNESS': { name: 'Deltoid Badge Numbness', description: 'Numbness on outside of upper arm (regimental badge area)', question_type: 'patient_report' },
  'SYM_SHD_SUBACROMIAL_CATCHING': { name: 'Subacromial Catching', description: 'Pain or catching with overhead movement (secondary impingement)', question_type: 'patient_report' },
  'SYM_SHD_INITIAL_IMPROVEMENT_THEN_WORSE': { name: 'Improvement Then Worsening', description: 'Initial improvement then progressive worsening (AVN red flag)', question_type: 'pattern_recognition' },

  // CC Ligament Tear
  'SYM_SHD_AC_BUMP_STEPOFF': { name: 'AC Joint Bump/Step-off', description: 'Visible bump at top of shoulder (piano key sign)', question_type: 'patient_report' },
  'SYM_SHD_DIRECT_SHOULDER_BLOW': { name: 'Direct Shoulder Blow', description: 'Injury from fall or blow to shoulder tip', question_type: 'patient_report' },
  'SYM_SHD_ARM_SUPPORT_POSTURE': { name: 'Arm Support Posture', description: 'Holds arm close to body, supports elbow with other hand', question_type: 'patient_report' },
  'SYM_SHD_PAIN_LIFTING_OVERHEAD': { name: 'Pain Lifting Overhead', description: 'Pain with lifting objects overhead (CC ligament stress)', question_type: 'patient_report' },
  'SYM_SHD_CLAVICLE_INSTABILITY_FEELING': { name: 'Clavicle Instability', description: 'Feeling of shoulder being loose or collarbone shifting', question_type: 'patient_report' },

  // Pec Strain
  'SYM_SHD_CHEST_PUSH_PAIN': { name: 'Chest Push/Press Pain', description: 'Pain in chest muscle with pushing movements', question_type: 'patient_report' },
  'SYM_SHD_CHEST_MUSCLE_TENDERNESS': { name: 'Chest Muscle Tenderness', description: 'Tenderness along anterior axillary fold or chest wall', question_type: 'patient_report' },
  'SYM_SHD_RESISTED_ADDUCTION_PAIN': { name: 'Resisted Adduction Pain', description: 'Pain bringing arm across body against resistance', question_type: 'patient_report' },
  'SYM_SHD_WEIGHT_TRAINING_ONSET': { name: 'Weight Training Onset', description: 'Pain started during weight training or pressing exercise', question_type: 'patient_report' },
  'SYM_SHD_MILD_CHEST_SWELLING': { name: 'Mild Chest Swelling', description: 'Localized swelling on chest wall', question_type: 'patient_report' },
  'SYM_SHD_DEEP_BREATH_CHEST_PAIN': { name: 'Deep Breath Chest Pain', description: 'Chest pain with deep breathing or coughing', question_type: 'patient_report' },
  'SYM_SHD_IR_WEAKNESS_MILD': { name: 'Mild Internal Rotation Weakness', description: 'Mild weakness with internal rotation', question_type: 'functional_task' },
  'SYM_SHD_NO_CHEST_DEFORMITY': { name: 'No Chest Deformity (Inverse)', description: 'Chest symmetry preserved — differentiates from complete tear', question_type: 'patient_report' },

  // Scapular Dyskinesis enrichment
  'SYM_SHD_DYNAMIC_SCAPULAR_PROMINENCE': { name: 'Dynamic Scapular Prominence', description: 'Shoulder blade pokes out during arm movement', question_type: 'guided_mini_test' },
  'SYM_SHD_PERISCAPULAR_PAIN': { name: 'Periscapular Pain', description: 'Pain between shoulder blade and spine', question_type: 'patient_report' },
  'SYM_SHD_SHOULDER_SHRUGGING': { name: 'Shoulder Shrugging/Hiking', description: 'Involuntary shoulder hike when raising arm', question_type: 'patient_report' },
  'SYM_SHD_SCAPULOTHORACIC_CREPITUS': { name: 'Scapulothoracic Crepitus', description: 'Snapping/clicking between shoulder blade and ribcage', question_type: 'patient_report' },
  'SYM_SHD_OVERHEAD_FATIGUE': { name: 'Overhead Fatigue', description: 'Aching/fatigue with repetitive overhead activities', question_type: 'patient_report' },

  // Biceps Rupture enrichment
  'SYM_SHD_POPEYE_DEFORMITY': { name: 'Popeye Deformity', description: 'Visible biceps muscle bulge from tendon rupture', question_type: 'patient_report' },
  'SYM_SHD_ECCHYMOSIS_TRACKING': { name: 'Ecchymosis Tracking', description: 'Bruising extending from shoulder/arm toward elbow', question_type: 'patient_report' },
  'SYM_SHD_SUPINATION_WEAKNESS': { name: 'Supination Weakness', description: 'Weakness turning doorknobs or twisting forearm', question_type: 'functional_task' },
  'SYM_SHD_ELBOW_FLEXION_WEAKNESS': { name: 'Elbow Flexion Weakness', description: 'Weakness bending elbow against resistance', question_type: 'functional_task' },
  'SYM_SHD_BICEPS_CRAMPING': { name: 'Biceps Cramping/Spasm', description: 'Intermittent muscle cramping in biceps area', question_type: 'patient_report' },
};

// === BUILD OUTPUT ===
const output = {
  metadata: {
    body_region: 'shoulder',
    generated_date: '2026-02-21',
    total_conditions: 26,
    new_conditions: Object.keys(cptTables).length,
    enriched_conditions: Object.keys(sparseEnrichment).length,
    total_questions: Object.keys(questions).length,
    total_new_symptoms: Object.keys(symptomDefinitions).length,
    research_method: 'web_search_per_condition',
  },
  cpt_tables: cptTables,
  sparse_enrichment: sparseEnrichment,
  prior_probabilities: { shoulder: priors },
  questions,
  cross_region_links: crossRegionLinks,
  symptom_definitions: symptomDefinitions,
};

// === VALIDATION ===
console.log('=== Validation ===\n');

// Check 1: present + absent = 1.0
let cptPass = true;
for (const [condId, cond] of Object.entries(cptTables)) {
  for (const [symId, sym] of Object.entries(cond.symptom_probabilities)) {
    const sum = sym.present + sym.absent;
    if (Math.abs(sum - 1.0) > 0.01) {
      console.log(`FAIL: ${condId}.${symId}: present+absent = ${sum}`);
      cptPass = false;
    }
  }
}
// Also check enrichment
for (const [condId, syms] of Object.entries(sparseEnrichment)) {
  for (const [symId, sym] of Object.entries(syms)) {
    const sum = sym.present + sym.absent;
    if (Math.abs(sum - 1.0) > 0.01) {
      console.log(`FAIL: enrichment ${condId}.${symId}: present+absent = ${sum}`);
      cptPass = false;
    }
  }
}
console.log(`CPT present+absent check: ${cptPass ? 'PASS' : 'FAIL'}`);

// Check 2: Prior sum
const priorSumCheck = Object.values(priors).reduce((s, v) => s + v, 0);
console.log(`Prior sum: ${priorSumCheck.toFixed(4)} ${Math.abs(priorSumCheck - 1.0) < 0.002 ? 'PASS' : 'FAIL'}`);

// Check 3: Min 6 symptoms per condition
let minSymPass = true;
for (const [condId, cond] of Object.entries(cptTables)) {
  const count = Object.keys(cond.symptom_probabilities).length;
  if (count < 6) {
    console.log(`FAIL: ${condId} has only ${count} symptoms`);
    minSymPass = false;
  }
}
console.log(`Min 6 symptoms check: ${minSymPass ? 'PASS' : 'FAIL'}`);

// Check 4: Symptom coverage
const allSymptoms = new Set();
for (const [condId, cond] of Object.entries(cptTables)) {
  for (const symId of Object.keys(cond.symptom_probabilities)) {
    allSymptoms.add(symId);
  }
}
for (const [condId, syms] of Object.entries(sparseEnrichment)) {
  for (const symId of Object.keys(syms)) {
    allSymptoms.add(symId);
  }
}

const testedSymptoms = new Set();
for (const q of Object.values(questions)) {
  for (const sym of q.tests_symptoms) {
    testedSymptoms.add(sym);
  }
}

const untested = [...allSymptoms].filter(s => !testedSymptoms.has(s));
console.log(`Symptom coverage: ${allSymptoms.size} total, ${untested.length} untested by generated questions`);
if (untested.length > 0) {
  for (const s of untested) {
    console.log(`  UNTESTED: ${s}`);
  }
}

// Check 5: Guided mini-tests with safety disclaimer
let miniTestCount = 0;
for (const q of Object.values(questions)) {
  if (q.patient_guidance && q.patient_guidance.includes('Stop immediately if you feel sharp pain')) {
    miniTestCount++;
  }
}
console.log(`Guided mini-tests with safety disclaimer: ${miniTestCount} (min 5 required) ${miniTestCount >= 5 ? 'PASS' : 'FAIL'}`);

console.log(`\nTotal questions: ${Object.keys(questions).length}`);
console.log(`Total new conditions: ${Object.keys(cptTables).length}`);
console.log(`Total enriched conditions: ${Object.keys(sparseEnrichment).length}`);
console.log(`Total new symptom definitions: ${Object.keys(symptomDefinitions).length}`);

// === WRITE OUTPUT ===
const outDir = path.join(__dirname, '../public/data/symptom-assessment/generated');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'shoulder.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
const size = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`\nWritten to: ${outPath}`);
console.log(`File size: ${size} KB`);

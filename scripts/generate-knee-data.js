#!/usr/bin/env node
/**
 * Generate knee screening data (CPT tables + questions + cross-region links)
 * for all 33 knee conditions: 15 gap conditions + 5 sparse enrichments + 13 existing adequate.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '../public/data/symptom-assessment/generated/knee.json');

// ==========================================
// PRIOR PROBABILITY CALCULATION
// ==========================================
const kneeConditions = [
  { id: 'COND_010', name: 'Knee Osteoarthritis', rank: 4 },
  { id: 'COND_004', name: 'Patellofemoral Pain Syndrome', rank: 7 },
  { id: 'COND_015', name: 'Meniscal Tear (Knee)', rank: 13 },
  { id: 'COND_041', name: 'ACL Reconstruction (Post-Surgical)', rank: 17 },
  { id: 'COND_016', name: 'IT Band Syndrome', rank: 19 },
  { id: 'COND_043', name: 'Total Knee Replacement (Post-Surgical)', rank: 30 },
  { id: 'COND_046', name: 'Meniscus Repair (Post-Surgical)', rank: 36 },
  { id: 'COND_061', name: 'Patellar Tendinopathy (Jumper\'s Knee)', rank: 49 },
  { id: 'COND_104', name: 'Anterior Cruciate Ligament (ACL) Tear', rank: 102 },
  { id: 'COND_106', name: 'Medial Collateral Ligament (MCL) Sprain', rank: 108 },
  { id: 'COND_108', name: 'Chondromalacia Patella', rank: 109 },
  { id: 'COND_109', name: 'Osgood-Schlatter Disease', rank: 115 },
  { id: 'COND_110', name: 'Baker\'s Cyst (Popliteal Cyst)', rank: 120 },
  { id: 'COND_105', name: 'Posterior Cruciate Ligament (PCL) Tear', rank: 135 },
  { id: 'COND_107', name: 'Lateral Collateral Ligament (LCL) Sprain', rank: 138 },
  { id: 'COND_202', name: 'Acute Quadriceps Strain', rank: 164 },
  { id: 'COND_211', name: 'Muscle Contusion (Quadriceps/Charley Horse)', rank: 174 },
  { id: 'COND_251', name: 'Patella Dislocation/Subluxation', rank: 236 },
  { id: 'COND_254', name: 'Pes Anserine Bursitis', rank: 237 },
  { id: 'COND_255', name: 'Prepatellar Bursitis', rank: 239 },
  { id: 'COND_256', name: 'Infrapatellar Bursitis', rank: 243 },
  { id: 'COND_252', name: 'Plica Syndrome', rank: 256 },
  { id: 'COND_253', name: 'Hoffa\'s Fat Pad Impingement', rank: 262 },
  { id: 'COND_259', name: 'Knee Arthrofibrosis', rank: 268 },
  { id: 'COND_278', name: 'Sinding-Larsen-Johansson Syndrome', rank: 269 },
  { id: 'COND_257', name: 'Quadriceps Tendon Rupture (Post-Surgical)', rank: 278 },
  { id: 'COND_258', name: 'Patellar Tendon Rupture (Post-Surgical)', rank: 282 },
  { id: 'COND_294', name: 'Tibial Plateau Fracture (Post-Surgical)', rank: 289 },
  { id: 'COND_260', name: 'Multi-Ligament Knee Injury (Post-Surgical)', rank: 290 },
  { id: 'COND_327', name: 'Quadriceps Tendinopathy', rank: 326 },
  { id: 'COND_333', name: 'Peroneal Nerve Entrapment', rank: 333 },
  { id: 'COND_341', name: 'Iliotibial Band Syndrome (ITBS)', rank: 341 },
  { id: 'COND_342', name: 'Quadriceps Strain', rank: 342 },
];

const OTHER_BUCKET = 0.05;
const rawPriors = kneeConditions.map(c => ({ id: c.id, raw: 1 / c.rank }));
const rawSum = rawPriors.reduce((s, p) => s + p.raw, 0);
const priorProbabilities = { knee: {} };
rawPriors.forEach(p => {
  priorProbabilities.knee[p.id] = Math.round((p.raw / rawSum) * (1 - OTHER_BUCKET) * 10000) / 10000;
});
priorProbabilities.knee.other = OTHER_BUCKET;

// Fix rounding to ensure sum = 1.0
const priorSum = Object.values(priorProbabilities.knee).reduce((s, v) => s + v, 0);
if (Math.abs(priorSum - 1.0) > 0.0001) {
  const diff = 1.0 - priorSum;
  // Adjust the largest entry
  const largestId = Object.entries(priorProbabilities.knee)
    .filter(([k]) => k !== 'other')
    .sort(([, a], [, b]) => b - a)[0][0];
  priorProbabilities.knee[largestId] = Math.round((priorProbabilities.knee[largestId] + diff) * 10000) / 10000;
}

// ==========================================
// CPT TABLES — 15 GAP CONDITIONS
// ==========================================
const gapCPTTables = {
  "COND_105": {
    "name": "Posterior Cruciate Ligament (PCL) Tear",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.007,
    "symptom_probabilities": {
      "SYM_KNE_POSTERIOR_PAIN": { "present": 0.85, "absent": 0.15, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_DASHBOARD_MECHANISM": { "present": 0.75, "absent": 0.25, "weight": 0.80, "category": "characteristic" },
      "SYMPTOM_SWELLING": { "present": 0.60, "absent": 0.40, "weight": 0.50, "category": "common" },
      "SYMPTOM_KNEE_GIVING_WAY": { "present": 0.55, "absent": 0.45, "weight": 0.55, "category": "common" },
      "SYM_KNE_PAIN_DECELERATION_STAIRS": { "present": 0.65, "absent": 0.35, "weight": 0.70, "category": "characteristic" },
      "SYM_KNE_DIFFICULTY_KNEELING": { "present": 0.50, "absent": 0.50, "weight": 0.50, "category": "common" },
      "SYMPTOM_ONSET_ACUTE": { "present": 0.85, "absent": 0.15, "weight": 0.70, "category": "characteristic" },
      "SYMPTOM_AUDIBLE_POP": { "present": 0.20, "absent": 0.80, "weight": 0.75, "category": "inverse" },
      "SYM_KNE_ROTATIONAL_INSTABILITY": { "present": 0.10, "absent": 0.90, "weight": 0.80, "category": "inverse" }
    }
  },
  "COND_202": {
    "name": "Acute Quadriceps Strain",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.006,
    "symptom_probabilities": {
      "SYM_KNE_SHARP_ANTERIOR_THIGH_PAIN": { "present": 0.90, "absent": 0.10, "weight": 0.90, "category": "pathognomonic" },
      "SYM_KNE_PAIN_RESISTED_EXTENSION": { "present": 0.90, "absent": 0.10, "weight": 0.88, "category": "characteristic" },
      "SYM_KNE_PAIN_QUAD_STRETCH": { "present": 0.85, "absent": 0.15, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_ANTERIOR_THIGH_TENDERNESS": { "present": 0.85, "absent": 0.15, "weight": 0.80, "category": "characteristic" },
      "SYMPTOM_LIMITED_ROM": { "present": 0.70, "absent": 0.30, "weight": 0.60, "category": "common" },
      "SYM_KNE_DELAYED_ECCHYMOSIS": { "present": 0.55, "absent": 0.45, "weight": 0.55, "category": "common" },
      "SYMPTOM_ONSET_ACUTE": { "present": 0.95, "absent": 0.05, "weight": 0.85, "category": "pathognomonic" },
      "SYM_KNE_DIRECT_BLOW_HISTORY": { "present": 0.05, "absent": 0.95, "weight": 0.80, "category": "inverse" }
    }
  },
  "COND_211": {
    "name": "Muscle Contusion (Quadriceps/Charley Horse)",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.006,
    "symptom_probabilities": {
      "SYM_KNE_DIRECT_BLOW_HISTORY": { "present": 0.95, "absent": 0.05, "weight": 0.95, "category": "pathognomonic" },
      "SYM_KNE_IMPACT_SITE_PAIN": { "present": 0.95, "absent": 0.05, "weight": 0.90, "category": "pathognomonic" },
      "SYM_KNE_VISIBLE_BRUISING": { "present": 0.80, "absent": 0.20, "weight": 0.80, "category": "characteristic" },
      "SYMPTOM_LIMITED_ROM": { "present": 0.85, "absent": 0.15, "weight": 0.75, "category": "characteristic" },
      "SYM_KNE_PALPABLE_MASS_HEMATOMA": { "present": 0.70, "absent": 0.30, "weight": 0.70, "category": "characteristic" },
      "SYMPTOM_DIFFICULTY_WEIGHT_BEARING": { "present": 0.60, "absent": 0.40, "weight": 0.55, "category": "common" },
      "SYM_KNE_MORNING_AFTER_STIFFNESS": { "present": 0.65, "absent": 0.35, "weight": 0.55, "category": "common" },
      "SYM_KNE_PAIN_QUAD_STRETCH": { "present": 0.05, "absent": 0.95, "weight": 0.75, "category": "inverse" }
    }
  },
  "COND_254": {
    "name": "Pes Anserine Bursitis",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_MEDIAL_BELOW_JOINT_LINE_PAIN": { "present": 0.90, "absent": 0.10, "weight": 0.92, "category": "pathognomonic" },
      "SYMPTOM_PAIN_STAIRS": { "present": 0.85, "absent": 0.15, "weight": 0.80, "category": "characteristic" },
      "SYM_KNE_PAIN_RESISTED_FLEXION_INT_ROT": { "present": 0.75, "absent": 0.25, "weight": 0.75, "category": "characteristic" },
      "SYM_KNE_PAIN_RISING_FROM_SEATED": { "present": 0.70, "absent": 0.30, "weight": 0.65, "category": "common" },
      "SYM_KNE_MEDIAL_SWELLING": { "present": 0.50, "absent": 0.50, "weight": 0.50, "category": "common" },
      "SYMPTOM_ONSET_GRADUAL": { "present": 0.70, "absent": 0.30, "weight": 0.55, "category": "common" },
      "SYMPTOM_JOINT_LINE_TENDERNESS": { "present": 0.15, "absent": 0.85, "weight": 0.80, "category": "inverse" },
      "SYMPTOM_CATCHING_LOCKING": { "present": 0.05, "absent": 0.95, "weight": 0.85, "category": "inverse" }
    }
  },
  "COND_255": {
    "name": "Prepatellar Bursitis",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_ANTERIOR_PATELLA_SWELLING": { "present": 0.95, "absent": 0.05, "weight": 0.95, "category": "pathognomonic" },
      "SYM_KNE_KNEELING_HISTORY": { "present": 0.85, "absent": 0.15, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_PAIN_KNEELING": { "present": 0.90, "absent": 0.10, "weight": 0.88, "category": "characteristic" },
      "SYM_KNE_PATELLA_TENDERNESS": { "present": 0.85, "absent": 0.15, "weight": 0.80, "category": "characteristic" },
      "SYM_KNE_PRESERVED_ROM": { "present": 0.80, "absent": 0.20, "weight": 0.70, "category": "characteristic" },
      "SYM_KNE_WARMTH_REDNESS": { "present": 0.50, "absent": 0.50, "weight": 0.50, "category": "common" },
      "SYMPTOM_INSTABILITY": { "present": 0.05, "absent": 0.95, "weight": 0.85, "category": "inverse" },
      "SYMPTOM_CATCHING_LOCKING": { "present": 0.03, "absent": 0.97, "weight": 0.85, "category": "inverse" }
    }
  },
  "COND_252": {
    "name": "Plica Syndrome",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_ANTEROMEDIAL_PAIN": { "present": 0.90, "absent": 0.10, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_CLICKING_FLEXION_ARC": { "present": 0.75, "absent": 0.25, "weight": 0.80, "category": "characteristic" },
      "SYMPTOM_PAIN_STAIRS": { "present": 0.85, "absent": 0.15, "weight": 0.60, "category": "common" },
      "SYM_KNE_PALPABLE_BAND": { "present": 0.65, "absent": 0.35, "weight": 0.90, "category": "pathognomonic" },
      "SYM_KNE_PSEUDO_LOCKING": { "present": 0.40, "absent": 0.60, "weight": 0.65, "category": "common" },
      "SYMPTOM_PAIN_PROLONGED_SITTING": { "present": 0.70, "absent": 0.30, "weight": 0.65, "category": "common" },
      "SYMPTOM_ONSET_GRADUAL": { "present": 0.65, "absent": 0.35, "weight": 0.55, "category": "common" },
      "SYMPTOM_SWELLING": { "present": 0.20, "absent": 0.80, "weight": 0.70, "category": "inverse" }
    }
  },
  "COND_256": {
    "name": "Infrapatellar Bursitis",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_INFRAPATELLAR_PAIN": { "present": 0.92, "absent": 0.08, "weight": 0.88, "category": "characteristic" },
      "SYM_KNE_INFRAPATELLAR_SWELLING": { "present": 0.80, "absent": 0.20, "weight": 0.90, "category": "pathognomonic" },
      "SYM_KNE_KNEELING_HISTORY": { "present": 0.70, "absent": 0.30, "weight": 0.80, "category": "characteristic" },
      "SYM_KNE_PAIN_KNEELING": { "present": 0.85, "absent": 0.15, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_PRESERVED_ROM": { "present": 0.70, "absent": 0.30, "weight": 0.60, "category": "common" },
      "SYM_KNE_WARMTH_REDNESS": { "present": 0.35, "absent": 0.65, "weight": 0.45, "category": "common" },
      "SYMPTOM_CATCHING_LOCKING": { "present": 0.10, "absent": 0.90, "weight": 0.80, "category": "inverse" },
      "SYMPTOM_JOINT_LINE_TENDERNESS": { "present": 0.15, "absent": 0.85, "weight": 0.75, "category": "inverse" }
    }
  },
  "COND_253": {
    "name": "Hoffa's Fat Pad Impingement",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_INFRAPATELLAR_PAIN": { "present": 0.92, "absent": 0.08, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_PAIN_EXTENSION_HYPEREXT": { "present": 0.85, "absent": 0.15, "weight": 0.92, "category": "pathognomonic" },
      "SYM_KNE_PARAPATELLAR_FULLNESS": { "present": 0.60, "absent": 0.40, "weight": 0.75, "category": "characteristic" },
      "SYM_KNE_PAIN_PROLONGED_STANDING": { "present": 0.70, "absent": 0.30, "weight": 0.65, "category": "common" },
      "SYMPTOM_PAIN_SQUATTING": { "present": 0.65, "absent": 0.35, "weight": 0.55, "category": "common" },
      "SYMPTOM_ONSET_GRADUAL": { "present": 0.60, "absent": 0.40, "weight": 0.50, "category": "common" },
      "SYMPTOM_SWELLING": { "present": 0.15, "absent": 0.85, "weight": 0.70, "category": "inverse" },
      "SYMPTOM_JOINT_LINE_TENDERNESS": { "present": 0.20, "absent": 0.80, "weight": 0.70, "category": "inverse" }
    }
  },
  "COND_259": {
    "name": "Knee Arthrofibrosis",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_PROGRESSIVE_ROM_LOSS": { "present": 0.95, "absent": 0.05, "weight": 0.95, "category": "pathognomonic" },
      "SYM_KNE_PRIOR_SURGERY_HISTORY": { "present": 0.95, "absent": 0.05, "weight": 0.90, "category": "pathognomonic" },
      "SYM_KNE_PERSISTENT_STIFFNESS": { "present": 0.92, "absent": 0.08, "weight": 0.88, "category": "characteristic" },
      "SYM_KNE_HARD_END_FEEL_ROM": { "present": 0.85, "absent": 0.15, "weight": 0.82, "category": "characteristic" },
      "SYM_KNE_EXTENSION_DEFICIT": { "present": 0.80, "absent": 0.20, "weight": 0.80, "category": "characteristic" },
      "SYMPTOM_WEAKNESS": { "present": 0.75, "absent": 0.25, "weight": 0.60, "category": "common" },
      "SYM_KNE_ANTALGIC_GAIT": { "present": 0.70, "absent": 0.30, "weight": 0.55, "category": "common" },
      "SYMPTOM_INSTABILITY": { "present": 0.10, "absent": 0.90, "weight": 0.80, "category": "inverse" }
    }
  },
  "COND_278": {
    "name": "Sinding-Larsen-Johansson Syndrome",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_INFERIOR_PATELLA_TENDERNESS": { "present": 0.92, "absent": 0.08, "weight": 0.92, "category": "pathognomonic" },
      "SYM_KNE_PEDIATRIC_AGE": { "present": 0.90, "absent": 0.10, "weight": 0.90, "category": "pathognomonic" },
      "SYMPTOM_ONSET_GRADUAL": { "present": 0.85, "absent": 0.15, "weight": 0.78, "category": "characteristic" },
      "SYM_KNE_PAIN_RUNNING_JUMPING": { "present": 0.90, "absent": 0.10, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_INFERIOR_PATELLA_SWELLING": { "present": 0.65, "absent": 0.35, "weight": 0.70, "category": "common" },
      "SYMPTOM_PAIN_STAIRS": { "present": 0.75, "absent": 0.25, "weight": 0.55, "category": "common" },
      "SYMPTOM_SWELLING": { "present": 0.10, "absent": 0.90, "weight": 0.75, "category": "inverse" },
      "SYMPTOM_ONSET_ACUTE": { "present": 0.15, "absent": 0.85, "weight": 0.80, "category": "inverse" }
    }
  },
  "COND_257": {
    "name": "Quadriceps Tendon Rupture (Post-Surgical)",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_INABILITY_EXTEND": { "present": 0.90, "absent": 0.10, "weight": 0.92, "category": "pathognomonic" },
      "SYM_KNE_SUPRAPATELLAR_GAP": { "present": 0.85, "absent": 0.15, "weight": 0.95, "category": "pathognomonic" },
      "SYM_KNE_EXTENSOR_LAG": { "present": 0.80, "absent": 0.20, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_SUPRAPATELLAR_SWELLING": { "present": 0.85, "absent": 0.15, "weight": 0.75, "category": "characteristic" },
      "SYMPTOM_WEAKNESS": { "present": 0.75, "absent": 0.25, "weight": 0.65, "category": "common" },
      "SYM_KNE_PRIOR_SURGERY_HISTORY": { "present": 0.70, "absent": 0.30, "weight": 0.60, "category": "common" },
      "SYM_KNE_INFRAPATELLAR_PAIN": { "present": 0.10, "absent": 0.90, "weight": 0.75, "category": "inverse" },
      "SYMPTOM_JOINT_LINE_TENDERNESS": { "present": 0.10, "absent": 0.90, "weight": 0.70, "category": "inverse" }
    }
  },
  "COND_258": {
    "name": "Patellar Tendon Rupture (Post-Surgical)",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.004,
    "symptom_probabilities": {
      "SYM_KNE_INABILITY_EXTEND": { "present": 0.92, "absent": 0.08, "weight": 0.92, "category": "pathognomonic" },
      "SYM_KNE_INFRAPATELLAR_GAP": { "present": 0.85, "absent": 0.15, "weight": 0.95, "category": "pathognomonic" },
      "SYM_KNE_PATELLA_ALTA": { "present": 0.80, "absent": 0.20, "weight": 0.88, "category": "pathognomonic" },
      "SYM_KNE_EXTENSOR_LAG": { "present": 0.78, "absent": 0.22, "weight": 0.82, "category": "characteristic" },
      "SYM_KNE_INFRAPATELLAR_SWELLING": { "present": 0.85, "absent": 0.15, "weight": 0.75, "category": "characteristic" },
      "SYMPTOM_WEAKNESS": { "present": 0.70, "absent": 0.30, "weight": 0.60, "category": "common" },
      "SYM_KNE_SUPRAPATELLAR_GAP": { "present": 0.05, "absent": 0.95, "weight": 0.85, "category": "inverse" },
      "SYMPTOM_INSTABILITY": { "present": 0.05, "absent": 0.95, "weight": 0.75, "category": "inverse" }
    }
  },
  "COND_260": {
    "name": "Multi-Ligament Knee Injury (Post-Surgical)",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.003,
    "symptom_probabilities": {
      "SYM_KNE_MULTI_DIRECTIONAL_INSTABILITY": { "present": 0.85, "absent": 0.15, "weight": 0.92, "category": "pathognomonic" },
      "SYM_KNE_SEVERE_STIFFNESS": { "present": 0.75, "absent": 0.25, "weight": 0.78, "category": "characteristic" },
      "SYMPTOM_LIMITED_ROM": { "present": 0.80, "absent": 0.20, "weight": 0.75, "category": "characteristic" },
      "SYMPTOM_WEAKNESS": { "present": 0.75, "absent": 0.25, "weight": 0.65, "category": "common" },
      "SYMPTOM_SWELLING": { "present": 0.70, "absent": 0.30, "weight": 0.55, "category": "common" },
      "SYM_KNE_PERONEAL_NERVE_SYMPTOMS": { "present": 0.30, "absent": 0.70, "weight": 0.75, "category": "characteristic" },
      "SYMPTOM_DIFFICULTY_WEIGHT_BEARING": { "present": 0.80, "absent": 0.20, "weight": 0.60, "category": "common" },
      "SYM_KNE_PRIOR_SURGERY_HISTORY": { "present": 0.90, "absent": 0.10, "weight": 0.80, "category": "characteristic" }
    }
  },
  "COND_294": {
    "name": "Tibial Plateau Fracture (Post-Surgical)",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.003,
    "symptom_probabilities": {
      "SYM_KNE_PROXIMAL_TIBIA_PAIN": { "present": 0.90, "absent": 0.10, "weight": 0.88, "category": "characteristic" },
      "SYM_KNE_PERSISTENT_STIFFNESS": { "present": 0.80, "absent": 0.20, "weight": 0.78, "category": "characteristic" },
      "SYMPTOM_SWELLING": { "present": 0.75, "absent": 0.25, "weight": 0.55, "category": "common" },
      "SYM_KNE_HARDWARE_IRRITATION": { "present": 0.50, "absent": 0.50, "weight": 0.80, "category": "characteristic" },
      "SYMPTOM_PAIN_STAIRS": { "present": 0.85, "absent": 0.15, "weight": 0.60, "category": "common" },
      "SYMPTOM_WEAKNESS": { "present": 0.70, "absent": 0.30, "weight": 0.55, "category": "common" },
      "SYM_KNE_PRIOR_SURGERY_HISTORY": { "present": 0.95, "absent": 0.05, "weight": 0.85, "category": "pathognomonic" },
      "SYM_KNE_MULTI_DIRECTIONAL_INSTABILITY": { "present": 0.10, "absent": 0.90, "weight": 0.70, "category": "inverse" }
    }
  },
  "COND_333": {
    "name": "Peroneal Nerve Entrapment",
    "category": "neurological",
    "body_regions": ["knee"],
    "base_probability": 0.003,
    "symptom_probabilities": {
      "SYM_KNE_FOOT_DROP": { "present": 0.85, "absent": 0.15, "weight": 0.95, "category": "pathognomonic" },
      "SYM_KNE_DORSAL_FOOT_NUMBNESS": { "present": 0.80, "absent": 0.20, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_LATERAL_LEG_NUMBNESS": { "present": 0.75, "absent": 0.25, "weight": 0.82, "category": "characteristic" },
      "SYM_KNE_STEPPAGE_GAIT": { "present": 0.70, "absent": 0.30, "weight": 0.80, "category": "characteristic" },
      "SYM_KNE_EVERSION_WEAKNESS": { "present": 0.75, "absent": 0.25, "weight": 0.78, "category": "characteristic" },
      "SYM_KNE_FIBULAR_HEAD_TENDERNESS": { "present": 0.60, "absent": 0.40, "weight": 0.65, "category": "common" },
      "SYMPTOM_ONSET_GRADUAL": { "present": 0.65, "absent": 0.35, "weight": 0.55, "category": "common" },
      "SYM_KNE_FOOT_INVERSION_WEAKNESS": { "present": 0.05, "absent": 0.95, "weight": 0.90, "category": "inverse" },
      "SYM_CRX_BACK_PAIN_RADICULAR": { "present": 0.08, "absent": 0.92, "weight": 0.85, "category": "inverse" }
    }
  },
  "COND_342": {
    "name": "Quadriceps Strain",
    "category": "musculoskeletal",
    "body_regions": ["knee"],
    "base_probability": 0.003,
    "symptom_probabilities": {
      "SYM_KNE_SHARP_ANTERIOR_THIGH_PAIN": { "present": 0.92, "absent": 0.08, "weight": 0.88, "category": "characteristic" },
      "SYM_KNE_PAIN_RESISTED_EXTENSION": { "present": 0.85, "absent": 0.15, "weight": 0.85, "category": "characteristic" },
      "SYM_KNE_PAIN_QUAD_STRETCH": { "present": 0.80, "absent": 0.20, "weight": 0.82, "category": "characteristic" },
      "SYM_KNE_ANTERIOR_THIGH_TENDERNESS": { "present": 0.85, "absent": 0.15, "weight": 0.80, "category": "characteristic" },
      "SYM_KNE_ANTERIOR_THIGH_SWELLING": { "present": 0.65, "absent": 0.35, "weight": 0.55, "category": "common" },
      "SYM_KNE_DELAYED_ECCHYMOSIS": { "present": 0.55, "absent": 0.45, "weight": 0.55, "category": "common" },
      "SYMPTOM_ONSET_ACUTE": { "present": 0.90, "absent": 0.10, "weight": 0.80, "category": "characteristic" },
      "SYM_KNE_INABILITY_EXTEND": { "present": 0.05, "absent": 0.95, "weight": 0.85, "category": "inverse" },
      "SYM_KNE_SUPRAPATELLAR_GAP": { "present": 0.02, "absent": 0.98, "weight": 0.90, "category": "inverse" }
    }
  }
};

// ==========================================
// SPARSE CONDITION ENRICHMENT (additions only)
// ==========================================
const sparseEnrichment = {
  "COND_108": {
    "SYMPTOM_ANTERIOR_KNEE_PAIN": { "present": 0.92, "absent": 0.08, "weight": 0.90, "category": "pathognomonic" },
    "SYMPTOM_PAIN_STAIRS": { "present": 0.88, "absent": 0.12, "weight": 0.85, "category": "characteristic" },
    "SYMPTOM_CREPITUS": { "present": 0.75, "absent": 0.25, "weight": 0.80, "category": "characteristic" },
    "SYMPTOM_PAIN_PROLONGED_SITTING": { "present": 0.80, "absent": 0.20, "weight": 0.78, "category": "characteristic" },
    "SYMPTOM_ONSET_GRADUAL": { "present": 0.85, "absent": 0.15, "weight": 0.80, "category": "characteristic" },
    "SYMPTOM_PAIN_SQUATTING": { "present": 0.85, "absent": 0.15, "weight": 0.82, "category": "characteristic" }
  },
  "COND_109": {
    "SYMPTOM_ANTERIOR_KNEE_PAIN": { "present": 0.95, "absent": 0.05, "weight": 0.90, "category": "pathognomonic" },
    "SYM_KNE_TIBIAL_TUBEROSITY_TENDERNESS": { "present": 0.97, "absent": 0.03, "weight": 0.95, "category": "pathognomonic" },
    "SYM_KNE_PEDIATRIC_AGE": { "present": 0.90, "absent": 0.10, "weight": 0.90, "category": "pathognomonic" },
    "SYMPTOM_PAIN_WITH_ACTIVITY": { "present": 0.90, "absent": 0.10, "weight": 0.85, "category": "characteristic" },
    "SYMPTOM_ONSET_GRADUAL": { "present": 0.85, "absent": 0.15, "weight": 0.80, "category": "characteristic" },
    "SYM_KNE_TIBIAL_TUBEROSITY_PROMINENCE": { "present": 0.80, "absent": 0.20, "weight": 0.82, "category": "characteristic" }
  },
  "COND_110": {
    "SYMPTOM_POSTERIOR_KNEE_PAIN": { "present": 0.85, "absent": 0.15, "weight": 0.90, "category": "pathognomonic" },
    "SYM_KNE_POSTERIOR_MASS": { "present": 0.80, "absent": 0.20, "weight": 0.88, "category": "pathognomonic" },
    "SYMPTOM_STIFFNESS": { "present": 0.75, "absent": 0.25, "weight": 0.72, "category": "characteristic" },
    "SYMPTOM_LIMITED_ROM": { "present": 0.70, "absent": 0.30, "weight": 0.70, "category": "characteristic" },
    "SYMPTOM_ONSET_GRADUAL": { "present": 0.80, "absent": 0.20, "weight": 0.75, "category": "characteristic" },
    "SYM_KNE_CALF_SWELLING": { "present": 0.30, "absent": 0.70, "weight": 0.65, "category": "common" }
  },
  "COND_251": {
    "SYMPTOM_KNEE_GIVING_WAY": { "present": 0.80, "absent": 0.20, "weight": 0.85, "category": "characteristic" },
    "SYMPTOM_IMMEDIATE_SWELLING": { "present": 0.85, "absent": 0.15, "weight": 0.88, "category": "pathognomonic" },
    "SYMPTOM_AUDIBLE_POP": { "present": 0.55, "absent": 0.45, "weight": 0.70, "category": "common" },
    "SYMPTOM_INSTABILITY": { "present": 0.85, "absent": 0.15, "weight": 0.88, "category": "pathognomonic" }
  },
  "COND_341": {
    "SYMPTOM_LATERAL_KNEE_PAIN": { "present": 0.95, "absent": 0.05, "weight": 0.95, "category": "pathognomonic" },
    "SYMPTOM_PAIN_RUNNING": { "present": 0.90, "absent": 0.10, "weight": 0.88, "category": "pathognomonic" },
    "SYMPTOM_PAIN_STAIRS": { "present": 0.70, "absent": 0.30, "weight": 0.65, "category": "common" }
  }
};

// ==========================================
// QUESTIONS
// ==========================================
const questions = {
  // === GUIDED MINI-TESTS (6+ required) ===
  "DIFF_KNE_001": {
    "id": "DIFF_KNE_001", "phase": "differential",
    "text": "Sit on a chair and try to straighten your leg fully. Can you lock it completely straight?",
    "patient_guidance": "Sit on the edge of a chair. Slowly straighten your knee as far as it will go. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_EXTENSION_DEFICIT", "SYM_KNE_EXTENSOR_LAG"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "Extension deficit suggests arthrofibrosis, meniscal block, or extensor mechanism injury"
  },
  "DIFF_KNE_002": {
    "id": "DIFF_KNE_002", "phase": "differential",
    "text": "Squat halfway down, keeping your feet flat. Does your knee feel like it might give way or buckle?",
    "patient_guidance": "Hold onto a counter or wall for support. Bend your knees to about half-squat depth. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_KNEE_GIVING_WAY", "SYMPTOM_INSTABILITY"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Giving way during squat suggests ligament insufficiency or patellar instability"
  },
  "DIFF_KNE_003": {
    "id": "DIFF_KNE_003", "phase": "differential",
    "text": "Walk up 3 stairs slowly. Where exactly do you feel the pain?",
    "patient_guidance": "Use a handrail for safety. Walk up 3 steps at a normal pace. Notice exactly where the pain is. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "multiple_choice", "body_regions": ["knee"],
    "options": [
      { "value": "front_kneecap", "text": "Front of the kneecap" },
      { "value": "below_kneecap", "text": "Just below the kneecap" },
      { "value": "inside_knee", "text": "Inside (medial) of the knee" },
      { "value": "outside_knee", "text": "Outside (lateral) of the knee" },
      { "value": "behind_knee", "text": "Behind the knee" },
      { "value": "above_knee_thigh", "text": "Above the knee / front of thigh" },
      { "value": "no_pain", "text": "No pain with stairs" }
    ],
    "tests_symptoms": ["SYMPTOM_PAIN_STAIRS", "SYMPTOM_ANTERIOR_KNEE_PAIN", "SYMPTOM_LATERAL_KNEE_PAIN", "SYMPTOM_MEDIAL_KNEE_PAIN", "SYMPTOM_POSTERIOR_KNEE_PAIN"],
    "diagnostic_weight": 0.80, "information_gain_potential": 1.4,
    "red_flag": false, "clinical_note": "Pain location during stair climbing discriminates anterior (PFP/tendon) vs medial (pes anserine/MCL) vs lateral (ITBS/LCL)"
  },
  "DIFF_KNE_004": {
    "id": "DIFF_KNE_004", "phase": "differential",
    "text": "Stand on your injured leg only for 10 seconds. Could you do it without your knee buckling?",
    "patient_guidance": "Stand near a wall for safety. Lift your good leg off the ground and balance on the injured leg for up to 10 seconds. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_INSTABILITY", "SYMPTOM_DIFFICULTY_WEIGHT_BEARING"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Single-leg stance failure suggests significant instability or weight-bearing intolerance"
  },
  "DIFF_KNE_005": {
    "id": "DIFF_KNE_005", "phase": "differential",
    "text": "Lie on your back and try to lift your straight leg about 30cm off the bed. Can you do it?",
    "patient_guidance": "Lie flat on your back. Keep your knee completely straight and lift your whole leg about a foot off the surface. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_INABILITY_EXTEND", "SYM_KNE_EXTENSOR_LAG"],
    "diagnostic_weight": 0.90, "information_gain_potential": 1.5,
    "red_flag": false, "clinical_note": "Straight leg raise failure is pathognomonic for extensor mechanism disruption (quad/patellar tendon rupture)"
  },
  "DIFF_KNE_006": {
    "id": "DIFF_KNE_006", "phase": "differential",
    "text": "Sit on a chair, then stand up and sit back down 5 times. How does your knee feel?",
    "patient_guidance": "Use a sturdy chair. Stand up fully and sit back down 5 times at a comfortable pace. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "multiple_choice", "body_regions": ["knee"],
    "options": [
      { "value": "no_issue", "text": "No pain or difficulty" },
      { "value": "mild_pain", "text": "Mild pain but manageable" },
      { "value": "significant_pain", "text": "Significant pain that limited me" },
      { "value": "couldnt_do", "text": "Could not complete it" }
    ],
    "tests_symptoms": ["SYMPTOM_PAIN_SQUATTING", "SYMPTOM_DIFFICULTY_WEIGHT_BEARING", "SYMPTOM_WEAKNESS"],
    "diagnostic_weight": 0.75, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Sit-to-stand test assesses functional knee loading capacity"
  },
  "DIFF_KNE_007": {
    "id": "DIFF_KNE_007", "phase": "differential",
    "text": "Try to bend your knee as far as you can (heel towards buttock). How far can you go?",
    "patient_guidance": "You can do this sitting or lying down. Bend your knee bringing your heel towards your buttock. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "multiple_choice", "body_regions": ["knee"],
    "options": [
      { "value": "full_range", "text": "Heel touches buttock easily" },
      { "value": "mostly", "text": "Almost there but a little short" },
      { "value": "halfway", "text": "Only about halfway" },
      { "value": "minimal", "text": "Very limited — barely bends" }
    ],
    "tests_symptoms": ["SYMPTOM_LIMITED_ROM", "SYM_KNE_PROGRESSIVE_ROM_LOSS"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "ROM limitation severity helps distinguish arthrofibrosis/effusion from muscular/pain-limited restriction"
  },

  // === SYMPTOM REPORT QUESTIONS ===
  "DIFF_KNE_008": {
    "id": "DIFF_KNE_008", "phase": "differential",
    "text": "Does your knee make a clicking, popping, or grinding sound when you bend and straighten it?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_CREPITUS", "SYM_KNE_CLICKING_FLEXION_ARC"],
    "diagnostic_weight": 0.72, "information_gain_potential": 0.9,
    "red_flag": false, "clinical_note": "Crepitus/clicking suggests chondromalacia, plica, or meniscal pathology"
  },
  "DIFF_KNE_009": {
    "id": "DIFF_KNE_009", "phase": "differential",
    "text": "Does your knee ever get stuck or lock in one position, where you can't straighten or bend it for a moment?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_CATCHING_LOCKING", "SYM_KNE_PSEUDO_LOCKING"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "True locking = meniscal/loose body; pseudo-locking = plica, pain inhibition"
  },
  "DIFF_KNE_010": {
    "id": "DIFF_KNE_010", "phase": "differential",
    "text": "Did you hear or feel a \"pop\" at the time of your injury?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_AUDIBLE_POP"],
    "diagnostic_weight": 0.80, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Audible pop strongly suggests ACL tear (~70% sensitivity); less common in PCL, patellar dislocation"
  },
  "DIFF_KNE_011": {
    "id": "DIFF_KNE_011", "phase": "differential",
    "text": "Did your knee swell up within the first 2 hours after the injury?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_IMMEDIATE_SWELLING"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Rapid hemarthrosis (<2h) suggests ACL tear, patellar dislocation, or fracture"
  },
  "DIFF_KNE_012": {
    "id": "DIFF_KNE_012", "phase": "differential",
    "text": "Is the pain worse when you first get up in the morning, then gradually improves as you move around?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_MORNING_STIFFNESS", "SYMPTOM_MORNING_STIFFNESS_SHORT"],
    "diagnostic_weight": 0.70, "information_gain_potential": 0.9,
    "red_flag": false, "clinical_note": "Morning stiffness <30min = OA pattern; >30min suggests inflammatory arthritis"
  },

  // === LOCATION MAPPING QUESTIONS ===
  "DIFF_KNE_013": {
    "id": "DIFF_KNE_013", "phase": "differential",
    "text": "Where is the pain located most of the time?",
    "type": "multiple_choice", "body_regions": ["knee"],
    "options": [
      { "value": "front_kneecap", "text": "Front of the kneecap" },
      { "value": "below_kneecap", "text": "Just below the kneecap" },
      { "value": "above_kneecap", "text": "Just above the kneecap" },
      { "value": "inside_knee", "text": "Inner side of the knee" },
      { "value": "outside_knee", "text": "Outer side of the knee" },
      { "value": "behind_knee", "text": "Behind the knee" },
      { "value": "front_thigh", "text": "Front of the thigh (above knee)" },
      { "value": "shin_area", "text": "Below the knee on the shin bone" }
    ],
    "tests_symptoms": ["SYMPTOM_ANTERIOR_KNEE_PAIN", "SYM_KNE_INFRAPATELLAR_PAIN", "SYMPTOM_MEDIAL_KNEE_PAIN", "SYMPTOM_LATERAL_KNEE_PAIN", "SYMPTOM_POSTERIOR_KNEE_PAIN", "SYM_KNE_SHARP_ANTERIOR_THIGH_PAIN"],
    "diagnostic_weight": 0.88, "information_gain_potential": 1.5,
    "red_flag": false, "clinical_note": "Pain location is the single highest-value discriminator across knee conditions"
  },
  "DIFF_KNE_014": {
    "id": "DIFF_KNE_014", "phase": "differential",
    "text": "If the pain is on the inner side of your knee, is it right at the joint line crease, or a few inches below it?",
    "type": "multiple_choice", "body_regions": ["knee"],
    "options": [
      { "value": "at_joint_line", "text": "Right at the crease of the joint" },
      { "value": "below_joint_line", "text": "A few inches below the joint crease" },
      { "value": "not_medial", "text": "My pain is not on the inner side" }
    ],
    "tests_symptoms": ["SYMPTOM_JOINT_LINE_TENDERNESS", "SYM_KNE_MEDIAL_BELOW_JOINT_LINE_PAIN"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "Joint line = meniscal/MCL; below joint line = pes anserine bursitis"
  },

  // === PATTERN RECOGNITION QUESTIONS ===
  "DIFF_KNE_015": {
    "id": "DIFF_KNE_015", "phase": "differential",
    "text": "Does the pain get worse the longer you sit with your knees bent (like watching a movie)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_PAIN_PROLONGED_SITTING"],
    "diagnostic_weight": 0.75, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Theater sign — characteristic of PFP, chondromalacia, plica syndrome"
  },
  "DIFF_KNE_016": {
    "id": "DIFF_KNE_016", "phase": "differential",
    "text": "Does the pain start after you've been running for a specific distance, and then get worse the more you run?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_PAIN_RUNNING", "SYMPTOM_PAIN_AT_SPECIFIC_DISTANCE"],
    "diagnostic_weight": 0.80, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Distance-dependent pain is classic ITBS pattern"
  },
  "DIFF_KNE_017": {
    "id": "DIFF_KNE_017", "phase": "differential",
    "text": "Did the pain start after a direct blow or impact to your knee or thigh?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_DIRECT_BLOW_HISTORY", "SYM_KNE_IMPACT_SITE_PAIN"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "Direct trauma mechanism discriminates contusion from strain and overuse injuries"
  },
  "DIFF_KNE_018": {
    "id": "DIFF_KNE_018", "phase": "differential",
    "text": "Did your knee injury happen during a twisting, pivoting, or cutting movement?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_PIVOTING_INJURY", "SYMPTOM_TWISTING_INJURY", "SYM_KNE_ROTATIONAL_INSTABILITY"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Pivoting/cutting mechanism strongly suggests ACL injury"
  },
  "DIFF_KNE_019": {
    "id": "DIFF_KNE_019", "phase": "differential",
    "text": "Is there visible swelling directly over the front of your kneecap (a soft, puffy bump)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_ANTERIOR_PATELLA_SWELLING"],
    "diagnostic_weight": 0.88, "information_gain_potential": 1.4,
    "red_flag": false, "clinical_note": "Fluctuant anterior patella swelling is pathognomonic for prepatellar bursitis"
  },
  "DIFF_KNE_020": {
    "id": "DIFF_KNE_020", "phase": "differential",
    "text": "Is the pain worse when you fully straighten your knee or push it into a straight (locked) position?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_EXTENSION_HYPEREXT"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Extension pain is characteristic of Hoffa's fat pad impingement; also meniscal block"
  },
  "DIFF_KNE_021": {
    "id": "DIFF_KNE_021", "phase": "differential",
    "text": "Do you have any numbness, tingling, or weakness in your foot or lower leg?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_FOOT_DROP", "SYM_KNE_DORSAL_FOOT_NUMBNESS", "SYM_KNE_LATERAL_LEG_NUMBNESS", "SYM_KNE_PERONEAL_NERVE_SYMPTOMS"],
    "diagnostic_weight": 0.90, "information_gain_potential": 1.5,
    "red_flag": false, "clinical_note": "Neurological symptoms below knee suggest peroneal nerve entrapment or lumbar radiculopathy"
  },
  "DIFF_KNE_022": {
    "id": "DIFF_KNE_022", "phase": "differential",
    "text": "Have you had knee surgery in the past?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PRIOR_SURGERY_HISTORY"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.4,
    "red_flag": false, "clinical_note": "Post-surgical status essential for arthrofibrosis, tendon rupture, hardware irritation diagnoses"
  },
  "DIFF_KNE_023": {
    "id": "DIFF_KNE_023", "phase": "differential",
    "text": "Can you feel a bump or lump behind your knee that gets smaller when you bend your knee?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_POSTERIOR_MASS"],
    "diagnostic_weight": 0.88, "information_gain_potential": 1.4,
    "red_flag": false, "clinical_note": "Fluctuant posterior mass that changes with flexion = Baker's cyst (Foucher sign)"
  },
  "DIFF_KNE_024": {
    "id": "DIFF_KNE_024", "phase": "differential",
    "text": "Is the pain mainly worse when kneeling on the affected knee?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_KNEELING", "SYM_KNE_DIFFICULTY_KNEELING"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Kneeling-specific pain suggests prepatellar/infrapatellar bursitis or PCL"
  },
  "DIFF_KNE_025": {
    "id": "DIFF_KNE_025", "phase": "differential",
    "text": "Are you between the ages of 10 and 15?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PEDIATRIC_AGE"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "Pediatric age immediately narrows to Osgood-Schlatter, Sinding-Larsen-Johansson, or osteochondral conditions"
  },
  "DIFF_KNE_026": {
    "id": "DIFF_KNE_026", "phase": "differential",
    "text": "Can you feel a tender bump on the bony point just below your kneecap, at the top of your shin bone?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_TIBIAL_TUBEROSITY_TENDERNESS", "SYM_KNE_TIBIAL_TUBEROSITY_PROMINENCE"],
    "diagnostic_weight": 0.90, "information_gain_potential": 1.4,
    "red_flag": false, "clinical_note": "Tibial tuberosity tenderness/prominence is pathognomonic for Osgood-Schlatter in adolescents"
  },
  "DIFF_KNE_027": {
    "id": "DIFF_KNE_027", "phase": "differential",
    "text": "Is the knee stiffness constant throughout the day (not just in the morning)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PERSISTENT_STIFFNESS", "SYM_KNE_PROGRESSIVE_ROM_LOSS"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "All-day stiffness (vs morning only) suggests arthrofibrosis or advanced OA"
  },
  "DIFF_KNE_028": {
    "id": "DIFF_KNE_028", "phase": "differential",
    "text": "Did you feel the kneecap slide out of place or shift to the side during the injury?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYMPTOM_INSTABILITY", "SYM_KNE_MULTI_DIRECTIONAL_INSTABILITY"],
    "diagnostic_weight": 0.90, "information_gain_potential": 1.4,
    "red_flag": false, "clinical_note": "Patellar displacement sensation is pathognomonic for patellar dislocation/subluxation"
  },
  "DIFF_KNE_029": {
    "id": "DIFF_KNE_029", "phase": "differential",
    "text": "Did the pain come on suddenly during a kicking, jumping, or sprinting movement?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_SHARP_ANTERIOR_THIGH_PAIN", "SYMPTOM_ONSET_ACUTE"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Explosive eccentric mechanism during sport = quadriceps strain/tear"
  },
  "DIFF_KNE_030": {
    "id": "DIFF_KNE_030", "phase": "differential",
    "text": "Can you feel a gap or dent just above or just below your kneecap?",
    "type": "multiple_choice", "body_regions": ["knee"],
    "options": [
      { "value": "gap_above", "text": "Yes, a gap ABOVE the kneecap" },
      { "value": "gap_below", "text": "Yes, a gap BELOW the kneecap" },
      { "value": "no_gap", "text": "No gap or dent" }
    ],
    "tests_symptoms": ["SYM_KNE_SUPRAPATELLAR_GAP", "SYM_KNE_INFRAPATELLAR_GAP"],
    "diagnostic_weight": 0.92, "information_gain_potential": 1.6,
    "red_flag": false, "clinical_note": "Suprapatellar gap = quad tendon rupture; infrapatellar gap = patellar tendon rupture. Highest discriminating value."
  },
  "DIFF_KNE_031": {
    "id": "DIFF_KNE_031", "phase": "differential",
    "text": "Is the pain mainly behind your knee, deep inside?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_POSTERIOR_PAIN"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Deep posterior pain suggests PCL injury, Baker's cyst, or popliteal pathology"
  },
  "DIFF_KNE_032": {
    "id": "DIFF_KNE_032", "phase": "differential",
    "text": "Did you injure your knee by falling onto it while it was bent, or by hitting the front of your shin on something (like a car dashboard)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_DASHBOARD_MECHANISM"],
    "diagnostic_weight": 0.80, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Posterior-directed tibial force mechanism is classic for PCL injury"
  },
  "DIFF_KNE_033": {
    "id": "DIFF_KNE_033", "phase": "differential",
    "text": "Is the pain worse when walking downhill or slowing down from a run?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_DECELERATION_STAIRS"],
    "diagnostic_weight": 0.75, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Deceleration pain is characteristic of PCL insufficiency"
  },
  "DIFF_KNE_034": {
    "id": "DIFF_KNE_034", "phase": "differential",
    "text": "Try to bend your knee and pull your heel towards your buttock with your hand. Does this cause pain in the front of the thigh?",
    "patient_guidance": "Stand near a wall. Pull your heel towards your buttock gently. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_QUAD_STRETCH", "SYM_KNE_PAIN_RESISTED_EXTENSION"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Pain on passive quad stretch with resisted extension suggests quadriceps strain or contusion"
  },
  "DIFF_KNE_035": {
    "id": "DIFF_KNE_035", "phase": "differential",
    "text": "Is there tenderness when you press on the front of your thigh (between the knee and hip)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_ANTERIOR_THIGH_TENDERNESS", "SYM_KNE_ANTERIOR_THIGH_SWELLING"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Anterior thigh tenderness with swelling suggests quad strain or contusion"
  },
  "DIFF_KNE_036": {
    "id": "DIFF_KNE_036", "phase": "differential",
    "text": "Did bruising appear on your thigh 1-2 days after the injury?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_DELAYED_ECCHYMOSIS", "SYM_KNE_VISIBLE_BRUISING"],
    "diagnostic_weight": 0.72, "information_gain_potential": 0.9,
    "red_flag": false, "clinical_note": "Delayed ecchymosis suggests muscle strain or contusion"
  },
  "DIFF_KNE_037": {
    "id": "DIFF_KNE_037", "phase": "differential",
    "text": "Can you feel a hard, tender lump at the spot where you were hit?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PALPABLE_MASS_HEMATOMA", "SYM_KNE_IMPACT_SITE_PAIN"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Palpable hematoma mass at impact site is characteristic of quadriceps contusion"
  },
  "DIFF_KNE_038": {
    "id": "DIFF_KNE_038", "phase": "differential",
    "text": "Was the knee much stiffer and more painful the morning after the injury compared to right after?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_MORNING_AFTER_STIFFNESS"],
    "diagnostic_weight": 0.68, "information_gain_potential": 0.8,
    "red_flag": false, "clinical_note": "Significant day-after worsening is common with intramuscular hematoma formation"
  },
  "DIFF_KNE_039": {
    "id": "DIFF_KNE_039", "phase": "differential",
    "text": "Is the pain on the inner side of your knee worse when you stand up from a chair?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_RISING_FROM_SEATED", "SYM_KNE_MEDIAL_SWELLING"],
    "diagnostic_weight": 0.72, "information_gain_potential": 0.9,
    "red_flag": false, "clinical_note": "Medial pain with sit-to-stand suggests pes anserine bursitis"
  },
  "DIFF_KNE_040": {
    "id": "DIFF_KNE_040", "phase": "differential",
    "text": "Do you kneel frequently for your work or activities (gardening, cleaning floors, etc.)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_KNEELING_HISTORY"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Occupational kneeling is the primary risk factor for prepatellar and infrapatellar bursitis"
  },
  "DIFF_KNE_041": {
    "id": "DIFF_KNE_041", "phase": "differential",
    "text": "Does the area around your knee feel warm or look red?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_WARMTH_REDNESS"],
    "diagnostic_weight": 0.70, "information_gain_potential": 0.9,
    "red_flag": true, "clinical_note": "Warmth + redness may indicate septic bursitis or infection — requires medical evaluation"
  },
  "DIFF_KNE_042": {
    "id": "DIFF_KNE_042", "phase": "differential",
    "text": "Is the pain on the front-inner part of your knee, just above the joint crease?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_ANTEROMEDIAL_PAIN", "SYM_KNE_PALPABLE_BAND"],
    "diagnostic_weight": 0.75, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Anteromedial pain with palpable band suggests plica syndrome"
  },
  "DIFF_KNE_043": {
    "id": "DIFF_KNE_043", "phase": "differential",
    "text": "Is there swelling just below your kneecap (on either side of the tendon that connects the kneecap to the shin)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_INFRAPATELLAR_SWELLING", "SYM_KNE_PARAPATELLAR_FULLNESS", "SYM_KNE_INFERIOR_PATELLA_SWELLING"],
    "diagnostic_weight": 0.80, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Infrapatellar swelling/fullness suggests bursitis or fat pad impingement"
  },
  "DIFF_KNE_044": {
    "id": "DIFF_KNE_044", "phase": "differential",
    "text": "Is the pain worse when you stand for a long time (more than 15-20 minutes)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_PROLONGED_STANDING"],
    "diagnostic_weight": 0.68, "information_gain_potential": 0.8,
    "red_flag": false, "clinical_note": "Prolonged standing pain suggests fat pad impingement (extension loading)"
  },
  "DIFF_KNE_045": {
    "id": "DIFF_KNE_045", "phase": "differential",
    "text": "Do you walk with a noticeable limp?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_ANTALGIC_GAIT", "SYM_KNE_STEPPAGE_GAIT"],
    "diagnostic_weight": 0.65, "information_gain_potential": 0.8,
    "red_flag": false, "clinical_note": "Antalgic gait = pain-avoidance; steppage gait = foot drop (peroneal nerve)"
  },
  "DIFF_KNE_046": {
    "id": "DIFF_KNE_046", "phase": "differential",
    "text": "Is the pain worse with running, jumping, or kicking — and does it ease when you rest?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_RUNNING_JUMPING", "SYM_KNE_INFERIOR_PATELLA_TENDERNESS"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Activity-related anterior knee pain in adolescents suggests SLJ or Osgood-Schlatter"
  },
  "DIFF_KNE_047": {
    "id": "DIFF_KNE_047", "phase": "differential",
    "text": "Does your kneecap appear to sit higher than normal compared to the other knee?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PATELLA_ALTA", "SYM_KNE_SUPRAPATELLAR_SWELLING"],
    "diagnostic_weight": 0.82, "information_gain_potential": 1.2,
    "red_flag": false, "clinical_note": "Patella alta (high-riding) suggests patellar tendon rupture"
  },
  "DIFF_KNE_048": {
    "id": "DIFF_KNE_048", "phase": "differential",
    "text": "Does your knee feel stiff in every direction — both bending AND straightening — and not just in the morning?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_SEVERE_STIFFNESS", "SYM_KNE_HARD_END_FEEL_ROM"],
    "diagnostic_weight": 0.80, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Global, persistent stiffness post-surgery is the hallmark of arthrofibrosis"
  },
  "DIFF_KNE_049": {
    "id": "DIFF_KNE_049", "phase": "differential",
    "text": "Is the pain at the top of your shin bone, near where a surgical plate or screws might be?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PROXIMAL_TIBIA_PAIN", "SYM_KNE_HARDWARE_IRRITATION"],
    "diagnostic_weight": 0.78, "information_gain_potential": 1.1,
    "red_flag": false, "clinical_note": "Proximal tibial pain with hardware awareness suggests tibial plateau fracture post-op complications"
  },
  "DIFF_KNE_050": {
    "id": "DIFF_KNE_050", "phase": "differential",
    "text": "Do you have difficulty turning your foot outward, or does the front of your foot seem to drop when you walk?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_EVERSION_WEAKNESS", "SYM_KNE_FOOT_INVERSION_WEAKNESS"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "Eversion weakness with preserved inversion = peroneal nerve (not L5 root)"
  },
  "DIFF_KNE_051": {
    "id": "DIFF_KNE_051", "phase": "differential",
    "text": "Is there tenderness when you press on the bony bump on the outer side of your knee (just below the joint)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_FIBULAR_HEAD_TENDERNESS"],
    "diagnostic_weight": 0.72, "information_gain_potential": 0.9,
    "red_flag": false, "clinical_note": "Fibular head tenderness suggests peroneal nerve entrapment at the fibular tunnel"
  },
  "DIFF_KNE_052": {
    "id": "DIFF_KNE_052", "phase": "differential",
    "text": "Do you also have back pain that radiates down your leg?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_CRX_BACK_PAIN_RADICULAR"],
    "diagnostic_weight": 0.85, "information_gain_potential": 1.3,
    "red_flag": false, "clinical_note": "Back pain with radicular leg symptoms suggests lumbar radiculopathy as pain source, not local knee pathology"
  },
  "DIFF_KNE_053": {
    "id": "DIFF_KNE_053", "phase": "differential",
    "text": "Have you noticed any swelling in your calf (below the knee)?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_CALF_SWELLING"],
    "diagnostic_weight": 0.75, "information_gain_potential": 1.0,
    "red_flag": true, "clinical_note": "Calf swelling may indicate ruptured Baker's cyst or DVT — requires medical evaluation"
  },
  "DIFF_KNE_054": {
    "id": "DIFF_KNE_054", "phase": "differential",
    "text": "When you press on the kneecap itself, is it tender?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PATELLA_TENDERNESS"],
    "diagnostic_weight": 0.70, "information_gain_potential": 0.9,
    "red_flag": false, "clinical_note": "Patellar tenderness suggests chondromalacia, prepatellar bursitis, or patellar stress injury"
  },
  "DIFF_KNE_055": {
    "id": "DIFF_KNE_055", "phase": "differential",
    "text": "Despite having pain, can you bend and straighten your knee through its full range without it getting stuck?",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PRESERVED_ROM"],
    "diagnostic_weight": 0.68, "information_gain_potential": 0.8,
    "red_flag": false, "clinical_note": "Preserved ROM with focal swelling supports bursitis over intra-articular pathology"
  },
  "DIFF_KNE_056": {
    "id": "DIFF_KNE_056", "phase": "differential",
    "text": "Try bending your knee against your other hand's resistance (like pushing against a door). Does this cause pain on the inside of the knee?",
    "patient_guidance": "Sit on a chair. Place your hand behind the ankle of the painful leg. Try to bend your knee while your hand resists. Stop immediately if you feel sharp pain, instability, or dizziness.",
    "type": "yes_no", "body_regions": ["knee"],
    "tests_symptoms": ["SYM_KNE_PAIN_RESISTED_FLEXION_INT_ROT"],
    "diagnostic_weight": 0.75, "information_gain_potential": 1.0,
    "red_flag": false, "clinical_note": "Pain with resisted flexion at medial knee suggests pes anserine involvement"
  }
};

// ==========================================
// CROSS-REGION LINKS
// ==========================================
const crossRegionLinks = {
  "knee": {
    "referred_from": [
      { "region": "hip", "conditions": ["COND_124", "COND_125"], "symptom_pattern": "Hip pathology causing referred medial knee pain (obturator nerve); pain with hip ROM, not knee ROM" },
      { "region": "lumbar_spine", "conditions": ["COND_084", "COND_007"], "symptom_pattern": "L3/L4 radiculopathy causing anterior knee pain with dermatomal numbness; positive SLR, back pain" }
    ],
    "refers_to": [
      { "region": "lower_leg", "conditions": ["COND_111", "COND_113"], "symptom_pattern": "Altered gait from knee injury causing lower leg compensatory loading" },
      { "region": "ankle", "conditions": ["COND_005"], "symptom_pattern": "Knee immobilization causing ankle stiffness and compensatory ankle overload" }
    ]
  }
};

// ==========================================
// SYMPTOM DEFINITIONS (new symptoms only)
// ==========================================
const symptomDefinitions = {
  "SYM_KNE_POSTERIOR_PAIN": { "name": "Posterior Knee Pain", "description": "Deep aching pain behind the knee", "question_type": "patient_report" },
  "SYM_KNE_DASHBOARD_MECHANISM": { "name": "Dashboard / Anterior Tibial Blow Mechanism", "description": "Injury from force hitting the front of the shin or falling on bent knee", "question_type": "patient_report" },
  "SYM_KNE_PAIN_DECELERATION_STAIRS": { "name": "Pain with Deceleration/Descending Stairs", "description": "Pain specifically when slowing down or going downstairs", "question_type": "patient_report" },
  "SYM_KNE_DIFFICULTY_KNEELING": { "name": "Difficulty Kneeling", "description": "Pain or difficulty when kneeling on the affected knee", "question_type": "patient_report" },
  "SYM_KNE_ROTATIONAL_INSTABILITY": { "name": "Rotational Knee Instability", "description": "Knee gives way during twisting or pivoting movements", "question_type": "patient_report" },
  "SYM_KNE_SHARP_ANTERIOR_THIGH_PAIN": { "name": "Sharp Anterior Thigh Pain", "description": "Sudden sharp pain in the front of the thigh during activity", "question_type": "patient_report" },
  "SYM_KNE_PAIN_RESISTED_EXTENSION": { "name": "Pain with Resisted Knee Extension", "description": "Pain when trying to straighten the knee against resistance", "question_type": "functional_task" },
  "SYM_KNE_PAIN_QUAD_STRETCH": { "name": "Pain with Quadriceps Stretching", "description": "Pain when bending the knee fully (heel to buttock)", "question_type": "functional_task" },
  "SYM_KNE_ANTERIOR_THIGH_TENDERNESS": { "name": "Anterior Thigh Tenderness", "description": "Tenderness when pressing on the front of the thigh", "question_type": "patient_report" },
  "SYM_KNE_DELAYED_ECCHYMOSIS": { "name": "Delayed Bruising", "description": "Bruising appearing 24-48 hours after injury on the thigh", "question_type": "patient_report" },
  "SYM_KNE_DIRECT_BLOW_HISTORY": { "name": "Direct Blow / Impact History", "description": "Clear history of being hit directly on the thigh or knee", "question_type": "patient_report" },
  "SYM_KNE_IMPACT_SITE_PAIN": { "name": "Pain at Exact Impact Location", "description": "Pain centered at the exact point where the blow landed", "question_type": "patient_report" },
  "SYM_KNE_VISIBLE_BRUISING": { "name": "Visible Bruising", "description": "Black, blue, or purple discoloration at the injury site", "question_type": "patient_report" },
  "SYM_KNE_PALPABLE_MASS_HEMATOMA": { "name": "Palpable Swollen Mass", "description": "A firm, tender lump at the injury site from internal bleeding", "question_type": "patient_report" },
  "SYM_KNE_MORNING_AFTER_STIFFNESS": { "name": "Day-After Stiffness", "description": "Significant stiffness the morning after the injury", "question_type": "patient_report" },
  "SYM_KNE_MEDIAL_BELOW_JOINT_LINE_PAIN": { "name": "Medial Pain Below Joint Line", "description": "Pain on inner knee, 5-7cm below the joint crease", "question_type": "patient_report" },
  "SYM_KNE_PAIN_RESISTED_FLEXION_INT_ROT": { "name": "Pain with Resisted Flexion + Internal Rotation", "description": "Pain when bending the knee against resistance while rotating inward", "question_type": "functional_task" },
  "SYM_KNE_PAIN_RISING_FROM_SEATED": { "name": "Pain Rising from Seated Position", "description": "Pain when standing up from a chair", "question_type": "patient_report" },
  "SYM_KNE_MEDIAL_SWELLING": { "name": "Medial Knee Swelling", "description": "Localized swelling on the inner side of the knee", "question_type": "patient_report" },
  "SYM_KNE_ANTERIOR_PATELLA_SWELLING": { "name": "Anterior Patella Swelling", "description": "Soft, puffy swelling directly over the front of the kneecap", "question_type": "patient_report" },
  "SYM_KNE_KNEELING_HISTORY": { "name": "Repetitive Kneeling History", "description": "History of prolonged or repetitive kneeling (occupation/activity)", "question_type": "patient_report" },
  "SYM_KNE_PAIN_KNEELING": { "name": "Pain with Kneeling", "description": "Pain specifically when kneeling on the affected knee", "question_type": "patient_report" },
  "SYM_KNE_PATELLA_TENDERNESS": { "name": "Patella Tenderness", "description": "Tenderness when pressing on the kneecap", "question_type": "patient_report" },
  "SYM_KNE_PRESERVED_ROM": { "name": "Preserved Range of Motion", "description": "Full or nearly full knee bending and straightening despite other symptoms", "question_type": "functional_task" },
  "SYM_KNE_WARMTH_REDNESS": { "name": "Warmth and Redness", "description": "The area feels warm and looks red", "question_type": "patient_report" },
  "SYM_KNE_ANTEROMEDIAL_PAIN": { "name": "Anteromedial Knee Pain", "description": "Pain on the front-inner side of the knee", "question_type": "patient_report" },
  "SYM_KNE_CLICKING_FLEXION_ARC": { "name": "Clicking in Flexion Arc", "description": "Clicking or snapping during knee bending in the 30-70 degree range", "question_type": "patient_report" },
  "SYM_KNE_PALPABLE_BAND": { "name": "Palpable Band/Ridge on Medial Knee", "description": "A tender band or ridge that can be felt rolling over the inner knee", "question_type": "patient_report" },
  "SYM_KNE_PSEUDO_LOCKING": { "name": "Pseudo-Locking / Transient Catching", "description": "Brief catching sensation that self-resolves, not a true mechanical block", "question_type": "patient_report" },
  "SYM_KNE_INFRAPATELLAR_PAIN": { "name": "Infrapatellar Pain", "description": "Pain just below the kneecap", "question_type": "patient_report" },
  "SYM_KNE_INFRAPATELLAR_SWELLING": { "name": "Infrapatellar Swelling", "description": "Visible swelling just below the kneecap", "question_type": "patient_report" },
  "SYM_KNE_PAIN_EXTENSION_HYPEREXT": { "name": "Pain with Extension / Hyperextension", "description": "Pain when fully straightening or overextending the knee", "question_type": "patient_report" },
  "SYM_KNE_PARAPATELLAR_FULLNESS": { "name": "Parapatellar Fullness", "description": "Puffiness or fullness on either side of the kneecap tendon", "question_type": "patient_report" },
  "SYM_KNE_PAIN_PROLONGED_STANDING": { "name": "Pain with Prolonged Standing", "description": "Pain that develops or worsens with extended standing", "question_type": "patient_report" },
  "SYM_KNE_PROGRESSIVE_ROM_LOSS": { "name": "Progressive Range of Motion Loss", "description": "Gradual worsening of knee bending/straightening ability over weeks", "question_type": "patient_report" },
  "SYM_KNE_PRIOR_SURGERY_HISTORY": { "name": "Prior Knee Surgery History", "description": "History of previous knee surgery", "question_type": "patient_report" },
  "SYM_KNE_PERSISTENT_STIFFNESS": { "name": "Persistent All-Day Stiffness", "description": "Knee stiffness that lasts throughout the day, not just mornings", "question_type": "patient_report" },
  "SYM_KNE_HARD_END_FEEL_ROM": { "name": "Hard End-Feel at ROM Limit", "description": "A firm, unyielding stop when pushing knee range of motion", "question_type": "functional_task" },
  "SYM_KNE_EXTENSION_DEFICIT": { "name": "Extension Deficit", "description": "Inability to fully straighten the knee", "question_type": "functional_task" },
  "SYM_KNE_ANTALGIC_GAIT": { "name": "Limping / Antalgic Gait", "description": "Walking with a limp to avoid putting weight on the affected knee", "question_type": "patient_report" },
  "SYM_KNE_INFERIOR_PATELLA_TENDERNESS": { "name": "Inferior Patella Pole Tenderness", "description": "Pain when pressing on the bottom tip of the kneecap", "question_type": "patient_report" },
  "SYM_KNE_PEDIATRIC_AGE": { "name": "Pediatric Age (10-15 years)", "description": "Patient is between 10 and 15 years old", "question_type": "patient_report" },
  "SYM_KNE_PAIN_RUNNING_JUMPING": { "name": "Pain with Running/Jumping/Kicking", "description": "Pain that increases with running, jumping, or kicking activities", "question_type": "patient_report" },
  "SYM_KNE_INFERIOR_PATELLA_SWELLING": { "name": "Inferior Patella Swelling", "description": "Localized swelling at the bottom tip of the kneecap", "question_type": "patient_report" },
  "SYM_KNE_INABILITY_EXTEND": { "name": "Inability to Extend Knee (SLR Failure)", "description": "Cannot lift straight leg or extend knee against gravity", "question_type": "functional_task" },
  "SYM_KNE_SUPRAPATELLAR_GAP": { "name": "Suprapatellar Gap / Defect", "description": "A palpable gap or dent just above the kneecap", "question_type": "patient_report" },
  "SYM_KNE_EXTENSOR_LAG": { "name": "Extensor Lag", "description": "Knee drops slightly when trying to hold it straight", "question_type": "functional_task" },
  "SYM_KNE_SUPRAPATELLAR_SWELLING": { "name": "Suprapatellar Swelling", "description": "Swelling and tenderness just above the kneecap", "question_type": "patient_report" },
  "SYM_KNE_INFRAPATELLAR_GAP": { "name": "Infrapatellar Gap / Defect", "description": "A palpable gap or dent just below the kneecap", "question_type": "patient_report" },
  "SYM_KNE_PATELLA_ALTA": { "name": "High-Riding Patella", "description": "The kneecap appears to sit higher than normal", "question_type": "patient_report" },
  "SYM_KNE_MULTI_DIRECTIONAL_INSTABILITY": { "name": "Multi-Directional Knee Instability", "description": "Knee gives way in multiple directions, not just one", "question_type": "patient_report" },
  "SYM_KNE_SEVERE_STIFFNESS": { "name": "Severe Knee Stiffness", "description": "Major restriction of knee movement in all directions", "question_type": "patient_report" },
  "SYM_KNE_PERONEAL_NERVE_SYMPTOMS": { "name": "Peroneal Nerve Symptoms", "description": "Foot drop, numbness on top of foot, or lateral leg tingling", "question_type": "patient_report" },
  "SYM_KNE_PROXIMAL_TIBIA_PAIN": { "name": "Proximal Tibia Pain", "description": "Pain at the top of the shin bone near the knee", "question_type": "patient_report" },
  "SYM_KNE_HARDWARE_IRRITATION": { "name": "Hardware Irritation Symptoms", "description": "Pain or discomfort over surgical hardware (plates/screws)", "question_type": "patient_report" },
  "SYM_KNE_FOOT_DROP": { "name": "Foot Drop", "description": "Difficulty lifting the front of the foot when walking", "question_type": "patient_report" },
  "SYM_KNE_DORSAL_FOOT_NUMBNESS": { "name": "Numbness on Top of Foot", "description": "Numbness or tingling on the top surface of the foot", "question_type": "patient_report" },
  "SYM_KNE_LATERAL_LEG_NUMBNESS": { "name": "Lateral Lower Leg Numbness", "description": "Numbness or tingling on the outer side of the lower leg", "question_type": "patient_report" },
  "SYM_KNE_STEPPAGE_GAIT": { "name": "Steppage Gait", "description": "High-stepping walking pattern to clear the drooping foot", "question_type": "patient_report" },
  "SYM_KNE_EVERSION_WEAKNESS": { "name": "Foot Eversion Weakness", "description": "Difficulty turning the foot outward", "question_type": "functional_task" },
  "SYM_KNE_FIBULAR_HEAD_TENDERNESS": { "name": "Fibular Head Tenderness", "description": "Tenderness at the bony bump on the outer side of the knee", "question_type": "patient_report" },
  "SYM_KNE_FOOT_INVERSION_WEAKNESS": { "name": "Foot Inversion Weakness (Absent)", "description": "Weakness turning the foot inward — if present, suggests L5 not peroneal", "question_type": "functional_task" },
  "SYM_CRX_BACK_PAIN_RADICULAR": { "name": "Back Pain with Radicular Pattern", "description": "Low back pain radiating down the leg in a nerve pattern", "question_type": "patient_report" },
  "SYM_KNE_ANTERIOR_THIGH_SWELLING": { "name": "Anterior Thigh Swelling", "description": "Swelling on the front of the thigh", "question_type": "patient_report" },
  "SYM_KNE_TIBIAL_TUBEROSITY_TENDERNESS": { "name": "Tibial Tuberosity Tenderness", "description": "Pain when pressing the bony bump at the top of the shin", "question_type": "patient_report" },
  "SYM_KNE_TIBIAL_TUBEROSITY_PROMINENCE": { "name": "Enlarged Tibial Tuberosity", "description": "Visible bump at the top of the shin bone larger than the other side", "question_type": "patient_report" },
  "SYM_KNE_POSTERIOR_MASS": { "name": "Posterior Knee Mass", "description": "A palpable lump or bump behind the knee", "question_type": "patient_report" },
  "SYM_KNE_CALF_SWELLING": { "name": "Calf Swelling", "description": "Swelling in the calf below the knee", "question_type": "patient_report" }
};

// ==========================================
// BUILD OUTPUT
// ==========================================
const totalNewSymptoms = Object.keys(symptomDefinitions).length;
const totalQuestions = Object.keys(questions).length;
const totalNewConditions = Object.keys(gapCPTTables).length;

const output = {
  metadata: {
    body_region: "knee",
    generated_date: "2026-02-21",
    total_conditions: 33,
    new_conditions: totalNewConditions,
    enriched_conditions: Object.keys(sparseEnrichment).length,
    total_questions: totalQuestions,
    total_new_symptoms: totalNewSymptoms,
    research_method: "web_search_per_condition"
  },
  cpt_tables: gapCPTTables,
  sparse_enrichment: sparseEnrichment,
  prior_probabilities: priorProbabilities,
  questions,
  cross_region_links: crossRegionLinks,
  symptom_definitions: symptomDefinitions
};

// ==========================================
// VALIDATION
// ==========================================
console.log('=== Validation ===\n');

// Check 1: All CPT present+absent = 1.0
let cptErrors = 0;
for (const [condId, condData] of Object.entries(gapCPTTables)) {
  for (const [symId, symProb] of Object.entries(condData.symptom_probabilities)) {
    const sum = symProb.present + symProb.absent;
    if (Math.abs(sum - 1.0) > 0.01) {
      console.error(`  CPT ERROR: ${condId}.${symId}: ${sum}`);
      cptErrors++;
    }
  }
}
console.log(`CPT present+absent check: ${cptErrors === 0 ? 'PASS' : `FAIL (${cptErrors} errors)`}`);

// Check 2: Priors sum to 1.0
const priorTotal = Object.values(priorProbabilities.knee).reduce((s, v) => s + v, 0);
console.log(`Prior sum: ${priorTotal.toFixed(4)} ${Math.abs(priorTotal - 1.0) < 0.002 ? 'PASS' : 'FAIL'}`);

// Check 3: Min 6 symptoms per condition
let sparseCount = 0;
for (const [condId, condData] of Object.entries(gapCPTTables)) {
  const count = Object.keys(condData.symptom_probabilities).length;
  if (count < 6) {
    console.error(`  SPARSE: ${condId} has ${count} symptoms`);
    sparseCount++;
  }
}
console.log(`Min 6 symptoms check: ${sparseCount === 0 ? 'PASS' : `FAIL (${sparseCount} sparse)`}`);

// Check 4: Every CPT symptom has a question
const allCPTSyms = new Set();
for (const condData of Object.values(gapCPTTables)) {
  for (const symId of Object.keys(condData.symptom_probabilities)) {
    allCPTSyms.add(symId);
  }
}
for (const enrichData of Object.values(sparseEnrichment)) {
  for (const symId of Object.keys(enrichData)) {
    allCPTSyms.add(symId);
  }
}
const testedSyms = new Set();
for (const q of Object.values(questions)) {
  for (const sym of q.tests_symptoms) {
    testedSyms.add(sym);
  }
}
const untested = [...allCPTSyms].filter(s => !testedSyms.has(s));
// Allow existing symptoms that already have questions in the main questions.json
const existingSymsWithQuestions = new Set([
  'SYMPTOM_SWELLING', 'SYMPTOM_ONSET_ACUTE', 'SYMPTOM_ONSET_GRADUAL', 'SYMPTOM_LIMITED_ROM',
  'SYMPTOM_DIFFICULTY_WEIGHT_BEARING', 'SYMPTOM_WEAKNESS', 'SYMPTOM_PAIN_SQUATTING',
  'SYMPTOM_PAIN_WITH_ACTIVITY', 'SYMPTOM_STIFFNESS', 'SYMPTOM_KNEE_GIVING_WAY',
  'SYMPTOM_PAIN_STAIRS', 'SYMPTOM_PAIN_PROLONGED_SITTING', 'SYMPTOM_ANTERIOR_KNEE_PAIN',
  'SYMPTOM_MEDIAL_KNEE_PAIN', 'SYMPTOM_LATERAL_KNEE_PAIN', 'SYMPTOM_POSTERIOR_KNEE_PAIN',
  'SYMPTOM_CREPITUS', 'SYMPTOM_CATCHING_LOCKING', 'SYMPTOM_AUDIBLE_POP',
  'SYMPTOM_IMMEDIATE_SWELLING', 'SYMPTOM_INSTABILITY', 'SYMPTOM_JOINT_LINE_TENDERNESS',
  'SYMPTOM_MORNING_STIFFNESS', 'SYMPTOM_MORNING_STIFFNESS_SHORT', 'SYMPTOM_PAIN_RUNNING',
  'SYMPTOM_PAIN_AT_SPECIFIC_DISTANCE', 'SYMPTOM_PIVOTING_INJURY', 'SYMPTOM_TWISTING_INJURY',
  'SYMPTOM_PAIN_JUMPING'
]);
const trulyUntested = untested.filter(s => !existingSymsWithQuestions.has(s));
console.log(`Symptom coverage: ${allCPTSyms.size} total, ${trulyUntested.length} untested by generated questions`);
if (trulyUntested.length > 0) {
  console.log(`  Untested: ${trulyUntested.join(', ')}`);
}

// Check 5: Mini-test count
const miniTests = Object.values(questions).filter(q =>
  q.patient_guidance && q.patient_guidance.includes('Stop immediately')
).length;
console.log(`Guided mini-tests with safety disclaimer: ${miniTests} (min 6 required) ${miniTests >= 6 ? 'PASS' : 'FAIL'}`);

console.log(`\nTotal questions: ${totalQuestions}`);
console.log(`Total new conditions: ${totalNewConditions}`);
console.log(`Total enriched conditions: ${Object.keys(sparseEnrichment).length}`);
console.log(`Total new symptom definitions: ${totalNewSymptoms}`);

// ==========================================
// WRITE OUTPUT
// ==========================================
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`\nWritten to: ${OUTPUT_PATH}`);
console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB`);

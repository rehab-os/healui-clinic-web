/**
 * Referral Pattern Database - Simplified for Clinical Use
 *
 * 2-3 key screening questions per body region to identify
 * if pain source is local or referred from another area.
 *
 * Evidence-based patterns from: dermatomal referral, sclerotomal referral,
 * myofascial trigger points, and regional interdependence.
 */

export interface ReferralQuestion {
  id: string;
  question: string;
  positiveImplication: string;
  sourceRegion: string;
  isRedFlag?: boolean; // If true, positive response should trigger red flag alert
}

export interface RegionReferralData {
  region: string;
  label: string;
  questions: ReferralQuestion[];
  clinicalNote: string;
}

// ==================== REGION NORMALIZATION ====================
// Centralized mapping to handle all variations consistently

const REGION_ALIASES: Record<string, string> = {
  // Lower back variations
  'lower-back': 'lower-back',
  'lower_back': 'lower-back',
  'lowerback': 'lower-back',
  'lumbar': 'lower-back',

  // Upper back / Thoracic variations
  'upper-back': 'thoracic',
  'upper_back': 'thoracic',
  'upperback': 'thoracic',
  'thoracic': 'thoracic',
  'mid-back': 'thoracic',
  'mid_back': 'thoracic',
  'midback': 'thoracic',

  // Calf / Lower leg variations
  'calf': 'lower-leg',
  'lower-leg': 'lower-leg',
  'lower_leg': 'lower-leg',
  'lowerleg': 'lower-leg',

  // Forearm
  'forearm': 'forearm',

  // Arm (upper arm) - maps to shoulder (similar referral patterns)
  'arm': 'arm',
  'upper-arm': 'arm',
  'upper_arm': 'arm',
  'upperarm': 'arm',
  'bicep': 'arm',
  'tricep': 'arm',

  // Leg variations -> lower-leg
  'leg': 'lower-leg',

  // Standard regions (map to themselves)
  'shoulder': 'shoulder',
  'elbow': 'elbow',
  'wrist': 'wrist',
  'hand': 'hand',
  'hip': 'hip',
  'thigh': 'thigh',
  'knee': 'knee',
  'ankle': 'ankle',
  'foot': 'foot',
  'neck': 'neck',
  'head': 'head',
  'chest': 'chest',
  'abdomen': 'abdomen',
};

/**
 * Normalize region name to database key
 */
export function normalizeRegion(region: string): string {
  const normalized = region.toLowerCase()
    .trim()
    .replace(/ /g, '-')
    .replace(/_/g, '-');

  return REGION_ALIASES[normalized] || normalized;
}

// ==================== REFERRAL SCREENING DATABASE ====================

export const REFERRAL_SCREENING: Record<string, RegionReferralData> = {

  // ==================== UPPER LIMB ====================

  shoulder: {
    region: 'shoulder',
    label: 'Shoulder',
    questions: [
      // CARDIAC - CRITICAL RED FLAG
      {
        id: 'shoulder_cardiac_screen',
        question: 'Do you have chest tightness, shortness of breath, or jaw discomfort along with shoulder pain?',
        positiveImplication: 'CARDIAC REFERRAL - Requires immediate medical evaluation',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      {
        id: 'shoulder_exertion',
        question: 'Does your LEFT shoulder pain come on or worsen with physical exertion (walking, climbing stairs)?',
        positiveImplication: 'Exertional pattern suggests possible cardiac origin',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      // GALLBLADDER (Right shoulder)
      {
        id: 'shoulder_meals',
        question: 'Is your RIGHT shoulder pain worse after eating fatty or greasy meals?',
        positiveImplication: 'Gallbladder referral pattern - consider hepatobiliary evaluation',
        sourceRegion: 'gallbladder',
        isRedFlag: true
      },
      // CERVICAL
      {
        id: 'shoulder_neck_movement',
        question: 'Does moving your neck change your shoulder symptoms?',
        positiveImplication: 'Cervical spine may be contributing',
        sourceRegion: 'cervical'
      },
      {
        id: 'shoulder_below_elbow',
        question: 'Do your symptoms travel below the elbow into forearm or hand?',
        positiveImplication: 'Suggests cervical radiculopathy rather than local shoulder',
        sourceRegion: 'cervical'
      },
      // DIAPHRAGM / PHRENIC NERVE
      {
        id: 'shoulder_breathing',
        question: 'Does deep breathing significantly worsen your shoulder tip pain?',
        positiveImplication: 'Diaphragm/phrenic nerve irritation (C3-C5)',
        sourceRegion: 'diaphragm'
      }
    ],
    clinicalNote: 'RED FLAGS: Left shoulder + exertion = cardiac. Right shoulder + meals = gallbladder. Always screen cardiac before assuming MSK!'
  },

  elbow: {
    region: 'elbow',
    label: 'Elbow',
    questions: [
      // CERVICAL
      {
        id: 'elbow_neck_movement',
        question: 'Does moving your neck affect your elbow symptoms?',
        positiveImplication: 'Cervical spine (C5-C7) may be the source',
        sourceRegion: 'cervical'
      },
      {
        id: 'elbow_thumb_tingling',
        question: 'Do you have any tingling in your thumb, index, or middle finger?',
        positiveImplication: 'Dermatomal pattern: thumb/index=C6, middle=C7',
        sourceRegion: 'cervical'
      },
      // SHOULDER - Regional interdependence
      {
        id: 'elbow_shoulder_pain',
        question: 'Do you have any shoulder pain or difficulty reaching overhead?',
        positiveImplication: 'Shoulder dysfunction causing compensatory elbow strain',
        sourceRegion: 'shoulder'
      },
      // DOUBLE CRUSH
      {
        id: 'elbow_double_crush',
        question: 'Do you have BOTH neck stiffness AND wrist/hand symptoms?',
        positiveImplication: 'Double crush syndrome - proximal AND distal compression',
        sourceRegion: 'double_crush'
      },
      // THORACIC OUTLET
      {
        id: 'elbow_tos',
        question: 'Are symptoms worse with arms overhead or carrying heavy bags?',
        positiveImplication: 'Thoracic outlet syndrome pattern',
        sourceRegion: 'thoracic_outlet'
      }
    ],
    clinicalNote: '82% of patients with C6/C7 radiculopathy had bilateral epicondylitis. If grip strengthening fails after 6 weeks - CHECK THE NECK!'
  },

  forearm: {
    region: 'forearm',
    label: 'Forearm',
    questions: [
      {
        id: 'forearm_neck_movement',
        question: 'Does moving your neck affect your forearm symptoms?',
        positiveImplication: 'Cervical spine (C6-C7) may be contributing',
        sourceRegion: 'cervical'
      },
      {
        id: 'forearm_elbow_pain',
        question: 'Do you have any elbow pain or tenderness?',
        positiveImplication: 'Local elbow pathology referring to forearm',
        sourceRegion: 'elbow'
      }
    ],
    clinicalNote: 'Forearm pain with negative local exam - check cervical spine and elbow.'
  },

  wrist: {
    region: 'wrist',
    label: 'Wrist',
    questions: [
      {
        id: 'wrist_neck_effect',
        question: 'Does neck position or movement affect your wrist/hand symptoms?',
        positiveImplication: 'Cervical component present',
        sourceRegion: 'cervical'
      },
      {
        id: 'wrist_proximal_symptoms',
        question: 'Do you have any symptoms in your neck, shoulder, or arm?',
        positiveImplication: 'Proximal source likely - double crush possible',
        sourceRegion: 'cervical'
      }
    ],
    clinicalNote: 'Double crush: cervical radiculopathy + carpal tunnel often coexist.'
  },

  hand: {
    region: 'hand',
    label: 'Hand',
    questions: [
      {
        id: 'hand_neck_movement',
        question: 'Does neck movement change your hand symptoms?',
        positiveImplication: 'Cervical radiculopathy likely',
        sourceRegion: 'cervical'
      },
      {
        id: 'hand_arm_overhead',
        question: 'Are symptoms worse with arms overhead or carrying heavy bags?',
        positiveImplication: 'Thoracic outlet syndrome possible',
        sourceRegion: 'thoracic_outlet'
      }
    ],
    clinicalNote: 'Map finger distribution: thumb/index=C6, middle=C7, ring/small=C8'
  },

  // ==================== SPINE ====================

  neck: {
    region: 'neck',
    label: 'Neck',
    questions: [
      // CARDIAC - Can present as neck/jaw pain
      {
        id: 'neck_cardiac_screen',
        question: 'Does neck or jaw pain come on with physical exertion or stress?',
        positiveImplication: 'Exertional neck/jaw pain may be cardiac angina equivalent',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      {
        id: 'neck_cardiac_chest',
        question: 'Do you have any chest discomfort or shortness of breath with your neck pain?',
        positiveImplication: 'Associated cardiac symptoms - needs evaluation',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      // VASCULAR - Carotid/Vertebral
      {
        id: 'neck_vascular',
        question: 'Did neck pain start suddenly with any dizziness, visual changes, or difficulty speaking?',
        positiveImplication: 'VASCULAR EMERGENCY - possible carotid/vertebral dissection',
        sourceRegion: 'vascular',
        isRedFlag: true
      },
      // THORACIC
      {
        id: 'neck_upper_back',
        question: 'Do you have stiffness or pain between your shoulder blades?',
        positiveImplication: 'Thoracic spine contributing to neck symptoms',
        sourceRegion: 'thoracic'
      },
      // TMJ
      {
        id: 'neck_jaw_symptoms',
        question: 'Do you have any jaw pain, clicking, or teeth grinding?',
        positiveImplication: 'TMJ dysfunction may be contributing',
        sourceRegion: 'tmj'
      }
    ],
    clinicalNote: 'RED FLAGS: Exertional neck/jaw pain = cardiac angina. Sudden onset + neuro symptoms = vascular emergency.'
  },

  thoracic: {
    region: 'thoracic',
    label: 'Thoracic / Mid Back',
    questions: [
      {
        id: 'thoracic_neck_stiffness',
        question: 'Do you have any neck pain or stiffness?',
        positiveImplication: 'Cervical-thoracic junction involvement',
        sourceRegion: 'cervical'
      },
      {
        id: 'thoracic_breathing_pain',
        question: 'Does deep breathing or twisting worsen your pain?',
        positiveImplication: 'Rib/costovertebral joint involvement',
        sourceRegion: 'rib'
      }
    ],
    clinicalNote: 'Consider visceral referral if no mechanical pattern found.'
  },

  'lower-back': {
    region: 'lower-back',
    label: 'Lower Back',
    questions: [
      // ABDOMINAL AORTIC ANEURYSM - CRITICAL RED FLAG
      {
        id: 'lb_aaa_screen',
        question: 'Do you feel a pulsing or throbbing sensation in your abdomen with your back pain?',
        positiveImplication: 'POSSIBLE AAA - Requires urgent vascular evaluation',
        sourceRegion: 'vascular_aaa',
        isRedFlag: true
      },
      {
        id: 'lb_aaa_risk',
        question: 'Are you male over 60 with a history of smoking or high blood pressure?',
        positiveImplication: 'High risk for AAA - screen if back pain is non-mechanical',
        sourceRegion: 'vascular_aaa',
        isRedFlag: true
      },
      // KIDNEY
      {
        id: 'lb_kidney',
        question: 'Do you have pain that wraps around to your side/flank, or any burning with urination?',
        positiveImplication: 'Kidney involvement possible - check urinalysis',
        sourceRegion: 'kidney',
        isRedFlag: true
      },
      // GI / PANCREAS
      {
        id: 'lb_gi',
        question: 'Is your back pain related to eating, or does it feel like it goes through from front to back?',
        positiveImplication: 'GI/Pancreatic referral pattern - needs medical evaluation',
        sourceRegion: 'gi_visceral',
        isRedFlag: true
      },
      // HIP
      {
        id: 'lb_hip_stiffness',
        question: 'Do you have stiffness putting on socks or getting in/out of car?',
        positiveImplication: 'Hip joint may be contributing to back pain',
        sourceRegion: 'hip'
      },
      {
        id: 'lb_groin_pain',
        question: 'Do you have any groin pain or pain in front of hip?',
        positiveImplication: 'Hip pathology likely - check hip ROM',
        sourceRegion: 'hip'
      },
      // SI JOINT
      {
        id: 'lb_si_joint',
        question: 'Is pain located right at the back of your pelvis (dimples), worse with prolonged standing on one leg?',
        positiveImplication: 'SI joint dysfunction likely',
        sourceRegion: 'si_joint'
      }
    ],
    clinicalNote: 'RED FLAGS: Pulsating abdominal pain = AAA emergency. Flank pain + fever = kidney. Always rule out visceral before treating as mechanical LBP!'
  },

  // ==================== TRUNK ====================

  chest: {
    region: 'chest',
    label: 'Chest',
    questions: [
      // CARDIAC - CRITICAL RED FLAG (MUST BE FIRST)
      {
        id: 'chest_cardiac_exertion',
        question: 'Does chest pain come on with exertion (walking, stairs) and ease with rest?',
        positiveImplication: 'ANGINA PATTERN - Requires immediate cardiac evaluation',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      {
        id: 'chest_cardiac_radiation',
        question: 'Does pain radiate to your left arm, jaw, neck, or between shoulder blades?',
        positiveImplication: 'CARDIAC RADIATION PATTERN - Urgent evaluation needed',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      {
        id: 'chest_cardiac_symptoms',
        question: 'Do you have sweating, nausea, or shortness of breath with chest pain?',
        positiveImplication: 'Associated cardiac symptoms - EMERGENCY evaluation',
        sourceRegion: 'cardiac',
        isRedFlag: true
      },
      // PULMONARY
      {
        id: 'chest_pe_screen',
        question: 'Do you have sudden shortness of breath, recent leg swelling, or recent long travel/surgery?',
        positiveImplication: 'PE risk factors present - urgent evaluation',
        sourceRegion: 'pulmonary',
        isRedFlag: true
      },
      // GI / GERD
      {
        id: 'chest_gerd',
        question: 'Is pain worse after eating, lying down, or relieved by antacids?',
        positiveImplication: 'GERD/esophageal origin likely',
        sourceRegion: 'gi_gerd'
      },
      // THORACIC (only after red flags ruled out)
      {
        id: 'chest_back_pain',
        question: 'Do you have any upper back pain or stiffness?',
        positiveImplication: 'Thoracic spine likely contributing',
        sourceRegion: 'thoracic'
      },
      {
        id: 'chest_movement_breathing',
        question: 'Does movement, twisting, or deep breathing affect your chest pain?',
        positiveImplication: 'Mechanical/musculoskeletal origin likely',
        sourceRegion: 'thoracic'
      }
    ],
    clinicalNote: 'CRITICAL: ALWAYS rule out cardiac and pulmonary causes FIRST. Chest pain is cardiac until proven otherwise!'
  },

  abdomen: {
    region: 'abdomen',
    label: 'Abdomen',
    questions: [
      {
        id: 'abdomen_back_pain',
        question: 'Do you have any mid or lower back pain?',
        positiveImplication: 'Thoracic/lumbar spine may be referring to abdomen',
        sourceRegion: 'thoracolumbar'
      },
      {
        id: 'abdomen_movement_effect',
        question: 'Does back movement or position change affect your abdominal discomfort?',
        positiveImplication: 'Mechanical spinal component - not visceral',
        sourceRegion: 'thoracolumbar'
      }
    ],
    clinicalNote: 'RED FLAG: Rule out visceral pathology first. Spinal referred abdominal pain is diagnosis of exclusion.'
  },

  // ==================== LOWER LIMB ====================

  hip: {
    region: 'hip',
    label: 'Hip',
    questions: [
      // VASCULAR
      {
        id: 'hip_vascular_claudication',
        question: 'Does hip or thigh pain come on after walking and go away with rest?',
        positiveImplication: 'Vascular claudication pattern - check femoral pulses',
        sourceRegion: 'vascular',
        isRedFlag: true
      },
      // INGUINAL HERNIA
      {
        id: 'hip_hernia',
        question: 'Is groin pain worse with coughing, sneezing, or lifting heavy objects?',
        positiveImplication: 'Inguinal hernia pattern - surgical evaluation',
        sourceRegion: 'hernia',
        isRedFlag: true
      },
      // LUMBAR
      {
        id: 'hip_back_movement',
        question: 'Does bending your back forward or backward affect your hip symptoms?',
        positiveImplication: 'Lumbar spine contributing to hip symptoms',
        sourceRegion: 'lumbar'
      },
      {
        id: 'hip_back_pain',
        question: 'Do you have any back pain or morning stiffness in your back?',
        positiveImplication: 'Concurrent lumbar involvement',
        sourceRegion: 'lumbar'
      },
      // SI JOINT
      {
        id: 'hip_si_joint',
        question: 'Is pain at the back of your pelvis rather than the side or front of hip?',
        positiveImplication: 'SI joint dysfunction - not true hip pathology',
        sourceRegion: 'si_joint'
      }
    ],
    clinicalNote: 'Many patients say "hip" but mean SI joint, lateral thigh, or groin. Clarify location! Claudication pattern = vascular.'
  },

  thigh: {
    region: 'thigh',
    label: 'Thigh',
    questions: [
      {
        id: 'thigh_back_relation',
        question: 'Do you have any back pain, or does back movement affect thigh symptoms?',
        positiveImplication: 'Lumbar spine likely source (L2-L5 depending on location)',
        sourceRegion: 'lumbar'
      },
      {
        id: 'thigh_groin_stiffness',
        question: 'Do you have any groin pain or hip stiffness?',
        positiveImplication: 'Hip pathology referring to thigh',
        sourceRegion: 'hip'
      },
      {
        id: 'thigh_below_knee',
        question: 'Does pain extend below the knee?',
        positiveImplication: 'True radiculopathy more likely than referred pain',
        sourceRegion: 'lumbar'
      }
    ],
    clinicalNote: 'Anterior thigh + negative hip exam = check L2-L3. Commonly missed!'
  },

  knee: {
    region: 'knee',
    label: 'Knee',
    questions: [
      // VASCULAR - Popliteal
      {
        id: 'knee_vascular',
        question: 'Is pain behind the knee that comes on with walking and eases with rest?',
        positiveImplication: 'Popliteal artery involvement - check distal pulses',
        sourceRegion: 'vascular',
        isRedFlag: true
      },
      // DVT / Baker's cyst rupture
      {
        id: 'knee_dvt_bakers',
        question: 'Did you suddenly develop calf swelling or pain after having knee pain/swelling?',
        positiveImplication: 'Baker cyst rupture or DVT - urgent evaluation',
        sourceRegion: 'vascular',
        isRedFlag: true
      },
      // HIP - Most common referral!
      {
        id: 'knee_hip_groin',
        question: 'Do you have any hip or groin pain or stiffness?',
        positiveImplication: 'Hip pathology may be referring to knee',
        sourceRegion: 'hip'
      },
      {
        id: 'knee_hip_rom',
        question: 'Is it difficult to put on shoes/socks or get in/out of a car?',
        positiveImplication: 'Hip mobility loss - likely source of knee symptoms',
        sourceRegion: 'hip'
      },
      // LUMBAR
      {
        id: 'knee_back_pain',
        question: 'Do you have any back pain or stiffness?',
        positiveImplication: 'Lumbar spine (L3-L4) may be contributing',
        sourceRegion: 'lumbar'
      },
      // ANKLE - Ascending chain
      {
        id: 'knee_ankle',
        question: 'Do you have any ankle stiffness or history of ankle sprains?',
        positiveImplication: 'Ankle dysfunction causing compensatory knee stress',
        sourceRegion: 'ankle'
      }
    ],
    clinicalNote: 'CRITICAL: Hip OA commonly presents as knee pain ONLY - always examine hip! 21 patients in one study had knee surgery for hip-referred pain.'
  },

  'lower-leg': {
    region: 'lower-leg',
    label: 'Calf / Lower Leg',
    questions: [
      // DVT - CRITICAL
      {
        id: 'calf_swelling',
        question: 'Is your calf swollen, warm, or red compared to the other side?',
        positiveImplication: 'DVT MUST be ruled out - urgent evaluation',
        sourceRegion: 'vascular_dvt',
        isRedFlag: true
      },
      {
        id: 'calf_dvt_risk',
        question: 'Have you had recent surgery, long travel, or are you on birth control/HRT?',
        positiveImplication: 'DVT risk factors present - lower threshold for imaging',
        sourceRegion: 'vascular_dvt',
        isRedFlag: true
      },
      // PAD - Claudication
      {
        id: 'calf_claudication',
        question: 'Does calf pain come on after walking a specific distance and go away within minutes of rest?',
        positiveImplication: 'Classic intermittent claudication - PAD evaluation needed',
        sourceRegion: 'vascular_pad',
        isRedFlag: true
      },
      // LUMBAR
      {
        id: 'calf_back_relation',
        question: 'Do you have any back pain, or did symptoms start in back/buttock and travel down?',
        positiveImplication: 'Lumbar spine (S1) likely source - sciatica pattern',
        sourceRegion: 'lumbar'
      },
      // ANKLE
      {
        id: 'calf_ankle_history',
        question: 'Have you had any ankle sprains or does your ankle feel unstable?',
        positiveImplication: 'Ankle instability causing compensatory calf overload',
        sourceRegion: 'ankle'
      },
      // POPLITEAL ENTRAPMENT
      {
        id: 'calf_popliteal',
        question: 'Are you young/athletic with calf pain during exercise that feels like cramping?',
        positiveImplication: 'Popliteal artery entrapment syndrome - specialist referral',
        sourceRegion: 'vascular_popliteal'
      }
    ],
    clinicalNote: 'RED FLAGS: Unilateral swelling = DVT until proven otherwise. Walking pain + rest relief = PAD. Young athlete + exercise cramps = popliteal entrapment.'
  },

  ankle: {
    region: 'ankle',
    label: 'Ankle',
    questions: [
      // VASCULAR - PAD
      {
        id: 'ankle_pad_claudication',
        question: 'Does ankle or calf pain come on after walking a specific distance and go away with rest?',
        positiveImplication: 'Intermittent claudication pattern - PAD evaluation needed',
        sourceRegion: 'vascular_pad',
        isRedFlag: true
      },
      {
        id: 'ankle_pad_wounds',
        question: 'Do you have any foot wounds that are slow to heal, or cold feet compared to legs?',
        positiveImplication: 'Vascular insufficiency signs - urgent vascular assessment',
        sourceRegion: 'vascular_pad',
        isRedFlag: true
      },
      // LUMBAR
      {
        id: 'ankle_back_leg_pain',
        question: 'Do you have any back or leg pain above the ankle?',
        positiveImplication: 'Lumbar spine may be contributing',
        sourceRegion: 'lumbar'
      },
      {
        id: 'ankle_numbness',
        question: 'Do you have numbness or tingling around ankle or foot?',
        positiveImplication: 'Neurological component - check L4-S1',
        sourceRegion: 'lumbar'
      },
      // KNEE compensation
      {
        id: 'ankle_knee_issues',
        question: 'Do you have any knee pain or did ankle symptoms start after a knee problem?',
        positiveImplication: 'Descending kinetic chain - knee affecting ankle',
        sourceRegion: 'knee'
      }
    ],
    clinicalNote: 'PAD RED FLAG: Pain with walking + relief with rest = claudication. Check pulses! Lateral numbness = S1.'
  },

  foot: {
    region: 'foot',
    label: 'Foot',
    questions: [
      // VASCULAR - PAD / Critical limb ischemia
      {
        id: 'foot_vascular_rest_pain',
        question: 'Do you have foot pain at rest, especially at night, that improves when you hang your foot off the bed?',
        positiveImplication: 'Critical limb ischemia - URGENT vascular evaluation',
        sourceRegion: 'vascular_pad',
        isRedFlag: true
      },
      {
        id: 'foot_vascular_wounds',
        question: 'Do you have any foot wounds or ulcers that are not healing?',
        positiveImplication: 'Vascular insufficiency or diabetic foot - urgent care needed',
        sourceRegion: 'vascular_pad',
        isRedFlag: true
      },
      // DIABETIC NEUROPATHY
      {
        id: 'foot_diabetic',
        question: 'Do you have diabetes, and is numbness/tingling in BOTH feet symmetrically?',
        positiveImplication: 'Diabetic peripheral neuropathy pattern',
        sourceRegion: 'diabetic_neuropathy'
      },
      // LUMBAR
      {
        id: 'foot_back_leg_pain',
        question: 'Do you have any back or leg pain?',
        positiveImplication: 'Lumbar spine may be source (L5 or S1)',
        sourceRegion: 'lumbar'
      },
      {
        id: 'foot_dermatomal',
        question: 'Is numbness mainly on top of foot/big toe OR on the outer edge/sole?',
        positiveImplication: 'Dermatomal pattern: dorsum/big toe = L5, lateral/sole = S1',
        sourceRegion: 'lumbar'
      },
      // TARSAL TUNNEL
      {
        id: 'foot_sole_tingling',
        question: 'Is your pain/tingling mainly in the sole of your foot, worse at night?',
        positiveImplication: 'Tarsal tunnel syndrome possible',
        sourceRegion: 'tarsal_tunnel'
      }
    ],
    clinicalNote: 'PAD RED FLAG: Rest pain at night + non-healing wounds = critical ischemia. Bilateral symmetric = diabetic. Dermatomal = lumbar.'
  },

  // ==================== HEAD ====================

  head: {
    region: 'head',
    label: 'Head / Headache',
    questions: [
      {
        id: 'headache_neck_trigger',
        question: 'Does moving your neck or sustained neck positions trigger your headache?',
        positiveImplication: 'Cervicogenic headache likely',
        sourceRegion: 'cervical'
      },
      {
        id: 'headache_neck_stiffness',
        question: 'Do you have neck pain or stiffness along with headaches?',
        positiveImplication: 'Cervical component to headache',
        sourceRegion: 'cervical'
      },
      {
        id: 'headache_shoulder_tension',
        question: 'Do headaches worsen with stress or shoulder tension?',
        positiveImplication: 'Upper trapezius trigger points contributing',
        sourceRegion: 'upper_trap'
      }
    ],
    clinicalNote: 'Flexion-Rotation Test: >10 degree difference indicates C1-C2 restriction.'
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get referral screening questions for a body region
 * Uses centralized normalization for consistency
 */
export function getReferralQuestions(region: string): ReferralQuestion[] {
  const normalizedRegion = normalizeRegion(region);
  return REFERRAL_SCREENING[normalizedRegion]?.questions || [];
}

/**
 * Get clinical note for a region
 * Uses centralized normalization for consistency
 */
export function getClinicalNote(region: string): string | null {
  const normalizedRegion = normalizeRegion(region);
  return REFERRAL_SCREENING[normalizedRegion]?.clinicalNote || null;
}

/**
 * Get region label for display
 */
export function getRegionLabel(region: string): string | null {
  const normalizedRegion = normalizeRegion(region);
  return REFERRAL_SCREENING[normalizedRegion]?.label || null;
}

/**
 * Check if a region has referral screening questions
 */
export function hasReferralScreening(region: string): boolean {
  const normalizedRegion = normalizeRegion(region);
  return normalizedRegion in REFERRAL_SCREENING;
}

/**
 * Evaluate responses and return identified referral sources
 */
export function evaluateReferralResponses(
  region: string,
  responses: Record<string, string>
): { sourceRegion: string; implication: string; isRedFlag: boolean }[] {
  const questions = getReferralQuestions(region);
  const findings: { sourceRegion: string; implication: string; isRedFlag: boolean }[] = [];

  questions.forEach(q => {
    if (responses[q.id] === 'yes') {
      findings.push({
        sourceRegion: q.sourceRegion,
        implication: q.positiveImplication,
        isRedFlag: q.isRedFlag || false
      });
    }
  });

  return findings;
}

/**
 * Get all red flag question IDs
 */
export function getRedFlagQuestionIds(): string[] {
  const redFlagIds: string[] = [];

  Object.values(REFERRAL_SCREENING).forEach(regionData => {
    regionData.questions.forEach(q => {
      if (q.isRedFlag) {
        redFlagIds.push(q.id);
      }
    });
  });

  return redFlagIds;
}

/**
 * Get all supported regions
 */
export function getSupportedRegions(): string[] {
  return Object.keys(REFERRAL_SCREENING);
}

export default REFERRAL_SCREENING;

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, SkipForward } from 'lucide-react';

interface RegionQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

interface RegionQuestionsMap {
  label: string;
  description: string;
  questions: RegionQuestion[];
}

// Region-specific questions sourced from ClinicalDx questionnaire
// Not symptom dx — these are the physio-facing clinical assessment questions
const REGION_QUESTION_MAPS: Record<string, RegionQuestionsMap> = {
  lower_back: {
    label: 'Lumbar Spine',
    description: 'Lower back & lumbar region specific',
    questions: [
      {
        id: 'lbp_movement_direction',
        question: 'Which direction of movement increases pain most?',
        options: [
          { value: 'flexion', label: 'Flexion (bending forward)' },
          { value: 'extension', label: 'Extension (bending back)' },
          { value: 'rotation', label: 'Rotation / twisting' },
          { value: 'all', label: 'All movements' },
          { value: 'rest_pain', label: 'Worse at rest' },
        ],
      },
      {
        id: 'lbp_cough_sneeze',
        question: 'Does coughing or sneezing increase the pain?',
        options: [
          { value: 'yes', label: 'Yes — significantly' },
          { value: 'mild', label: 'Yes — mildly' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'lbp_sitting_tolerance',
        question: 'How long can the patient sit comfortably?',
        options: [
          { value: 'less_10', label: 'Less than 10 min' },
          { value: '10_30', label: '10–30 min' },
          { value: '30_60', label: '30–60 min' },
          { value: 'over_60', label: 'Over 60 min' },
          { value: 'no_issue', label: 'No issue' },
        ],
      },
      {
        id: 'lbp_neurological',
        question: 'Are there neurological signs (leg weakness, dermatomal loss)?',
        options: [
          { value: 'yes_both', label: 'Yes — weakness + sensory loss' },
          { value: 'yes_sensory', label: 'Sensory loss only' },
          { value: 'yes_weakness', label: 'Weakness only' },
          { value: 'no', label: 'No neurological signs' },
        ],
      },
    ],
  },

  neck: {
    label: 'Cervical Spine',
    description: 'Neck & cervical region specific',
    questions: [
      {
        id: 'neck_movement_restriction',
        question: 'Which cervical movement is most restricted?',
        options: [
          { value: 'rotation', label: 'Rotation' },
          { value: 'extension', label: 'Extension' },
          { value: 'lateral_flexion', label: 'Lateral flexion' },
          { value: 'all', label: 'All movements' },
          { value: 'none', label: 'No restriction' },
        ],
      },
      {
        id: 'neck_arm_symptoms',
        question: 'Any arm symptoms (pain, numbness, tingling)?',
        options: [
          { value: 'yes_unilateral', label: 'Yes — one arm' },
          { value: 'yes_bilateral', label: 'Yes — both arms' },
          { value: 'no', label: 'No arm symptoms' },
        ],
      },
      {
        id: 'neck_headache',
        question: 'Is there associated headache with neck pain?',
        options: [
          { value: 'yes_occipital', label: 'Yes — back of head' },
          { value: 'yes_frontal', label: 'Yes — frontal / behind eyes' },
          { value: 'no', label: 'No headache' },
        ],
      },
      {
        id: 'neck_posture',
        question: 'Is there a postural component to the pain?',
        options: [
          { value: 'desk_work', label: 'Worse with desk work / screens' },
          { value: 'sustained_posture', label: 'Worse with sustained postures' },
          { value: 'morning', label: 'Worse on waking' },
          { value: 'no', label: 'Not posture-related' },
        ],
      },
    ],
  },

  shoulder: {
    label: 'Shoulder',
    description: 'Shoulder complex specific',
    questions: [
      {
        id: 'shoulder_painful_arc',
        question: 'Is there a painful arc (pain 60°–120° of elevation)?',
        options: [
          { value: 'yes', label: 'Yes — classic painful arc' },
          { value: 'yes_full', label: 'Yes — painful throughout' },
          { value: 'no', label: 'No painful arc' },
          { value: 'not_tested', label: 'Not tested yet' },
        ],
      },
      {
        id: 'shoulder_night_pain',
        question: 'How severe is night pain?',
        options: [
          { value: 'wakes_up', label: 'Wakes up from sleep' },
          { value: 'difficulty_sleeping', label: 'Difficulty getting to sleep' },
          { value: 'mild', label: 'Mild — position dependent' },
          { value: 'none', label: 'No night pain' },
        ],
      },
      {
        id: 'shoulder_overhead',
        question: 'Can the patient reach overhead / behind their back?',
        options: [
          { value: 'overhead_limited', label: 'Overhead limited' },
          { value: 'behind_back_limited', label: 'Behind back limited' },
          { value: 'both_limited', label: 'Both limited' },
          { value: 'normal', label: 'Near normal' },
        ],
      },
    ],
  },

  knee: {
    label: 'Knee',
    description: 'Knee joint specific',
    questions: [
      {
        id: 'knee_instability',
        question: 'Does the knee lock or give way?',
        options: [
          { value: 'locking', label: 'Locking — gets stuck' },
          { value: 'giving_way', label: 'Giving way — buckles' },
          { value: 'both', label: 'Both locking and giving way' },
          { value: 'neither', label: 'Neither' },
        ],
      },
      {
        id: 'knee_stairs',
        question: 'Is there stair pain?',
        options: [
          { value: 'going_up', label: 'Going up only' },
          { value: 'going_down', label: 'Going down only' },
          { value: 'both', label: 'Both up and down' },
          { value: 'neither', label: 'No stair pain' },
        ],
      },
      {
        id: 'knee_swelling',
        question: 'Is there swelling around the knee?',
        options: [
          { value: 'immediate_post_activity', label: 'Immediate after activity' },
          { value: 'delayed_post_activity', label: 'Hours after activity' },
          { value: 'persistent', label: 'Persistent / constant' },
          { value: 'no_swelling', label: 'No swelling' },
        ],
      },
    ],
  },

  ankle: {
    label: 'Ankle / Foot',
    description: 'Ankle and foot specific',
    questions: [
      {
        id: 'ankle_weight_bearing',
        question: 'Can the patient bear weight on the ankle?',
        options: [
          { value: 'full', label: 'Full weight bearing' },
          { value: 'partial', label: 'Partial — antalgic' },
          { value: 'unable', label: 'Unable to bear weight' },
        ],
      },
      {
        id: 'ankle_mechanism',
        question: 'Was there a specific injury mechanism?',
        options: [
          { value: 'rolled_inward', label: 'Rolled inward (inversion)' },
          { value: 'rolled_outward', label: 'Rolled outward (eversion)' },
          { value: 'overuse', label: 'Gradual overuse' },
          { value: 'no_injury', label: 'No specific injury' },
        ],
      },
      {
        id: 'ankle_morning_pain',
        question: 'Is the first step in the morning most painful?',
        options: [
          { value: 'yes_significant', label: 'Yes — significantly (plantar)' },
          { value: 'yes_mild', label: 'Yes — mildly' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  hip: {
    label: 'Hip',
    description: 'Hip joint specific',
    questions: [
      {
        id: 'hip_groin_pain',
        question: 'Is there groin pain on hip loading?',
        options: [
          { value: 'yes_sharp', label: 'Yes — sharp groin pain' },
          { value: 'yes_ache', label: 'Yes — deep aching' },
          { value: 'lateral_pain', label: 'No — lateral / outer hip' },
          { value: 'no', label: 'No groin pain' },
        ],
      },
      {
        id: 'hip_walking_tolerance',
        question: 'Walking tolerance before pain begins?',
        options: [
          { value: 'less_5min', label: 'Less than 5 min' },
          { value: '5_15min', label: '5–15 min' },
          { value: '15_30min', label: '15–30 min' },
          { value: 'over_30min', label: 'Over 30 min' },
        ],
      },
      {
        id: 'hip_sit_to_stand',
        question: 'Is sit-to-stand painful or stiff?',
        options: [
          { value: 'yes_painful', label: 'Yes — painful to rise' },
          { value: 'yes_stiff', label: 'Yes — stiff initially' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  wrist_hand: {
    label: 'Wrist / Hand',
    description: 'Wrist and hand specific',
    questions: [
      {
        id: 'wrist_night_symptoms',
        question: 'Is there night pain or waking with numbness?',
        options: [
          { value: 'waking_numbness', label: 'Wakes with numb hands' },
          { value: 'night_pain', label: 'Night pain — woken by pain' },
          { value: 'both', label: 'Both pain and numbness' },
          { value: 'no', label: 'No night symptoms' },
        ],
      },
      {
        id: 'wrist_grip_pain',
        question: 'Is there pain with gripping or pinching?',
        options: [
          { value: 'yes_significant', label: 'Yes — significantly limits grip' },
          { value: 'yes_mild', label: 'Yes — mildly' },
          { value: 'no', label: 'No grip pain' },
        ],
      },
    ],
  },

  elbow: {
    label: 'Elbow',
    description: 'Elbow specific',
    questions: [
      {
        id: 'elbow_lateral_medial',
        question: 'Where is the tenderness most prominent?',
        options: [
          { value: 'lateral', label: 'Lateral epicondyle (outside)' },
          { value: 'medial', label: 'Medial epicondyle (inside)' },
          { value: 'diffuse', label: 'Diffuse / throughout' },
          { value: 'posterior', label: 'Posterior / olecranon' },
        ],
      },
      {
        id: 'elbow_grip_pain',
        question: 'Does gripping or squeezing increase the pain?',
        options: [
          { value: 'yes_significantly', label: 'Yes — significantly' },
          { value: 'yes_mildly', label: 'Yes — mildly' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  thoracic: {
    label: 'Thoracic Spine',
    description: 'Mid / upper back specific',
    questions: [
      {
        id: 'thoracic_breathing_pain',
        question: 'Does deep breathing increase the pain?',
        options: [
          { value: 'yes_sharp', label: 'Yes — sharp with deep breath' },
          { value: 'yes_mild', label: 'Yes — mild increase' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'thoracic_posture_related',
        question: 'Is pain significantly worse with prolonged sitting?',
        options: [
          { value: 'yes_worse', label: 'Yes — much worse sitting' },
          { value: 'yes_mild', label: 'Yes — slightly worse' },
          { value: 'no', label: 'Not posture related' },
        ],
      },
    ],
  },

  tmj: {
    label: 'TMJ / Jaw',
    description: 'Temporomandibular joint specific',
    questions: [
      {
        id: 'tmj_click',
        question: 'Does the jaw click, pop, or lock?',
        options: [
          { value: 'clicking', label: 'Clicking / popping' },
          { value: 'locking_open', label: 'Locks open' },
          { value: 'locking_closed', label: 'Locks closed' },
          { value: 'none', label: 'No click or lock' },
        ],
      },
      {
        id: 'tmj_opening_limit',
        question: 'Is there limited mouth opening?',
        options: [
          { value: 'significantly_limited', label: 'Significantly limited' },
          { value: 'mildly_limited', label: 'Mildly limited' },
          { value: 'normal', label: 'Normal opening' },
        ],
      },
    ],
  },
};

// Detect the body region from extracted fields
function detectRegion(extractedFields: Record<string, any>, gapAnswers: Record<string, any>): string | null {
  const merged = { ...extractedFields, ...gapAnswers };
  const loc = merged.pain_location;

  if (loc) {
    const locations = Array.isArray(loc) ? loc : [loc];
    const locStr = locations.map((l: any) => {
      if (typeof l === 'object' && l?.mainRegion) return l.mainRegion;
      return String(l);
    }).join(' ').toLowerCase();

    // Source vs site: if radiation + leg pain → likely lumbar source
    const hasRadiation = merged.pain_radiation === true;
    const hasNeuralSigns = merged.sensation_screening === true || merged.weakness_screening === true;
    const radiationPattern = merged.radiation_pattern;

    if (
      (locStr.includes('lower-leg') || locStr.includes('foot') || locStr.includes('lower_leg')) &&
      (hasRadiation || hasNeuralSigns || radiationPattern === 'down_leg')
    ) {
      return 'lower_back'; // Referred leg pain — source is lumbar
    }

    if (
      (locStr.includes('forearm') || locStr.includes('hand') || locStr.includes('upper-arm')) &&
      (hasRadiation || hasNeuralSigns || radiationPattern === 'down_arm')
    ) {
      return 'neck'; // Referred arm pain — source is cervical
    }

    if (locStr.includes('lower-back') || locStr.includes('lower_back') || locStr.includes('lumbar')) return 'lower_back';
    if (locStr.includes('neck') || locStr.includes('cervical')) return 'neck';
    if (locStr.includes('shoulder')) return 'shoulder';
    if (locStr.includes('knee')) return 'knee';
    if (locStr.includes('ankle') || (locStr.includes('foot') && !hasRadiation)) return 'ankle';
    if (locStr.includes('hip') || locStr.includes('thigh')) return 'hip';
    if (locStr.includes('wrist') || locStr.includes('hand') || locStr.includes('finger')) return 'wrist_hand';
    if (locStr.includes('elbow')) return 'elbow';
    if (locStr.includes('thoracic') || locStr.includes('upper-back') || locStr.includes('mid-back')) return 'thoracic';
    if (locStr.includes('jaw') || locStr.includes('tmj')) return 'tmj';
  }

  return null;
}

interface RegionQuestionsModeProps {
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  onComplete: (answers: Record<string, any>) => void;
  onSkip: () => void;
}

export default function RegionQuestionsMode({
  extractedFields,
  gapAnswers,
  onComplete,
  onSkip,
}: RegionQuestionsModeProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const region = useMemo(
    () => detectRegion(extractedFields, gapAnswers),
    [extractedFields, gapAnswers],
  );

  const regionMap = region ? REGION_QUESTION_MAPS[region] : null;

  const setAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleComplete = () => {
    onComplete(answers);
  };

  if (!regionMap) {
    // No region detected — skip automatically
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-6">
        <p className="text-[13px] text-gray-400 mb-6 text-center">
          No specific region detected — proceeding to review
        </p>
        <button
          onClick={onSkip}
          className="px-6 py-3 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors flex items-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = regionMap.questions.length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-1">
          Region Specific
        </p>
        <h3 className="text-[15px] text-gray-800 font-medium">{regionMap.label}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{regionMap.description}</p>

        {/* Progress */}
        <div className="mt-3 h-px bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-500 rounded-full"
            animate={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          {answeredCount} / {totalCount}
        </p>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        <AnimatePresence>
          {regionMap.questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="space-y-2"
            >
              <p className="text-[13px] text-gray-600 leading-relaxed">{q.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(q.id, opt.value)}
                    className={`py-2.5 px-3 rounded-lg text-[12px] text-left transition-all border ${
                      answers[q.id] === opt.value
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 py-3 rounded-xl border border-teal-600 bg-teal-600 hover:bg-teal-700 text-[13px] text-white transition-all flex items-center justify-center gap-2"
        >
          Continue to Review
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

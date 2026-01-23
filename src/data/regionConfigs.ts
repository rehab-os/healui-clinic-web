/**
 * Region-Specific Configuration Database
 *
 * Provides region-specific options for screening questions.
 * When a body region is selected, subsequent questions adapt to show
 * only clinically relevant options for that region.
 */

export interface QuestionOption {
  value: string;
  label: string;
}

export interface MyotomeConfig {
  level: string;
  muscle: string;
  action: string;
}

export interface ReflexConfig {
  reflex: string;
  nerve: string;
  level: string;
}

export interface RegionConfig {
  region: string;
  label: string;
  aggravatingFactors: QuestionOption[];
  relievingFactors: QuestionOption[];
  functionalLimitations: QuestionOption[];
  romMovements: QuestionOption[];
  mmtMuscleGroups: QuestionOption[];
  relevantDermatomes: string[];
  relevantMyotomes: MyotomeConfig[];
  gaitObservations: QuestionOption[];
  postureObservations: QuestionOption[];
  radiationPatterns: QuestionOption[];
  tightnessAssessment: QuestionOption[];
  relevantReflexes: ReflexConfig[];
  balanceAssessment: QuestionOption[];
}

// ==================== REGION CONFIGURATIONS ====================

export const REGION_CONFIGS: Record<string, RegionConfig> = {

  // ==================== UPPER LIMB ====================

  shoulder: {
    region: 'shoulder',
    label: 'Shoulder',
    aggravatingFactors: [
      { value: 'reaching_overhead', label: 'Reaching overhead' },
      { value: 'reaching_behind_back', label: 'Reaching behind back' },
      { value: 'lifting', label: 'Lifting objects' },
      { value: 'pushing', label: 'Pushing' },
      { value: 'pulling', label: 'Pulling' },
      { value: 'throwing', label: 'Throwing' },
      { value: 'lying_on_side', label: 'Lying on affected side' },
      { value: 'carrying', label: 'Carrying bags/objects' },
      { value: 'driving', label: 'Driving (steering)' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'arm_supported', label: 'Arm supported/sling' },
      { value: 'lying_opposite_side', label: 'Lying on opposite side' },
      { value: 'ice', label: 'Ice/cold' },
      { value: 'heat', label: 'Heat' },
      { value: 'medication', label: 'Pain medication' },
      { value: 'gentle_movement', label: 'Gentle movement' }
    ],
    functionalLimitations: [
      { value: 'dressing_overhead', label: 'Putting on shirt/dress' },
      { value: 'bra_strap', label: 'Reaching bra strap/back pocket' },
      { value: 'washing_hair', label: 'Washing/brushing hair' },
      { value: 'reaching_shelf', label: 'Reaching high shelf' },
      { value: 'sleeping', label: 'Sleeping on affected side' },
      { value: 'lifting_objects', label: 'Lifting objects' },
      { value: 'driving', label: 'Driving' },
      { value: 'work_tasks', label: 'Work tasks' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (arm forward/up)' },
      { value: 'extension', label: 'Extension (arm backward)' },
      { value: 'abduction', label: 'Abduction (arm out to side)' },
      { value: 'adduction', label: 'Adduction (arm across body)' },
      { value: 'internal_rotation', label: 'Internal rotation' },
      { value: 'external_rotation', label: 'External rotation' },
      { value: 'horizontal_adduction', label: 'Horizontal adduction' }
    ],
    mmtMuscleGroups: [
      { value: 'flexors', label: 'Flexors (Anterior deltoid)' },
      { value: 'extensors', label: 'Extensors (Posterior deltoid, Lats)' },
      { value: 'abductors', label: 'Abductors (Middle deltoid, Supraspinatus)' },
      { value: 'adductors', label: 'Adductors (Pectoralis, Lats)' },
      { value: 'internal_rotators', label: 'Internal rotators (Subscapularis)' },
      { value: 'external_rotators', label: 'External rotators (Infraspinatus, Teres minor)' }
    ],
    relevantDermatomes: ['C4', 'C5', 'C6'],
    relevantMyotomes: [
      { level: 'C4', muscle: 'Upper trapezius', action: 'Shoulder shrug' },
      { level: 'C5', muscle: 'Deltoid, Biceps', action: 'Shoulder abduction, Elbow flexion' },
      { level: 'C6', muscle: 'Wrist extensors', action: 'Wrist extension' }
    ],
    gaitObservations: [
      { value: 'arm_guarding', label: 'Arm held in guarded position' },
      { value: 'reduced_arm_swing', label: 'Reduced arm swing' },
      { value: 'compensatory_trunk', label: 'Compensatory trunk lean' }
    ],
    postureObservations: [
      { value: 'elevated_shoulder', label: 'Elevated shoulder' },
      { value: 'protracted_shoulder', label: 'Protracted (rounded) shoulder' },
      { value: 'scapular_winging', label: 'Scapular winging' },
      { value: 'head_tilt', label: 'Head tilt to affected side' }
    ],
    radiationPatterns: [
      { value: 'down_arm', label: 'Down the arm towards elbow/hand' },
      { value: 'into_neck', label: 'Up into the neck' },
      { value: 'across_upper_back', label: 'Across the upper back' },
      { value: 'into_chest', label: 'Into the chest' },
      { value: 'into_scapula', label: 'Into the shoulder blade area' }
    ],
    tightnessAssessment: [
      { value: 'pectoralis_major', label: 'Pectoralis major' },
      { value: 'pectoralis_minor', label: 'Pectoralis minor' },
      { value: 'upper_trapezius', label: 'Upper trapezius' },
      { value: 'levator_scapulae', label: 'Levator scapulae' },
      { value: 'posterior_capsule', label: 'Posterior capsule' },
      { value: 'latissimus_dorsi', label: 'Latissimus dorsi' }
    ],
    relevantReflexes: [
      { reflex: 'Biceps', nerve: 'Musculocutaneous', level: 'C5-C6' }
    ],
    balanceAssessment: []
  },

  elbow: {
    region: 'elbow',
    label: 'Elbow',
    aggravatingFactors: [
      { value: 'gripping', label: 'Gripping objects' },
      { value: 'lifting', label: 'Lifting with palm up/down' },
      { value: 'twisting', label: 'Twisting (doorknobs, jars)' },
      { value: 'typing', label: 'Typing/computer work' },
      { value: 'writing', label: 'Writing' },
      { value: 'shaking_hands', label: 'Shaking hands' },
      { value: 'carrying', label: 'Carrying with arm extended' },
      { value: 'throwing', label: 'Throwing' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice/cold' },
      { value: 'brace', label: 'Elbow brace/strap' },
      { value: 'avoiding_gripping', label: 'Avoiding gripping activities' },
      { value: 'medication', label: 'Pain medication' }
    ],
    functionalLimitations: [
      { value: 'opening_jars', label: 'Opening jars/bottles' },
      { value: 'turning_doorknobs', label: 'Turning doorknobs' },
      { value: 'carrying_bags', label: 'Carrying shopping bags' },
      { value: 'typing', label: 'Typing/computer use' },
      { value: 'lifting_cup', label: 'Lifting cup/mug' },
      { value: 'shaking_hands', label: 'Shaking hands' },
      { value: 'work_tasks', label: 'Work tasks' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (bending elbow)' },
      { value: 'extension', label: 'Extension (straightening elbow)' },
      { value: 'supination', label: 'Supination (palm up)' },
      { value: 'pronation', label: 'Pronation (palm down)' }
    ],
    mmtMuscleGroups: [
      { value: 'flexors', label: 'Flexors (Biceps, Brachialis)' },
      { value: 'extensors', label: 'Extensors (Triceps)' },
      { value: 'supinators', label: 'Supinators' },
      { value: 'pronators', label: 'Pronators' },
      { value: 'wrist_extensors', label: 'Wrist extensors' },
      { value: 'wrist_flexors', label: 'Wrist flexors' }
    ],
    relevantDermatomes: ['C5', 'C6', 'C7'],
    relevantMyotomes: [
      { level: 'C5', muscle: 'Biceps', action: 'Elbow flexion' },
      { level: 'C6', muscle: 'Wrist extensors', action: 'Wrist extension' },
      { level: 'C7', muscle: 'Triceps, Wrist flexors', action: 'Elbow extension, Wrist flexion' }
    ],
    gaitObservations: [
      { value: 'arm_guarding', label: 'Arm held flexed/guarded' },
      { value: 'reduced_arm_swing', label: 'Reduced arm swing' }
    ],
    postureObservations: [
      { value: 'elbow_flexion', label: 'Elbow held in flexion' },
      { value: 'forearm_position', label: 'Forearm held in pronation/supination' }
    ],
    radiationPatterns: [
      { value: 'down_forearm', label: 'Down the forearm towards wrist' },
      { value: 'up_arm', label: 'Up the arm towards shoulder' },
      { value: 'into_hand', label: 'Into the hand/fingers' }
    ],
    tightnessAssessment: [
      { value: 'biceps', label: 'Biceps' },
      { value: 'triceps', label: 'Triceps' },
      { value: 'wrist_flexors', label: 'Wrist flexors' },
      { value: 'wrist_extensors', label: 'Wrist extensors' }
    ],
    relevantReflexes: [
      { reflex: 'Biceps', nerve: 'Musculocutaneous', level: 'C5-C6' },
      { reflex: 'Triceps', nerve: 'Radial', level: 'C7-C8' },
      { reflex: 'Brachioradialis', nerve: 'Radial', level: 'C5-C6' }
    ],
    balanceAssessment: []
  },

  forearm: {
    region: 'forearm',
    label: 'Forearm',
    aggravatingFactors: [
      { value: 'gripping', label: 'Gripping' },
      { value: 'twisting', label: 'Twisting motions' },
      { value: 'typing', label: 'Typing' },
      { value: 'writing', label: 'Writing' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'repetitive_movements', label: 'Repetitive wrist movements' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice' },
      { value: 'stretching', label: 'Gentle stretching' },
      { value: 'brace', label: 'Forearm brace' }
    ],
    functionalLimitations: [
      { value: 'gripping', label: 'Gripping objects' },
      { value: 'turning', label: 'Turning objects' },
      { value: 'typing', label: 'Typing' },
      { value: 'lifting', label: 'Lifting' }
    ],
    romMovements: [
      { value: 'supination', label: 'Supination (palm up)' },
      { value: 'pronation', label: 'Pronation (palm down)' },
      { value: 'wrist_flexion', label: 'Wrist flexion' },
      { value: 'wrist_extension', label: 'Wrist extension' }
    ],
    mmtMuscleGroups: [
      { value: 'supinators', label: 'Supinators' },
      { value: 'pronators', label: 'Pronators' },
      { value: 'wrist_flexors', label: 'Wrist flexors' },
      { value: 'wrist_extensors', label: 'Wrist extensors' },
      { value: 'finger_flexors', label: 'Finger flexors' },
      { value: 'finger_extensors', label: 'Finger extensors' }
    ],
    relevantDermatomes: ['C6', 'C7', 'C8'],
    relevantMyotomes: [
      { level: 'C6', muscle: 'Wrist extensors', action: 'Wrist extension' },
      { level: 'C7', muscle: 'Wrist flexors, Finger extensors', action: 'Wrist flexion, Finger extension' },
      { level: 'C8', muscle: 'Finger flexors', action: 'Finger flexion' }
    ],
    gaitObservations: [
      { value: 'arm_guarding', label: 'Arm held guarded' }
    ],
    postureObservations: [
      { value: 'wrist_position', label: 'Wrist position abnormality' }
    ],
    radiationPatterns: [
      { value: 'into_wrist', label: 'Into the wrist' },
      { value: 'into_hand', label: 'Into the hand/fingers' },
      { value: 'up_arm', label: 'Up towards elbow' }
    ],
    tightnessAssessment: [
      { value: 'wrist_flexors', label: 'Wrist flexors' },
      { value: 'wrist_extensors', label: 'Wrist extensors' },
      { value: 'pronators', label: 'Pronators' },
      { value: 'supinators', label: 'Supinators' }
    ],
    relevantReflexes: [
      { reflex: 'Brachioradialis', nerve: 'Radial', level: 'C5-C6' }
    ],
    balanceAssessment: []
  },

  wrist: {
    region: 'wrist',
    label: 'Wrist',
    aggravatingFactors: [
      { value: 'gripping', label: 'Gripping' },
      { value: 'twisting', label: 'Twisting (opening jars)' },
      { value: 'weight_bearing', label: 'Weight bearing on hand' },
      { value: 'typing', label: 'Typing' },
      { value: 'writing', label: 'Writing' },
      { value: 'bending_wrist', label: 'Bending wrist' },
      { value: 'pushing', label: 'Pushing up from chair' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'splint', label: 'Wrist splint' },
      { value: 'ice', label: 'Ice' },
      { value: 'neutral_position', label: 'Keeping wrist in neutral' }
    ],
    functionalLimitations: [
      { value: 'opening_jars', label: 'Opening jars/bottles' },
      { value: 'typing', label: 'Typing' },
      { value: 'writing', label: 'Writing' },
      { value: 'cooking', label: 'Cooking (cutting, stirring)' },
      { value: 'push_up', label: 'Push up from chair/bed' },
      { value: 'carrying', label: 'Carrying heavy items' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (bending palm down)' },
      { value: 'extension', label: 'Extension (bending palm up)' },
      { value: 'radial_deviation', label: 'Radial deviation (thumb side)' },
      { value: 'ulnar_deviation', label: 'Ulnar deviation (pinky side)' }
    ],
    mmtMuscleGroups: [
      { value: 'wrist_flexors', label: 'Wrist flexors' },
      { value: 'wrist_extensors', label: 'Wrist extensors' },
      { value: 'radial_deviators', label: 'Radial deviators' },
      { value: 'ulnar_deviators', label: 'Ulnar deviators' },
      { value: 'grip_strength', label: 'Grip strength' }
    ],
    relevantDermatomes: ['C6', 'C7', 'C8'],
    relevantMyotomes: [
      { level: 'C6', muscle: 'Wrist extensors', action: 'Wrist extension' },
      { level: 'C7', muscle: 'Wrist flexors', action: 'Wrist flexion' },
      { level: 'C8', muscle: 'Finger flexors', action: 'Grip' }
    ],
    gaitObservations: [
      { value: 'arm_guarding', label: 'Arm/wrist held guarded' }
    ],
    postureObservations: [
      { value: 'wrist_position', label: 'Wrist held in flexion/extension' }
    ],
    radiationPatterns: [
      { value: 'into_fingers', label: 'Into the fingers' },
      { value: 'into_thumb', label: 'Into the thumb' },
      { value: 'up_forearm', label: 'Up the forearm' },
      { value: 'into_palm', label: 'Into the palm' }
    ],
    tightnessAssessment: [
      { value: 'wrist_flexors', label: 'Wrist flexors' },
      { value: 'wrist_extensors', label: 'Wrist extensors' },
      { value: 'finger_flexors', label: 'Finger flexors' }
    ],
    relevantReflexes: [],
    balanceAssessment: []
  },

  hand: {
    region: 'hand',
    label: 'Hand',
    aggravatingFactors: [
      { value: 'gripping', label: 'Gripping' },
      { value: 'pinching', label: 'Pinching (fine motor)' },
      { value: 'writing', label: 'Writing' },
      { value: 'typing', label: 'Typing' },
      { value: 'opening_jars', label: 'Opening jars' },
      { value: 'buttons', label: 'Buttoning clothes' },
      { value: 'cold_exposure', label: 'Cold exposure' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'warmth', label: 'Warmth' },
      { value: 'splinting', label: 'Splinting' },
      { value: 'avoiding_activities', label: 'Avoiding aggravating activities' }
    ],
    functionalLimitations: [
      { value: 'gripping', label: 'Gripping objects' },
      { value: 'buttons', label: 'Buttoning/zipping' },
      { value: 'writing', label: 'Writing' },
      { value: 'opening_jars', label: 'Opening jars' },
      { value: 'keys', label: 'Turning keys' },
      { value: 'cooking', label: 'Cooking tasks' },
      { value: 'phone_use', label: 'Using phone' }
    ],
    romMovements: [
      { value: 'finger_flexion', label: 'Finger flexion (making fist)' },
      { value: 'finger_extension', label: 'Finger extension (straightening)' },
      { value: 'finger_abduction', label: 'Finger abduction (spreading)' },
      { value: 'thumb_opposition', label: 'Thumb opposition' },
      { value: 'thumb_abduction', label: 'Thumb abduction' }
    ],
    mmtMuscleGroups: [
      { value: 'finger_flexors', label: 'Finger flexors (grip)' },
      { value: 'finger_extensors', label: 'Finger extensors' },
      { value: 'intrinsics', label: 'Intrinsic muscles' },
      { value: 'thenar', label: 'Thenar muscles (thumb)' },
      { value: 'hypothenar', label: 'Hypothenar muscles' },
      { value: 'pinch_strength', label: 'Pinch strength' }
    ],
    relevantDermatomes: ['C6', 'C7', 'C8', 'T1'],
    relevantMyotomes: [
      { level: 'C7', muscle: 'Finger extensors', action: 'Finger extension' },
      { level: 'C8', muscle: 'Finger flexors', action: 'Finger flexion' },
      { level: 'T1', muscle: 'Intrinsics', action: 'Finger abduction' }
    ],
    gaitObservations: [
      { value: 'hand_guarding', label: 'Hand held guarded/protected' }
    ],
    postureObservations: [
      { value: 'ulnar_drift', label: 'Ulnar drift' },
      { value: 'swan_neck', label: 'Swan neck deformity' },
      { value: 'boutonniere', label: 'Boutonniere deformity' },
      { value: 'mallet_finger', label: 'Mallet finger' },
      { value: 'thumb_z_deformity', label: 'Thumb Z-deformity' },
      { value: 'finger_contracture', label: 'Finger flexion contracture' },
      { value: 'intrinsic_minus', label: 'Intrinsic minus hand position' }
    ],
    radiationPatterns: [
      { value: 'into_specific_fingers', label: 'Into specific fingers' },
      { value: 'into_wrist', label: 'Into the wrist' },
      { value: 'across_palm', label: 'Across the palm' }
    ],
    tightnessAssessment: [
      { value: 'finger_flexors', label: 'Finger flexors' },
      { value: 'thenar_muscles', label: 'Thenar muscles' },
      { value: 'hypothenar_muscles', label: 'Hypothenar muscles' },
      { value: 'interossei', label: 'Interossei' }
    ],
    relevantReflexes: [],
    balanceAssessment: []
  },

  arm: {
    region: 'arm',
    label: 'Upper Arm',
    aggravatingFactors: [
      { value: 'lifting', label: 'Lifting objects' },
      { value: 'reaching', label: 'Reaching overhead' },
      { value: 'pushing', label: 'Pushing' },
      { value: 'pulling', label: 'Pulling' },
      { value: 'throwing', label: 'Throwing' },
      { value: 'carrying', label: 'Carrying heavy objects' },
      { value: 'repetitive_arm', label: 'Repetitive arm movements' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice' },
      { value: 'heat', label: 'Heat' },
      { value: 'supporting_arm', label: 'Supporting/resting arm' },
      { value: 'gentle_movement', label: 'Gentle movement' }
    ],
    functionalLimitations: [
      { value: 'lifting', label: 'Lifting objects' },
      { value: 'reaching', label: 'Reaching' },
      { value: 'dressing', label: 'Dressing' },
      { value: 'carrying', label: 'Carrying bags' },
      { value: 'work_tasks', label: 'Work tasks' }
    ],
    romMovements: [
      { value: 'shoulder_flexion', label: 'Shoulder flexion' },
      { value: 'shoulder_extension', label: 'Shoulder extension' },
      { value: 'shoulder_abduction', label: 'Shoulder abduction' },
      { value: 'elbow_flexion', label: 'Elbow flexion' },
      { value: 'elbow_extension', label: 'Elbow extension' }
    ],
    mmtMuscleGroups: [
      { value: 'biceps', label: 'Biceps' },
      { value: 'triceps', label: 'Triceps' },
      { value: 'deltoid', label: 'Deltoid' },
      { value: 'brachialis', label: 'Brachialis' }
    ],
    relevantDermatomes: ['C5', 'C6', 'T1'],
    relevantMyotomes: [
      { level: 'C5', muscle: 'Biceps', action: 'Elbow flexion' },
      { level: 'C6', muscle: 'Biceps, Brachioradialis', action: 'Elbow flexion' },
      { level: 'C7', muscle: 'Triceps', action: 'Elbow extension' }
    ],
    gaitObservations: [
      { value: 'arm_guarding', label: 'Arm held in guarded position' },
      { value: 'reduced_arm_swing', label: 'Reduced arm swing' }
    ],
    postureObservations: [
      { value: 'arm_position', label: 'Arm held close to body' },
      { value: 'shoulder_protraction', label: 'Shoulder protraction' },
      { value: 'elbow_flexion', label: 'Elbow held flexed' }
    ],
    radiationPatterns: [
      { value: 'into_shoulder', label: 'Into the shoulder' },
      { value: 'down_forearm', label: 'Down into the forearm' },
      { value: 'into_elbow', label: 'Into the elbow' },
      { value: 'from_neck', label: 'From the neck (referred)' }
    ],
    tightnessAssessment: [
      { value: 'biceps', label: 'Biceps' },
      { value: 'triceps', label: 'Triceps' },
      { value: 'deltoid', label: 'Deltoid' }
    ],
    relevantReflexes: [
      { reflex: 'Biceps', nerve: 'Musculocutaneous', level: 'C5-C6' },
      { reflex: 'Triceps', nerve: 'Radial', level: 'C7-C8' }
    ],
    balanceAssessment: []
  },

  // ==================== SPINE ====================

  neck: {
    region: 'neck',
    label: 'Neck',
    aggravatingFactors: [
      { value: 'looking_up', label: 'Looking up' },
      { value: 'looking_down', label: 'Looking down (reading/phone)' },
      { value: 'turning_head', label: 'Turning head' },
      { value: 'prolonged_sitting', label: 'Prolonged sitting/desk work' },
      { value: 'driving', label: 'Driving' },
      { value: 'sleeping_position', label: 'Sleeping position' },
      { value: 'carrying', label: 'Carrying bags on shoulder' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'heat', label: 'Heat' },
      { value: 'lying_down', label: 'Lying down' },
      { value: 'supporting_head', label: 'Supporting head' },
      { value: 'movement', label: 'Gentle movement' },
      { value: 'medication', label: 'Pain medication' }
    ],
    functionalLimitations: [
      { value: 'driving', label: 'Driving (checking mirrors)' },
      { value: 'reading', label: 'Reading/computer work' },
      { value: 'sleeping', label: 'Sleeping' },
      { value: 'work', label: 'Work tasks' },
      { value: 'reversing_car', label: 'Reversing car' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (chin to chest)' },
      { value: 'extension', label: 'Extension (looking up)' },
      { value: 'rotation_left', label: 'Rotation left' },
      { value: 'rotation_right', label: 'Rotation right' },
      { value: 'lateral_flexion_left', label: 'Lateral flexion left' },
      { value: 'lateral_flexion_right', label: 'Lateral flexion right' }
    ],
    mmtMuscleGroups: [
      { value: 'flexors', label: 'Neck flexors (SCM, deep flexors)' },
      { value: 'extensors', label: 'Neck extensors' },
      { value: 'rotators', label: 'Rotators' },
      { value: 'lateral_flexors', label: 'Lateral flexors' },
      { value: 'upper_trap', label: 'Upper trapezius' },
      { value: 'deep_neck_flexors', label: 'Deep neck flexors' }
    ],
    relevantDermatomes: ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'],
    relevantMyotomes: [
      { level: 'C4', muscle: 'Upper trapezius', action: 'Shoulder shrug' },
      { level: 'C5', muscle: 'Deltoid, Biceps', action: 'Shoulder abduction, Elbow flexion' },
      { level: 'C6', muscle: 'Wrist extensors', action: 'Wrist extension' },
      { level: 'C7', muscle: 'Triceps, Wrist flexors', action: 'Elbow extension, Wrist flexion' },
      { level: 'C8', muscle: 'Finger flexors', action: 'Finger flexion' }
    ],
    gaitObservations: [
      { value: 'head_position', label: 'Head held in abnormal position' },
      { value: 'reduced_head_movement', label: 'Reduced head movement' },
      { value: 'trunk_rotation', label: 'Whole trunk rotation instead of head' }
    ],
    postureObservations: [
      { value: 'forward_head', label: 'Forward head posture' },
      { value: 'cervical_lordosis', label: 'Loss of cervical lordosis' },
      { value: 'head_tilt', label: 'Head tilt' },
      { value: 'elevated_shoulders', label: 'Elevated shoulders' }
    ],
    radiationPatterns: [
      { value: 'into_head', label: 'Up into the head (headache)' },
      { value: 'into_shoulder', label: 'Into the shoulder' },
      { value: 'down_arm', label: 'Down the arm towards hand' },
      { value: 'between_shoulders', label: 'Between the shoulder blades' },
      { value: 'into_jaw', label: 'Into the jaw/face' }
    ],
    tightnessAssessment: [
      { value: 'upper_trapezius', label: 'Upper trapezius' },
      { value: 'levator_scapulae', label: 'Levator scapulae' },
      { value: 'scalenes', label: 'Scalenes' },
      { value: 'sternocleidomastoid', label: 'Sternocleidomastoid' },
      { value: 'suboccipitals', label: 'Suboccipitals' },
      { value: 'pectoralis_minor', label: 'Pectoralis minor' }
    ],
    relevantReflexes: [
      { reflex: 'Biceps', nerve: 'Musculocutaneous', level: 'C5-C6' },
      { reflex: 'Triceps', nerve: 'Radial', level: 'C7-C8' },
      { reflex: 'Brachioradialis', nerve: 'Radial', level: 'C5-C6' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'dizziness_head_movement', label: 'Dizziness with head movement' },
      { value: 'cervicogenic_dizziness', label: 'Cervicogenic dizziness suspected' },
      { value: 'romberg_positive', label: 'Romberg test positive' }
    ]
  },

  thoracic: {
    region: 'thoracic',
    label: 'Thoracic / Mid Back',
    aggravatingFactors: [
      { value: 'prolonged_sitting', label: 'Prolonged sitting' },
      { value: 'slouching', label: 'Slouching' },
      { value: 'deep_breathing', label: 'Deep breathing' },
      { value: 'twisting', label: 'Twisting' },
      { value: 'bending', label: 'Bending forward' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'coughing', label: 'Coughing/sneezing' }
    ],
    relievingFactors: [
      { value: 'movement', label: 'Movement/changing position' },
      { value: 'stretching', label: 'Stretching' },
      { value: 'heat', label: 'Heat' },
      { value: 'good_posture', label: 'Maintaining good posture' },
      { value: 'lying_down', label: 'Lying down' }
    ],
    functionalLimitations: [
      { value: 'sitting', label: 'Prolonged sitting' },
      { value: 'deep_breathing', label: 'Deep breathing' },
      { value: 'twisting', label: 'Twisting activities' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'reaching', label: 'Reaching' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (bending forward)' },
      { value: 'extension', label: 'Extension (bending backward)' },
      { value: 'rotation_left', label: 'Rotation left' },
      { value: 'rotation_right', label: 'Rotation right' },
      { value: 'lateral_flexion_left', label: 'Lateral flexion left' },
      { value: 'lateral_flexion_right', label: 'Lateral flexion right' }
    ],
    mmtMuscleGroups: [
      { value: 'extensors', label: 'Thoracic extensors' },
      { value: 'rotators', label: 'Rotators' },
      { value: 'scapular_retractors', label: 'Scapular retractors (Rhomboids)' },
      { value: 'serratus', label: 'Serratus anterior' }
    ],
    relevantDermatomes: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    relevantMyotomes: [
      { level: 'T1-T12', muscle: 'Intercostals', action: 'Breathing' },
      { level: 'T6-T12', muscle: 'Abdominals', action: 'Trunk flexion' }
    ],
    gaitObservations: [
      { value: 'reduced_trunk_rotation', label: 'Reduced trunk rotation' },
      { value: 'stiff_posture', label: 'Stiff/guarded posture' }
    ],
    postureObservations: [
      { value: 'kyphosis', label: 'Increased kyphosis' },
      { value: 'flat_thoracic', label: 'Flat thoracic spine' },
      { value: 'scoliosis', label: 'Scoliosis' },
      { value: 'scapular_position', label: 'Scapular protraction/retraction' }
    ],
    radiationPatterns: [
      { value: 'around_ribs', label: 'Around the ribcage' },
      { value: 'into_chest', label: 'Into the chest' },
      { value: 'into_abdomen', label: 'Into the abdomen' },
      { value: 'up_to_neck', label: 'Up towards the neck' },
      { value: 'down_to_low_back', label: 'Down towards lower back' }
    ],
    tightnessAssessment: [
      { value: 'thoracic_extensors', label: 'Thoracic extensors' },
      { value: 'intercostals', label: 'Intercostals' },
      { value: 'latissimus_dorsi', label: 'Latissimus dorsi' },
      { value: 'rhomboids', label: 'Rhomboids' }
    ],
    relevantReflexes: [],
    balanceAssessment: []
  },

  'lower-back': {
    region: 'lower-back',
    label: 'Lower Back',
    aggravatingFactors: [
      { value: 'bending_forward', label: 'Bending forward' },
      { value: 'bending_backward', label: 'Bending backward' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'prolonged_sitting', label: 'Prolonged sitting' },
      { value: 'prolonged_standing', label: 'Prolonged standing' },
      { value: 'twisting', label: 'Twisting' },
      { value: 'coughing_sneezing', label: 'Coughing/sneezing' },
      { value: 'walking', label: 'Walking' },
      { value: 'getting_up', label: 'Getting up from sitting' }
    ],
    relievingFactors: [
      { value: 'lying_down', label: 'Lying down' },
      { value: 'walking', label: 'Walking' },
      { value: 'changing_position', label: 'Changing position frequently' },
      { value: 'flexion', label: 'Flexed position (knees to chest)' },
      { value: 'extension', label: 'Extension (lying on stomach)' },
      { value: 'heat', label: 'Heat' },
      { value: 'medication', label: 'Pain medication' }
    ],
    functionalLimitations: [
      { value: 'sitting_tolerance', label: 'Sitting tolerance' },
      { value: 'standing_tolerance', label: 'Standing tolerance' },
      { value: 'walking_distance', label: 'Walking distance' },
      { value: 'lifting', label: 'Lifting objects' },
      { value: 'bending', label: 'Bending (e.g., putting on shoes)' },
      { value: 'sleeping', label: 'Sleeping' },
      { value: 'getting_in_out_car', label: 'Getting in/out of car' },
      { value: 'work', label: 'Work activities' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (bending forward)' },
      { value: 'extension', label: 'Extension (bending backward)' },
      { value: 'lateral_flexion_left', label: 'Lateral flexion left' },
      { value: 'lateral_flexion_right', label: 'Lateral flexion right' },
      { value: 'rotation_left', label: 'Rotation left' },
      { value: 'rotation_right', label: 'Rotation right' }
    ],
    mmtMuscleGroups: [
      { value: 'hip_flexors', label: 'Hip flexors (L1-L2)' },
      { value: 'knee_extensors', label: 'Knee extensors/Quads (L3-L4)' },
      { value: 'ankle_dorsiflexors', label: 'Ankle dorsiflexors (L4-L5)' },
      { value: 'big_toe_extensors', label: 'Big toe extensors (L5)' },
      { value: 'ankle_plantarflexors', label: 'Ankle plantarflexors (S1)' },
      { value: 'hip_abductors', label: 'Hip abductors (L5)' }
    ],
    relevantDermatomes: ['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2'],
    relevantMyotomes: [
      { level: 'L2', muscle: 'Hip flexors', action: 'Hip flexion' },
      { level: 'L3', muscle: 'Quadriceps', action: 'Knee extension' },
      { level: 'L4', muscle: 'Tibialis anterior', action: 'Ankle dorsiflexion' },
      { level: 'L5', muscle: 'Extensor hallucis longus', action: 'Big toe extension' },
      { level: 'S1', muscle: 'Gastrocnemius', action: 'Ankle plantarflexion' },
      { level: 'S2', muscle: 'Hamstrings', action: 'Knee flexion' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait (shortened stance)' },
      { value: 'lateral_shift', label: 'Lateral shift' },
      { value: 'reduced_stride', label: 'Reduced stride length' },
      { value: 'guarded', label: 'Guarded/stiff movement' },
      { value: 'foot_drop', label: 'Foot drop' },
      { value: 'trendelenburg', label: 'Trendelenburg (hip drop)' }
    ],
    postureObservations: [
      { value: 'lordosis_increased', label: 'Increased lordosis' },
      { value: 'lordosis_decreased', label: 'Decreased/flat lordosis' },
      { value: 'lateral_shift', label: 'Lateral shift' },
      { value: 'scoliosis', label: 'Scoliosis' },
      { value: 'pelvic_tilt', label: 'Anterior/posterior pelvic tilt' }
    ],
    radiationPatterns: [
      { value: 'down_leg', label: 'Down the leg (sciatica pattern)' },
      { value: 'into_buttock', label: 'Into the buttock' },
      { value: 'into_groin', label: 'Into the groin' },
      { value: 'around_hip', label: 'Around the hip' },
      { value: 'down_both_legs', label: 'Down both legs' },
      { value: 'into_foot', label: 'Into the foot/toes' }
    ],
    tightnessAssessment: [
      { value: 'hip_flexors', label: 'Hip flexors (Iliopsoas)' },
      { value: 'hamstrings', label: 'Hamstrings' },
      { value: 'piriformis', label: 'Piriformis' },
      { value: 'quadratus_lumborum', label: 'Quadratus lumborum' },
      { value: 'thoracolumbar_fascia', label: 'Thoracolumbar fascia' },
      { value: 'rectus_femoris', label: 'Rectus femoris' }
    ],
    relevantReflexes: [
      { reflex: 'Patellar', nerve: 'Femoral', level: 'L3-L4' },
      { reflex: 'Achilles', nerve: 'Tibial', level: 'S1-S2' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand' },
      { value: 'tandem_stance', label: 'Unable to tandem stance' },
      { value: 'romberg_positive', label: 'Romberg test positive' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  // ==================== TRUNK ====================

  chest: {
    region: 'chest',
    label: 'Chest',
    aggravatingFactors: [
      { value: 'deep_breathing', label: 'Deep breathing' },
      { value: 'coughing', label: 'Coughing' },
      { value: 'twisting', label: 'Twisting' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'pushing', label: 'Pushing' },
      { value: 'lying_on_side', label: 'Lying on affected side' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'shallow_breathing', label: 'Shallow breathing' },
      { value: 'supporting_chest', label: 'Supporting chest when coughing' },
      { value: 'heat', label: 'Heat' }
    ],
    functionalLimitations: [
      { value: 'deep_breathing', label: 'Deep breathing' },
      { value: 'coughing', label: 'Coughing/sneezing' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'reaching', label: 'Reaching' },
      { value: 'sleeping', label: 'Sleeping' }
    ],
    romMovements: [
      { value: 'thoracic_rotation', label: 'Thoracic rotation' },
      { value: 'deep_inspiration', label: 'Deep inspiration' },
      { value: 'shoulder_movements', label: 'Shoulder movements' }
    ],
    mmtMuscleGroups: [
      { value: 'pectoralis', label: 'Pectoralis major/minor' },
      { value: 'serratus', label: 'Serratus anterior' },
      { value: 'intercostals', label: 'Intercostals' }
    ],
    relevantDermatomes: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    relevantMyotomes: [],
    gaitObservations: [
      { value: 'guarded_breathing', label: 'Guarded breathing pattern' },
      { value: 'reduced_arm_swing', label: 'Reduced arm swing' }
    ],
    postureObservations: [
      { value: 'protective_posture', label: 'Protective/guarded posture' },
      { value: 'shallow_breathing', label: 'Shallow breathing pattern' }
    ],
    radiationPatterns: [
      { value: 'around_ribs', label: 'Around the ribcage' },
      { value: 'into_back', label: 'Into the back' },
      { value: 'into_shoulder', label: 'Into the shoulder (referred)' },
      { value: 'into_arm', label: 'Into the arm (cardiac pattern)' },
      { value: 'into_neck', label: 'Into the neck/jaw' }
    ],
    tightnessAssessment: [
      { value: 'pectoralis_major', label: 'Pectoralis major' },
      { value: 'pectoralis_minor', label: 'Pectoralis minor' },
      { value: 'intercostals', label: 'Intercostals' }
    ],
    relevantReflexes: [],
    balanceAssessment: []
  },

  abdomen: {
    region: 'abdomen',
    label: 'Abdomen',
    aggravatingFactors: [
      { value: 'bending', label: 'Bending forward' },
      { value: 'twisting', label: 'Twisting' },
      { value: 'coughing', label: 'Coughing/sneezing' },
      { value: 'straining', label: 'Straining' },
      { value: 'getting_up', label: 'Getting up from lying' },
      { value: 'lifting', label: 'Lifting' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'lying_down', label: 'Lying down' },
      { value: 'supporting_abdomen', label: 'Supporting abdomen' },
      { value: 'heat', label: 'Heat' }
    ],
    functionalLimitations: [
      { value: 'getting_up', label: 'Getting up from bed' },
      { value: 'bending', label: 'Bending' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'coughing', label: 'Coughing/sneezing' }
    ],
    romMovements: [
      { value: 'trunk_flexion', label: 'Trunk flexion' },
      { value: 'trunk_rotation', label: 'Trunk rotation' }
    ],
    mmtMuscleGroups: [
      { value: 'rectus_abdominis', label: 'Rectus abdominis' },
      { value: 'obliques', label: 'Obliques (internal/external)' },
      { value: 'transversus', label: 'Transversus abdominis' }
    ],
    relevantDermatomes: ['T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    relevantMyotomes: [
      { level: 'T7-T12', muscle: 'Abdominals', action: 'Trunk flexion' }
    ],
    gaitObservations: [
      { value: 'guarded_posture', label: 'Guarded posture' },
      { value: 'reduced_trunk_movement', label: 'Reduced trunk movement' }
    ],
    postureObservations: [
      { value: 'flexed_posture', label: 'Flexed/protective posture' }
    ],
    radiationPatterns: [
      { value: 'into_back', label: 'Into the back' },
      { value: 'into_groin', label: 'Into the groin' },
      { value: 'around_flank', label: 'Around the flank/side' },
      { value: 'into_pelvis', label: 'Into the pelvis' }
    ],
    tightnessAssessment: [
      { value: 'rectus_abdominis', label: 'Rectus abdominis' },
      { value: 'obliques', label: 'Obliques' },
      { value: 'hip_flexors', label: 'Hip flexors' }
    ],
    relevantReflexes: [],
    balanceAssessment: []
  },

  // ==================== LOWER LIMB ====================

  hip: {
    region: 'hip',
    label: 'Hip',
    aggravatingFactors: [
      { value: 'walking', label: 'Walking' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'sitting_to_standing', label: 'Sitting to standing' },
      { value: 'prolonged_sitting', label: 'Prolonged sitting' },
      { value: 'crossing_legs', label: 'Crossing legs' },
      { value: 'putting_on_shoes', label: 'Putting on shoes/socks' },
      { value: 'lying_on_side', label: 'Lying on affected side' },
      { value: 'getting_in_out_car', label: 'Getting in/out of car' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'non_weight_bearing', label: 'Non-weight bearing' },
      { value: 'heat', label: 'Heat' },
      { value: 'movement', label: 'Gentle movement' },
      { value: 'medication', label: 'Pain medication' }
    ],
    functionalLimitations: [
      { value: 'walking_distance', label: 'Walking distance' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'putting_on_shoes', label: 'Putting on shoes/socks' },
      { value: 'getting_in_out_car', label: 'Getting in/out of car' },
      { value: 'sitting_to_standing', label: 'Sit to stand' },
      { value: 'sleeping', label: 'Sleeping on affected side' },
      { value: 'sexual_activity', label: 'Sexual activity' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (knee to chest)' },
      { value: 'extension', label: 'Extension (leg backward)' },
      { value: 'abduction', label: 'Abduction (leg out to side)' },
      { value: 'adduction', label: 'Adduction (leg across body)' },
      { value: 'internal_rotation', label: 'Internal rotation' },
      { value: 'external_rotation', label: 'External rotation' }
    ],
    mmtMuscleGroups: [
      { value: 'flexors', label: 'Flexors (Iliopsoas, Rectus femoris)' },
      { value: 'extensors', label: 'Extensors (Gluteus maximus, Hamstrings)' },
      { value: 'abductors', label: 'Abductors (Gluteus medius/minimus)' },
      { value: 'adductors', label: 'Adductors' },
      { value: 'internal_rotators', label: 'Internal rotators' },
      { value: 'external_rotators', label: 'External rotators (Piriformis, Deep rotators)' }
    ],
    relevantDermatomes: ['L1', 'L2', 'L3', 'L4'],
    relevantMyotomes: [
      { level: 'L2', muscle: 'Iliopsoas', action: 'Hip flexion' },
      { level: 'L3', muscle: 'Quadriceps', action: 'Knee extension' },
      { level: 'L4', muscle: 'Tibialis anterior', action: 'Ankle dorsiflexion' },
      { level: 'L5', muscle: 'Gluteus medius', action: 'Hip abduction' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait (shortened stance)' },
      { value: 'trendelenburg', label: 'Trendelenburg (hip drop)' },
      { value: 'reduced_stride', label: 'Reduced stride length' },
      { value: 'circumduction', label: 'Circumduction' },
      { value: 'decreased_hip_extension', label: 'Decreased hip extension' }
    ],
    postureObservations: [
      { value: 'pelvic_tilt', label: 'Anterior/posterior pelvic tilt' },
      { value: 'hip_hiking', label: 'Hip hiking' },
      { value: 'leg_length', label: 'Apparent leg length discrepancy' },
      { value: 'flexed_hip', label: 'Hip held in flexion' }
    ],
    radiationPatterns: [
      { value: 'into_groin', label: 'Into the groin' },
      { value: 'down_thigh', label: 'Down the front of thigh' },
      { value: 'into_buttock', label: 'Into the buttock' },
      { value: 'into_knee', label: 'Into the knee' },
      { value: 'into_low_back', label: 'Into the lower back' }
    ],
    tightnessAssessment: [
      { value: 'hip_flexors', label: 'Hip flexors (Iliopsoas, Rectus femoris)' },
      { value: 'hamstrings', label: 'Hamstrings' },
      { value: 'adductors', label: 'Adductors' },
      { value: 'piriformis', label: 'Piriformis' },
      { value: 'it_band', label: 'IT band / TFL' },
      { value: 'gluteals', label: 'Gluteals' }
    ],
    relevantReflexes: [
      { reflex: 'Patellar', nerve: 'Femoral', level: 'L3-L4' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand (affected side)' },
      { value: 'trendelenburg', label: 'Trendelenburg sign positive' },
      { value: 'hip_strategy_impaired', label: 'Hip strategy impaired' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  thigh: {
    region: 'thigh',
    label: 'Thigh',
    aggravatingFactors: [
      { value: 'walking', label: 'Walking' },
      { value: 'running', label: 'Running' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'squatting', label: 'Squatting' },
      { value: 'sitting_to_standing', label: 'Sit to stand' },
      { value: 'kicking', label: 'Kicking' },
      { value: 'stretching', label: 'Stretching' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice (acute)' },
      { value: 'heat', label: 'Heat' },
      { value: 'gentle_stretching', label: 'Gentle stretching' },
      { value: 'elevation', label: 'Elevation' }
    ],
    functionalLimitations: [
      { value: 'walking', label: 'Walking' },
      { value: 'running', label: 'Running' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'squatting', label: 'Squatting' },
      { value: 'sports', label: 'Sports activities' }
    ],
    romMovements: [
      { value: 'hip_flexion', label: 'Hip flexion' },
      { value: 'hip_extension', label: 'Hip extension' },
      { value: 'knee_flexion', label: 'Knee flexion' },
      { value: 'knee_extension', label: 'Knee extension' }
    ],
    mmtMuscleGroups: [
      { value: 'quadriceps', label: 'Quadriceps' },
      { value: 'hamstrings', label: 'Hamstrings' },
      { value: 'hip_flexors', label: 'Hip flexors' },
      { value: 'adductors', label: 'Adductors' }
    ],
    relevantDermatomes: ['L2', 'L3', 'L4', 'L5', 'S1'],
    relevantMyotomes: [
      { level: 'L2', muscle: 'Hip flexors', action: 'Hip flexion' },
      { level: 'L3', muscle: 'Quadriceps', action: 'Knee extension' },
      { level: 'L4', muscle: 'Quadriceps', action: 'Knee extension' },
      { level: 'L5', muscle: 'Hamstrings', action: 'Knee flexion' },
      { level: 'S1', muscle: 'Hamstrings', action: 'Knee flexion' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait' },
      { value: 'reduced_stride', label: 'Reduced stride' },
      { value: 'quadriceps_avoidance', label: 'Quadriceps avoidance' }
    ],
    postureObservations: [
      { value: 'femoral_anteversion', label: 'Femoral anteversion' },
      { value: 'femoral_retroversion', label: 'Femoral retroversion' },
      { value: 'hip_flexion_posture', label: 'Hip held in flexion' },
      { value: 'thigh_asymmetry', label: 'Thigh muscle asymmetry' },
      { value: 'leg_length_discrepancy', label: 'Leg length discrepancy' }
    ],
    radiationPatterns: [
      { value: 'into_knee', label: 'Into the knee' },
      { value: 'up_to_hip', label: 'Up towards the hip' },
      { value: 'down_to_calf', label: 'Down to the calf' },
      { value: 'around_thigh', label: 'Around the thigh' }
    ],
    tightnessAssessment: [
      { value: 'quadriceps', label: 'Quadriceps' },
      { value: 'hamstrings', label: 'Hamstrings' },
      { value: 'adductors', label: 'Adductors' },
      { value: 'it_band', label: 'IT band' }
    ],
    relevantReflexes: [
      { reflex: 'Patellar', nerve: 'Femoral', level: 'L3-L4' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand' },
      { value: 'quad_weakness_balance', label: 'Balance affected by quadriceps weakness' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  knee: {
    region: 'knee',
    label: 'Knee',
    aggravatingFactors: [
      { value: 'walking', label: 'Walking' },
      { value: 'stairs_up', label: 'Going up stairs' },
      { value: 'stairs_down', label: 'Going down stairs' },
      { value: 'squatting', label: 'Squatting' },
      { value: 'kneeling', label: 'Kneeling' },
      { value: 'running', label: 'Running' },
      { value: 'sitting_to_standing', label: 'Sitting to standing' },
      { value: 'prolonged_sitting', label: 'Prolonged sitting (movie sign)' },
      { value: 'twisting', label: 'Twisting on planted foot' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice' },
      { value: 'elevation', label: 'Elevation' },
      { value: 'straightening', label: 'Straightening the knee' },
      { value: 'medication', label: 'Pain medication' }
    ],
    functionalLimitations: [
      { value: 'walking_distance', label: 'Walking distance' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'squatting', label: 'Squatting' },
      { value: 'kneeling', label: 'Kneeling' },
      { value: 'getting_up', label: 'Getting up from chair' },
      { value: 'running', label: 'Running' },
      { value: 'sports', label: 'Sports activities' }
    ],
    romMovements: [
      { value: 'flexion', label: 'Flexion (bending knee)' },
      { value: 'extension', label: 'Extension (straightening knee)' }
    ],
    mmtMuscleGroups: [
      { value: 'extensors', label: 'Extensors (Quadriceps)' },
      { value: 'flexors', label: 'Flexors (Hamstrings)' }
    ],
    relevantDermatomes: ['L3', 'L4'],
    relevantMyotomes: [
      { level: 'L3', muscle: 'Quadriceps', action: 'Knee extension' },
      { level: 'L4', muscle: 'Quadriceps', action: 'Knee extension' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait' },
      { value: 'flexed_knee', label: 'Knee held flexed' },
      { value: 'stiff_knee', label: 'Stiff knee gait' },
      { value: 'varus_thrust', label: 'Varus thrust' },
      { value: 'valgus_thrust', label: 'Valgus thrust' },
      { value: 'circumduction', label: 'Circumduction' }
    ],
    postureObservations: [
      { value: 'varus', label: 'Varus alignment (bow-legged)' },
      { value: 'valgus', label: 'Valgus alignment (knock-kneed)' },
      { value: 'genu_recurvatum', label: 'Genu recurvatum (hyperextension)' },
      { value: 'flexion_contracture', label: 'Flexion contracture' },
      { value: 'patella_position', label: 'Patella alta/baja or lateral tracking' },
      { value: 'tibial_torsion', label: 'Tibial torsion' }
    ],
    radiationPatterns: [
      { value: 'up_thigh', label: 'Up the thigh' },
      { value: 'down_leg', label: 'Down the lower leg' },
      { value: 'into_calf', label: 'Into the calf' },
      { value: 'around_knee', label: 'Around the knee joint' }
    ],
    tightnessAssessment: [
      { value: 'quadriceps', label: 'Quadriceps' },
      { value: 'hamstrings', label: 'Hamstrings' },
      { value: 'it_band', label: 'IT band' },
      { value: 'gastrocnemius', label: 'Gastrocnemius' },
      { value: 'popliteus', label: 'Popliteus' }
    ],
    relevantReflexes: [
      { reflex: 'Patellar', nerve: 'Femoral', level: 'L3-L4' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand' },
      { value: 'giving_way', label: 'Knee giving way' },
      { value: 'instability', label: 'Knee instability affecting balance' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  'lower-leg': {
    region: 'lower-leg',
    label: 'Calf / Lower Leg',
    aggravatingFactors: [
      { value: 'walking', label: 'Walking' },
      { value: 'running', label: 'Running' },
      { value: 'jumping', label: 'Jumping' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'standing', label: 'Prolonged standing' },
      { value: 'heel_raise', label: 'Heel raises' },
      { value: 'uneven_surfaces', label: 'Walking on uneven surfaces' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'elevation', label: 'Elevation' },
      { value: 'ice', label: 'Ice' },
      { value: 'stretching', label: 'Gentle stretching' },
      { value: 'compression', label: 'Compression' }
    ],
    functionalLimitations: [
      { value: 'walking_distance', label: 'Walking distance' },
      { value: 'running', label: 'Running' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'heel_raises', label: 'Going on tiptoes' },
      { value: 'sports', label: 'Sports activities' }
    ],
    romMovements: [
      { value: 'ankle_dorsiflexion', label: 'Ankle dorsiflexion' },
      { value: 'ankle_plantarflexion', label: 'Ankle plantarflexion' },
      { value: 'knee_flexion', label: 'Knee flexion' },
      { value: 'knee_extension', label: 'Knee extension' }
    ],
    mmtMuscleGroups: [
      { value: 'plantarflexors', label: 'Plantarflexors (Gastrocnemius, Soleus)' },
      { value: 'dorsiflexors', label: 'Dorsiflexors (Tibialis anterior)' },
      { value: 'invertors', label: 'Invertors (Tibialis posterior)' },
      { value: 'evertors', label: 'Evertors (Peroneals)' }
    ],
    relevantDermatomes: ['L4', 'L5', 'S1'],
    relevantMyotomes: [
      { level: 'L4', muscle: 'Tibialis anterior', action: 'Ankle dorsiflexion' },
      { level: 'L5', muscle: 'Extensor hallucis longus', action: 'Big toe extension' },
      { level: 'S1', muscle: 'Gastrocnemius', action: 'Ankle plantarflexion' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait' },
      { value: 'foot_drop', label: 'Foot drop' },
      { value: 'toe_walking', label: 'Toe walking' },
      { value: 'reduced_push_off', label: 'Reduced push-off' }
    ],
    postureObservations: [
      { value: 'tibial_bowing', label: 'Tibial bowing' },
      { value: 'ankle_alignment', label: 'Ankle alignment abnormality' },
      { value: 'calf_asymmetry', label: 'Calf muscle asymmetry' },
      { value: 'toe_walking_stance', label: 'Toe walking stance' },
      { value: 'foot_drop_position', label: 'Foot drop position' }
    ],
    radiationPatterns: [
      { value: 'into_ankle', label: 'Into the ankle' },
      { value: 'into_foot', label: 'Into the foot' },
      { value: 'up_to_knee', label: 'Up towards the knee' },
      { value: 'into_heel', label: 'Into the heel' }
    ],
    tightnessAssessment: [
      { value: 'gastrocnemius', label: 'Gastrocnemius' },
      { value: 'soleus', label: 'Soleus' },
      { value: 'tibialis_anterior', label: 'Tibialis anterior' },
      { value: 'peroneals', label: 'Peroneals' }
    ],
    relevantReflexes: [
      { reflex: 'Achilles', nerve: 'Tibial', level: 'S1-S2' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand' },
      { value: 'heel_raises', label: 'Unable to perform heel raises' },
      { value: 'foot_drop_balance', label: 'Foot drop affecting balance' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  ankle: {
    region: 'ankle',
    label: 'Ankle',
    aggravatingFactors: [
      { value: 'walking', label: 'Walking' },
      { value: 'running', label: 'Running' },
      { value: 'uneven_surfaces', label: 'Uneven surfaces' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'jumping', label: 'Jumping' },
      { value: 'standing', label: 'Prolonged standing' },
      { value: 'squatting', label: 'Squatting (deep ankle dorsiflexion)' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'elevation', label: 'Elevation' },
      { value: 'ice', label: 'Ice' },
      { value: 'compression', label: 'Compression/brace' },
      { value: 'flat_surfaces', label: 'Walking on flat surfaces' }
    ],
    functionalLimitations: [
      { value: 'walking', label: 'Walking' },
      { value: 'uneven_ground', label: 'Walking on uneven ground' },
      { value: 'running', label: 'Running' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'squatting', label: 'Squatting' },
      { value: 'sports', label: 'Sports activities' }
    ],
    romMovements: [
      { value: 'dorsiflexion', label: 'Dorsiflexion (toes up)' },
      { value: 'plantarflexion', label: 'Plantarflexion (toes down)' },
      { value: 'inversion', label: 'Inversion (sole inward)' },
      { value: 'eversion', label: 'Eversion (sole outward)' }
    ],
    mmtMuscleGroups: [
      { value: 'dorsiflexors', label: 'Dorsiflexors (Tibialis anterior)' },
      { value: 'plantarflexors', label: 'Plantarflexors (Gastrocnemius, Soleus)' },
      { value: 'invertors', label: 'Invertors (Tibialis posterior)' },
      { value: 'evertors', label: 'Evertors (Peroneals)' }
    ],
    relevantDermatomes: ['L4', 'L5', 'S1'],
    relevantMyotomes: [
      { level: 'L4', muscle: 'Tibialis anterior', action: 'Ankle dorsiflexion' },
      { level: 'L5', muscle: 'Peroneals', action: 'Ankle eversion' },
      { level: 'S1', muscle: 'Gastrocnemius', action: 'Ankle plantarflexion' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait' },
      { value: 'foot_flat', label: 'Foot flat gait (no heel strike)' },
      { value: 'reduced_push_off', label: 'Reduced push-off' },
      { value: 'circumduction', label: 'Circumduction' },
      { value: 'instability', label: 'Visible instability/giving way' }
    ],
    postureObservations: [
      { value: 'hindfoot_varus', label: 'Hindfoot varus (heel turned in)' },
      { value: 'hindfoot_valgus', label: 'Hindfoot valgus (heel turned out)' },
      { value: 'forefoot_abduction', label: 'Forefoot abduction' },
      { value: 'equinus', label: 'Equinus (plantarflexed position)' },
      { value: 'weight_bearing_asymmetry', label: 'Weight bearing asymmetry' },
      { value: 'antalgic_stance', label: 'Antalgic stance (avoiding weight)' }
    ],
    radiationPatterns: [
      { value: 'into_foot', label: 'Into the foot' },
      { value: 'into_toes', label: 'Into the toes' },
      { value: 'up_calf', label: 'Up the calf' },
      { value: 'into_heel', label: 'Into the heel' },
      { value: 'around_ankle', label: 'Around the ankle joint' }
    ],
    tightnessAssessment: [
      { value: 'gastrocnemius', label: 'Gastrocnemius' },
      { value: 'soleus', label: 'Soleus' },
      { value: 'tibialis_posterior', label: 'Tibialis posterior' },
      { value: 'peroneals', label: 'Peroneals' },
      { value: 'plantar_fascia', label: 'Plantar fascia' }
    ],
    relevantReflexes: [
      { reflex: 'Achilles', nerve: 'Tibial', level: 'S1-S2' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand (affected side)' },
      { value: 'tandem_stance', label: 'Unable to tandem stance' },
      { value: 'ankle_strategy_impaired', label: 'Ankle strategy impaired' },
      { value: 'instability', label: 'Ankle instability affecting balance' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  foot: {
    region: 'foot',
    label: 'Foot',
    aggravatingFactors: [
      { value: 'walking', label: 'Walking' },
      { value: 'standing', label: 'Prolonged standing' },
      { value: 'first_steps', label: 'First steps in morning' },
      { value: 'barefoot', label: 'Walking barefoot' },
      { value: 'running', label: 'Running' },
      { value: 'hard_surfaces', label: 'Walking on hard surfaces' },
      { value: 'tight_shoes', label: 'Tight shoes' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'elevation', label: 'Elevation' },
      { value: 'ice', label: 'Ice' },
      { value: 'supportive_shoes', label: 'Supportive shoes' },
      { value: 'orthotics', label: 'Orthotics/insoles' },
      { value: 'stretching', label: 'Stretching' }
    ],
    functionalLimitations: [
      { value: 'walking', label: 'Walking' },
      { value: 'standing', label: 'Standing' },
      { value: 'running', label: 'Running' },
      { value: 'wearing_shoes', label: 'Wearing certain shoes' },
      { value: 'barefoot', label: 'Walking barefoot' }
    ],
    romMovements: [
      { value: 'toe_flexion', label: 'Toe flexion' },
      { value: 'toe_extension', label: 'Toe extension' },
      { value: 'midfoot_mobility', label: 'Midfoot mobility' },
      { value: 'first_mtp', label: 'First MTP joint (big toe)' }
    ],
    mmtMuscleGroups: [
      { value: 'toe_flexors', label: 'Toe flexors' },
      { value: 'toe_extensors', label: 'Toe extensors' },
      { value: 'intrinsics', label: 'Foot intrinsics' },
      { value: 'tibialis_posterior', label: 'Tibialis posterior (arch support)' }
    ],
    relevantDermatomes: ['L4', 'L5', 'S1', 'S2'],
    relevantMyotomes: [
      { level: 'L5', muscle: 'Extensor hallucis longus', action: 'Big toe extension' },
      { level: 'S1', muscle: 'Toe flexors', action: 'Toe flexion' },
      { level: 'S2', muscle: 'Intrinsics', action: 'Toe spreading' }
    ],
    gaitObservations: [
      { value: 'antalgic', label: 'Antalgic gait' },
      { value: 'toe_walking', label: 'Toe walking (avoiding heel)' },
      { value: 'heel_walking', label: 'Heel walking (avoiding forefoot)' },
      { value: 'overpronation', label: 'Overpronation' },
      { value: 'supination', label: 'Supination' }
    ],
    postureObservations: [
      { value: 'pes_planus', label: 'Pes planus (flat foot)' },
      { value: 'pes_cavus', label: 'Pes cavus (high arch)' },
      { value: 'hallux_valgus', label: 'Hallux valgus (bunion)' },
      { value: 'toe_deformity', label: 'Toe deformity (hammer/claw)' },
      { value: 'forefoot_varus', label: 'Forefoot varus' },
      { value: 'forefoot_valgus', label: 'Forefoot valgus' },
      { value: 'toe_in', label: 'Toe-in (pigeon-toed)' },
      { value: 'toe_out', label: 'Toe-out' }
    ],
    radiationPatterns: [
      { value: 'into_toes', label: 'Into specific toes' },
      { value: 'into_heel', label: 'Into the heel' },
      { value: 'into_arch', label: 'Into the arch' },
      { value: 'up_ankle', label: 'Up towards the ankle' },
      { value: 'across_forefoot', label: 'Across the forefoot' }
    ],
    tightnessAssessment: [
      { value: 'plantar_fascia', label: 'Plantar fascia' },
      { value: 'toe_flexors', label: 'Toe flexors' },
      { value: 'toe_extensors', label: 'Toe extensors' },
      { value: 'gastrocnemius', label: 'Gastrocnemius' },
      { value: 'soleus', label: 'Soleus' }
    ],
    relevantReflexes: [],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'single_leg_stance', label: 'Unable to single leg stand' },
      { value: 'tandem_stance', label: 'Unable to tandem stance' },
      { value: 'proprioception_impaired', label: 'Proprioception impaired' },
      { value: 'falls_risk', label: 'High falls risk' }
    ]
  },

  // ==================== HEAD ====================

  head: {
    region: 'head',
    label: 'Head / Headache',
    aggravatingFactors: [
      { value: 'neck_movement', label: 'Neck movement' },
      { value: 'prolonged_postures', label: 'Prolonged postures (desk work)' },
      { value: 'stress', label: 'Stress' },
      { value: 'bright_light', label: 'Bright light' },
      { value: 'noise', label: 'Loud noise' },
      { value: 'lack_of_sleep', label: 'Lack of sleep' },
      { value: 'screen_time', label: 'Prolonged screen time' },
      { value: 'jaw_clenching', label: 'Jaw clenching' }
    ],
    relievingFactors: [
      { value: 'rest', label: 'Rest' },
      { value: 'dark_quiet', label: 'Dark, quiet room' },
      { value: 'sleep', label: 'Sleep' },
      { value: 'medication', label: 'Pain medication' },
      { value: 'massage', label: 'Massage' },
      { value: 'neck_movement', label: 'Gentle neck movement' }
    ],
    functionalLimitations: [
      { value: 'concentration', label: 'Concentration' },
      { value: 'work', label: 'Work' },
      { value: 'reading', label: 'Reading' },
      { value: 'screen_use', label: 'Screen use' },
      { value: 'driving', label: 'Driving' },
      { value: 'social_activities', label: 'Social activities' }
    ],
    romMovements: [
      { value: 'cervical_flexion', label: 'Cervical flexion' },
      { value: 'cervical_extension', label: 'Cervical extension' },
      { value: 'cervical_rotation', label: 'Cervical rotation' },
      { value: 'cervical_lateral_flexion', label: 'Cervical lateral flexion' },
      { value: 'jaw_opening', label: 'Jaw opening' }
    ],
    mmtMuscleGroups: [
      { value: 'neck_flexors', label: 'Neck flexors' },
      { value: 'neck_extensors', label: 'Neck extensors' },
      { value: 'upper_trap', label: 'Upper trapezius' },
      { value: 'jaw_muscles', label: 'Jaw muscles (if TMJ involved)' }
    ],
    relevantDermatomes: ['C1', 'C2', 'C3', 'C4'],
    relevantMyotomes: [
      { level: 'C1-C2', muscle: 'Deep neck flexors', action: 'Neck flexion' },
      { level: 'C3-C4', muscle: 'Upper trapezius', action: 'Shoulder shrug' }
    ],
    gaitObservations: [
      { value: 'reduced_head_movement', label: 'Reduced head movement' },
      { value: 'guarded_posture', label: 'Guarded posture' }
    ],
    postureObservations: [
      { value: 'forward_head', label: 'Forward head posture' },
      { value: 'head_tilt', label: 'Head tilt' },
      { value: 'elevated_shoulders', label: 'Elevated shoulders' },
      { value: 'jaw_position', label: 'Jaw position asymmetry' }
    ],
    radiationPatterns: [
      { value: 'into_neck', label: 'Into the neck' },
      { value: 'into_face', label: 'Into the face' },
      { value: 'into_jaw', label: 'Into the jaw (TMJ)' },
      { value: 'behind_eyes', label: 'Behind the eyes' },
      { value: 'across_forehead', label: 'Across the forehead' },
      { value: 'into_temples', label: 'Into the temples' }
    ],
    tightnessAssessment: [
      { value: 'upper_trapezius', label: 'Upper trapezius' },
      { value: 'suboccipitals', label: 'Suboccipitals' },
      { value: 'sternocleidomastoid', label: 'Sternocleidomastoid' },
      { value: 'temporalis', label: 'Temporalis' },
      { value: 'masseter', label: 'Masseter' },
      { value: 'scalenes', label: 'Scalenes' }
    ],
    relevantReflexes: [
      { reflex: 'Jaw jerk', nerve: 'Trigeminal', level: 'CN V' }
    ],
    balanceAssessment: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'dizziness', label: 'Dizziness/vertigo' },
      { value: 'cervicogenic_dizziness', label: 'Cervicogenic dizziness suspected' },
      { value: 'vestibular', label: 'Vestibular involvement suspected' },
      { value: 'romberg_positive', label: 'Romberg test positive' }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

import { normalizeRegion } from './referralPatterns';

/**
 * Get region configuration
 */
export function getRegionConfig(region: string): RegionConfig | null {
  const normalized = normalizeRegion(region);
  return REGION_CONFIGS[normalized] || null;
}

/**
 * Get aggravating factors for a region
 */
export function getAggravatingFactors(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.aggravatingFactors || [];
}

/**
 * Get relieving factors for a region
 */
export function getRelievingFactors(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.relievingFactors || [];
}

/**
 * Get functional limitations for a region
 */
export function getFunctionalLimitations(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.functionalLimitations || [];
}

/**
 * Get ROM movements for a region
 */
export function getRomMovements(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.romMovements || [];
}

/**
 * Get MMT muscle groups for a region
 */
export function getMmtMuscleGroups(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.mmtMuscleGroups || [];
}

/**
 * Get relevant dermatomes for a region
 */
export function getRelevantDermatomes(region: string): string[] {
  const config = getRegionConfig(region);
  return config?.relevantDermatomes || [];
}

/**
 * Get relevant myotomes for a region
 */
export function getRelevantMyotomes(region: string): MyotomeConfig[] {
  const config = getRegionConfig(region);
  return config?.relevantMyotomes || [];
}

/**
 * Get gait observations for a region
 */
export function getGaitObservations(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.gaitObservations || [];
}

/**
 * Get posture observations for a region
 */
export function getPostureObservations(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.postureObservations || [];
}

/**
 * Get radiation patterns for a region
 */
export function getRadiationPatterns(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.radiationPatterns || [];
}

/**
 * Get tightness assessment muscles for a region
 */
export function getTightnessAssessment(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.tightnessAssessment || [];
}

/**
 * Get relevant reflexes for a region
 */
export function getRelevantReflexes(region: string): ReflexConfig[] {
  const config = getRegionConfig(region);
  return config?.relevantReflexes || [];
}

/**
 * Get balance assessment options for a region
 */
export function getBalanceAssessment(region: string): QuestionOption[] {
  const config = getRegionConfig(region);
  return config?.balanceAssessment || [];
}

/**
 * Check if a region has configuration
 */
export function hasRegionConfig(region: string): boolean {
  return getRegionConfig(region) !== null;
}

/**
 * Get all configured regions
 */
export function getConfiguredRegions(): string[] {
  return Object.keys(REGION_CONFIGS);
}

export default REGION_CONFIGS;

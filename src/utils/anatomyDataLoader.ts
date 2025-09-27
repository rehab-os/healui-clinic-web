// Anatomy Data Loader Utility
import headNeckMuscles from '../data/anatomy-database/mustles/01_head_and_neck_muscles.json';
import shoulderMuscles from '../data/anatomy-database/mustles/02_shoulder_complex.json';
import upperArmMuscles from '../data/anatomy-database/mustles/03_upper_arm.json';
import forearmHandMuscles from '../data/anatomy-database/mustles/04_forearm_and_hand.json';
import trunkCoreMuscles from '../data/anatomy-database/mustles/05_trunk_and_core.json';
import hipPelvisMuscles from '../data/anatomy-database/mustles/06_hip_and_pelvis.json';
import thighMuscles from '../data/anatomy-database/mustles/07_thigh.json';
import lowerLegMuscles from '../data/anatomy-database/mustles/08_lower_leg.json';
import footMuscles from '../data/anatomy-database/mustles/09_foot_intrinsic.json';

import jointStructures from '../data/anatomy-database/joint_structures.json';
import ligaments from '../data/anatomy-database/ligaments.json';
import tendons from '../data/anatomy-database/tendons.json';
import neuralStructures from '../data/anatomy-database/neural_structure.json';

export interface MuscleData {
  id: string;
  name: string;
  latin_name?: string;
  muscle_group: string;
  origin: string[];
  insertion: string[];
  innervation: {
    nerve: string;
    nerve_roots: string[];
  };
  blood_supply: string[];
  actions: {
    primary: string[];
    secondary?: string[];
  };
  synergists?: string[];
  antagonists?: string[];
  functional_movements?: string[];
  clinical_relevance?: string;
  common_conditions?: string[];
  palpation?: string;
  assessment_methods?: string[];
  manual_therapy_techniques?: string[];
  common_trigger_points?: string[];
  referred_pain_patterns?: string[];
  stretching_positions?: string[];
  strengthening_exercises?: string[];
  exercise_ids?: string[];
  image_urls?: string[];
  notes?: string;
}

export interface JointData {
  id: string;
  name: string;
  latin_name?: string;
  type: string;
  joint: string;
  functions?: string[];
  pathology?: any;
  clinical_tests?: any;
  rehabilitation?: any;
  anatomy?: any;
}

export interface TendonData {
  id: string;
  name: string;
  latin_name?: string;
  region: string;
  muscles_involved?: string[];
  insertion?: string;
  blood_supply?: any;
  biomechanics?: any;
  pathology?: any;
  rehabilitation?: any;
  clinical_tests?: any;
}

export interface LigamentData {
  id: string;
  name: string;
  latin_name?: string;
  region?: string;
  joint?: string;
  attachments?: any;
  function?: string[];
  pathology?: any;
  clinical_tests?: any;
  rehabilitation?: any;
}

export interface NeuralData {
  id: string;
  name: string;
  latin_name?: string;
  nerve_roots?: string;
  origin?: string;
  course?: string[];
  motor_innervation?: any;
  sensory_innervation?: string[];
  common_compression_sites?: string[];
  clinical_conditions?: any;
  examination?: any;
  treatment?: any;
}

export interface AnatomyStructure {
  id: string;
  name: string;
  type: 'muscle' | 'joint' | 'tendon' | 'ligament' | 'neural';
  region: string;
  details?: MuscleData | JointData | TendonData | LigamentData | NeuralData;
}

// Combine all muscle data
const allMuscles: MuscleData[] = [
  ...headNeckMuscles,
  ...shoulderMuscles,
  ...upperArmMuscles,
  ...forearmHandMuscles,
  ...trunkCoreMuscles,
  ...hipPelvisMuscles,
  ...thighMuscles,
  ...lowerLegMuscles,
  ...footMuscles
];

// Load other anatomy data
const allJoints: JointData[] = jointStructures as JointData[];
const allTendons: TendonData[] = tendons as TendonData[];
const allLigaments: LigamentData[] = ligaments as LigamentData[];
const allNeuralStructures: NeuralData[] = neuralStructures as NeuralData[];

// Get all structures by type
export const getAllMuscles = (): MuscleData[] => allMuscles;
export const getAllJoints = (): JointData[] => allJoints;
export const getAllTendons = (): TendonData[] => allTendons;
export const getAllLigaments = (): LigamentData[] => allLigaments;
export const getAllNeuralStructures = (): NeuralData[] => allNeuralStructures;

// Get by ID
export const getMuscleById = (id: string): MuscleData | undefined => {
  return allMuscles.find(muscle => muscle.id === id);
};
export const getJointById = (id: string): JointData | undefined => {
  return allJoints.find(joint => joint.id === id);
};
export const getTendonById = (id: string): TendonData | undefined => {
  return allTendons.find(tendon => tendon.id === id);
};
export const getLigamentById = (id: string): LigamentData | undefined => {
  return allLigaments.find(ligament => ligament.id === id);
};
export const getNeuralById = (id: string): NeuralData | undefined => {
  return allNeuralStructures.find(neural => neural.id === id);
};

// Search functions for each type
export const searchMuscles = (query: string): MuscleData[] => {
  const searchTerm = query.toLowerCase();
  return allMuscles.filter(muscle => 
    muscle.name.toLowerCase().includes(searchTerm) ||
    muscle.muscle_group.toLowerCase().includes(searchTerm) ||
    muscle.latin_name?.toLowerCase().includes(searchTerm) ||
    muscle.common_conditions?.some(condition => 
      condition.toLowerCase().includes(searchTerm)
    )
  );
};

export const searchJoints = (query: string): JointData[] => {
  const searchTerm = query.toLowerCase();
  return allJoints.filter(joint => 
    joint.name.toLowerCase().includes(searchTerm) ||
    joint.joint?.toLowerCase().includes(searchTerm) ||
    joint.type?.toLowerCase().includes(searchTerm) ||
    joint.latin_name?.toLowerCase().includes(searchTerm)
  );
};

export const searchTendons = (query: string): TendonData[] => {
  const searchTerm = query.toLowerCase();
  return allTendons.filter(tendon => 
    tendon.name.toLowerCase().includes(searchTerm) ||
    tendon.region?.toLowerCase().includes(searchTerm) ||
    tendon.muscles_involved?.some(muscle => 
      muscle.toLowerCase().includes(searchTerm)
    ) ||
    tendon.latin_name?.toLowerCase().includes(searchTerm)
  );
};

export const searchLigaments = (query: string): LigamentData[] => {
  const searchTerm = query.toLowerCase();
  return allLigaments.filter(ligament => 
    ligament.name.toLowerCase().includes(searchTerm) ||
    ligament.region?.toLowerCase().includes(searchTerm) ||
    ligament.joint?.toLowerCase().includes(searchTerm) ||
    ligament.latin_name?.toLowerCase().includes(searchTerm)
  );
};

export const searchNeuralStructures = (query: string): NeuralData[] => {
  const searchTerm = query.toLowerCase();
  return allNeuralStructures.filter(neural => 
    neural.name.toLowerCase().includes(searchTerm) ||
    neural.nerve_roots?.toLowerCase().includes(searchTerm) ||
    neural.origin?.toLowerCase().includes(searchTerm) ||
    neural.latin_name?.toLowerCase().includes(searchTerm) ||
    neural.common_compression_sites?.some(site => 
      site.toLowerCase().includes(searchTerm)
    )
  );
};

// Universal search across all structure types
export const searchAllStructures = (query: string): AnatomyStructure[] => {
  const searchTerm = query.toLowerCase();
  const results: AnatomyStructure[] = [];
  
  // Search muscles
  searchMuscles(query).forEach(muscle => {
    results.push({
      id: muscle.id,
      name: muscle.name,
      type: 'muscle',
      region: muscle.muscle_group,
      details: muscle
    });
  });
  
  // Search joints
  searchJoints(query).forEach(joint => {
    results.push({
      id: joint.id,
      name: joint.name,
      type: 'joint',
      region: joint.joint || 'General',
      details: joint
    });
  });
  
  // Search tendons
  searchTendons(query).forEach(tendon => {
    results.push({
      id: tendon.id,
      name: tendon.name,
      type: 'tendon',
      region: tendon.region,
      details: tendon
    });
  });
  
  // Search ligaments
  searchLigaments(query).forEach(ligament => {
    results.push({
      id: ligament.id,
      name: ligament.name,
      type: 'ligament',
      region: ligament.region || ligament.joint || 'General',
      details: ligament
    });
  });
  
  // Search neural structures
  searchNeuralStructures(query).forEach(neural => {
    results.push({
      id: neural.id,
      name: neural.name,
      type: 'neural',
      region: 'Nervous System',
      details: neural
    });
  });
  
  return results;
};

// Get all anatomy structures for comprehensive search
export const getAllAnatomyStructures = (): AnatomyStructure[] => {
  const structures: AnatomyStructure[] = [];
  
  // Add muscles
  allMuscles.forEach(muscle => {
    structures.push({
      id: muscle.id,
      name: muscle.name,
      type: 'muscle',
      region: muscle.muscle_group,
      details: muscle
    });
  });
  
  // Add joints
  jointStructures.forEach((joint: any) => {
    structures.push({
      id: joint.id,
      name: joint.name,
      type: 'joint',
      region: joint.region || 'General',
      details: joint
    });
  });
  
  // Add tendons
  tendons.forEach((tendon: any) => {
    structures.push({
      id: tendon.id,
      name: tendon.name,
      type: 'tendon',
      region: tendon.region || 'General',
      details: tendon
    });
  });
  
  // Add ligaments
  ligaments.forEach((ligament: any) => {
    structures.push({
      id: ligament.id,
      name: ligament.name,
      type: 'ligament',
      region: ligament.region || 'General',
      details: ligament
    });
  });
  
  // Add neural structures
  neuralStructures.forEach((neural: any) => {
    structures.push({
      id: neural.id,
      name: neural.name,
      type: 'neural',
      region: neural.region || 'General',
      details: neural
    });
  });
  
  return structures;
};

// Get muscle groups for filtering
export const getMuscleGroups = (): string[] => {
  const groups = new Set<string>();
  allMuscles.forEach(muscle => {
    groups.add(muscle.muscle_group);
  });
  return Array.from(groups).sort();
};

// Get related exercises for a muscle
export const getRelatedExercises = (muscleId: string): string[] => {
  const muscle = getMuscleById(muscleId);
  return muscle?.exercise_ids || [];
};

// Get muscles that refer pain to a specific area
export const getMusclesByPainPattern = (area: string): MuscleData[] => {
  const searchArea = area.toLowerCase();
  return allMuscles.filter(muscle => 
    muscle.referred_pain_patterns?.some(pattern => 
      pattern.toLowerCase().includes(searchArea)
    )
  );
};

// Get muscles involved in a specific movement
export const getMusclesByMovement = (movement: string): MuscleData[] => {
  const searchMovement = movement.toLowerCase();
  return allMuscles.filter(muscle => 
    muscle.functional_movements?.some(move => 
      move.toLowerCase().includes(searchMovement)
    ) ||
    muscle.actions.primary.some(action => 
      action.toLowerCase().includes(searchMovement)
    ) ||
    muscle.actions.secondary?.some(action => 
      action.toLowerCase().includes(searchMovement)
    )
  );
};
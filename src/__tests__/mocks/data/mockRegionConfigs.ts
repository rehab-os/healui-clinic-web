/**
 * Mock Region Configurations for Testing
 *
 * Simplified versions of region-specific options for testing
 */

export const mockKneeConfig = {
  region: 'knee',
  label: 'Knee',
  aggravatingFactors: [
    { value: 'walking', label: 'Walking' },
    { value: 'stairs_up', label: 'Going up stairs' },
    { value: 'stairs_down', label: 'Going down stairs' },
    { value: 'squatting', label: 'Squatting' },
    { value: 'kneeling', label: 'Kneeling' },
    { value: 'running', label: 'Running' },
  ],
  relievingFactors: [
    { value: 'rest', label: 'Rest' },
    { value: 'ice', label: 'Ice' },
    { value: 'elevation', label: 'Elevation' },
  ],
  mmtMuscleGroups: [
    { value: 'extensors', label: 'Extensors (Quadriceps)' },
    { value: 'flexors', label: 'Flexors (Hamstrings)' },
  ],
}

export const mockShoulderConfig = {
  region: 'shoulder',
  label: 'Shoulder',
  aggravatingFactors: [
    { value: 'reaching_overhead', label: 'Reaching overhead' },
    { value: 'reaching_behind_back', label: 'Reaching behind back' },
    { value: 'lifting', label: 'Lifting objects' },
    { value: 'pushing', label: 'Pushing' },
    { value: 'pulling', label: 'Pulling' },
    { value: 'throwing', label: 'Throwing' },
  ],
  relievingFactors: [
    { value: 'rest', label: 'Rest' },
    { value: 'arm_supported', label: 'Arm supported/sling' },
    { value: 'ice', label: 'Ice/cold' },
  ],
  mmtMuscleGroups: [
    { value: 'flexors', label: 'Flexors (Anterior deltoid)' },
    { value: 'extensors', label: 'Extensors (Posterior deltoid, Lats)' },
    { value: 'abductors', label: 'Abductors (Middle deltoid, Supraspinatus)' },
    { value: 'external_rotators', label: 'External rotators (Infraspinatus, Teres minor)' },
  ],
}

export const mockLowerBackConfig = {
  region: 'lower-back',
  label: 'Lower Back',
  aggravatingFactors: [
    { value: 'bending_forward', label: 'Bending forward' },
    { value: 'bending_backward', label: 'Bending backward' },
    { value: 'lifting', label: 'Lifting' },
    { value: 'prolonged_sitting', label: 'Prolonged sitting' },
    { value: 'twisting', label: 'Twisting' },
  ],
  relievingFactors: [
    { value: 'lying_down', label: 'Lying down' },
    { value: 'walking', label: 'Walking' },
    { value: 'heat', label: 'Heat' },
  ],
  mmtMuscleGroups: [
    { value: 'hip_flexors', label: 'Hip flexors (L1-L2)' },
    { value: 'knee_extensors', label: 'Knee extensors/Quads (L3-L4)' },
    { value: 'ankle_dorsiflexors', label: 'Ankle dorsiflexors (L4-L5)' },
  ],
}

// Helper to get mock region config
export const getMockRegionConfig = (region: 'knee' | 'shoulder' | 'lower-back') => {
  const configs = {
    knee: mockKneeConfig,
    shoulder: mockShoulderConfig,
    'lower-back': mockLowerBackConfig,
  }
  return configs[region]
}

// Mock function to simulate getRegionConfig
export const mockGetRegionConfig = jest.fn((region: string) => {
  const normalized = region.toLowerCase().replace(/_/g, '-')
  return getMockRegionConfig(normalized as 'knee' | 'shoulder' | 'lower-back')
})

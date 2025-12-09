# Condition Tracking Strategy: Migration from Neo4j to Local Ontology

## IMPLEMENTATION UPDATE (Latest)

✅ **Successfully migrated from Neo4j to local ontology data** - This replaces the previous condition-specific tracking strategy with a more robust, offline-capable solution.

## Overview

This document outlines the strategic decision to implement **local ontology-based condition tracking** by replacing external Neo4j database dependencies with comprehensive local JSON data structures. This approach provides evidence-based, standardized tracking while maintaining clinical efficiency and eliminating external dependencies.

## Strategic Decision Rationale

### Why Local Ontology Migration?

✅ **Performance:** Immediate condition lookups vs external database calls  
✅ **Offline Capability:** No network dependency for condition data  
✅ **Data Quality:** 200+ comprehensive conditions with treatment protocols  
✅ **Maintenance:** Eliminates Neo4j infrastructure requirements  
✅ **Version Control:** Condition data tracked in repository  

### Implementation Complete ✅

- **OntologyConditionService**: Direct access to local JSON condition database
- **Enhanced Search**: Text-based and symptom-based condition matching  
- **Treatment Protocols**: Embedded protocol extraction from condition data
- **Type System**: Migrated to `ontology_condition_id` with backward compatibility
- **Assessment Builder**: Updated to use local ontology lookups

### Current Ontology Database Analysis

- **200+ conditions** across multiple specialties and body regions
- **Comprehensive treatment protocols** embedded in each condition
- **Enhanced Bayesian data** for AI-powered recommendations
- **SNOMED CT & ICD-10** standardization included
- **Exercise relationships** pre-mapped for each condition

## Implementation Strategy

### Enhanced Condition Structure

Each condition in `conditions.json` will be extended with a `tracking_profile` object containing:

```json
{
  "COND_XXX": {
    // Existing fields maintained
    "name": "string",
    "snomed_ct": "string", 
    "icd10": "string",
    "body_region": "string",
    "specialty": "string",
    
    // NEW: Condition-Specific Tracking Parameters
    "tracking_profile": {
      "primary_metrics": [
        {
          "metric_id": "METRIC_XXX",
          "frequency": "weekly|biweekly|monthly|quarterly",
          "priority": "high|medium|low",
          "phases": ["acute", "rehabilitation", "maintenance"]
        }
      ],
      
      "muscle_tracking": {
        "primary_targets": [
          {
            "muscle_group": "string",
            "assessment": "manual_muscle_test|strength_test|EMG",
            "frequency": "weekly|biweekly|monthly",
            "movements": ["specific movements to test"]
          }
        ]
      },
      
      "rom_tracking": {
        "critical_measurements": [
          {
            "joint": "string",
            "movements": ["flexion", "extension", "rotation"],
            "frequency": "weekly|biweekly",
            "expected_progression": true/false,
            "normal_ranges": {"movement": degrees}
          }
        ]
      },
      
      "functional_tests": [
        {
          "test_name": "string",
          "frequency": "monthly|quarterly",
          "return_to_function": true/false
        }
      ],
      
      "phase_specific_tracking": {
        "acute_phase": {
          "duration": "0-6_weeks",
          "focus": ["pain_management", "protection"],
          "track_intensively": ["pain", "inflammation"]
        },
        "rehabilitation_phase": {
          "duration": "6-12_weeks",
          "focus": ["strength", "ROM", "function"],
          "track_intensively": ["ROM", "strength", "function"]
        },
        "maintenance_phase": {
          "duration": "12+_weeks",
          "focus": ["prevention", "optimization"],
          "track_intensively": ["functional_goals", "lifestyle"]
        }
      }
    }
  }
}
```

### Example: Adhesive Capsulitis (Frozen Shoulder)

```json
"COND_001": {
  "name": "Adhesive Capsulitis (Frozen Shoulder)",
  "body_region": "shoulder",
  "specialty": "orthopedic",
  
  "tracking_profile": {
    "primary_metrics": [
      {
        "metric_id": "METRIC_003", // SPADI
        "frequency": "monthly",
        "priority": "high",
        "phases": ["all"]
      },
      {
        "metric_id": "METRIC_VAS", // Pain scale
        "frequency": "weekly",
        "priority": "high",
        "phases": ["acute", "frozen", "thawing"]
      }
    ],
    
    "muscle_tracking": {
      "primary_targets": [
        {
          "muscle_group": "rotator_cuff",
          "assessment": "manual_muscle_test",
          "frequency": "biweekly",
          "movements": ["external_rotation", "abduction"]
        }
      ]
    },
    
    "rom_tracking": {
      "critical_measurements": [
        {
          "joint": "shoulder",
          "movements": ["flexion", "abduction", "external_rotation"],
          "frequency": "weekly",
          "expected_progression": true,
          "normal_ranges": {"flexion": 180, "abduction": 180, "external_rotation": 90}
        }
      ]
    },
    
    "functional_tests": [
      {
        "test_name": "overhead_reach_test",
        "frequency": "monthly",
        "return_to_function": true
      }
    ],
    
    "phase_specific_tracking": {
      "freezing_phase": {
        "duration": "0-4_weeks",
        "focus": ["pain_management", "maintain_ROM"],
        "track_intensively": ["pain", "sleep_quality"]
      },
      "frozen_phase": {
        "duration": "4-10_weeks",
        "focus": ["improve_ROM", "progressive_stretching"],
        "track_intensively": ["ROM", "function"]
      },
      "thawing_phase": {
        "duration": "10-18_weeks",
        "focus": ["strength", "full_function"],
        "track_intensively": ["strength", "functional_goals"]
      }
    }
  }
}
```

## Tracking Templates by Condition Category

### Template A: Musculoskeletal Conditions (80% of database)

```json
"tracking_template_musculoskeletal": {
  "universal_metrics": ["pain_VAS", "global_change", "condition_specific_PRO"],
  "universal_measures": ["ROM", "strength", "function"],
  "frequency_standard": {
    "pain": "weekly",
    "PRO": "monthly",
    "ROM": "biweekly",
    "strength": "monthly"
  }
}
```

### Template B: Neurological Conditions (15% of database)

```json
"tracking_template_neurological": {
  "universal_metrics": ["FIM", "balance", "motor_function"],
  "universal_measures": ["spasticity", "coordination", "ADL"],
  "frequency_standard": {
    "motor_function": "weekly",
    "FIM": "monthly",
    "balance": "biweekly"
  }
}
```

### Template C: Specialized Conditions (5% of database)

```json
"tracking_template_specialized": {
  "universal_metrics": ["condition_specific_scales", "quality_of_life"],
  "universal_measures": ["symptom_tracking", "functional_capacity"],
  "frequency_standard": {
    "symptoms": "daily_to_weekly",
    "function": "monthly",
    "quality_of_life": "quarterly"
  }
}
```

## Three-Tier Tracking Framework

### TIER 1: Universal Core (Every Patient, Every Visit)

**Patient-Reported (3 minutes):**
1. **Pain Intensity** (0-10 NPRS) - Universal language of suffering
2. **Global Rating of Change** (-7 to +7) - "How are you compared to last visit?"
3. **Primary Functional Goal** - "What's the ONE activity you want to get back to?"

**Clinician-Assessed (2 minutes):**
4. **Range of Motion** - Primary affected joint(s)
5. **Functional Movement Screen** - Key movement pattern for condition

### TIER 2: Condition-Specific (Every 2-4 weeks)

Based on automatic assignment from condition tracking profile:

**Musculoskeletal Conditions:**
- **Shoulder:** SPADI + External rotation strength
- **Knee:** KOOS + Quadriceps strength
- **Spine:** ODI + Neural tension tests

**Neurological Conditions:**
- **Stroke:** FIM + Balance (Berg Scale)
- **Parkinson's:** UPDRS + Timed Up & Go
- **MS:** MSFC + Fatigue Severity Scale

### TIER 3: Specialized (Initial, Mid-treatment, Discharge)

**Psychosocial Screening:**
- **Fear-Avoidance** (FABQ) - For chronic pain conditions
- **Kinesiophobia** (TSK) - For post-injury anxiety
- **Depression/Anxiety** (PHQ-9/GAD-7) - For complex cases

## Implementation Phases

### Phase 1: High-Impact Conditions (Top 20 - 80% patient volume)
- Knee OA, Low Back Pain, Shoulder Impingement
- Rotator Cuff tears, Ankle Sprains, Neck Pain
- Create detailed tracking profiles with clinical team input

### Phase 2: Remaining Musculoskeletal (100 conditions)
- Use template approach with condition-specific modifications
- Focus on body region and injury type patterns

### Phase 3: Specialized Conditions (80 conditions)
- Neurological, Cardiac, Chronic Pain conditions
- Require specialized assessment protocols and expert input

## Auto-Assignment System Logic

```javascript
// Pseudo-code for condition selection
function assignTrackingParameters(conditionId) {
  const condition = getCondition(conditionId);
  const trackingProfile = condition.tracking_profile;
  
  // Auto-assign metrics based on condition
  const assignedMetrics = trackingProfile.primary_metrics;
  
  // Auto-schedule based on frequency rules
  const schedule = generateTrackingSchedule(trackingProfile);
  
  // Set up muscle/ROM tracking
  const physicalTracking = setupPhysicalAssessments(trackingProfile);
  
  return {
    metrics: assignedMetrics,
    schedule: schedule,
    physicalTracking: physicalTracking
  };
}
```

## User Interface Examples

### Condition Selection Interface
```
📋 Selected Condition: Rotator Cuff Tendinopathy

🔄 Auto-Assigned Tracking:
✅ SPADI Score (monthly)
✅ Pain VAS (weekly) 
✅ Shoulder ROM (biweekly)
✅ External rotation strength (monthly)
✅ Overhead function test (monthly)

⚙️ Customize tracking? [Advanced Options]
```

### Patient Dashboard
```
📊 John Smith - Rotator Cuff Tendinopathy

This Week's Tracking:
□ Pain level (0-10): Due today
□ Shoulder movement check: Due Wed
□ Overhead reach test: Due Friday

📈 Progress Summary:
Pain: 7→5→4 (improving ✅)
SPADI: 65→45 (significant improvement ✅)
ROM: 120°→145° (good progress ✅)
```

## Benefits

### For Physiotherapists
- **No guessing** - evidence-based tracking for each condition
- **Consistent care** - standardized across all clinicians
- **Efficient** - auto-populated, no setup time
- **Complete** - nothing important gets missed

### For Patients
- **Focused tracking** - only relevant measures, not overwhelming
- **Clear progress** - see improvement in what matters to them
- **Motivation** - visual progress on condition-specific goals
- **Education** - understand what to expect for their condition

### For System
- **Scalable** - add new conditions easily
- **Maintainable** - update tracking for specific conditions
- **Data quality** - consistent, complete datasets
- **Research ready** - standardized outcome collection

## Clinical Efficiency Rules

### The 5-Minute Rule
- **2 minutes:** Patient-reported (pain, function, goals)
- **3 minutes:** Key objective measures
- **Total tracking time:** <5 minutes per visit

### The Meaningful Change Rule
- **Track only what influences treatment decisions**
- **If it doesn't change your intervention, don't track it**
- **Focus on metrics with established minimal clinically important differences**

## Success Metrics for Implementation

1. **Clinical Efficiency:** <5 minutes total assessment time
2. **Patient Engagement:** >80% completion rate on patient-reported measures
3. **Clinical Relevance:** Tracking directly influences 90% of treatment decisions
4. **Outcome Sensitivity:** Detects meaningful change in 85% of improving patients

## Next Steps

1. **Validate with clinical team** - Review tracking profiles for accuracy
2. **Implement Phase 1 conditions** - Start with highest volume conditions
3. **Develop UI/UX** - Create intuitive interfaces for auto-assignment
4. **Test and iterate** - Gather feedback from physiotherapists and patients
5. **Scale systematically** - Expand to all conditions following template approach

This strategy provides a robust foundation for evidence-based, efficient, and patient-centered progress tracking across all physiotherapy conditions while maintaining technical simplicity and clinical relevance.
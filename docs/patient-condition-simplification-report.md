# Patient Condition Simplification - Complete Report

**Date:** February 3, 2026
**Scope:** Backend (healui-backend-core) + Frontend (healui-clinic-web)

---

## Overview

The patient-condition system was refactored from a **field-heavy approach** (storing individual screening fields as separate database columns) to a **JSONB-based approach** (storing detailed assessment data in structured JSON fields).

---

## What Was Removed

### Database Columns Removed from `patient_condition` Entity

**Individual Red Flag Columns:**
- `night_pain`
- `unexplained_weight_loss`
- `history_cancer_tb`
- `fever_with_symptoms`
- `bladder_bowel_changes`
- `neurological_symptoms`
- `recent_trauma`
- `red_flag_notes`

**Functional Impact Columns:**
- `functional_limitation_level`
- `work_affected`
- `sleep_affected`
- `daily_activities_affected`

**Mechanism/Context Columns:**
- `mechanism_of_injury`
- `related_to_work`
- `related_to_sport`
- `previous_episodes`

**Other Removed Columns:**
- `condition_type` (ACUTE, CHRONIC, POST_SURGICAL, CONGENITAL)
- `severity_level` (MILD, MODERATE, SEVERE)
- `symptom_duration` (ACUTE, SUBACUTE, CHRONIC)
- `onset_date`
- `description`
- `primary_body_region`
- `pain_present`
- `primary_goal`
- `current_protocol_id`
- `last_assessment_date`

### Enums Removed from Backend Entity
- `ConditionType`
- `SeverityLevel`
- `FunctionalLimitationLevel`
- `MechanismOfInjury`
- `SymptomDuration`

### Enums Removed from Frontend Types
- `ConditionType`
- `SeverityLevel`
- `FunctionalLimitationLevel`
- `MechanismOfInjury`
- `SymptomDuration`

---

## What Was Kept

### Quick-Access Fields (for queries/display)

| Field | Purpose |
|-------|---------|
| `chief_complaint` | Patient's main concern - quick display |
| `vas_score` | Pain level 0-10 - quick filtering |
| `urgency_level` | LOW, MODERATE, HIGH, URGENT - triage |

### JSONB Fields (for detailed data storage)

| Field | Stores |
|-------|--------|
| `symptom_dx_data` | All symptom assessment responses, red flags, functional impact |
| `clinical_dx_data` | Clinical screening chatbot results |
| `clinical_assessments_data` | ROM, MMT, Special Tests results |
| `clinical_dx_differential` | AI-generated differential diagnosis |
| `final_diagnosis` | Selected diagnosis with confirmation |

### Workflow Fields
- `diagnosis_method` - SYMPTOM_AND_CLINICAL or CLINICAL_ONLY
- `diagnosis_status` - DRAFT, SYMPTOM_DX_PENDING, SYMPTOM_DX_COMPLETE, CLINICAL_DX_COMPLETE, COMPLETE
- `symptom_dx_completed`, `symptom_dx_completed_at`, `symptom_dx_filled_by`
- `clinical_dx_completed`, `clinical_dx_completed_at`
- `patient_link_token`, `patient_link_expires_at`

### Kept Enums
- `ConditionStatus` - ACTIVE, IMPROVING, ON_HOLD, DISCHARGED, RESOLVED
- `DischargeReason` - GOALS_MET, MMI, REFERRED, LAMA, etc.
- `UrgencyLevel` - Updated to LOW, MODERATE, HIGH, URGENT

---

## Files Modified

### Backend Files

| File | Changes |
|------|---------|
| `patient-condition.entity.ts` | Removed ~30 columns, kept JSONB fields |
| `patient-condition.dto.ts` | Simplified Create/Update/Response DTOs |
| `patient-condition.service.ts` | Removed mapping for deleted fields |
| `patient-condition.controller.ts` | Removed `/description` and `/sync` endpoints |
| `visit-condition.controller.ts` | Removed `condition_type`, `onset_date` from response |
| `visit-condition.service.ts` | Removed `condition_type` from mapping |
| `visit-condition.dto.ts` | Removed `condition_type` from nested condition |
| `patients.service.ts` | Changed `description` to `chief_complaint` |
| `assessment-mapper.util.ts` | **DELETED** - obsolete utility |

### Frontend Files

| File | Changes |
|------|---------|
| `src/lib/types/index.ts` | Removed enums, simplified DTOs, updated UrgencyLevel |
| `PatientConditionManagement.tsx` | Removed condition_type, severity_level, onset_date UI |
| `ConditionEditModal.tsx` | Removed severity_level, changed description to chief_complaint |
| `AddConditionToVisitModal.tsx` | Removed condition_type selector |
| `ScheduleVisitModal.tsx` | Removed condition_type selector |
| `AddPatientModal.tsx` | Removed condition_type selector |
| `ConditionSelector.tsx` | Removed unused ConditionType import |
| `ConditionScreeningModal.tsx` | Local types, stores data in symptom_dx_data |
| `SmartScreeningModal.tsx` | Local types, stores data in symptom_dx_data |

---

## New Data Flow

### Before (Old Approach)
```
Screening Form → 30+ individual columns in database
                 ↓
                 Redundant: Same data stored twice
                 (in columns AND in JSONB)
```

### After (New Approach)
```
Screening Form → symptom_dx_data (JSONB)
                 ↓
                 Quick-access fields extracted:
                 • chief_complaint
                 • vas_score
                 • urgency_level
```

---

## Benefits of This Refactoring

1. **Reduced Complexity** - Entity went from ~50 fields to ~25 fields
2. **No Data Duplication** - Screening data stored once in JSONB
3. **Flexible Schema** - JSONB can store any assessment format without migrations
4. **Better Performance** - Fewer columns to index/query
5. **Cleaner Code** - Removed obsolete utility file and unused endpoints
6. **Type Safety** - Local types in screening modals for UI-specific enums

---

## Migration Note

If you have existing data in the removed columns, you may want to:
1. Create a migration to move that data into the appropriate JSONB fields
2. Or simply let it be (soft migration) since the columns are nullable

The JSONB fields (`symptom_dx_data`, `clinical_dx_data`) are now the source of truth for detailed assessment data.

---

## API Endpoints Removed

| Method | Endpoint | Reason |
|--------|----------|--------|
| PUT | `/patients/:patientId/conditions/:conditionId/description` | Use PATCH endpoint with `chief_complaint` instead |
| POST | `/patients/:patientId/conditions/:conditionId/sync` | No longer needed - static data resolved at creation |

---

## Schema Reference

### Final `patient_condition` Entity Structure

```typescript
@Entity('patient_conditions')
export class PatientCondition {
  // Core identification
  id: string;
  patient_user_id?: string;
  patient_id?: string;
  condition_id?: string;
  condition_name: string;
  body_region?: string;
  status: ConditionStatus;

  // Quick access fields
  chief_complaint?: string;
  vas_score?: number;
  urgency_level?: UrgencyLevel;

  // Discharge tracking
  discharged_at?: Date;
  discharged_by_id?: string;
  discharge_reason?: DischargeReason;
  discharge_summary?: string;
  discharge_notes?: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;

  // SymptomDx (JSONB)
  symptom_dx_data?: SymptomDxData;
  symptom_dx_completed?: boolean;
  symptom_dx_completed_at?: Date;
  symptom_dx_filled_by?: SymptomDxFilledBy;
  symptom_dx_filled_by_user_id?: string;

  // ClinicalDx (JSONB)
  clinical_dx_data?: ClinicalDxData;
  clinical_assessments_data?: ClinicalAssessmentResult[];
  clinical_dx_differential?: DifferentialDiagnosis;
  clinical_dx_completed?: boolean;
  clinical_dx_completed_at?: Date;

  // Diagnosis workflow
  diagnosis_method?: DiagnosisMethod;
  diagnosis_status?: string;
  final_diagnosis?: FinalDiagnosisData;

  // Patient link
  patient_link_token?: string;
  patient_link_expires_at?: Date;

  // Soft delete
  deleted_at?: Date;
  deleted_by_id?: string;

  // Relationships
  patientUser?: PatientUser;
  patient?: Patient;
  visitConditions?: VisitCondition[];
  dischargedBy?: User;
  deletedBy?: User;
}
```

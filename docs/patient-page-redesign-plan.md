# Patient Page Redesign Plan

## Current Problem

The current patient page (`/dashboard/patients/[id]/page.tsx`) is:
- **Fragmented** - Shows visits and notes but disconnects them from conditions
- **Missing Key Data** - Doesn't show the rich condition data available in APIs
- **No Condition-Centric View** - A physio can't easily see "all about this patient's Lower Back Pain"
- **Limited Editability** - Can't easily update conditions, discharge, or manage treatment

---

## Design Philosophy

### Condition-Centric Approach
> "Everything revolves around conditions. A patient comes to you with conditions. You treat conditions. You track progress per condition. You discharge conditions."

### The Mental Model
```
Patient
  └── Condition 1 (Lower Back Pain)
  │     ├── Diagnosis Data (symptoms, clinical findings, differential)
  │     ├── Visit History (5 visits where this was treated)
  │     ├── Notes (SOAP notes specific to this condition)
  │     ├── Protocols (treatment plans for this condition)
  │     └── Progress (VAS trend, functional improvement)
  │
  └── Condition 2 (Neck Pain)
        ├── ...
```

---

## Proposed Layout

### Tab-Based Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│  [Patient Header: Name, Age, Contact, Quick Actions]            │
├─────────────────────────────────────────────────────────────────┤
│  [ Overview ] [ Conditions ] [ Visits ] [ History ] [ Settings ]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      Tab Content Area                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Overview (Dashboard)

### Purpose
Quick snapshot of the patient - "What do I need to know right now?"

### Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ PATIENT HEADER                                                    │
│ ┌─────────────┐  John Doe, 45M                                   │
│ │   Avatar    │  Phone: +91 98765 43210 | Email: john@email.com  │
│ └─────────────┘  Last Visit: Jan 28, 2026 | Next: Feb 5, 2026    │
│                  [Schedule Visit] [Start Screening] [Edit Info]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Active          │  │ Total Visits    │  │ Upcoming        │  │
│  │ Conditions      │  │                 │  │ Appointments    │  │
│  │      3          │  │      12         │  │      2          │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ACTIVE CONDITIONS (Quick View)                               │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 🔴 Lower Back Pain          VAS: 7/10    URGENT         │ │ │
│  │ │    Last: Jan 28 | 5 visits | Dx: Complete               │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 🟡 Neck Pain                VAS: 4/10    MODERATE       │ │ │
│  │ │    Last: Jan 20 | 3 visits | Dx: In Progress            │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                      [View All Conditions →] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │ UPCOMING VISITS            │  │ MEDICAL ALERTS              │ │
│  │ • Feb 5, 10:00 AM          │  │ ⚠️ Allergic to NSAIDs       │ │
│  │   Lower Back Pain          │  │ ⚠️ Hypertension             │ │
│  │ • Feb 12, 2:30 PM          │  │ 💊 On blood thinners        │ │
│  │   Neck Pain + LBP          │  │                             │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Required
```typescript
// API Calls
ApiManager.getPatient(id)
ApiManager.getPatientConditions(id)
ApiManager.getPatientVisits(id, { status: 'SCHEDULED', limit: 5 })
ApiManager.getPatientVisitHistory(id)  // For stats
```

---

## Tab 2: Conditions (Main Feature)

### Purpose
Deep dive into each condition - diagnosis, treatment, progress

### Layout - Condition List View
```
┌──────────────────────────────────────────────────────────────────┐
│ CONDITIONS                                    [+ Add Condition]  │
│                                                                  │
│ Filter: [All ▼] [Active ▼] [Body Region ▼]     🔍 Search        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ACTIVE (3)                                                   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Lower Back Pain                              [Expand ▼] │ │ │
│ │ │ Lumbar Spine | URGENT | VAS: 7/10                       │ │ │
│ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░ Dx: 80% Complete    │ │ │
│ │ │ Chief Complaint: Radiating pain to left leg             │ │ │
│ │ │ Last Visit: Jan 28, 2026 | Total: 5 visits              │ │ │
│ │ │ [View Details] [Start Session] [Edit] [Discharge]       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Neck Pain                                    [Expand ▼] │ │ │
│ │ │ Cervical Spine | MODERATE | VAS: 4/10                   │ │ │
│ │ │ ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░ Dx: 40% Complete     │ │ │
│ │ │ Chief Complaint: Stiffness in morning                   │ │ │
│ │ │ Last Visit: Jan 20, 2026 | Total: 3 visits              │ │ │
│ │ │ [View Details] [Start Session] [Edit] [Discharge]       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ DISCHARGED (2)                               [Show/Hide ▼]  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ • Shoulder Impingement - GOALS_MET - Dec 15, 2025          │ │
│ │ • Tennis Elbow - REFERRED - Nov 20, 2025                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Layout - Condition Detail View (Expanded/Modal)
```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to Conditions                                             │
│                                                                  │
│ LOWER BACK PAIN                                                  │
│ Lumbar Spine | Added: Jan 10, 2026                              │
│                                                                  │
│ [Diagnosis] [Visits] [Notes] [Protocols] [Progress]             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────┐  ┌─────────────────────────────────┐│
│ │ QUICK STATS             │  │ ACTIONS                         ││
│ │ Status: ACTIVE          │  │ [Edit Condition]                ││
│ │ VAS Score: 7/10         │  │ [Start Clinical Screening]      ││
│ │ Urgency: URGENT         │  │ [Generate Protocol]             ││
│ │ Total Visits: 5         │  │ [Put on Hold]                   ││
│ │ Last Treated: Jan 28    │  │ [Discharge Condition]           ││
│ └─────────────────────────┘  └─────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ DIAGNOSIS PROGRESS                                          │ │
│ │                                                             │ │
│ │ SymptomDx    ClinicalDx    Differential    Final Dx        │ │
│ │    ✅           ✅             ✅            ⏳             │ │
│ │                                                             │ │
│ │ Symptom Assessment: Completed by Physio on Jan 10          │ │
│ │ Clinical Screening: Completed on Jan 12                    │ │
│ │ Differential: 3 conditions identified                      │ │
│ │   1. Lumbar Disc Herniation (85%)                         │ │
│ │   2. Lumbar Sprain (10%)                                  │ │
│ │   3. Facet Joint Syndrome (5%)                            │ │
│ │ Final Diagnosis: Pending confirmation                      │ │
│ │                                                             │ │
│ │ [View Full Diagnosis Data] [Edit Diagnosis]                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ VISIT HISTORY FOR THIS CONDITION                            │ │
│ │                                                             │ │
│ │ Jan 28, 2026 - Session 5                                   │ │
│ │   Focus: PRIMARY | Goals: Reduce pain, improve ROM         │ │
│ │   Note: SOAP note attached | Protocol: Active              │ │
│ │   [View Visit] [View Note] [View Protocol]                 │ │
│ │                                                             │ │
│ │ Jan 21, 2026 - Session 4                                   │ │
│ │   Focus: PRIMARY | Goals: Core strengthening               │ │
│ │   Note: SOAP note attached                                 │ │
│ │   [View Visit] [View Note]                                 │ │
│ │                                                             │ │
│ │ ... more visits ...                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PAIN PROGRESSION                                            │ │
│ │                                                             │ │
│ │  10 │                                                       │ │
│ │   8 │  ●                                                    │ │
│ │   6 │      ●    ●                                           │ │
│ │   4 │              ●                                        │ │
│ │   2 │                  ●                                    │ │
│ │   0 └──────────────────────────────────                    │ │
│ │      Jan10  Jan14  Jan18  Jan21  Jan28                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Required
```typescript
// For condition list
ApiManager.getPatientConditions(patientId)

// For condition detail
ApiManager.getConditionHistory(conditionId)  // Visit history for this condition
ApiManager.getTreatmentProtocols({ patient_condition_id: conditionId })

// The condition object itself contains:
// - symptom_dx_data
// - clinical_dx_data
// - clinical_dx_differential
// - final_diagnosis
```

---

## Tab 3: Visits

### Purpose
Chronological view of all visits with condition mapping

### Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ VISITS                                        [Schedule Visit]   │
│                                                                  │
│ Filter: [All ▼] [Completed ▼] [Date Range ▼]                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ UPCOMING                                                     │ │
│ │                                                             │ │
│ │ Feb 5, 2026 - 10:00 AM                         SCHEDULED   │ │
│ │ Dr. Smith | Follow-up | 30 min                              │ │
│ │ Conditions: Lower Back Pain (PRIMARY)                       │ │
│ │ [Start Visit] [Reschedule] [Cancel]                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PAST VISITS                                                  │ │
│ │                                                             │ │
│ │ Jan 28, 2026 - 2:30 PM                         COMPLETED   │ │
│ │ Dr. Smith | Follow-up | 45 min                              │ │
│ │ Conditions Treated:                                         │ │
│ │   • Lower Back Pain (PRIMARY) - VAS: 7→6                   │ │
│ │   • Neck Pain (SECONDARY)                                   │ │
│ │ Notes: 2 | Protocols: 1                                     │ │
│ │ [View Details] [View Notes] [View Protocol]                │ │
│ │                                                             │ │
│ │ Jan 21, 2026 - 11:00 AM                        COMPLETED   │ │
│ │ Dr. Smith | Follow-up | 30 min                              │ │
│ │ Conditions Treated:                                         │ │
│ │   • Lower Back Pain (PRIMARY) - VAS: 8→7                   │ │
│ │ Notes: 1                                                    │ │
│ │ [View Details] [View Notes]                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Load More]                                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Required
```typescript
ApiManager.getPatientVisits(patientId, { page, limit, status })

// For each visit, also need:
ApiManager.getVisitConditions(visitId)  // What conditions were treated
```

---

## Tab 4: History (Medical Record)

### Purpose
Editable medical history, allergies, medications, past conditions

### Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ PATIENT HISTORY                                     [Edit All]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ MEDICAL HISTORY                                    [Edit]   │ │
│ │                                                             │ │
│ │ Previous Surgeries:                                         │ │
│ │   • Appendectomy - 2015                                    │ │
│ │   • Knee Arthroscopy (Right) - 2020                        │ │
│ │                                                             │ │
│ │ Chronic Conditions:                                         │ │
│ │   • Hypertension (controlled)                              │ │
│ │   • Type 2 Diabetes                                        │ │
│ │                                                             │ │
│ │ Past Illnesses:                                             │ │
│ │   • Pneumonia - 2018 (resolved)                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ALLERGIES & MEDICATIONS                            [Edit]   │ │
│ │                                                             │ │
│ │ Allergies:                                                  │ │
│ │   ⚠️ NSAIDs (causes GI upset)                              │ │
│ │   ⚠️ Penicillin (rash)                                     │ │
│ │                                                             │ │
│ │ Current Medications:                                        │ │
│ │   💊 Metformin 500mg - twice daily                         │ │
│ │   💊 Lisinopril 10mg - once daily                          │ │
│ │   💊 Aspirin 75mg - once daily                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ LIFESTYLE & OCCUPATION                             [Edit]   │ │
│ │                                                             │ │
│ │ Occupation: Software Engineer (Desk job, 8+ hrs sitting)   │ │
│ │ Activity Level: Sedentary                                   │ │
│ │ Exercise: Occasional walking                                │ │
│ │ Sleep: 6-7 hours, reports poor quality                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ DISCHARGED CONDITIONS                                       │ │
│ │                                                             │ │
│ │ • Shoulder Impingement                                      │ │
│ │   Discharged: Dec 15, 2025 | Reason: GOALS_MET             │ │
│ │   Summary: Full ROM restored, pain-free                    │ │
│ │   [View Full History] [Reactivate]                         │ │
│ │                                                             │ │
│ │ • Tennis Elbow                                              │ │
│ │   Discharged: Nov 20, 2025 | Reason: REFERRED              │ │
│ │   Summary: Referred to orthopedic surgeon                  │ │
│ │   [View Full History]                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Required
```typescript
ApiManager.getPatient(id)  // Contains all medical history fields
ApiManager.getPatientConditions(id)  // Filter for discharged conditions
```

---

## Tab 5: Settings

### Purpose
Patient preferences, contact info, insurance, emergency contacts

### Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ PATIENT SETTINGS                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CONTACT INFORMATION                                [Edit]   │ │
│ │ Phone: +91 98765 43210                                      │ │
│ │ Email: john.doe@email.com                                   │ │
│ │ Address: 123, Main Street, Mumbai - 400001                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ EMERGENCY CONTACT                                  [Edit]   │ │
│ │ Name: Jane Doe (Wife)                                       │ │
│ │ Phone: +91 98765 43211                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ INSURANCE                                          [Edit]   │ │
│ │ Provider: Star Health Insurance                             │ │
│ │ Policy Number: SHI-2024-123456                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ DANGER ZONE                                                 │ │
│ │ [Deactivate Patient] [Delete Patient Data]                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
src/app/dashboard/patients/[id]/
├── page.tsx                    # Main page with tab routing
├── components/
│   ├── PatientHeader.tsx       # Sticky header with patient info
│   ├── PatientOverview.tsx     # Overview tab content
│   ├── PatientConditions/
│   │   ├── ConditionList.tsx   # List of all conditions
│   │   ├── ConditionCard.tsx   # Single condition card
│   │   ├── ConditionDetail.tsx # Expanded condition view
│   │   ├── DiagnosisProgress.tsx
│   │   ├── ConditionVisitHistory.tsx
│   │   └── PainProgressChart.tsx
│   ├── PatientVisits/
│   │   ├── VisitList.tsx
│   │   ├── VisitCard.tsx
│   │   └── VisitConditions.tsx
│   ├── PatientHistory/
│   │   ├── MedicalHistory.tsx
│   │   ├── AllergiesMedications.tsx
│   │   └── DischargedConditions.tsx
│   └── PatientSettings/
│       ├── ContactInfo.tsx
│       └── InsuranceInfo.tsx
```

---

## API Integration Summary

### Required API Calls by Tab

| Tab | API Calls |
|-----|-----------|
| Overview | `getPatient`, `getPatientConditions`, `getPatientVisits(upcoming)`, `getPatientVisitHistory` |
| Conditions | `getPatientConditions`, `getConditionHistory(per condition)`, `getTreatmentProtocols` |
| Visits | `getPatientVisits(paginated)`, `getVisitConditions(per visit)` |
| History | `getPatient`, `getPatientConditions(discharged)` |
| Settings | `getPatient` |

### Actions Available

| Action | API Method |
|--------|------------|
| Add Condition | `createPatientCondition` |
| Edit Condition | `updatePatientCondition` |
| Discharge Condition | `dischargeCondition` |
| Reactivate Condition | `reactivateCondition` |
| Put on Hold | `putConditionOnHold` |
| Schedule Visit | `createVisit` |
| Edit Patient Info | `updatePatient` |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create new page structure with tabs
- [ ] Implement PatientHeader component
- [ ] Implement Overview tab with stats
- [ ] Basic condition list (no detail view yet)

### Phase 2: Conditions Tab (Week 2)
- [ ] Full ConditionCard with all data
- [ ] ConditionDetail expanded view
- [ ] Diagnosis progress visualization
- [ ] Condition edit/discharge modals

### Phase 3: Visits Integration (Week 3)
- [ ] Visit list with condition mapping
- [ ] Visit-condition linking UI
- [ ] Notes preview in visits
- [ ] Protocol linking

### Phase 4: History & Polish (Week 4)
- [ ] Medical history editable sections
- [ ] Discharged conditions view
- [ ] Pain progression charts
- [ ] Settings tab
- [ ] Mobile responsiveness

---

## Questions to Resolve Before Implementation

1. **Should condition detail be a modal or a separate route?**
   - Modal: Faster, stays in context
   - Route: Shareable URL, better for deep linking

2. **How to handle VAS score tracking?**
   - Store in visit_condition metadata?
   - Create separate endpoint for pain scores?

3. **Should we show all notes or just condition-specific notes?**
   - Option A: All notes in Visits tab
   - Option B: Condition-specific notes in Condition detail

4. **Protocol generation flow:**
   - From condition detail?
   - From visit?
   - Both?

---

## Success Metrics

1. **Time to find condition info** - Should be < 2 clicks
2. **Time to discharge condition** - Should be < 30 seconds
3. **Condition history visibility** - All visits for a condition visible in one view
4. **Edit accessibility** - Any field editable within 2 clicks

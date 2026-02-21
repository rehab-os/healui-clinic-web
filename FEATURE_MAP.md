# HealUI Clinic Web - Complete Feature Map

> **Platform**: Physiotherapy EMR & Clinic Management System
> **Stack**: Next.js 15 | React 19 | Redux Toolkit | Firebase Auth | Agora RTC | OpenAI
> **Last Updated**: February 2026

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Multi-Clinic & Organization Management](#2-multi-clinic--organization-management)
3. [User & Role Management](#3-user--role-management)
4. [Physiotherapist Profile](#4-physiotherapist-profile)
5. [Patient Management](#5-patient-management)
6. [Condition & Diagnosis Management](#6-condition--diagnosis-management)
7. [AI-Powered Clinical Screening](#7-ai-powered-clinical-screening)
8. [Treatment Protocols & Care Plans](#8-treatment-protocols--care-plans)
9. [Exercise Prescription Engine](#9-exercise-prescription-engine)
10. [Modalities & Manual Therapy](#10-modalities--manual-therapy)
11. [Goal-Based Care Plans](#11-goal-based-care-plans)
12. [Patient Tracking & Outcome Measures](#12-patient-tracking--outcome-measures)
13. [Appointment & Visit Management](#13-appointment--visit-management)
14. [Clinical Notes & Insights](#14-clinical-notes--insights)
15. [Dietary & Nutrition Management](#15-dietary--nutrition-management)
16. [Billing & Payments](#16-billing--payments)
17. [Video Consultations](#17-video-consultations)
18. [Dashboard & Analytics](#18-dashboard--analytics)
19. [Clinical Outcomes](#19-clinical-outcomes)
20. [Availability & Scheduling](#20-availability--scheduling)
21. [Patient Self-Service](#21-patient-self-service)
22. [Technical Infrastructure](#22-technical-infrastructure)

---

## 1. Authentication & Onboarding

### 1.1 Phone-Based OTP Login
- Phone number input with Indian country code (+91)
- Firebase Phone Authentication with invisible reCAPTCHA
- 6-digit OTP verification with auto-submit
- Paste support for OTP fields
- Auto field navigation between digits
- OTP resend functionality
- Rate-limiting retry logic (too-many-requests handling)
- Mobile-specific network error detection
- Token exchange: Firebase ID token -> Backend JWT (access + refresh)
- Cookie-based token storage (30-day expiry)

### 1.2 Clinic Registration (Get Started)
- Organization name input
- Admin name + phone number
- OTP verification for clinic owner
- Testimonial carousel showing success stories
- Auto-redirect to dashboard on success

### 1.3 Session Management
- Token validation on app startup via `getMe()` API
- Automatic logout on invalid/expired tokens
- Auth state persistence via Redux + cookies
- 401 response interception with auto-logout

---

## 2. Multi-Clinic & Organization Management

### 2.1 Organization Layer
- Create and manage organization entity
- Organization name, slug, type, active status
- Organization-level data aggregation
- Multi-clinic ownership under one organization

### 2.2 Clinic Management
- Create multiple clinics under an organization
- Per-clinic: name, code, address, city, state, pincode, phone, email
- Unique clinic code for patient registration (QR-based)
- Clinic activation/deactivation
- Clinic-specific billing settings
- Clinic-specific service charges

### 2.3 Context Switching
- Three context modes: **Organization**, **Clinic**, **My Practice**
- Context switcher in header for seamless navigation
- API requests include `x-organization-id` and `x-clinic-id` headers
- Dashboard adapts to selected context
- Data isolation per clinic/organization

---

## 3. User & Role Management

### 3.1 Role-Based Access Control (RBAC)
- **Organization Owner** - Full access to organization + all clinics
- **Clinic Admin** - Admin access to a specific clinic
- **Physiotherapist** - Clinical staff with patient management
- **Receptionist** - Front-desk with appointment management

### 3.2 Permission System
- Resource + action based permissions
- Role CRUD operations
- Assign/unassign permissions per role
- Page-level access enforcement
- Feature gating by role

### 3.3 Team Management
- Phone-based user invitation
- Role selection (physiotherapist, receptionist)
- Clinic assignment with admin toggle
- Multi-clinic assignment per user
- Status tracking: pending, active, inactive
- Team member listing with role/clinic filters

---

## 4. Physiotherapist Profile

### 4.1 Basic Information
- Full name, license number, phone, email
- Address (city, state, pincode)
- Experience level: Fresher | Junior | Senior | Expert
- Years of experience
- Bio/description
- Languages spoken
- Profile completion tracking

### 4.2 Specializations
- Orthopedic, Neurological, Pediatric, Geriatric
- Sports, Cardiac, Pulmonary, Women's Health
- Pain Management, Rehabilitation
- Specialization-specific consultation fees

### 4.3 Education Management
- Institution, degree, education type
- Education level: Bachelor | Master | Doctorate | Post-Graduate | Certificate
- Start/end dates, currently studying toggle

### 4.4 Techniques & Expertise
- 30+ tracked techniques (manual therapy, exercise therapy, electrotherapy, etc.)
- Proficiency levels: Beginner | Intermediate | Advanced | Expert
- Years of practice per technique
- Certification details with expiry dates

### 4.5 Equipment/Machine Competency
- 20+ equipment types tracked
- Competency levels: Basic | Intermediate | Advanced | Certified
- Manufacturer and model tracking
- Certification status with dates

### 4.6 Workshops & Training
- Type: Training | Certification | Conference | Seminar | Webinar | Hands-on | CE
- Organizer, dates, duration, online/in-person toggle
- Certificate tracking, rating, notes

### 4.7 Photos & Media
- Profile photo, cover photo, gallery photos, signature
- Upload, list, delete operations
- Google Cloud Storage integration

### 4.8 Bank Account Details
- Account holder, account number, IFSC, bank name
- PAN number, Aadhaar number

---

## 5. Patient Management

### 5.1 Patient Registration
- **Quick Intake Modal** - Fast registration: name, phone, email, DOB, gender, emergency contact
- **Full Registration Modal** - Complete demographics, medical history (surgeries, illnesses, investigations), allergies, medications, insurance, occupation, activity level, family history, multiple conditions at registration
- **Public Self-Registration** - Via clinic code URL, no auth required

### 5.2 Patient Listing & Search
- List/Grid view toggle
- Search by name, phone, patient code
- Status filtering: ACTIVE | INACTIVE | DISCHARGED | PROSPECT
- Pagination (15-20 per page)
- Sort by registration date, name, last visit

### 5.3 Patient Profile
- **Overview Tab** - Stats, active conditions, diagnosis progress (4-step visual)
- **Conditions Tab** - Active/discharged conditions, VAS scores, urgency levels
- **Visits Tab** - Upcoming/completed appointments
- **History Tab** - Medical history, surgeries, medications, allergies
- **Settings Tab** - Edit contact info, insurance

### 5.4 Patient Quick Actions
- View details, Schedule visit, Quick intake
- Add condition (Dx), Billing, Clinical assessment
- Edit patient, View all visits

---

## 6. Condition & Diagnosis Management

### 6.1 Add Condition Workflow (Dx Launcher)
Three entry paths:
1. **Start Assessment** - In-clinic clinical screening via AI chatbot
2. **Send to Patient** - Generate link for patient self-assessment
3. **Quick Dx** - Manual diagnosis search and selection

### 6.2 Workflow Steps
1. **LAUNCHER** - One-tap entry with 3 buttons
2. **SYMPTOM_DX_LINK** - Patient-facing assessment link
3. **SYMPTOM_DX_FILL** - Staff fills in-clinic
4. **SYMPTOM_DX_COMPLETE** - AI analysis results
5. **CLINICAL_DX** - Full clinical screening
6. **COMPLETE** - Final diagnosis selection

### 6.3 Condition Features
- Draft condition creation with 48-hour expiry tokens
- Dual diagnosis method: SYMPTOM_AND_CLINICAL or CLINICAL_ONLY
- AI-powered condition recommendations with confidence scores
- Manual diagnosis search fallback
- SNOMED-CT & ICD-10 coding
- Body region classification

### 6.4 Condition Lifecycle
- **Statuses**: ACTIVE | IMPROVING | ON_HOLD | DISCHARGED
- **Discharge Reasons**: Goals Met | Patient Request | Improved Significantly | Resolved | Transferred | Non-Compliance | Financial | Other
- Discharge with summary and reason
- Reactivation from discharged state

### 6.5 Condition Database
- 30+ mapped conditions with full metadata
- Prevalence rankings, typical age ranges
- Severity variants with different timelines
- Red flags, contraindications, special tests per condition

---

## 7. AI-Powered Clinical Screening

### 7.1 Smart Screening Chatbot (~2900 lines)
- AI-powered questionnaire with 35+ dynamic questions
- Conversational interface with typing indicators
- Adaptive question flow based on responses

### 7.2 Question Types
- Yes/No, Single choice, Multi-choice
- VAS Sliders (pain scales)
- Body map selection (interactive SVG)
- ROM (Range of Motion) inputs
- MMT (Manual Muscle Testing)
- Observational questions
- Red flag screening questions

### 7.3 Screening Pathways
- Pain pathway
- Motor Control pathway
- Sensory pathway
- Mobility/ROM pathway
- Balance pathway
- Inflammation pathway
- Objective assessment pathway

### 7.4 Body Map Selector
- Interactive SVG-based anterior body diagram
- Center regions: Head, Neck, Chest, Abdomen, Lower back
- Bilateral regions: Shoulder, Upper arm, Forearm, Wrist, Hand, Hip, Thigh, Knee, Lower leg, Ankle, Foot
- Left/Right/Both laterality options
- Multi-region selection with limits
- Sub-region support

### 7.5 Screening Outputs
- Diagnosis results with confidence scores
- Clinical summary generation
- Red flag detection and alerts
- Referral pattern screening
- Differential diagnosis ranking
- Treatment urgency classification

### 7.6 Symptom Assessment (Patient-Facing)
- Patient-facing questionnaire
- Chief complaint, pain severity (VAS), symptom duration
- Body region selection
- AI analysis with top condition suggestions

---

## 8. Treatment Protocols & Care Plans

### 8.1 AI Protocol Generation
Five specialized AI agents:
1. **Physiotherapy Assessment Agent** - Movement patterns, functional capacity, biomechanical deficits
2. **Exercise Prescription Engine** - 2,847+ evidence-based exercises with tissue healing timelines
3. **Manual Therapy Protocol Generator** - Hands-on techniques and modality recommendations
4. **Rehabilitation Timeline Optimizer** - Phased recovery with outcome predictions
5. **Clinical Safety Validator** - Red flag screening and safety parameters

### 8.2 Protocol Types
- **Home Protocol** - Patient self-managed exercises
- **Clinical Protocol** - In-clinic supervised treatment

### 8.3 Protocol Configuration
- **Primary Focus**: Pain Relief | Function | Performance
- **Progression Approach**: Conservative | Standard | Aggressive
- **Patient Engagement**: High Motivation | Moderate | Needs Simple
- **Program Duration**: 4, 6, 8, or 12 weeks
- **Setting**: Home or Clinic

### 8.4 Protocol Structure
Each protocol contains:
- Treatment phases (2-4 phases with progression criteria)
- Exercises (sets, reps, hold times, frequency)
- Modalities (therapeutic interventions)
- Manual therapy techniques
- Goals per phase
- Safety status: SAFE | RED_FLAGS_PRESENT | CONTRAINDICATED
- AI confidence score

### 8.5 Protocol Lifecycle
- Draft -> Finalized -> Sent to Patient
- Version tracking with modification history
- PDF generation and email delivery
- Print support

### 8.6 Protocol Customization
- Enable/disable individual exercises, modalities, manual therapy
- Adjust sets, reps, frequency, intensity
- Add custom exercises not in database
- Add custom modalities and techniques
- Phase editor (add/edit/delete phases)
- Protocol logging for audit trail

### 8.7 Treatment History & Version Control
**Change Types Tracked:**
- INITIAL_CREATION
- AI_GENERATED_FROM_INSIGHTS
- MANUAL_UPDATE
- PHASE_PROGRESSION
- GOAL_ADJUSTMENT
- EXERCISE_MODIFICATION
- MODALITY_CHANGE
- PATIENT_REQUEST
- ADVERSE_REACTION

**Version Management:**
- Side-by-side version comparison
- Highlight changes in phases, goals, exercises, modalities
- Creator identification and timestamps
- Change reason documentation

---

## 9. Exercise Prescription Engine

### 9.1 Exercise Database
- **342+ evidence-based exercises**
- **7 specialty categories:**
  1. General Orthopedic (EX_001-EX_200)
  2. Aquatic Therapy (EX_201-EX_225)
  3. Women's Health (EX_226-EX_250)
  4. Ligament Rehabilitation (EX_251-EX_300)
  5. Cardiac-Respiratory (EX_301-EX_320)
  6. Neurological Rehabilitation (EX_321-EX_340)
  7. Orthopedic-Specific (EX_341-EX_342)

### 9.2 Exercise Parameters
- Name, type, body region, difficulty level
- Equipment: required and optional
- Dosage: sets, reps, hold duration, frequency, intensity
- Progression cues and advancement rules
- Load modifications
- Contraindications (absolute & relative)
- Evidence level, indications, ICF codes
- Muscle targets

### 9.3 Body Regions Covered
- Head & Neck
- Shoulder Complex
- Upper Arm
- Forearm & Hand
- Trunk & Core
- Hip & Pelvis
- Thigh
- Lower Leg
- Foot Intrinsic

---

## 10. Modalities & Manual Therapy

### 10.1 Modality Categories
- **Thermal**: Heat/Ice therapy, Cryotherapy
- **Electrical**: TENS, EMS, Interferential, NMES
- **Mechanical**: Ultrasound, Shockwave therapy
- **Manual**: Joint mobilizations, Soft tissue release, Dry needling
- **Robotic**: Lokomat, AlterG treadmill, Armeo Spring
- **Specialized**: Laser therapy, Hydrotherapy, Photobiomodulation

### 10.2 Equipment Database (50+ entries)
- High-end: Biodex System 4 Pro, AlterG Anti-Gravity Treadmill, Lokomat Pro, SMART Balance Master, Shockwave Unit, Class IV K-Laser
- Basic: Resistance bands, dumbbells, exercise balls, balance pads, foam rollers

### 10.3 Manual Therapy Categories
- **Mobilization**: Grade 1-4 joint mobilizations
- **Manipulation**: High-velocity, low-amplitude thrusts
- **Soft Tissue**: Myofascial release, trigger point therapy, massage
- **Neural**: Nerve mobilization, neural sliders
- **PNF**: Proprioceptive neuromuscular facilitation

### 10.4 Modality Parameters
- Intensity, duration, frequency
- Progression strategy
- Clinical supervision required flag
- Evidence level
- Indications & contraindications

---

## 11. Goal-Based Care Plans

### 11.1 Goal Types
- **Pain Management** - e.g., "Reduce pain from 8/10 to 3/10"
- **ROM Goals** - e.g., "Achieve 90 degree shoulder abduction"
- **Strength Goals** - e.g., "Quad strength >80% of contralateral"
- **Functional Goals** - e.g., "Return to work activities"
- **Sport-Specific Goals** - e.g., "Return to running"

### 11.2 Goal Tracking
- Priority levels: HIGH | MEDIUM | LOW
- Status: PENDING | IN_PROGRESS | ACHIEVED
- Target dates with deadline tracking
- Goal adjustment based on patient response/clinical insights

### 11.3 Phase-Aligned Goals
- Phase-specific goals (different per phase)
- Progression-based goal updates
- Patient compliance tracking
- Goal achievement documentation

### 11.4 Treatment Phases
- **Phase 1 - Acute/Pain Management** (0-4 weeks): Pain reduction, ROM maintenance, education
- **Phase 2 - Subacute/Early Mobility** (4-12 weeks): ROM restoration, early strengthening
- **Phase 3 - Functional/Strengthening** (8-16 weeks): Strength building, functional activities
- **Phase 4 - Advanced/Return to Function** (12-24 weeks): Sport-specific, performance optimization

### 11.5 Progression Criteria
- Pain level targets (e.g., <=6/10)
- ROM achievement thresholds
- Strength milestones (% of contralateral)
- Functional tests (hop tests, symmetry)
- Movement quality standards

---

## 12. Patient Tracking & Outcome Measures

### 12.1 Tracking Input Types
- **Numeric** - Single value measurements
- **Bilateral Numeric** - Left/right measurements
- **Scale** - 0-3, 0-5, 0-10 scales
- **MMT Grade** - 0-5 muscle strength grading
- **Select** - Dropdown selections
- **Select P/N** - Present/Negative for clinical findings
- **Toggle** - Yes/No boolean
- **Text** - Free-form notes
- **Timer** - Stopwatch for timed tests (hold times, test durations)
- **Questionnaire** - PROM administration
- **Slider** - Range input

### 12.2 Tracking Categories (Per Condition)
- Essential measures (VAS, NPRS)
- Function (disability indices, functional scales)
- ROM (range of motion by plane)
- Strength (muscle testing, strength ratios)
- Measurements (capsular patterns, painful arcs)
- Special tests (clinical examination findings)
- Vital signs (HR, BP, temperature, SpO2)

### 12.3 Patient-Reported Outcome Measures (PROMs) - 47+ Instruments

**Shoulder & Upper Extremity:**
- SPADI (Shoulder Pain & Disability Index)
- DASH (Disabilities of Arm, Shoulder, Hand) - 30 items
- QuickDASH - 11 items
- ASES (American Shoulder & Elbow Surgeons)
- PRTEE (Patient-Rated Tennis Elbow Evaluation)
- Constant Score

**Spine:**
- NDI (Neck Disability Index) - Cervical
- ODI (Oswestry Disability Index) - Lumbar
- RMDQ (Roland-Morris Disability Questionnaire)
- SRS-22 (Scoliosis Research Society)
- QuALEFfo-41 (Osteoporosis)

**Lower Extremity:**
- KOOS (Knee Injury & OA Outcome Score) - 42 items
- WOMAC (Western Ontario McMaster Universities OA Index)
- LEFS (Lower Extremity Functional Scale) - 20 items
- FAAM (Foot & Ankle Ability Measure) - 29 items
- HOOS (Hip Disability & OA Outcome Score)
- IKDC (International Knee Documentation Committee)
- Lysholm Knee Score
- Tegner Activity Scale
- FFI (Foot Function Index)
- FHSQ (Foot Health Status Questionnaire)
- CAIT (Cumberland Ankle Instability Tool)
- VISA-A / VISA-P (Achilles/Patellar Tendon)

**Pain & Function:**
- NRS (Numeric Rating Scale)
- PCS (Pain Catastrophizing Scale)
- TSK (Tampa Scale of Kinesiophobia)
- CPAQ (Chronic Pain Acceptance Questionnaire)

**Balance & Vestibular:**
- Berg Balance Scale
- ABC (Activities-specific Balance Confidence)
- DHI (Dizziness Handicap Inventory)

**General & Specialized:**
- SF-36, EQ-5D
- FIM (Functional Independence Measure)
- HAQ-DI (Health Assessment Questionnaire)
- HIT-6 (Headache Impact Test)
- SGRQ (St. George's Respiratory Questionnaire)
- FIQ (Fibromyalgia Impact Questionnaire)
- LymQoL (Lymphedema Quality of Life)
- BCTQ (Boston Carpal Tunnel Questionnaire)
- JFLS (Jaw Functional Limitation Scale)
- DSQ (Daily Sleep Questionnaire)
- PFDI-20 (Pelvic Floor Distress Inventory)
- FSFI (Female Sexual Function Index)
- PRWE (Patient-Rated Wrist Evaluation)

### 12.4 PROM Features
- Scoring with subscales and total scores
- MCID (Minimally Clinically Important Difference) values
- MDC (Minimal Detectable Change) values
- Score direction: Higher Better vs Higher Worse
- Estimated completion time (2-10 minutes)
- Validated populations per instrument
- Baseline and interval assessments
- Progress trending across visits

---

## 13. Appointment & Visit Management

### 13.1 Appointment Views
- **Grid View** - Card-based appointment cards
- **Calendar View** - Calendar-based scheduling
- **Table View** - Tabular listing

### 13.2 Appointment Filtering
- Date: Today | This Week | This Month | All | Custom Range
- Status: SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
- Search by patient name
- Pagination (20 per page)

### 13.3 Appointment Creation
- Patient selection (search or create new)
- Visit type: Initial Consultation | Follow-up | Review | Emergency
- Visit mode: Clinic | Home Visit | Online
- Chief complaint entry
- Duration: 15 | 30 | 45 | 60 minutes
- Therapist selection with availability check
- Date/time slot selection
- Home visit zone pricing (green/yellow/red)
- Online visit auto-creates video session

### 13.4 Appointment Status Flow
```
SCHEDULED -> [Check-in] -> IN_PROGRESS -> [Start Session] -> [Complete] -> COMPLETED
SCHEDULED -> CANCELLED (with reason)
SCHEDULED -> NO_SHOW
SCHEDULED -> RESCHEDULED -> SCHEDULED (new time)
```

### 13.5 Visit Detail Page
**Left Panel (60% - Golden Ratio):**
- Conditions section with treatment focus (PRIMARY/SECONDARY)
- Per condition: Condition card, Home protocol viewer, Clinical protocol viewer
- Condition tracking panel (tabbed by category)
- Condition action bar (generate protocol, add insight)
- Treatment history with version viewer

**Right Panel (40%):**
- Add Insight / Add Condition Note / Add Visit Note buttons
- Notes section (condition-specific + visit-level, SOAP formatted)
- Insights timeline (chronological clinical observations)
- Dietary section (AI-powered, collapsible)
- Past visits section (quick navigation)

### 13.6 Visit Completion Flow
1. Patient feedback modal (1-5 stars, comment, signature, skip option)
2. Session duration calculation
3. Auto-opens billing modal
4. End time recorded

---

## 14. Clinical Notes & Insights

### 14.1 Note Types
- **Condition Notes** - Specific to a condition within a visit
- **Visit Notes** - General visit-level observations
- **SOAP Notes** - Structured: Subjective, Objective, Assessment, Plan

### 14.2 Note Features
- Add during or after visit
- Edit before finalization
- Sign note with signature capture
- Timestamp tracking
- Audio recording -> transcription -> AI note generation

### 14.3 Clinical Insights
**Insight Types:**
- OBSERVATION (clinical findings)
- PROGRESS (positive changes)
- SETBACK (regression)
- MILESTONE (achievement)
- PATIENT_FEEDBACK (patient report)

**Insight Data:**
- Free-text insight entry (min 10 chars)
- Pain level (0-10)
- Functional status
- Patient compliance level
- Other notes

### 14.4 Insight-Driven Protocol Generation
- Select insights to base protocol updates on
- Specify phase/goals to emphasize
- Generate new protocol version from insights
- Track which insights were used

### 14.5 Audio Transcription
- In-app audio recording
- Audio-to-text transcription API
- Auto-generate SOAP/DAP notes from transcript

---

## 15. Dietary & Nutrition Management

### 15.1 AI-Powered Nutrition Suggestions
Generated based on: age, gender, allergies, medications, medical history, chief complaints, clinical notes, visit history

### 15.2 Nutrition Output
- **Recommended Foods** - With reasoning per item
- **Foods to Avoid** - With reasons
- **Meal Plans** - Breakfast, lunch, dinner, snacks
- **Supplements** - Name, dosage, reason
- **Hydration Guidelines**
- **Blood Tests Recommended** - Specific tests with reasons
- **General Guidelines & Precautions**

### 15.3 Food Contraindications
- Add food contraindications (item, reason, severity)
- Display flagged contraindications with severity levels
- Tab-based: Recommended | Avoid | Supplements | Contraindications

---

## 16. Billing & Payments

### 16.1 Billing Dashboard
- Daily summary KPIs (appointments, collections, outstanding)
- Quick actions: Record Payment | Session Pack | Services | Settings
- Date-based analysis

### 16.2 Visit Billing Workflow
1. Service selection (clinic/home visit)
2. Base charge + zone extra (home visits)
3. Additional services/add-ons
4. Tax calculation (IGST, CGST, SGST)
5. Payment recording (amount, method, reference)
6. Session pack application
7. Receipt generation (print/email)

### 16.3 Payment Methods
- Cash, Card, UPI, Cheque
- Reference number tracking
- Multiple payment batching

### 16.4 Session Packs
- Template management (name, sessions, validity, price, discount)
- Condition association (optional)
- Create and assign packs to patients
- Track sessions remaining vs total
- Expiry tracking

### 16.5 Clinic Services
- Service name and type (consultation, session, add-on)
- Clinic visit price vs Home visit price
- GST applicability
- Active/inactive status
- Display order management

### 16.6 Billing Reports
- Outstanding report (top 10 overdue patients)
- Recent payments history
- Active session packs
- Corporate outstanding tracking
- Billing summary row on appointment page (paid/outstanding/unbilled)

### 16.7 Billing Settings
- Default billing type (insurance, corporate, individual)
- Tax rates (IGST, CGST, SGST)
- Invoice formatting
- Receipt formatting
- Accepted payment methods
- Default fees & charges

---

## 17. Video Consultations

### 17.1 Agora RTC Integration
- Real-time video/audio communication
- Token-based secure access
- Automatic channel creation per visit
- Multi-participant support

### 17.2 Controls
- Toggle video on/off
- Toggle audio (mute/unmute)
- End call
- Switch front/back camera

### 17.3 Features
- Remote user video display
- Local video preview
- Call duration timer
- Session notes during/after call
- Auto-save notes with timestamp
- Copy notes to clipboard

### 17.4 Access Control
- Visit type validation (must be ONLINE)
- User access rights verification
- Dynamic token generation

---

## 18. Dashboard & Analytics

### 18.1 Organization Owner Dashboard
**KPIs:** Revenue this month, Total patients, Outstanding, Active cases

**Sections:**
- Monthly revenue chart (6-month trend, collections vs invoiced)
- Clinic performance comparison table
- Outstanding patients list (top 10 overdue, cross-clinic)

### 18.2 Clinic Admin Dashboard
**KPIs:** Today's appointments, Collected today, New patients, Outstanding

**Sections:**
- Today's appointments list (time, patient, doctor, status, quick actions)
- This week's collections bar chart
- Sessions ending soon (< 3 remaining, pack expiry)
- Outstanding payments (per patient, days overdue)

### 18.3 Physiotherapist Dashboard
**KPIs:** Today (completed/total), Pending, Active patients

**Sections:**
- My schedule today (time, patient, condition, sessions)
- Patients needing attention:
  - Last session (hasn't attended recently)
  - Treatment gap (days since last visit)
  - New patients (recently added)

### 18.4 Insights & Analytics Page
- **Demographics**: Age distribution histogram, gender breakdown
- **Top Conditions**: Bar chart of most common, body region distribution
- **Operations**: Peak hours heatmap, completion/cancellation/no-show rates, avg sessions per patient, avg visit duration
- **Monthly Trends**: 6-month condition prevalence graph

---

## 19. Clinical Outcomes

### 19.1 Summary Metrics (Org-Owner Only)
- Total conditions treated
- Resolved / Active / Improving conditions
- Recovery rate (%)
- Average sessions to recovery
- Treatment completion rate
- Average treatment duration (days)

### 19.2 Outcomes by Condition
- Per condition: total patients, resolved, active, improving
- Recovery rate per condition
- Average sessions needed

### 19.3 Outcomes by Therapist
- Per therapist: total patients, resolved, active
- Recovery rate per therapist
- Average sessions to recovery
- Completed visits count

---

## 20. Availability & Scheduling

### 20.1 Availability Slots
- Types: Clinic | Home Visit | Online
- Day of week selection (Sunday-Saturday)
- Start/end time per slot
- Slot duration: 15 | 30 | 45 | 60 minutes
- Default weekly template (one-click setup)

### 20.2 Home Visit Service Areas (Coordinate-Based)
- Center location (lat/lng)
- Service zones:
  - **Green** - Base rate (typically 5km)
  - **Yellow** - Extra charge (typically 15km)
  - **Red** - High extra charge (typically 25km)
- Travel charges per zone
- Multiple service areas supported

### 20.3 Legacy Service Locations (Pincode-Based)
- Base address and pincode
- Service pincodes list
- Zone configuration per pincode
- Extra charges per zone

### 20.4 Practice Settings
- Specializations selection
- Per-specialization pricing (consultation + home visit fees)
- Years of experience
- Clinic associations

---

## 21. Patient Self-Service

### 21.1 Public Patient Registration
- Clinic code-based URL (`/register/[clinicCode]`)
- No authentication required
- Data collected: name, phone, DOB, gender, email (optional), address (optional), emergency contact (optional)
- Validation for Indian phone numbers
- Success page with patient code

### 21.2 Clinic Agent (AI Registration)
- Clinic-specific branded AI experience (`/clinic-agent/[clinicCode]`)
- Full-screen conversational chat interface
- Guided patient intake via AI
- Patient record generation

### 21.3 Symptom Assessment Link
- Generate patient-facing assessment link
- 48-hour expiry token
- Patient completes at own pace
- Results feed back into clinician workflow

### 21.4 Patient Video Call
- Dedicated patient-side video call page (`/patient-call/[visitId]`)
- No dashboard access required
- Token-based secure access

---

## 22. Technical Infrastructure

### 22.1 Core Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.2.8 (App Router) |
| UI Library | React 19.0.0 |
| Styling | Tailwind CSS 3.4.3 |
| Component Primitives | Radix UI |
| Component Library | Mantine 8.2.5 |
| State Management | Redux Toolkit 2.5.0 |
| Form Handling | React Hook Form 7.59.0 + Zod 3.25.67 |
| Auth | Firebase Phone Auth + JWT |
| AI/LLM | OpenAI (GPT-3.5-turbo) |
| Video | Agora RTC SDK 4.22.0 |
| Animations | Framer Motion 12.27.5 + GSAP 3.13.0 |
| Charts | Recharts 3.6.0 |
| Maps | Leaflet + React Leaflet 1.9.4 |
| Body Map | @mjcdev/react-body-highlighter |
| PDF | html2pdf.js + jsPDF |
| Icons | Lucide React |
| Notifications | Sonner (toast) |
| Calendar | React Day Picker + React Big Calendar |
| QR Codes | QR Code library |

### 22.2 API Architecture
- REST API client with Bearer token auth
- 459+ endpoint definitions
- Context headers for multi-tenant isolation
- File upload support (photos, audio)
- Public endpoints for unauthenticated access
- 401 response interception with auto-logout

### 22.3 State Management (Redux Slices)
- `auth.slice` - Authentication state
- `user.slice` - Current user data
- `organization.slice` - Organization list
- `clinic.slice` - Clinic list
- `availability.slice` - Scheduling data
- `treatment-protocol.slice` - Protocol management (~14K lines)
- `appointmentDetails.slice` - Visit state (~18K lines)
- `analytics.slice` - Analytics data
- `practice.slice` - Practice settings

### 22.4 Testing
- **Unit**: Jest 30.2.0 + Testing Library
- **E2E**: Playwright 1.58.2
- **API Mocking**: MSW 2.12.9

### 22.5 Security
- Firebase Phone Auth with reCAPTCHA
- JWT token exchange and storage
- Role-based page access enforcement
- Organization/clinic data isolation
- Rate limiting handling
- Public API separation

---

## Feature Count Summary

| Category | Count |
|----------|-------|
| Authentication flows | 3 (OTP login, clinic registration, patient registration) |
| User roles | 4 (Owner, Admin, Physio, Receptionist) |
| Profile sections | 8 (Info, Specializations, Education, Techniques, Equipment, Workshops, Photos, Bank) |
| Patient registration paths | 3 (Quick intake, Full modal, Public self-registration) |
| Diagnosis entry methods | 3 (AI screening, Patient assessment, Quick Dx) |
| AI screening pathways | 7 (Pain, Motor, Sensory, Mobility, Balance, Inflammation, Objective) |
| Protocol AI agents | 5 |
| Exercises in database | 342+ |
| Exercise specialty categories | 7 |
| Equipment types | 50+ |
| PROM instruments | 47+ |
| Tracking input types | 11 |
| Insight types | 5 |
| Note types | 3 (Condition, Visit, SOAP) |
| Billing features | 7 (Visit billing, payments, packs, services, settings, reports, corporate) |
| Dashboard views | 3 (Org owner, Clinic admin, Physiotherapist) |
| Analytics sections | 4 (Demographics, Conditions, Operations, Trends) |
| API endpoints | 459+ |
| Redux slices | 9 |
| Treatment phases | 4 (Acute, Subacute, Functional, Advanced) |
| Protocol change types | 9 |
| Visit statuses | 5 (Scheduled, In-Progress, Completed, Cancelled, No-Show) |
| Condition statuses | 4 (Active, Improving, On Hold, Discharged) |

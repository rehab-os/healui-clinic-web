# How to Use AI Protocol Generator

**Feature:** AI-Powered Treatment Protocol Generation
**Status:** ✅ Active and Working
**Updated:** 2026-02-09

---

## 🎯 What It Does

The AI Protocol Generator creates personalized treatment protocols by analyzing:
- Patient demographics and medical history
- Condition severity and functional limitations
- Evidence-based exercise prescriptions
- Clinical guidelines and best practices

It can generate:
- **Home Exercise Programs (HEP)** - For patient self-management
- **Clinical Treatment Protocols** - For in-clinic therapy sessions
- **Both simultaneously** - Complete treatment plan

---

## 📍 Two Ways to Access

### Method 1: From Patient Dashboard (Recommended)
### Method 2: During a Visit/Appointment

---

## 🚀 Method 1: From Patient Dashboard

### Step-by-Step Instructions:

#### 1. Navigate to Patients Page
```
Dashboard → Patients (from sidebar)
```

#### 2. Select a Patient
- Click on any patient from the list
- This opens the Patient Details modal

#### 3. Go to Conditions Tab
- In the patient details modal
- Click on the **"Conditions"** tab
- You'll see a list of the patient's conditions

#### 4. Find the Sparkles Icon ✨
For each condition card, you'll see action buttons:
- **Edit button** (pencil icon)
- **✨ Sparkles button** ← THIS ONE! (Generate AI Protocol)
- **Discharge button** (logout icon)

#### 5. Click the Sparkles Button
- Look for the button with the `✨ Sparkles` icon
- Tooltip says: **"Generate AI Protocol"**
- Click it!

#### 6. Protocol Generator Modal Opens
You'll see the AI Protocol Generator interface.

---

## 🏥 Method 2: From Visit/Appointment Page

### Step-by-Step Instructions:

#### 1. Navigate to Appointments
```
Dashboard → Appointments (from sidebar)
```

#### 2. Select an Appointment
- Click on any scheduled appointment
- Or select from the visit list

#### 3. Open Visit Details
- You'll be on the visit page for that patient
- URL pattern: `/dashboard/appointments/[patientId]/[appointmentId]`

#### 4. Find the Condition Section
- Scroll to the patient's conditions section
- You'll see their active conditions listed

#### 5. Click "Generate Protocol" Button
- Look for button with `✨ Sparkles` icon
- Text says: "AI Generate Protocol" or similar
- Click it!

#### 6. Protocol Generator Opens
The modal will appear with the AI generation interface.

---

## 🎨 Using the Protocol Generator

Once the modal opens, follow these steps:

### Step 1: **Selection** (Choose Protocol Type)

You'll see two cards:

#### 🏠 Home Protocol
- Patient performs exercises at home
- No special equipment needed
- Focus on self-management
- Patient education included

#### 🏥 Clinical Protocol
- In-clinic treatment sessions
- Uses clinic equipment
- Manual therapy techniques
- Modality prescriptions (TENS, ultrasound, etc.)

**Action:** Click one or both cards to select

---

### Step 2: **Preferences** (Optional)

Set protocol preferences:

- **Primary Focus:**
  - Function (default)
  - Pain management
  - Strength
  - Mobility

- **Progression Approach:**
  - Standard (default)
  - Conservative
  - Aggressive

- **Patient Engagement:**
  - Low
  - Moderate (default)
  - High

- **Program Duration:**
  - 2 weeks
  - 4 weeks
  - 6 weeks (default)
  - 8 weeks
  - 12 weeks

---

### Step 3: **Generate** (AI Processing)

Click **"Generate Protocols"** button.

You'll see animated AI agents working:

1. **Physiotherapy Assessment Agent** 🤖
   - Analyzing movement patterns
   - Evaluating functional capacity
   - Processing biomechanical deficits

2. **Exercise Prescription Agent** 💪
   - Selecting evidence-based exercises
   - Determining optimal dosage
   - Planning progression strategy

3. **Evidence Integration Agent** 📚
   - Reviewing clinical practice guidelines
   - Applying research evidence
   - Ensuring best-practice protocols

4. **Progression Strategy Agent** 📈
   - Creating phased approach
   - Setting progression criteria
   - Planning discharge timeline

5. **Documentation Agent** 📝
   - Compiling comprehensive protocol
   - Generating patient instructions
   - Creating clinician notes

**Wait time:** ~30-60 seconds (AI processing)

---

### Step 4: **Review** (Generated Protocol)

Once generated, you'll see:

#### For Home Protocol:
```
✅ Exercise List
  - Exercise name
  - Photo/illustration
  - Sets × Reps
  - Duration
  - Frequency (per day/week)
  - Instructions

✅ Treatment Phases
  - Week 1-2: Phase goals
  - Week 3-4: Progression
  - Week 5-6: Advanced exercises

✅ Home Management
  - Self-care instructions
  - Ice/heat application
  - Activity modifications

✅ Patient Education
  - What to expect
  - Warning signs
  - When to contact therapist

✅ Safety Precautions
  - Contraindications
  - Red flags
  - Precautions
```

#### For Clinical Protocol:
```
✅ Clinical Exercises
  - Equipment-based exercises
  - Resistance training
  - Functional activities

✅ Manual Therapy
  - Joint mobilizations
  - Soft tissue techniques
  - Stretching protocols

✅ Modalities
  - Ultrasound
  - TENS
  - Hot/cold therapy
  - Electrical stimulation

✅ Treatment Phases
  - Week-by-week plan
  - Progression criteria
  - Frequency of visits

✅ Outcome Measures
  - Tests to track progress
  - Functional goals
  - Discharge criteria
```

---

### Step 5: **Customize** (Optional)

If you want to modify the generated protocol:

#### Click "Customize" Button

You can edit:

**Exercises:**
- Change sets/reps
- Modify duration
- Adjust frequency
- Add notes
- Remove exercises
- Add new exercises

**Modalities:**
- Change parameters
- Adjust duration
- Modify frequency

**Manual Therapy:**
- Edit techniques
- Adjust dosage
- Add instructions

**Treatment Phases:**
- Reorder phases
- Change timelines
- Modify progression criteria

**Use the Customization Interface:**
- Left panel: Exercise library
- Center: Current protocol
- Right: Exercise details
- Drag & drop to reorder
- Click edit icon to modify

---

### Step 6: **Save**

Once satisfied with the protocol:

#### Click "Save Protocol" Button

The protocol will be:
- ✅ Saved to the patient's condition record
- ✅ Available in patient history
- ✅ Linked to current visit (if in visit context)
- ✅ Ready to print/export as PDF
- ✅ Accessible for future reference

#### Success Notification
You'll see: "Protocol Generated! Home/Clinical protocol successfully generated"

---

## 🔍 Visual Cues to Look For

### In Patient Conditions List:

Each condition card has these buttons (left to right):
1. **📝 Edit** (pencil icon) - Edit condition details
2. **✨ Sparkles** (sparkles icon) - **AI PROTOCOL GENERATOR** ← THIS ONE!
3. **🚪 Discharge** (logout icon) - Discharge condition

### The Sparkles Button:
```
┌──────────────────────────────────────┐
│  Condition Name                      │
│  Body Region • Severity • Date       │
│                                      │
│  [ 📝 ] [ ✨ ] [ 🚪 ]               │
│   Edit  Generate  Discharge          │
└──────────────────────────────────────┘
```

**Tooltip:** "Generate AI Protocol"
**Icon:** ✨ Sparkles (indicates AI/magic feature)
**Color:** Blue/teal accent (healui-primary)

---

## 📋 Prerequisites

Before you can generate a protocol, ensure:

### ✅ Patient Must Have:
1. **Basic demographics** (name, age, gender)
2. **At least one condition** added
3. **Condition details:**
   - Condition name
   - Body region
   - Severity level (optional but helps)
   - Pain level (VAS score)
   - Onset date

### ✅ Optimal Results Require:
- Patient's activity level
- Medical history
- Previous surgeries
- Current medications
- Initial assessment data
- Functional limitations

**Note:** The AI will work with minimal data, but more information = better protocols!

---

## 🎯 Quick Start Checklist

- [ ] 1. Go to **Dashboard → Patients**
- [ ] 2. Select a patient
- [ ] 3. Click **Conditions** tab
- [ ] 4. Find condition card
- [ ] 5. Click **✨ Sparkles button**
- [ ] 6. Select Home/Clinical protocol
- [ ] 7. (Optional) Adjust preferences
- [ ] 8. Click **Generate**
- [ ] 9. Wait for AI processing
- [ ] 10. Review generated protocol
- [ ] 11. (Optional) Customize
- [ ] 12. Click **Save**
- [ ] 13. Done! ✅

---

## 💡 Tips & Best Practices

### For Best Results:

1. **Complete Patient Profile**
   - Fill in demographics completely
   - Add medical history
   - Note current medications
   - Record activity level

2. **Detailed Condition Information**
   - Include initial assessment
   - Add functional limitations
   - Note red flags if any
   - Record differential diagnosis

3. **Set Realistic Preferences**
   - Match patient engagement level
   - Consider patient's schedule
   - Align with treatment goals

4. **Review Before Saving**
   - Check exercise appropriateness
   - Verify dosage parameters
   - Ensure safety considerations
   - Confirm progression timeline

5. **Customize When Needed**
   - Adjust for patient preferences
   - Modify for available equipment
   - Adapt for specific limitations
   - Personalize instructions

---

## ⚠️ Troubleshooting

### Modal Doesn't Open
- ✅ Check if condition has required data
- ✅ Ensure patient has demographic info
- ✅ Check browser console for errors
- ✅ Refresh the page and try again

### Generation Fails
- ✅ Verify API connection (check network tab)
- ✅ Ensure condition_id is valid
- ✅ Check if patient data is complete
- ✅ Look for error notification message

### Can't Find Sparkles Button
- ✅ Make sure you're in Conditions tab
- ✅ Check if condition is active (not discharged)
- ✅ Scroll through the condition list
- ✅ Look for button next to Edit button

### Slow Generation
- ✅ AI processing takes 30-60 seconds (normal)
- ✅ Complex conditions may take longer
- ✅ Watch the AI agent progress indicators
- ✅ Don't refresh page during generation

---

## 📱 Mobile/Tablet Access

The feature is fully responsive:
- **Desktop:** Full interface with drag & drop
- **Tablet:** Touch-friendly, all features available
- **Mobile:** Optimized layout, swipe gestures

**Recommendation:** Use desktop/tablet for best customization experience

---

## 🎓 Training Resources

### For New Users:
1. Start with simple conditions (ankle sprain, back pain)
2. Generate home protocols first (simpler)
3. Review generated protocols before customizing
4. Compare multiple generations to learn AI patterns

### For Advanced Users:
- Customize protocols extensively
- Create templates for common conditions
- Use both home + clinical for comprehensive plans
- Export protocols for documentation

---

## 📞 Need Help?

### If you have issues:
1. Check this guide first
2. Review error messages in browser console
3. Verify patient and condition data is complete
4. Check API connectivity

### Common Questions:

**Q: Can I generate multiple protocols for the same condition?**
A: Yes! Generate as many as needed. Each is saved separately.

**Q: Can I edit a protocol after saving?**
A: Yes, open it from the condition history and regenerate with changes.

**Q: Does it work offline?**
A: No, requires API connection for AI processing.

**Q: How long does generation take?**
A: Typically 30-60 seconds, depending on complexity.

**Q: Can I print the protocol?**
A: Yes! Use the download/print button in the protocol view.

---

## ✅ Summary

**To invoke AI Protocol Generator:**

1. **Go to:** Dashboard → Patients → Select Patient → Conditions Tab
2. **Click:** ✨ Sparkles button on any condition card
3. **Select:** Home and/or Clinical protocol
4. **Generate:** Click generate button
5. **Review:** Check the AI-generated protocol
6. **Save:** Save to patient record

**Button Location:** Next to Edit button on condition cards
**Icon:** ✨ Sparkles (AI/magic indicator)
**Time:** ~30-60 seconds for generation

---

**Last Updated:** Phase 7 - Documentation
**Feature Status:** ✅ Production Ready
**Build Status:** ✅ Passing

Happy Protocol Generating! 🎉

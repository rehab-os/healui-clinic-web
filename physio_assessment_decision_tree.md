# Physiotherapy Initial Assessment - Adaptive Questionnaire Flow

## Core Principles
1. **Start broad, then narrow down** - Begin with chief complaints to determine pathway
2. **Skip irrelevant sections** - Don't ask pain questions if no pain exists
3. **Use conditional branching** - Each answer determines next questions
4. **Maintain clinical relevance** - Only ask questions that help diagnosis
5. **Progressive disclosure** - More detailed questions only when needed

## Primary Decision Tree Structure

### LEVEL 1: Chief Complaint Gateway
**Question:** "What brings you in today? Please describe your main concern(s)."

**Analysis Points:**
- Keywords: pain, weakness, stiffness, numbness, balance, movement difficulty
- Multiple complaints allowed
- Determines primary assessment pathway

**Branching Logic:**
```
IF mentions "pain" → Go to Pain Pathway
IF mentions "weakness/strength" → Go to Motor Pathway  
IF mentions "numbness/tingling" → Go to Sensory Pathway
IF mentions "stiffness/tightness" → Go to Mobility Pathway
IF mentions "balance/falling" → Go to Balance Pathway
IF mentions "swelling" → Go to Inflammation Pathway
IF multiple → Prioritize and combine pathways
```

---

## PATHWAY A: Pain Assessment (If pain mentioned)

### A1: Pain Location
**Question:** "Where exactly do you feel the pain? (You can select multiple areas)"
- Options: Interactive body map or structured list
- Captures: Primary and radiating pain sites

### A2: Pain Nature
**Question:** "How would you describe your pain?"
- Sharp/Stabbing
- Dull/Aching
- Burning
- Throbbing
- Cramping
- Other (specify)

### A3: Pain Timing
**Question:** "When do you experience this pain?"
- Constant
- Intermittent
- Morning
- Evening/Night
- During activity
- At rest

### A4: VAS Score
**Question:** "On a scale of 0-10, how would you rate your pain?"
- 0-3: Mild → May skip some detailed pain questions
- 4-6: Moderate → Full pain assessment
- 7-10: Severe → Comprehensive assessment + urgent markers

### A5: Movement Relationship
**Question:** "How does movement affect your pain?"
- Increases with movement
- Decreases with movement
- No change
- Depends on type of movement

**IF increases with movement:**
### A6: Aggravating Factors
**Question:** "What specific movements or activities make it worse?"
- Bending forward/backward
- Twisting
- Lifting
- Walking
- Sitting/Standing
- Specific activities (specify)

### A7: Relieving Factors
**Question:** "What helps reduce your pain?"
- Rest
- Ice/Heat
- Medication
- Specific positions
- Gentle movement
- Nothing helps

---

## PATHWAY B: Motor Assessment (If weakness/strength issues)

### B1: Weakness Location
**Question:** "Where do you feel weak or have difficulty with strength?"
- Upper limb (specify)
- Lower limb (specify)
- Core/Trunk
- General/whole body

### B2: Functional Impact
**Question:** "What activities are difficult due to weakness?"
- Walking
- Stairs
- Lifting objects
- Rising from chair
- Overhead activities
- Grip/holding items

**Based on location → Proceed to relevant MMT questions**

---

## PATHWAY C: Sensory Assessment (If numbness/tingling)

### C1: Sensation Type
**Question:** "What kind of sensation changes are you experiencing?"
- Numbness
- Tingling/Pins and needles
- Burning
- Hypersensitivity
- Complete loss of feeling

### C2: Distribution
**Question:** "Where do you feel these sensations?"
- Follows nerve path → Neurodynamic tests
- Random pattern → Different assessment
- Glove/stocking → Systemic evaluation

---

## OBJECTIVE ASSESSMENT TRIGGERS

### Tenderness Assessment
**Trigger:** If pain location identified
**Question:** "I'll need to check - is the area tender to touch?"
- Yes → Document specific points
- No → Note absence

### Swelling Assessment
**Trigger:** If injury/trauma mentioned OR visible swelling
**Question:** "Is there any swelling in the affected area?"
- Yes → Measure girth
- No → Skip girth measurement

### ROM Assessment
**Trigger:** Based on affected area and complaints
**Active ROM First:** "Can you show me how far you can move [body part]?"
- Limited → Check passive ROM
- Full → May skip passive ROM

**Passive ROM:** Only if active ROM limited
"Let me help you move it - tell me if there's pain or resistance"

### Special Tests
**Trigger:** Based on suspected condition from previous answers
**Examples:**
- Shoulder pain + overhead limitation → Impingement tests
- Knee pain + instability → Ligament tests
- Back pain + leg symptoms → Neural tension tests

---

## FUNCTIONAL ASSESSMENT TRIGGERS

### Gait Analysis
**Trigger if ANY of:**
- Lower limb complaints
- Balance issues
- Back pain affecting walking
- Neurological symptoms

**Skip if:**
- Upper limb only issue
- Non-ambulatory patient

### Posture Assessment
**Trigger if:**
- Spinal complaints
- Chronic pain
- Work-related issues
- Balance problems

### ADL Score
**Trigger:** Based on functional limitations mentioned
**Questions scaled to relevance:**
- Basic ADLs if severe disability
- Instrumental ADLs if moderate
- Sport/work specific if high function

---

## SMART SKIP LOGIC RULES

### Complete Skip Scenarios:
1. **No Pain** → Skip all pain-related questions (A1-A7)
2. **Upper limb only** → Skip gait assessment
3. **Acute injury < 24hrs** → Skip tightness tests
4. **No neurological symptoms** → Skip dermatome, myotome, reflexes
5. **No swelling** → Skip girth measurement

### Conditional Assessments:
1. **Neurodynamic tests** → Only if nerve involvement suspected
2. **Special tests** → Only specific to suspected pathology
3. **Combined movements** → Only for spinal conditions
4. **MMT** → Focus on affected muscles only
5. **Reflexes** → Only if neurological signs

---

## IMPLEMENTATION FLOW EXAMPLE

### Scenario 1: Lower Back Pain
1. Chief complaint: "Lower back pain"
2. → Pain pathway activated
3. Location: "Lower back, sometimes to right leg"
4. → Neurological pathway added
5. VAS: "6/10"
6. → Full assessment needed
7. Movement: "Worse with bending"
8. → Specific movement tests
9. Sensation: "Occasional tingling in foot"
10. → Neurodynamic tests added
11. → Skip: Upper limb tests, cervical tests
12. → Include: Gait, posture, lumbar ROM, SLR test

### Scenario 2: Shoulder Weakness Post-Surgery
1. Chief complaint: "Shoulder weakness after surgery"
2. → Motor pathway activated
3. → Skip pain pathway initially
4. Weakness location: "Right shoulder"
5. Functional impact: "Can't lift arm overhead"
6. → Shoulder ROM tests
7. → Shoulder special tests
8. → Skip: Gait, lower limb tests
9. → Include: Posture, shoulder MMT

---

## CONCLUSION GENERATION

After collecting data, system should:

1. **Pattern Recognition:**
   - Match symptoms to common conditions
   - Identify red flags
   - Recognize referred pain patterns

2. **Differential Diagnosis:**
   - List possible conditions (ranked by probability)
   - Note supporting findings
   - Identify missing data needed

3. **Severity Classification:**
   - Acute vs Chronic
   - Severity level (Mild/Moderate/Severe)
   - Functional limitation level

4. **Recommended Actions:**
   - Further tests needed
   - Initial treatment approach
   - Referral requirements

---

## CHATBOT CONVERSATION STRUCTURE

### Opening:
"Hi! I'm here to help with your physiotherapy assessment. I'll ask you some questions to understand your condition better. Let's start with what's bothering you most."

### Transitions:
- "Based on what you've told me about [X], I need to ask about..."
- "Since you mentioned [symptom], let's explore that further..."
- "That's helpful. Now let's check your [specific function]..."

### Skipping Explanations:
- "Since you don't have pain, we'll skip those questions and focus on..."
- "Given your symptoms are only in your [area], we won't need to assess..."

### Closing:
"Thank you for providing all this information. Based on your responses, here's what I'm seeing: [summary]. Your physiotherapist will review this and may ask additional questions during your appointment."

---

## TECHNICAL IMPLEMENTATION NOTES

### Data Structure:
```json
{
  "assessment_id": "unique_id",
  "pathways_activated": ["pain", "motor"],
  "skipped_sections": ["gait", "reflexes"],
  "responses": {
    "chief_complaint": "text",
    "pain_data": {},
    "objective_findings": {},
    "functional_status": {}
  },
  "provisional_diagnosis": [],
  "completion_percentage": 85
}
```

### Validation Rules:
- Mandatory: Chief complaint
- Conditional mandatory: If pain → VAS score required
- Optional but recommended: Based on condition
- Auto-calculate: Which tests are relevant

### UI/UX Considerations:
- Show progress bar
- Allow back navigation
- Save partial assessments
- Provide tooltips for medical terms
- Visual body maps for location selection
- Voice input option for detailed descriptions
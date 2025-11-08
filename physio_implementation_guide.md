# Physiotherapy Assessment Chatbot - Implementation Guide

## JavaScript/React Implementation Example

```javascript
// Assessment Flow Controller
class PhysioAssessmentFlow {
  constructor() {
    this.currentStep = 'chief_complaint';
    this.responses = {};
    this.activatedPathways = new Set();
    this.skippedSections = new Set();
    this.questionQueue = [];
  }

  // Main decision engine
  async processResponse(stepId, response) {
    // Store response
    this.responses[stepId] = response;
    
    // Determine next steps based on response
    const nextSteps = this.determineNextSteps(stepId, response);
    
    // Add to queue
    this.questionQueue.push(...nextSteps);
    
    // Return next question
    return this.getNextQuestion();
  }

  determineNextSteps(stepId, response) {
    const decisionMap = {
      'chief_complaint': () => this.analyzeChiefComplaint(response),
      'pain_present': () => response === 'yes' ? ['pain_location'] : this.skipPainPathway(),
      'pain_location': () => ['pain_nature', 'vas_score'],
      'vas_score': () => this.determinePainDepth(response),
      'weakness_location': () => this.determineMotorTests(response),
      'sensation_changes': () => this.determineNeuroTests(response)
    };

    return decisionMap[stepId] ? decisionMap[stepId]() : [];
  }

  analyzeChiefComplaint(complaint) {
    const text = complaint.toLowerCase();
    const steps = [];

    // Keyword analysis
    const painKeywords = ['pain', 'hurt', 'ache', 'sore', 'burning'];
    const weaknessKeywords = ['weak', 'strength', 'cant lift', 'difficulty'];
    const sensoryKeywords = ['numb', 'tingling', 'pins and needles'];
    const mobilityKeywords = ['stiff', 'tight', 'cant move', 'restricted'];
    const balanceKeywords = ['balance', 'fall', 'unsteady', 'dizzy'];

    if (painKeywords.some(keyword => text.includes(keyword))) {
      this.activatedPathways.add('pain');
      steps.push('pain_location');
    }

    if (weaknessKeywords.some(keyword => text.includes(keyword))) {
      this.activatedPathways.add('motor');
      steps.push('weakness_location');
    }

    if (sensoryKeywords.some(keyword => text.includes(keyword))) {
      this.activatedPathways.add('sensory');
      steps.push('sensation_type');
    }

    if (mobilityKeywords.some(keyword => text.includes(keyword))) {
      this.activatedPathways.add('mobility');
      steps.push('mobility_limitations');
    }

    if (balanceKeywords.some(keyword => text.includes(keyword))) {
      this.activatedPathways.add('balance');
      steps.push('balance_assessment');
    }

    // If no specific pathway, ask clarifying question
    if (steps.length === 0) {
      steps.push('clarify_symptoms');
    }

    return steps;
  }

  skipPainPathway() {
    const painSteps = ['pain_nature', 'pain_timing', 'vas_score', 
                       'pain_movement', 'aggravating_factors', 'relieving_factors'];
    painSteps.forEach(step => this.skippedSections.add(step));
    
    // Move to next relevant pathway
    if (this.activatedPathways.has('motor')) return ['weakness_location'];
    if (this.activatedPathways.has('sensory')) return ['sensation_type'];
    return ['functional_assessment'];
  }

  determinePainDepth(vasScore) {
    const score = parseInt(vasScore);
    
    if (score <= 3) {
      // Mild pain - abbreviated assessment
      this.skippedSections.add('detailed_pain_analysis');
      return ['pain_movement', 'functional_impact'];
    } else if (score <= 6) {
      // Moderate pain - standard assessment
      return ['pain_nature', 'pain_timing', 'pain_movement'];
    } else {
      // Severe pain - comprehensive assessment
      return ['pain_nature', 'pain_timing', 'pain_movement', 
              'aggravating_factors', 'relieving_factors', 'pain_pattern'];
    }
  }

  determineMotorTests(location) {
    const tests = [];
    
    if (location.includes('upper')) {
      tests.push('shoulder_mmt', 'elbow_mmt', 'grip_strength');
      this.skippedSections.add('gait_analysis');
    } else if (location.includes('lower')) {
      tests.push('hip_mmt', 'knee_mmt', 'ankle_mmt', 'gait_analysis');
    } else if (location.includes('core')) {
      tests.push('core_strength', 'posture_assessment');
    }
    
    return tests;
  }

  determineNeuroTests(response) {
    const tests = [];
    
    if (response.distribution === 'dermatomal') {
      tests.push('dermatome_assessment', 'myotome_assessment', 'reflex_testing');
    }
    
    if (response.includes('radiating')) {
      tests.push('neurodynamic_tests');
    }
    
    return tests;
  }
}

// Question Templates
const questionTemplates = {
  chief_complaint: {
    type: 'text',
    question: "What brings you in today? Please describe your main concern(s).",
    placeholder: "Describe your symptoms...",
    validation: (input) => input.length > 10
  },
  
  pain_location: {
    type: 'body_map',
    question: "Where exactly do you feel the pain? Click on the areas that hurt.",
    multiple: true,
    followUp: (locations) => {
      if (locations.includes('lower_back') && locations.includes('leg')) {
        return 'radiation_pattern';
      }
      return null;
    }
  },
  
  pain_nature: {
    type: 'multi_choice',
    question: "How would you describe your pain? Select all that apply.",
    options: [
      { value: 'sharp', label: 'Sharp/Stabbing' },
      { value: 'dull', label: 'Dull/Aching' },
      { value: 'burning', label: 'Burning' },
      { value: 'throbbing', label: 'Throbbing' },
      { value: 'cramping', label: 'Cramping' },
      { value: 'other', label: 'Other', requiresText: true }
    ]
  },
  
  vas_score: {
    type: 'slider',
    question: "On a scale of 0-10, how would you rate your pain right now?",
    min: 0,
    max: 10,
    labels: {
      0: 'No Pain',
      5: 'Moderate',
      10: 'Worst Possible'
    }
  },
  
  pain_movement: {
    type: 'single_choice',
    question: "How does movement affect your pain?",
    options: [
      { value: 'increases', label: 'Pain increases with movement' },
      { value: 'decreases', label: 'Pain decreases with movement' },
      { value: 'no_change', label: 'No change with movement' },
      { value: 'varies', label: 'Depends on the movement' }
    ],
    conditional: {
      'increases': ['aggravating_factors'],
      'decreases': ['relieving_factors'],
      'varies': ['specific_movements']
    }
  },
  
  aggravating_factors: {
    type: 'checklist',
    question: "What makes your pain worse? Check all that apply.",
    options: [
      'Bending forward',
      'Bending backward',
      'Twisting',
      'Lifting',
      'Walking',
      'Sitting',
      'Standing',
      'Lying down',
      'Stairs',
      'Reaching overhead'
    ]
  },
  
  functional_impact: {
    type: 'scale_grid',
    question: "How difficult are these activities for you?",
    scale: ['No difficulty', 'Mild', 'Moderate', 'Severe', 'Unable'],
    activities: [
      'Getting dressed',
      'Walking 10 minutes',
      'Climbing stairs',
      'Carrying groceries',
      'Work activities',
      'Recreational activities',
      'Sleeping'
    ]
  },
  
  gait_analysis: {
    type: 'observational',
    question: "Can you walk a few steps for me? I'll observe your walking pattern.",
    observations: [
      { id: 'limp', label: 'Limping observed' },
      { id: 'antalgic', label: 'Antalgic gait' },
      { id: 'trendelenburg', label: 'Trendelenburg sign' },
      { id: 'foot_drop', label: 'Foot drop' },
      { id: 'normal', label: 'Normal gait pattern' }
    ]
  }
};

// React Component Example
const AssessmentChatbot = () => {
  const [flow] = useState(new PhysioAssessmentFlow());
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Start with chief complaint
    const firstQuestion = questionTemplates.chief_complaint;
    setCurrentQuestion(firstQuestion);
    addToChat('bot', firstQuestion.question);
  }, []);

  const handleResponse = async (response) => {
    // Add user response to chat
    addToChat('user', formatResponse(response));
    
    // Process response and get next question
    setIsTyping(true);
    const nextStepId = await flow.processResponse(currentQuestion.id, response);
    
    setTimeout(() => {
      if (nextStepId) {
        const nextQuestion = questionTemplates[nextStepId];
        setCurrentQuestion(nextQuestion);
        addToChat('bot', nextQuestion.question);
      } else {
        // Assessment complete
        generateSummary();
      }
      setIsTyping(false);
    }, 800);
  };

  const addToChat = (sender, message) => {
    setChatHistory(prev => [...prev, { sender, message, timestamp: Date.now() }]);
  };

  const generateSummary = () => {
    const summary = {
      activatedPathways: Array.from(flow.activatedPathways),
      skippedSections: Array.from(flow.skippedSections),
      responses: flow.responses,
      completionRate: calculateCompletionRate(),
      provisionalAssessment: generateAssessment()
    };
    
    addToChat('bot', formatSummary(summary));
  };

  return (
    <div className="assessment-chatbot">
      <ChatWindow history={chatHistory} isTyping={isTyping} />
      <QuestionRenderer 
        question={currentQuestion}
        onSubmit={handleResponse}
      />
      <ProgressBar 
        completed={flow.responses}
        total={estimatedQuestions}
      />
    </div>
  );
};
```

## Python Backend Logic Example

```python
from dataclasses import dataclass
from typing import List, Dict, Optional, Set
from enum import Enum

class PathwayType(Enum):
    PAIN = "pain"
    MOTOR = "motor"
    SENSORY = "sensory"
    MOBILITY = "mobility"
    BALANCE = "balance"

@dataclass
class AssessmentNode:
    id: str
    question: str
    response_type: str
    required: bool = False
    conditional_on: Optional[Dict] = None
    leads_to: Optional[List[str]] = None
    skip_if: Optional[Dict] = None

class PhysioAssessmentEngine:
    def __init__(self):
        self.decision_tree = self._build_decision_tree()
        self.responses = {}
        self.active_pathways = set()
        self.skipped_nodes = set()
        self.question_queue = []
        
    def _build_decision_tree(self):
        return {
            'chief_complaint': AssessmentNode(
                id='chief_complaint',
                question="What brings you in today?",
                response_type='text',
                required=True,
                leads_to=['symptom_analysis']
            ),
            
            'pain_location': AssessmentNode(
                id='pain_location',
                question="Where is your pain located?",
                response_type='body_map',
                conditional_on={'pathway': PathwayType.PAIN},
                leads_to=['pain_nature', 'vas_score']
            ),
            
            'vas_score': AssessmentNode(
                id='vas_score',
                question="Rate your pain from 0-10",
                response_type='scale',
                conditional_on={'pathway': PathwayType.PAIN},
                leads_to=['pain_timing']
            ),
            
            'rom_active': AssessmentNode(
                id='rom_active',
                question="Show me how far you can move [joint]",
                response_type='measurement',
                conditional_on={'has_limitation': True},
                leads_to=['rom_passive']
            ),
            
            'special_tests': AssessmentNode(
                id='special_tests',
                question="Performing specific diagnostic tests",
                response_type='checklist',
                conditional_on={'suspected_pathology': True}
            )
        }
    
    def analyze_chief_complaint(self, complaint: str) -> List[PathwayType]:
        """Analyze text to determine which pathways to activate"""
        complaint_lower = complaint.lower()
        pathways = []
        
        # Keyword mapping
        keyword_pathway_map = {
            PathwayType.PAIN: ['pain', 'hurt', 'ache', 'sore', 'burning', 'sharp'],
            PathwayType.MOTOR: ['weak', 'strength', 'cant lift', 'paralysis'],
            PathwayType.SENSORY: ['numb', 'tingling', 'pins', 'needles', 'sensation'],
            PathwayType.MOBILITY: ['stiff', 'tight', 'restricted', 'cant move', 'frozen'],
            PathwayType.BALANCE: ['balance', 'fall', 'unsteady', 'dizzy', 'vertigo']
        }
        
        for pathway, keywords in keyword_pathway_map.items():
            if any(keyword in complaint_lower for keyword in keywords):
                pathways.append(pathway)
                
        return pathways
    
    def determine_next_questions(self, current_node: str, response: any) -> List[str]:
        """Determine next questions based on current response"""
        next_questions = []
        
        # Special logic for different scenarios
        if current_node == 'chief_complaint':
            pathways = self.analyze_chief_complaint(response)
            self.active_pathways.update(pathways)
            
            if PathwayType.PAIN in pathways:
                next_questions.append('pain_location')
            elif PathwayType.MOTOR in pathways:
                next_questions.append('weakness_location')
            elif PathwayType.SENSORY in pathways:
                next_questions.append('sensation_type')
                
        elif current_node == 'vas_score':
            score = int(response)
            if score <= 3:
                # Mild pain - skip detailed pain questions
                self.skip_questions(['pain_pattern', 'detailed_pain_analysis'])
                next_questions.append('functional_impact')
            elif score <= 6:
                # Moderate pain
                next_questions.extend(['pain_nature', 'pain_timing'])
            else:
                # Severe pain - comprehensive assessment
                next_questions.extend(['pain_nature', 'pain_timing', 
                                      'pain_pattern', 'aggravating_factors'])
                
        elif current_node == 'pain_location':
            locations = response
            if 'back' in locations and 'leg' in locations:
                # Possible radicular pain
                next_questions.append('neurological_screening')
                
        return next_questions
    
    def skip_questions(self, question_ids: List[str]):
        """Mark questions as skipped"""
        self.skipped_nodes.update(question_ids)
    
    def generate_clinical_impression(self) -> Dict:
        """Generate provisional diagnosis based on collected data"""
        impression = {
            'red_flags': self._check_red_flags(),
            'yellow_flags': self._check_yellow_flags(),
            'possible_conditions': self._differential_diagnosis(),
            'recommended_tests': self._recommend_special_tests(),
            'priority_level': self._determine_priority()
        }
        
        return impression
    
    def _check_red_flags(self) -> List[str]:
        """Check for serious pathology indicators"""
        red_flags = []
        
        if self.responses.get('pain_timing') == 'constant':
            if self.responses.get('pain_nature') == 'severe':
                red_flags.append('Constant severe pain - possible serious pathology')
                
        if self.responses.get('numbness_bilateral'):
            red_flags.append('Bilateral numbness - possible cauda equina')
            
        return red_flags
    
    def _differential_diagnosis(self) -> List[Dict]:
        """Generate differential diagnosis based on pattern recognition"""
        patterns = []
        
        # Example pattern matching
        if (self.responses.get('pain_location') == 'lower_back' and
            self.responses.get('pain_radiation') == 'leg' and
            self.responses.get('aggravated_by') == 'bending'):
            patterns.append({
                'condition': 'Lumbar Disc Herniation',
                'confidence': 0.75,
                'supporting_findings': ['Radiating pain', 'Aggravated by flexion']
            })
            
        return patterns

# Usage Example
if __name__ == "__main__":
    engine = PhysioAssessmentEngine()
    
    # Simulate assessment flow
    response = "I have lower back pain that goes down my leg"
    pathways = engine.analyze_chief_complaint(response)
    print(f"Activated pathways: {pathways}")
    
    next_questions = engine.determine_next_questions('chief_complaint', response)
    print(f"Next questions: {next_questions}")
```

## Database Schema

```sql
-- Assessment Sessions Table
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    therapist_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress',
    completion_percentage INTEGER DEFAULT 0,
    pathways_activated JSON,
    skipped_sections JSON
);

-- Assessment Responses Table
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES assessment_sessions(id),
    question_id VARCHAR(50) NOT NULL,
    question_text TEXT,
    response_type VARCHAR(20),
    response_value JSON,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_to_answer INTEGER -- in seconds
);

-- Clinical Impressions Table
CREATE TABLE clinical_impressions (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES assessment_sessions(id),
    provisional_diagnosis JSON,
    red_flags JSON,
    recommended_interventions JSON,
    priority_level VARCHAR(20),
    therapist_notes TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Flow Analytics Table
CREATE TABLE question_flow_analytics (
    id UUID PRIMARY KEY,
    from_question VARCHAR(50),
    to_question VARCHAR(50),
    transition_count INTEGER DEFAULT 1,
    avg_time_between INTEGER, -- in seconds
    skip_frequency DECIMAL(3,2)
);
```

## Key Implementation Considerations

1. **Natural Language Processing**
   - Use NLP for chief complaint analysis
   - Implement keyword extraction
   - Consider sentiment analysis for pain descriptions

2. **Adaptive Learning**
   - Track question effectiveness
   - Learn from therapist overrides
   - Optimize question sequences over time

3. **Clinical Safety**
   - Implement red flag detection
   - Mandatory questions for safety screening
   - Escalation protocols for urgent cases

4. **User Experience**
   - Progress indicators
   - Skip explanations
   - Save and resume functionality
   - Multilingual support

5. **Integration Points**
   - Existing EMR systems
   - Diagnostic equipment
   - Outcome measurement tools
   - Insurance coding systems

6. **Compliance**
   - HIPAA compliance
   - Clinical documentation standards
   - Professional practice guidelines
   - Audit trails
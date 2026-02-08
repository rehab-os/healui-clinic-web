# Chatbot Parts

This directory is prepared for refactoring large chatbot components.

## Refactoring Strategy for SmartScreeningChatbot (3542 lines)

### Suggested Sub-Components:
1. **ChatInterface.tsx** (~300 lines)
   - Main chat UI container
   - Message rendering
   - Input handling

2. **QuestionRenderer.tsx** (~400 lines)
   - Question type detection
   - Dynamic question rendering
   - Validation logic

3. **DiagnosisResults.tsx** (~500 lines)
   - Results display
   - Confidence indicators
   - Action buttons

4. **BodyMapStep.tsx** (~300 lines)
   - Body map selection UI
   - Pain point marking
   - Area highlighting

5. **ProgressTracker.tsx** (~200 lines)
   - Progress indicators
   - Step tracking
   - Completion percentage

### Extracted Hooks (screening/hooks/):
- `useScreeningFlow.ts` - Flow management
- `useQuestionLogic.ts` - Question handling
- `useDiagnosisEngine.ts` - Diagnosis computation
- `useBodyMapState.ts` - Body map state management

### Benefits:
- Easier testing (unit test each component)
- Better code reusability
- Improved performance (React can optimize smaller components)
- Easier maintenance

### Estimated Refactoring Time: 4-6 hours

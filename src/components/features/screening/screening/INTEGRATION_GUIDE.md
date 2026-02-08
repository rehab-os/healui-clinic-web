# Conversational Chatbot Integration Guide

This guide shows how to transform SmartScreeningChatbot.tsx to use the new conversational design.

## New Components Created

- `ChatMessage` - Message bubbles for bot/user/system messages
- `InlineClinicalQuestion` - Questions embedded in chat bubbles
- `ChatProgress` - Progress bar at bottom
- `SlidingSummaryPanel` - Summary panel that slides in
- `ClinicalChatbotLayout` - Overall layout wrapper

## Integration Steps

### 1. Update Imports

Add at the top of SmartScreeningChatbot.tsx:

```tsx
import {
  ChatMessage,
  InlineClinicalQuestion,
  ChatProgress,
  SlidingSummaryPanel,
  ClinicalChatbotLayout,
} from '@/components/screening';
```

### 2. Replace Main Render Logic

The current structure (lines 3103-3592) should be transformed to:

```tsx
return (
  <ClinicalChatbotLayout
    patientName={patientName}
    isComplete={isComplete}
    onReset={handleReset}
    onClose={onClose}
    showSummary={showSummaryPanel}
    onToggleSummary={() => setShowSummaryPanel(!showSummaryPanel)}
    summaryContent={
      <SlidingSummaryPanel
        isOpen={true}
        onClose={() => setShowSummaryPanel(false)}
        summary={{
          primaryArea: selectedRegions[0]?.label,
          painLevel: collectedData.vas_score,
          symptoms: Object.values(collectedData).filter(v => typeof v === 'string'),
          redFlags: detectedRedFlags,
          currentSection: currentClubLabel,
        }}
      />
    }
    progressComponent={
      <ChatProgress
        current={Object.keys(collectedData).length}
        total={totalSteps}
      />
    }
  >
    {/* Render all messages as chat bubbles */}
    {messages.map((msg) => (
      <ChatMessage
        key={msg.id}
        type={msg.type}
        content={msg.content}
        showAvatar={true}
      />
    ))}

    {/* Typing indicator */}
    {isTyping && (
      <ChatMessage
        type="bot"
        content={<div className="flex gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} /></div>}
        showAvatar={true}
      />
    )}

    {/* Current question embedded in bot message */}
    {currentQuestion && !isTyping && !isProcessing && clubbedQuestions.length === 0 && (
      <ChatMessage
        type="bot"
        content={
          <InlineClinicalQuestion
            question={currentQuestion.question}
            type={
              currentQuestion.type === 'yes_no' ? 'yes-no' :
              currentQuestion.type === 'slider' ? 'vas-slider' :
              currentQuestion.type === 'single_choice' || currentQuestion.type === 'multi_choice' ? 'multiple-choice' :
              'text'
            }
            options={currentQuestion.options}
            value={currentResponse}
            onChange={setCurrentResponse}
            onSubmit={() => handleSubmit()}
            disabled={isProcessing}
          />
        }
        showAvatar={true}
      />
    )}

    {/* Clubbed questions */}
    {clubbedQuestions.length > 0 && !isTyping && !isProcessing && (
      <ChatMessage
        type="bot"
        content={
          <div className="space-y-5">
            <p className="text-base font-semibold text-gray-800">{currentClubLabel}</p>
            {clubbedQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <InlineClinicalQuestion
                  question={q.question}
                  type={
                    q.type === 'yes_no' ? 'yes-no' :
                    q.type === 'slider' ? 'vas-slider' :
                    q.type === 'single_choice' || q.type === 'multi_choice' ? 'multiple-choice' :
                    'text'
                  }
                  options={q.options}
                  value={clubbedResponses[q.id]}
                  onChange={(value) => setClubbedResponses({ ...clubbedResponses, [q.id]: value })}
                  disabled={isProcessing}
                />
              </div>
            ))}
            <button
              onClick={handleClubbedSubmit}
              disabled={isProcessing || !isClubComplete}
              className="w-full rounded-xl p-5 font-semibold text-base
                bg-gradient-to-br from-brand-teal to-teal-600 text-white
                hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        }
        showAvatar={true}
      />
    )}

    {/* Processing indicator */}
    {isProcessing && (
      <ChatMessage
        type="system"
        content="Analyzing your responses..."
      />
    )}

    {/* Diagnosis results */}
    {isComplete && diagnosisResult && (
      <div className="space-y-4 py-4">
        <ChatMessage
          type="system"
          content="✨ Assessment Complete"
        />
        {renderDiagnosisResults()}
      </div>
    )}

    <div ref={chatEndRef} />
  </ClinicalChatbotLayout>
);
```

## Key Changes

### Before (Current Design)
- Questions shown as cards in a form-like layout
- Summary always visible on desktop (lg:col-span-2)
- Progress bar in header
- Separate sections for questions, messages, summary

### After (Conversational Design)
- Questions embedded in chat bubbles
- Summary slides in when needed
- Progress bar at bottom of chat
- Single unified conversation flow
- Comfortable chat-like experience

## Benefits

1. **More Natural**: Feels like talking to a clinician
2. **Better Mobile**: Single column, easy to scroll
3. **Clearer Context**: See question history in chat
4. **Less Overwhelming**: Progressive disclosure
5. **Modern UX**: Matches user expectations for AI chat

## Migration Notes

- Keep all SmartScreeningEngine logic untouched
- Keep all state management (useState, useEffect) intact
- Only change the render/UI layer
- Preserve all clinical pathways and question flow
- Maintain compatibility with SymptomDx integration

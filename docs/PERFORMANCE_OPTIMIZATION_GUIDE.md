# Performance Optimization Guide

**Created:** Phase 6 - Performance Optimization
**Status:** Infrastructure Ready, Refactoring Planned

---

## 🎯 Current Status

### ✅ Completed (Phase 6)
- [x] Barrel files created for all 15 feature folders
- [x] LazyComponents.tsx infrastructure for code splitting
- [x] Sub-component directories created with refactoring guides
- [x] Performance monitoring infrastructure

### 🔄 Planned (Future Work)
- [ ] Refactor SmartScreeningChatbot (3542 lines → ~5 components)
- [ ] Refactor PhysioAssessmentChatbot (2478 lines → ~4 components)
- [ ] Split TreatmentProtocolModal (1794 lines → ~3 components)
- [ ] Optimize bundle size further

---

## 📊 Large Components Analysis

### 🔴 **Critical (>2000 lines)**

#### 1. SmartScreeningChatbot.tsx (3542 lines)
**Location:** `src/components/features/screening/SmartScreeningChatbot.tsx`

**Issues:**
- Too large for efficient re-rendering
- Hard to test individual features
- Difficult to maintain

**Refactoring Plan:**
1. Extract to `screening/chatbot-parts/`:
   - `ChatInterface.tsx` (~300 lines) - UI container
   - `QuestionRenderer.tsx` (~400 lines) - Question rendering
   - `DiagnosisResults.tsx` (~500 lines) - Results display
   - `BodyMapStep.tsx` (~300 lines) - Body map UI
   - `ProgressTracker.tsx` (~200 lines) - Progress display

2. Extract custom hooks to `screening/hooks/`:
   - `useScreeningFlow.ts` - Flow state management
   - `useQuestionLogic.ts` - Question handling
   - `useDiagnosisEngine.ts` - Diagnosis computation
   - `useBodyMapState.ts` - Body map state

**Estimated Time:** 4-6 hours
**Priority:** HIGH
**Impact:** Significant performance improvement, better maintainability

---

#### 2. PhysioAssessmentChatbot.tsx (2478 lines)
**Location:** `src/components/features/screening/PhysioAssessmentChatbot.tsx`

**Refactoring Plan:**
1. Extract to `screening/chatbot-parts/`:
   - `AssessmentInterface.tsx` (~300 lines)
   - `HistoryQuestions.tsx` (~400 lines)
   - `PhysicalTests.tsx` (~350 lines)
   - `AssessmentResults.tsx` (~400 lines)

2. Extract hooks:
   - `useAssessmentFlow.ts`
   - `usePhysicalTestLogic.ts`
   - `useHistoryManager.ts`

**Estimated Time:** 3-5 hours
**Priority:** HIGH
**Impact:** Better code organization, easier testing

---

### 🟡 **High Priority (1000-2000 lines)**

#### 3. TreatmentProtocolModal.tsx (1794 lines)
**Location:** `src/components/features/conditions/TreatmentProtocolModal.tsx`

**Refactoring Plan:**
- Extract to `conditions/protocol-parts/`:
  - `ProtocolHeader.tsx`
  - `ExerciseSelector.tsx`
  - `AffectedAreaSelector.tsx`
  - `ProtocolPreview.tsx`
  - `ProtocolActions.tsx`

**Estimated Time:** 3-4 hours
**Priority:** MEDIUM
**Impact:** Moderate performance improvement

---

#### 4. ProtocolGeneratorModal.tsx (1485 lines)
**Location:** `src/components/features/conditions/ProtocolGeneratorModal.tsx`

**Refactoring Plan:**
- Extract configuration steps
- Separate generation logic
- Create reusable step components

**Estimated Time:** 2-3 hours
**Priority:** MEDIUM

---

#### 5. EnhancedPatientDetailsModal.tsx (1086 lines)
**Location:** `src/components/features/patients/EnhancedPatientDetailsModal.tsx`

**Refactoring Plan:**
- Extract to `patients/patient-details-parts/`:
  - `PatientInfoSection.tsx`
  - `ConditionsTab.tsx`
  - `VisitsTab.tsx`
  - `NotesTab.tsx`
  - `BillingTab.tsx`

**Estimated Time:** 2-3 hours
**Priority:** MEDIUM

---

## 🚀 Performance Optimization Strategies

### 1. **Code Splitting (✅ Ready)**

Use the `LazyComponents.tsx` file for dynamic imports:

```tsx
// Before (loads immediately)
import SmartScreeningChatbot from '@/components/features/screening/SmartScreeningChatbot';

// After (loads on demand)
import { LazySmartScreeningChatbot } from '@/components/features/LazyComponents';
import { Suspense } from 'react';

function MyPage() {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <LazySmartScreeningChatbot {...props} />
    </Suspense>
  );
}
```

**Benefits:**
- Reduces initial bundle size
- Faster page load
- Better user experience

---

### 2. **React.memo() for Expensive Components**

Wrap components that receive stable props:

```tsx
import React from 'react';

const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

**Use for:**
- List items
- Chart components
- Data visualizations
- Complex forms

---

### 3. **useMemo and useCallback**

Optimize expensive calculations and callbacks:

```tsx
import { useMemo, useCallback } from 'react';

function MyComponent({ data }) {
  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data.map(item => heavyProcessing(item));
  }, [data]);

  // Memoize callbacks
  const handleClick = useCallback(() => {
    doSomething();
  }, []);

  return <ExpensiveList data={processedData} onClick={handleClick} />;
}
```

---

### 4. **Virtual Scrolling for Large Lists**

Use `react-window` or `react-virtualized` for lists with 50+ items:

```tsx
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

---

### 5. **Image Optimization**

Use Next.js Image component:

```tsx
import Image from 'next/image';

// Automatic optimization, lazy loading, responsive
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={false} // Lazy load by default
/>
```

---

### 6. **Bundle Analysis**

Run bundle analyzer to identify large dependencies:

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Analyze
ANALYZE=true npm run build
```

---

## 📦 Current Bundle Size Optimization

### Barrel Files Created
All feature folders now have `index.ts` barrel files for cleaner imports:

```tsx
// Before
import AddPatientModal from '@/components/features/patients/AddPatientModal';
import EditPatientModal from '@/components/features/patients/EditPatientModal';

// After (still works the same, but cleaner)
import { AddPatientModal, EditPatientModal } from '@/components/features/patients';
```

**Folders with barrel files:**
- appointments
- assessments
- auth
- billing
- clinics
- conditions
- dashboard
- maps
- notes
- nutrition
- patients
- profile
- screening
- shared
- team

---

## 🎨 UI Performance Tips

### 1. **Avoid Anonymous Functions in JSX**
```tsx
// Bad ❌
<button onClick={() => handleClick(id)}>Click</button>

// Good ✅
const memoizedClick = useCallback(() => handleClick(id), [id]);
<button onClick={memoizedClick}>Click</button>
```

### 2. **Debounce Input Handlers**
```tsx
import { debounce } from 'lodash';
import { useMemo } from 'react';

const debouncedSearch = useMemo(
  () => debounce((value) => performSearch(value), 300),
  []
);
```

### 3. **Optimize Re-renders**
- Use `React.memo()` for pure components
- Split large components into smaller ones
- Move state down (only lift when necessary)
- Use context selectively (can cause wide re-renders)

---

## 📊 Monitoring Performance

### Chrome DevTools Performance Tab
1. Open DevTools → Performance
2. Record interaction
3. Analyze flame graph
4. Look for long tasks (>50ms)

### React DevTools Profiler
1. Install React DevTools extension
2. Open Profiler tab
3. Record session
4. Identify slow components
5. Check render reasons

### Lighthouse Audit
```bash
# Run Lighthouse
npm run build
npm run start
# Open Chrome DevTools → Lighthouse → Run audit
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## 🔄 Incremental Refactoring Strategy

### Phase 1: Quick Wins (✅ Done)
- [x] Create barrel files
- [x] Set up lazy loading infrastructure
- [x] Document refactoring plans

### Phase 2: Critical Components (2-3 weeks)
- [ ] Refactor SmartScreeningChatbot
- [ ] Refactor PhysioAssessmentChatbot
- [ ] Add comprehensive tests

### Phase 3: High Priority (1-2 weeks)
- [ ] Split TreatmentProtocolModal
- [ ] Split ProtocolGeneratorModal
- [ ] Split EnhancedPatientDetailsModal

### Phase 4: Polish & Optimize (1 week)
- [ ] Bundle size optimization
- [ ] Add virtual scrolling where needed
- [ ] Performance monitoring setup
- [ ] Documentation updates

---

## 📝 Refactoring Checklist

When refactoring large components:

- [ ] Identify logical sections
- [ ] Extract hooks first (easier to test)
- [ ] Create sub-components incrementally
- [ ] Add PropTypes/TypeScript types
- [ ] Write unit tests for extracted parts
- [ ] Update imports gradually
- [ ] Test thoroughly before merging
- [ ] Document component API
- [ ] Update Storybook (if applicable)
- [ ] Run performance profiler to verify improvement

---

## 🎯 Success Metrics

### Before Optimization
- SmartScreeningChatbot: 3542 lines
- Bundle size: ~500KB (estimated)
- Initial load: Not measured
- Lighthouse score: Not measured

### After Full Optimization (Target)
- SmartScreeningChatbot: <400 lines main + 5 sub-components
- Bundle size reduction: 20-30%
- Initial load improvement: 15-25%
- Lighthouse performance score: 90+

---

## 🛠️ Tools & Resources

### Performance Tools
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### React Performance
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)
- [React.memo](https://react.dev/reference/react/memo)

### Code Splitting
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React.lazy](https://react.dev/reference/react/lazy)
- [Route-based Code Splitting](https://nextjs.org/docs/advanced-features/dynamic-import)

---

## 📞 Support

For questions about performance optimization:
1. Check this guide first
2. Review the README files in sub-component directories
3. Profile the component to identify bottlenecks
4. Consider reaching out to the team for complex refactoring

---

**Last Updated:** Phase 6 Implementation
**Next Review:** After completing Phase 6.2 refactoring

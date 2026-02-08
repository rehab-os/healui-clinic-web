# Component Guide

**Project:** HealUI Clinic Web
**Last Updated:** Phase 7 - Polish & Best Practices

---

## 📋 Component Organization

All components are organized by **feature/domain** in `src/components/features/`.

### Feature Folders

| Folder | Purpose | Components | Lines |
|--------|---------|------------|-------|
| `appointments/` | Appointment management | 5 | ~800 |
| `assessments/` | Clinical assessments | 5 | ~1200 |
| `auth/` | Authentication | 1 | ~200 |
| `billing/` | Billing & payments | 5 | ~3000 |
| `clinics/` | Clinic management | 5 | ~900 |
| `conditions/` | Condition management | 22 | ~8000 |
| `dashboard/` | Dashboard widgets | 11 | ~1500 |
| `maps/` | Body maps & location | 3 | ~600 |
| `notes/` | Clinical notes | 2 | ~600 |
| `nutrition/` | Nutrition guidance | 1 | ~200 |
| `patients/` | Patient management | 7 | ~3000 |
| `profile/` | User profile | 2 | ~400 |
| `screening/` | Smart screening | ~20 | ~8000 |
| `shared/` | Reusable utilities | 7 | ~800 |
| `team/` | Team management | 1 | ~300 |

**Total:** 15 feature folders, ~75 components

---

## 🎯 Component Patterns

### 1. **Barrel Exports**

Each feature folder has an `index.ts` for clean imports:

```typescript
// src/components/features/patients/index.ts
export { default as AddPatientModal } from './AddPatientModal';
export { default as EditPatientModal } from './EditPatientModal';
export { default as PatientDetailsModal } from './PatientDetailsModal';
// ...

// Usage
import { AddPatientModal, EditPatientModal } from '@/components/features/patients';
```

### 2. **Lazy Loading**

Heavy components (>500 lines) have lazy-loaded versions:

```typescript
import { Suspense } from 'react';
import { LazySmartScreeningChatbot, ComponentLoader } from '@/components/features/LazyComponents';

function MyPage() {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <LazySmartScreeningChatbot {...props} />
    </Suspense>
  );
}
```

### 3. **Component Naming**

- **PascalCase** for components
- **Descriptive** names (e.g., `AddPatientModal`, not `Modal1`)
- **Domain prefix** when helpful (e.g., `PatientDetailsModal`)

### 4. **File Structure**

```typescript
// Component file structure
'use client'; // If client component

import React from 'react';
import { /* dependencies */ } from 'libraries';
import { /* local imports */ } from '@/';

// Types
interface ComponentProps {
  // ...
}

// Component
export default function Component({ props }: ComponentProps) {
  // State
  // Effects
  // Handlers
  // Render
  return (
    // JSX
  );
}
```

---

## 📦 Feature Breakdown

### `appointments/` - Appointment Management

**Components:**
- `AppointmentCalendar.tsx` - Calendar view for appointments
- `AppointmentCard.tsx` - Individual appointment card
- `CancelVisitModal.tsx` - Cancel appointment dialog
- `RescheduleVisitModal.tsx` - Reschedule appointment
- `ScheduleVisitModal.tsx` - Create new appointment

**Usage:**
```typescript
import { ScheduleVisitModal } from '@/components/features/appointments';

<ScheduleVisitModal
  isOpen={isOpen}
  onClose={handleClose}
  patientId={patientId}
/>
```

---

### `assessments/` - Clinical Assessments

**Components:**
- `AssessmentFormBuilder.tsx` - Build custom assessment forms
- `AssessmentQueue.tsx` - Queue of pending assessments
- `AssessmentRecommendationHub.tsx` - AI-powered recommendations
- `ClinicalAssessmentModal.tsx` - Perform clinical assessment
- `CustomAssessmentSelector.tsx` - Select assessment type

**Key Features:**
- Dynamic form building
- AI-powered suggestions
- SOAP/BAP note formats

---

### `billing/` - Billing & Payments

**Large Components (Optimization Targets):**
- `BillVisitModal.tsx` - 1061 lines
- `PatientBillingPanel.tsx` - 995 lines

**Components:**
- `BillVisitModal.tsx` - Bill a patient visit
- `CreateSessionPackModal.tsx` - Create session packages
- `PatientBillingModal.tsx` - Patient billing overview
- `PatientBillingPanel.tsx` - Billing panel widget
- `RecordPaymentModal.tsx` - Record payment

**Lazy Loading Available:**
```typescript
import { LazyBillVisitModal } from '@/components/features/LazyComponents';
```

---

### `conditions/` - Condition Management

**Largest Feature (22 components)**

**Key Components:**
- `AddConditionWorkflow.tsx` - Add condition workflow
- `TreatmentProtocolModal.tsx` - 1794 lines ⚠️
- `ProtocolGeneratorModal.tsx` - 1485 lines ⚠️
- `PatientConditionManagement.tsx` - 924 lines
- `ConditionSelector.tsx` - Searchable condition picker

**Sub-folders:**
- `protocol-parts/` - Infrastructure for TreatmentProtocolModal refactoring

**Usage:**
```typescript
import {
  AddConditionWorkflow,
  ConditionSelector
} from '@/components/features/conditions';
```

---

### `dashboard/` - Dashboard Widgets

**Analytics & Visualization:**
- `AgeDistributionChart.tsx` - Age demographics
- `GenderChart.tsx` - Gender distribution
- `TopConditionsChart.tsx` - Most common conditions
- `PeakHoursHeatmap.tsx` - Busiest clinic hours
- `KPICard.tsx` - Key performance indicators

**Lists:**
- `AppointmentList.tsx` - Upcoming appointments
- `OutstandingList.tsx` - Outstanding payments
- `PatientsAttention.tsx` - Patients needing attention
- `SessionsEndingSoon.tsx` - Sessions expiring soon

**Usage:**
```typescript
import {
  KPICard,
  TopConditionsChart,
  PeakHoursHeatmap
} from '@/components/features/dashboard';
```

---

### `maps/` - Maps & Body Selection

**Components:**
- `BodyMapSelector.tsx` - Interactive body map
- `LeafletMapPicker.tsx` - Location picker
- `PincodeZoneManager.tsx` - Service area management

**Usage:**
```typescript
import { BodyMapSelector } from '@/components/features/maps';

<BodyMapSelector
  selectedAreas={areas}
  onChange={handleSelection}
/>
```

---

### `patients/` - Patient Management

**Large Components:**
- `EnhancedPatientDetailsModal.tsx` - 1086 lines ⚠️

**Components:**
- `AddPatientModal.tsx` - Add new patient
- `EditPatientModal.tsx` - Edit patient details
- `EnhancedPatientDetailsModal.tsx` - Detailed patient view
- `PatientDetailsModal.tsx` - Simple patient view
- `PatientFeedbackModal.tsx` - Collect feedback
- `PatientSelfRegistrationForm.tsx` - Self-registration
- `RegistrationSuccess.tsx` - Registration confirmation

**Sub-folders:**
- `patient-details-parts/` - Infrastructure for EnhancedPatientDetailsModal refactoring

---

### `screening/` - Smart Screening & Assessment

**Largest Components (Critical Optimization Targets):**
- `SmartScreeningChatbot.tsx` - 3542 lines 🔴
- `PhysioAssessmentChatbot.tsx` - 2478 lines 🔴
- `SmartScreeningModal.tsx` - 1015 lines

**Other Components:**
- `DiagnosisSearchOverlay.tsx` - Diagnosis search
- `FloatingSummaryPanel.tsx` - Summary sidebar
- `SymptomAssessmentChat.tsx` - Symptom chat
- `SymptomAssessmentModal.tsx` - Assessment modal

**Sub-folders:**
- `assessment/` - Assessment-specific components
- `chat/` - Chat UI components
- `feedback/` - Feedback components
- `inputs/` - Custom input components
- `progress/` - Progress indicators
- `chatbot-parts/` - Infrastructure for chatbot refactoring
- `hooks/` - Infrastructure for extracted hooks

**Lazy Loading (Recommended):**
```typescript
import {
  LazySmartScreeningChatbot,
  LazyPhysioAssessmentChatbot
} from '@/components/features/LazyComponents';
```

**Documentation:**
- `INTEGRATION_GUIDE.md` - How to integrate screening
- `chatbot-parts/README.md` - Refactoring guide

---

### `shared/` - Shared Components

**Reusable across features:**
- `AddressFields.tsx` - Address input fields
- `AnatomySearchSelect.tsx` - Anatomy selector
- `ContextSwitcher.tsx` - Context/clinic switcher
- `Header.tsx` - Page headers
- `QuickIntakeModal.tsx` - Quick patient intake
- `VoiceInputButton.tsx` - Voice recording
- `WorkingHoursInput.tsx` - Hours picker

**Usage:**
```typescript
import { AddressFields, VoiceInputButton } from '@/components/features/shared';
```

---

## 🎨 UI Components (`components/ui/`)

**shadcn/ui Primitives:**
- `button.tsx` - Button component
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Text inputs
- `form.tsx` - Form helpers
- `select.tsx` - Dropdown selects
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation
- And more...

**Usage:**
```typescript
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
```

**Styling:**
- Tailwind CSS utility classes
- `cn()` helper for conditional classes

---

## 🔌 Provider Components (`components/providers/`)

**Context Providers:**
- `AuthProvider.tsx` - Authentication context
- `ReduxProvider.tsx` - Redux store provider
- `MantineProvider.tsx` - Mantine UI theme

**Usage (in layout.tsx):**
```typescript
import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReduxProvider>
          <AuthProvider>
            <MantineProvider>
              {children}
            </MantineProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
```

---

## 🚀 Performance Considerations

### Large Components (>1000 lines)

These components have refactoring guides:

| Component | Lines | Status | Guide |
|-----------|-------|--------|-------|
| SmartScreeningChatbot | 3542 | 🔴 Critical | `screening/chatbot-parts/README.md` |
| PhysioAssessmentChatbot | 2478 | 🔴 Critical | `screening/chatbot-parts/README.md` |
| TreatmentProtocolModal | 1794 | 🟡 High | `conditions/protocol-parts/README.md` |
| ProtocolGeneratorModal | 1485 | 🟡 High | `conditions/protocol-parts/README.md` |
| EnhancedPatientDetailsModal | 1086 | 🟡 High | `patients/patient-details-parts/README.md` |

### Optimization Strategies

1. **Use Lazy Loading:**
   ```typescript
   import { LazyComponent } from '@/components/features/LazyComponents';
   ```

2. **Code Splitting:**
   - Automatic by Next.js for pages
   - Manual via `dynamic()` for components

3. **React.memo():**
   ```typescript
   export default React.memo(ExpensiveComponent);
   ```

4. **useMemo/useCallback:**
   ```typescript
   const memoizedValue = useMemo(() => expensiveComputation(), [deps]);
   ```

---

## 🧪 Testing Components

### Test File Location

**Co-located (Recommended):**
```
patients/
├── AddPatientModal.tsx
└── AddPatientModal.test.tsx
```

### Test Structure

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import AddPatientModal from './AddPatientModal';

describe('AddPatientModal', () => {
  it('renders correctly', () => {
    render(<AddPatientModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('Add Patient')).toBeInTheDocument();
  });

  it('handles form submission', () => {
    const onSubmit = jest.fn();
    render(<AddPatientModal onSubmit={onSubmit} />);
    // ... test logic
  });
});
```

---

## 📝 Component Guidelines

### Do's ✅

- **Use descriptive names:** `AddPatientModal` not `Modal1`
- **Keep components focused:** Single responsibility
- **Extract reusable logic:** Custom hooks
- **Use TypeScript:** Proper prop types
- **Lazy load heavy components:** Use `LazyComponents.tsx`
- **Use barrel exports:** Clean imports
- **Follow design system:** Consistent styling

### Don'ts ❌

- **Don't create monster components:** >500 lines
- **Don't mix concerns:** Keep logic and UI separate
- **Don't use inline styles:** Use Tailwind classes
- **Don't repeat code:** Extract to shared components
- **Don't skip PropTypes:** Always define interfaces

---

## 🔍 Finding Components

### By Feature
```bash
# Find all patient-related components
ls src/components/features/patients/
```

### By Name
```bash
# Search for a specific component
find src/components -name "*Modal*.tsx"
```

### In IDE
- Use `Cmd+P` (VSCode) to search by filename
- Use `Cmd+Shift+F` to search content

---

## 📚 Related Documentation

- **Architecture:** `ARCHITECTURE.md`
- **Performance:** `PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **Integration Guides:**
  - `src/components/features/screening/INTEGRATION_GUIDE.md`
- **Refactoring Guides:**
  - `src/components/features/screening/chatbot-parts/README.md`
  - `src/components/features/conditions/protocol-parts/README.md`
  - `src/components/features/patients/patient-details-parts/README.md`

---

## 🆕 Adding New Components

### 1. Choose the Right Feature Folder

If it's patient-related → `patients/`
If it's billing-related → `billing/`
If it's reusable → `shared/`

### 2. Create the Component

```typescript
// src/components/features/patients/NewPatientComponent.tsx
'use client';

import React from 'react';

interface NewPatientComponentProps {
  patientId: string;
  onSave: (data: any) => void;
}

export default function NewPatientComponent({
  patientId,
  onSave
}: NewPatientComponentProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### 3. Add to Barrel Export

```typescript
// src/components/features/patients/index.ts
export { default as NewPatientComponent } from './NewPatientComponent';
```

### 4. Use the Component

```typescript
import { NewPatientComponent } from '@/components/features/patients';

<NewPatientComponent patientId="123" onSave={handleSave} />
```

---

**Maintained by:** Development Team
**Questions?** Check the guides or ask the team!

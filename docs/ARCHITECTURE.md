# Architecture Documentation

**Project:** HealUI Clinic Web
**Framework:** Next.js 15 + React 19 + TypeScript
**Last Updated:** Phase 7 - Polish & Best Practices

---

## 🏗️ Project Structure

```
healui-clinic-web/
├── src/
│   ├── app/                    # Next.js App Router (Routes & Layouts)
│   ├── components/             # React Components
│   ├── config/                 # Configuration Files
│   ├── data/                   # Static Data & Knowledge Graphs
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Utilities, Types, API Clients
│   ├── services/               # Business Logic & External Services
│   ├── store/                  # Redux State Management
│   └── theme/                  # Theme Configuration
├── public/                     # Static Assets
└── docs/                       # Documentation
```

---

## 📂 Directory Descriptions

### `/src/app/` - Next.js App Router

**Purpose:** Application routes, layouts, and page components

**Structure:**
```
app/
├── (auth)/                     # Auth route group
│   ├── login/
│   └── register/
├── (patient-facing)/           # Patient routes
│   ├── patient-call/
│   └── smart-screening/
├── dashboard/                  # Protected dashboard
│   ├── appointments/
│   ├── billing/
│   ├── patients/
│   └── ...
├── layout.tsx                  # Root layout
├── page.tsx                    # Home page
└── global.css                  # Global styles
```

**Key Patterns:**
- Route groups `(auth)` for shared layouts
- Dynamic routes `[id]` for parameterized pages
- Server components by default
- Client components marked with `'use client'`

---

### `/src/components/` - React Components

**Purpose:** Reusable UI components organized by feature

**Structure:**
```
components/
├── features/                   # Feature-based organization
│   ├── appointments/           # Appointment management
│   ├── assessments/            # Clinical assessments
│   ├── auth/                   # Authentication
│   ├── billing/                # Billing & payments
│   ├── clinics/                # Clinic management
│   ├── conditions/             # Condition management
│   ├── dashboard/              # Dashboard widgets
│   ├── maps/                   # Body maps & location
│   ├── notes/                  # Clinical notes
│   ├── nutrition/              # Nutrition guidance
│   ├── patients/               # Patient management
│   ├── profile/                # User profile
│   ├── screening/              # Smart screening & assessment
│   ├── shared/                 # Shared/reusable components
│   └── team/                   # Team management
├── providers/                  # Context providers
│   ├── AuthProvider.tsx
│   ├── ReduxProvider.tsx
│   └── MantineProvider.tsx
├── ui/                         # shadcn/ui primitives
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
└── LazyComponents.tsx          # Lazy-loaded components
```

**Key Principles:**
- Feature-based organization (not by component type)
- Each feature has `index.ts` barrel file
- Large components (>1000 lines) documented for refactoring
- Lazy loading for heavy modals

---

### `/src/config/` - Configuration

**Purpose:** Application configuration files

**Files:**
- `firebase.config.ts` - Firebase authentication setup
- Future: API endpoints, feature flags, etc.

---

### `/src/data/` - Static Data

**Purpose:** Build-time data, knowledge graphs, reference data

**Structure:**
```
data/
├── agent/                      # Agent-specific data
│   └── conditions.json
├── anatomy/                    # Anatomical data
│   ├── exercises/
│   ├── muscles/
│   ├── joints.json
│   └── ...
├── clinical/                   # Clinical knowledge graph
│   ├── bayesian/               # Bayesian reasoning data
│   ├── entities/               # Clinical entities
│   ├── protocols/              # Treatment protocols
│   ├── relationships/          # Entity relationships
│   ├── reasoning/              # Clinical reasoning rules
│   └── safety/                 # Safety checks
└── regions/                    # Regional configurations
    ├── referralPatterns.ts
    └── regionConfigs.ts
```

**Key Patterns:**
- JSON for static data
- TypeScript for configuration logic
- Indexed exports for easy access

---

### `/src/hooks/` - Custom Hooks

**Purpose:** Reusable React hooks

**Files:**
- `useAIQuestionFlow.ts` - AI-powered question flow
- `useMediaRecorder.ts` - Audio recording

**Naming:** Always start with `use`

---

### `/src/lib/` - Libraries & Utilities

**Purpose:** Utilities, types, API clients

**Structure:**
```
lib/
├── api/                        # API clients
│   ├── client.ts
│   └── endpoints.ts
├── types/                      # TypeScript types
│   ├── analytics.ts
│   ├── billing.ts
│   ├── conditions.ts
│   └── index.ts
└── utils/                      # Utility functions
    ├── anatomy.ts
    ├── chatbot.ts
    ├── firebase.ts
    ├── helpers.ts
    └── pdf.ts
```

**Naming Conventions:**
- Files: camelCase (e.g., `pdfGenerator.ts` → `pdf.ts`)
- Exports: Named exports preferred
- Index files for barrel exports

---

### `/src/services/` - Business Logic

**Purpose:** Domain-specific business logic & external services

**Structure:**
```
services/
├── ai/                         # AI & ML services
│   ├── diagnostic.service.ts
│   ├── decision-engine.service.ts
│   └── screening-engine.service.ts
├── api/                        # API services
│   ├── api.service.ts
│   └── screening-api.service.ts
├── auth/                       # Authentication
│   └── firebase-auth.service.ts
├── conditions/                 # Condition management
│   ├── local.service.ts
│   └── ontology.service.ts
└── symptom-assessment/         # Symptom assessment
    ├── bayesian-engine.ts
    ├── conversation-manager.ts
    └── referral-source-engine.ts
```

**Key Principles:**
- Domain-driven design
- Service suffix: `.service.ts`
- Single responsibility
- Stateless when possible

---

### `/src/store/` - State Management

**Purpose:** Redux state management

**Structure:**
```
store/
├── slices/                     # Redux slices
│   ├── analytics.slice.ts
│   ├── auth.slice.ts
│   ├── clinic.slice.ts
│   └── ...
├── actions/                    # Async actions
│   ├── analytics.actions.ts
│   └── treatment-protocol.actions.ts
├── hooks.ts                    # Typed Redux hooks
└── store.ts                    # Store configuration
```

**Patterns:**
- Redux Toolkit for modern Redux
- Slice per domain
- Async actions in separate files
- Typed hooks (`useAppSelector`, `useAppDispatch`)

---

### `/src/theme/` - Theme Configuration

**Purpose:** UI theme and styling

**Files:**
- `brand.guideline.txt` - Brand guidelines
- `mantine.theme.ts` - Mantine UI theme

---

## 🎨 Design System

### Color Palette

**Brand Colors:**
- `brand-teal` - Primary brand color
- `teal-*` family - Interactive elements, accents

**Neutrals:**
- `gray-*` - Text, borders, backgrounds
- NOT `slate-*` (avoid for consistency)

### Spacing (Golden Ratio)

- Primary buttons: `p-5`
- Secondary buttons: `p-3.5`
- Gaps: `gap-3`

### Layout Grid

- `lg:grid-cols-5` with `lg:col-span-3` + `lg:col-span-2` (60/40 golden ratio)

### Key Patterns

- Diagnosis results header: `bg-gradient-to-r from-brand-teal to-teal-600`
- Confidence badges: `bg-teal-700 text-white`

---

## 🔄 Data Flow

### 1. **Server Components (Default)**
```tsx
// app/dashboard/page.tsx
async function DashboardPage() {
  const data = await fetchData(); // Server-side
  return <DashboardView data={data} />;
}
```

### 2. **Client Components**
```tsx
'use client';

function InteractiveComponent() {
  const [state, setState] = useState();
  // Client-side interactivity
}
```

### 3. **State Management Flow**
```
User Action
   ↓
Component
   ↓
Redux Action
   ↓
Service Layer (API call)
   ↓
Redux Slice (state update)
   ↓
Component (re-render)
```

### 4. **API Communication**
```
Component
   ↓
Service (business logic)
   ↓
API Client (HTTP)
   ↓
Backend API
```

---

## 🔐 Authentication Flow

```
1. User enters phone number
   ↓
2. Firebase sends OTP
   ↓
3. User enters OTP
   ↓
4. Firebase verifies
   ↓
5. Token stored in Redux
   ↓
6. AuthProvider wraps app
   ↓
7. Protected routes check auth
```

**Files:**
- `src/config/firebase.config.ts` - Firebase setup
- `src/services/auth/firebase-auth.service.ts` - Auth logic
- `src/components/providers/AuthProvider.tsx` - Auth context

---

## 🧪 Testing Strategy

### Test Structure (Recommended)
```
src/
├── components/
│   └── features/
│       └── patients/
│           ├── AddPatientModal.tsx
│           └── AddPatientModal.test.tsx    # Co-located
```

### Test Types
1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user flows

### Tools (To be implemented)
- Jest - Unit testing
- React Testing Library - Component testing
- Playwright - E2E testing

---

## 🚀 Performance Optimization

### Code Splitting

**Lazy Loading:**
```tsx
import { LazySmartScreeningChatbot } from '@/components/features/LazyComponents';

<Suspense fallback={<ComponentLoader />}>
  <LazySmartScreeningChatbot {...props} />
</Suspense>
```

**Route-based Splitting:**
- Automatic by Next.js
- Each route is a separate bundle

### Bundle Optimization

**Barrel Files:**
```tsx
// Clean imports
import { AddPatientModal, EditPatientModal } from '@/components/features/patients';
```

**Tree Shaking:**
- Named exports enable tree shaking
- Avoid default exports for utilities

---

## 📦 Build & Deployment

### Build Process
```bash
npm run build
```

1. TypeScript compilation
2. Next.js optimization
3. Static generation
4. Bundle output

### Environment Variables

**Pattern:**
```env
NEXT_PUBLIC_* - Client-side accessible
*               - Server-side only
```

**Files:**
- `.env` - Local development
- `.env.production` - Production

---

## 🔍 Path Aliases

**Configured in `tsconfig.json`:**

```typescript
import Component from '@/components/features/patients/AddPatientModal';
import { api } from '@/services/api/api.service';
import { useAppSelector } from '@/store/hooks';
import { formatDate } from '@/utils/helpers';
import { UserType } from '@/types/user';
```

**Available Aliases:**
- `@/*` - src root
- `@/components/*` - Components
- `@/lib/*` - Libraries
- `@/services/*` - Services
- `@/store/*` - Redux store
- `@/hooks/*` - Custom hooks
- `@/data/*` - Static data
- `@/config/*` - Configuration
- `@/types/*` - TypeScript types
- `@/utils/*` - Utilities

---

## 🎯 Key Architectural Decisions

### 1. **Feature-Based Organization**
**Why:** Easier to locate related code, better for team collaboration

**Instead of:**
```
components/
├── buttons/
├── modals/
└── forms/
```

**We use:**
```
components/features/
├── patients/
├── appointments/
└── billing/
```

### 2. **Domain-Driven Services**
**Why:** Clear boundaries, easier to scale, better testability

### 3. **Consolidated Data Structure**
**Why:** Single source of truth, easier maintenance, no duplication

### 4. **Path Aliases**
**Why:** Cleaner imports, easier refactoring, better IDE support

### 5. **Lazy Loading Infrastructure**
**Why:** Better performance, reduced initial bundle, faster page loads

---

## 📚 Related Documentation

- **Components Guide:** `COMPONENTS.md`
- **Performance Guide:** `PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **Testing Guide:** `TESTING.md` (to be created)
- **API Guide:** `API.md` (to be created)

---

## 🔄 Evolution & Future

### Completed Phases
- ✅ Phase 1: Cleanup
- ✅ Phase 2: Config organization
- ✅ Phase 3: Component reorganization
- ✅ Phase 4: Data consolidation
- ✅ Phase 5: Services consolidation
- ✅ Phase 6: Performance infrastructure
- ✅ Phase 7: Polish & best practices

### Future Improvements
- [ ] Component library (Storybook)
- [ ] Comprehensive test coverage
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Performance monitoring (Sentry, Analytics)
- [ ] CI/CD pipeline
- [ ] Docker containerization

---

**Maintained by:** Development Team
**Questions?** See `COMPONENTS.md` for component-specific details

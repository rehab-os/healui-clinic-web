# Import Path Fixes

**Date:** 2026-02-09
**Issue:** Module not found errors after Phase 3 component reorganization
**Status:** ✅ **FIXED**

---

## 🐛 Issues Identified

After the Phase 3 component reorganization, several files had incorrect relative import paths that broke after components were moved into feature-based folders.

### Errors Found:
1. `AssessmentRecommendationHub.tsx` - couldn't find clinical_assessments.json
2. `DiagnosisSearchOverlay.tsx` - couldn't find conditions.json
3. `SmartScreeningChatbot.tsx` - couldn't find @/services/api
4. `decision-engine.service.ts` - incorrect import of decision_trees.json
5. `AssessmentFormBuilder.tsx` - old relative path to clinical_assessments.json
6. `CustomAssessmentSelector.tsx` - old relative path to clinical_assessments.json

---

## ✅ Fixes Applied

### 1. AssessmentRecommendationHub.tsx
**File:** `src/components/features/assessments/AssessmentRecommendationHub.tsx`

```typescript
// ❌ Before (line 63)
const response = await import('../../data/clinical/entities/clinical_assessments.json');

// ✅ After
const response = await import('@/data/clinical/entities/clinical_assessments.json');
```

---

### 2. DiagnosisSearchOverlay.tsx
**File:** `src/components/features/screening/DiagnosisSearchOverlay.tsx`

```typescript
// ❌ Before (line 42)
const conditionsModule = await import('../../data/clinical/entities/conditions.json');

// ✅ After
const conditionsModule = await import('@/data/clinical/entities/conditions.json');
```

---

### 3. SmartScreeningChatbot.tsx
**File:** `src/components/features/screening/SmartScreeningChatbot.tsx`

```typescript
// ❌ Before (line 1186)
const { default: ApiManager } = await import("@/services/api");

// ✅ After
const { default: ApiManager } = await import("@/services/api/api.service");
```

**Reason:** The service file is named `api.service.ts`, not `api.ts`

---

### 4. decision-engine.service.ts
**File:** `src/services/ai/decision-engine.service.ts`

```typescript
// ❌ Before (line 1-3)
import { decisionTrees } from '../../data/clinical/entities/decision_trees.json';
import { clinicalAssessments } from '../../data/clinical/entities/clinical_assessments.json';

// ✅ After
import decisionTreesData from '@/data/clinical/entities/decision_trees.json';
const decisionTrees = decisionTreesData;
import clinicalAssessmentsData from '@/data/clinical/entities/clinical_assessments.json';
const clinicalAssessments = clinicalAssessmentsData.assessments;
```

**Reason:**
- JSON files don't support named exports in Next.js
- Use default import and access properties
- Fixed relative path to use path alias

---

### 5. AssessmentFormBuilder.tsx
**File:** `src/components/features/assessments/AssessmentFormBuilder.tsx`

```typescript
// ❌ Before (line 7)
import assessmentsData from '../../../data/clinical/entities/clinical_assessments.json';

// ✅ After
import assessmentsData from '@/data/clinical/entities/clinical_assessments.json';
```

---

### 6. CustomAssessmentSelector.tsx
**File:** `src/components/features/assessments/CustomAssessmentSelector.tsx`

```typescript
// ❌ Before (line 7)
import assessmentsData from '../../../data/clinical/entities/clinical_assessments.json';

// ✅ After
import assessmentsData from '@/data/clinical/entities/clinical_assessments.json';
```

---

## 🎯 Solution Pattern

### Use Path Aliases Instead of Relative Paths

**Benefits:**
- ✅ Immune to folder restructuring
- ✅ Cleaner, more readable code
- ✅ Easier to maintain
- ✅ Consistent across the codebase

### Path Alias Reference:

```typescript
@/data            → src/data/
@/services        → src/services/
@/components      → src/components/
@/lib             → src/lib/
@/hooks           → src/hooks/
@/config          → src/config/
@/types           → src/lib/types/
@/utils           → src/lib/utils/
```

---

## ✅ Build Verification

```bash
npm run build
```

**Result:** ✅ **SUCCESS**

- All 27 routes compiled successfully
- No "Module not found" errors
- All imports resolved correctly
- Path aliases working perfectly

---

## 🛡️ Prevention Strategy

### Best Practices Going Forward:

1. **Always use path aliases** for imports
   ```typescript
   // ✅ Good
   import data from '@/data/clinical/entities/conditions.json';

   // ❌ Avoid
   import data from '../../../data/clinical/entities/conditions.json';
   ```

2. **Import JSON files correctly in Next.js**
   ```typescript
   // ✅ For JSON with structure
   import jsonData from '@/data/file.json';
   const items = jsonData.items; // Access properties

   // ❌ Named imports don't work
   import { items } from '@/data/file.json'; // ERROR!
   ```

3. **Check service file names**
   ```typescript
   // ✅ Correct (file is api.service.ts)
   import ApiManager from '@/services/api/api.service';

   // ❌ Wrong (file doesn't exist)
   import ApiManager from '@/services/api';
   ```

4. **Verify imports after reorganization**
   - Run `npm run build` after moving files
   - Check for "Module not found" warnings
   - Fix immediately to prevent runtime errors

---

## 📊 Impact

### Files Fixed: 6
1. AssessmentRecommendationHub.tsx
2. DiagnosisSearchOverlay.tsx
3. SmartScreeningChatbot.tsx
4. decision-engine.service.ts
5. AssessmentFormBuilder.tsx
6. CustomAssessmentSelector.tsx

### Imports Corrected: 7

### Build Status:
- Before: ⚠️ 4 module not found warnings
- After: ✅ Clean build (no import errors)

---

## 🔍 How These Errors Occurred

During **Phase 3: Component Reorganization**, components were moved from:
- `src/components/molecule/` → `src/components/features/[feature-name]/`

This meant relative paths like `../../data` were no longer correct because:
- Old location: `src/components/molecule/Component.tsx`
  - `../../data` → `src/data/` ✅
- New location: `src/components/features/assessments/Component.tsx`
  - `../../data` → `src/components/data/` ❌ (doesn't exist!)

**Solution:** Use path aliases (`@/data`) which always resolve correctly regardless of component location.

---

## ✅ Conclusion

All import path errors introduced by the Phase 3 reorganization have been resolved by:
1. Replacing relative paths with path aliases
2. Fixing incorrect service imports
3. Correcting JSON import syntax for Next.js

**Build Status:** ✅ Passing
**Runtime Errors:** ✅ Resolved
**Path Aliases:** ✅ Working correctly

---

**Fixed by:** Claude Code
**Time to fix:** ~5 minutes
**Prevention:** Use path aliases consistently

# UX Smoothness & Redux Migration Audit — HealUI Clinic Web

## Table of Contents
1. [Route Prefetching — 23 Missed Opportunities](#1-route-prefetching--23-missed-opportunities)
2. [Optimistic Updates — Every Mutation Makes Users Wait](#2-optimistic-updates--every-mutation-makes-users-wait)
3. [Loading & Skeleton States — 9 Blank White Pages](#3-loading--skeleton-states--9-blank-white-pages)
4. [Error Recovery — Zero Safety Nets](#4-error-recovery--zero-safety-nets)
5. [Redux Audit — What to Keep, What to Kill](#5-redux-audit--what-to-keep-what-to-kill)
6. [Redux vs TanStack Query — Speed Comparison](#6-redux-vs-tanstack-query--speed-comparison)

---

## 1. Route Prefetching — 23 Missed Opportunities

Next.js `<Link>` prefetches route JS on hover — making navigation near-instant. `router.push()` does NOT prefetch. Your app uses `router.push()` for 23 navigations that should be `<Link>`.

### What's Wrong Now

| Current | Count | Speed |
|---------|-------|-------|
| `<Link>` (prefetches) | 11 | Near-instant navigation |
| `router.push()` (no prefetch) | 38 total | Full page load on click |
| `router.push()` that SHOULD be `<Link>` | **23** | Unnecessarily slow |
| `router.push()` that are OK (redirects after login/logout) | 15 | Correct usage |

### High-Impact Conversions (Most Clicked Routes)

| File | Line | Current `router.push()` To | Should Be |
|------|------|---------------------------|-----------|
| `appointments/page.tsx` | 203 | `/dashboard/appointments/{patientId}/{appointmentId}` | `<Link>` — main workflow navigation |
| `appointments/page.tsx` | 199 | `/dashboard/patients/{id}` | `<Link>` — patient card click |
| `appointments/[..]/page.tsx` | 662 | `/dashboard/appointments/{patient.id}/{visitId}` | `<Link>` — past visit click |
| `patients/[id]/page.tsx` | 1080 | `/dashboard/visits/{visit.id}` | `<Link>` — visit card click |
| `clinics/page.tsx` | 284 | `/dashboard/clinics/{clinic.id}` | `<Link>` — clinic card click |
| `billing/page.tsx` | 195 | `/dashboard/billing/invoices` | `<Link>` — billing nav |
| `billing/page.tsx` | 208 | `/dashboard/billing/reports` | `<Link>` — billing nav |
| `billing/page.tsx` | 224 | `/dashboard/billing/services` | `<Link>` — billing nav |
| `billing/page.tsx` | 231 | `/dashboard/billing/pack-templates` | `<Link>` — billing nav |
| `billing/page.tsx` | 238 | `/dashboard/billing/settings` | `<Link>` — billing nav |
| `clinics/[id]/page.tsx` | 301 | `/dashboard/clinics` | `<Link>` — back button |
| `clinics/[id]/page.tsx` | 416 | `/dashboard/clinics` | `<Link>` — back button |
| `patients/[id]/page.tsx` | 237 | `/dashboard/visits/new?patient_id=...` | `<Link>` — schedule visit button |
| `availability/page.tsx` | 977 | `/dashboard/profile` | `<Link>` — profile nav |
| `video-call/[visitId]/page.tsx` | 447 | `/dashboard/appointments` | `<Link>` — back button |

Also: `login/page.tsx` line 280 uses `<a href="/get-started">` instead of `<Link>` — full page reload instead of client navigation.

### Speed Impact

| Navigation Type | Current (router.push) | With `<Link>` | Improvement |
|----------------|----------------------|---------------|-------------|
| Appointment card → detail | ~1-2s (full load) | ~100-200ms (prefetched) | **~90% faster** |
| Billing tab switches | ~1-2s each | ~100-200ms | **~90% faster** |
| Clinic card → detail | ~1-2s | ~100-200ms | **~90% faster** |
| Back buttons | ~1-2s | ~100-200ms | **~90% faster** |

**Total effort to fix: ~2-3 hours.** Replace `onClick={() => router.push(url)}` with wrapping the element in `<Link href={url}>`.

---

## 2. Optimistic Updates — Every Mutation Makes Users Wait

**Current state: ZERO optimistic updates.** Every single mutation waits for the full API round-trip before the UI updates.

### What Users Experience Now

When a physiotherapist adds a clinical note:
```
Click "Save" → Spinner (1-3s) → API responds → Note appears → Toast "Saved"
```

What they SHOULD experience:
```
Click "Save" → Note appears instantly → Toast "Saved" (background sync)
                                        → If API fails: Note removed + error toast
```

### All Mutations That Need Optimistic Updates

#### HIGH PRIORITY (Core clinical workflow — used every appointment)

| Operation | File | Line | Current Wait | With Optimistic |
|-----------|------|------|-------------|-----------------|
| Save tracking measurement | `useTrackingPersistence.ts` | 182 | 1-2s full API wait | Instant (already has local state, just needs save confirmation) |
| Add clinical insight | `appointmentDetails.slice.ts` | 153 | 1-2s (thunk → API → store update) | Instant insert, sync in background |
| Create clinical note | `SmartNoteInput.tsx` | 206 | 1-3s (includes transcription) | Show note immediately, transcription in background |
| Save & finalize protocol | `ProtocolGeneratorModal.tsx` | 612 | 2-5s (TWO sequential POSTs) | Close modal immediately, sync both in background |

#### MEDIUM PRIORITY (Used frequently but less time-critical)

| Operation | File | Line | Current Wait |
|-----------|------|------|-------------|
| Update clinical insight | `appointmentDetails.slice.ts` | 163 | 1-2s |
| Delete clinical insight | `appointmentDetails.slice.ts` | 173 | 1-2s |
| Add condition to visit | `AddConditionToVisitModal.tsx` | 156 | 2-4s (loops: create N conditions + add N to visit) |
| Create patient condition | `AddConditionWorkflow.tsx` | 126 | 1-2s |
| Update patient details | `EditPatientModal.tsx` | — | 1-2s |
| Check-in visit | `ScheduleVisitModal.tsx` | — | 1-2s |

### Speed Impact

With optimistic updates, perceived mutation latency drops from 1-3s to **< 200ms** for all operations. The API still takes the same time, but the user doesn't wait.

**Total effort: ~1-2 days** for high-priority mutations. Pattern is straightforward:
```typescript
// 1. Update UI immediately
setState(prev => [...prev, newItem])
// 2. Sync with API in background
try { await ApiManager.create(newItem) }
catch { setState(prev => prev.filter(i => i.id !== newItem.id)); toast.error('Failed') }
```

---

## 3. Loading & Skeleton States — 9 Blank White Pages

### Current State: Zero Infrastructure

| File Type | Count | Impact |
|-----------|-------|--------|
| `loading.tsx` files | **0** out of 31 routes | No route-level loading UI anywhere |
| `error.tsx` files | **0** | No error recovery anywhere |
| `not-found.tsx` files | **0** | Generic 404 for invalid URLs |
| `<Suspense>` boundaries | **0** | No progressive loading |
| Skeleton component (`skeleton.tsx`) | **EXISTS but UNUSED** | Component was created, never imported |

### What Users See During Data Fetches

| Route | What User Sees | Duration | Quality |
|-------|---------------|----------|---------|
| `/dashboard` | Skeleton cards (KPIs, charts) | 1-3s | GOOD |
| `/dashboard/appointments` | Centered spinner + "Loading appointments..." | 1-3s | OK |
| `/dashboard/billing` | Centered spinner + "Loading billing data..." | 1-3s | OK |
| `/dashboard/patients` | **BLANK WHITE PAGE** | 1-3s | BAD |
| `/dashboard/patients/[id]` | **BLANK WHITE PAGE** | 1-3s | BAD |
| `/dashboard/clinics` | **BLANK WHITE PAGE** | 1-3s | BAD |
| `/dashboard/team` | **BLANK WHITE PAGE** | 1-3s | BAD |
| `/dashboard/insights` | **BLANK WHITE PAGE** | 1-3s | BAD |
| `/dashboard/profile` | **BLANK WHITE PAGE** | Variable | BAD |
| `/dashboard/availability` | **BLANK WHITE PAGE** | Variable | BAD |
| `/dashboard/clinical-outcomes` | **BLANK WHITE PAGE** | Variable | BAD |
| `/dashboard/appointments/[..]/[..]` | Partial content (Redux loading flags) | 2-5s | POOR |

**9 routes show blank white pages** while data loads. Users think the app is broken.

### What Should Exist

Priority `loading.tsx` files to create:

```
src/app/dashboard/loading.tsx                                        ← dashboard home
src/app/dashboard/appointments/loading.tsx                           ← appointments list
src/app/dashboard/appointments/[patientId]/[appointmentId]/loading.tsx ← appointment detail (MOST IMPORTANT)
src/app/dashboard/patients/loading.tsx                               ← patients list
src/app/dashboard/patients/[id]/loading.tsx                          ← patient detail
src/app/dashboard/clinics/loading.tsx                                ← clinics list
src/app/dashboard/billing/loading.tsx                                ← billing
src/app/dashboard/team/loading.tsx                                   ← team
src/app/dashboard/insights/loading.tsx                               ← insights
```

Each `loading.tsx` should show a skeleton layout matching the page structure — not a centered spinner.

**Total effort: ~3-4 hours** for all routes. Most are simple skeleton layouts.

---

## 4. Error Recovery — Zero Safety Nets

### Current State

- **0 `error.tsx` files** — any unhandled error crashes the page to white screen
- **0 `not-found.tsx` files** — invalid URLs show generic Next.js 404
- **API errors in `api-client.ts:82`** — `response.json()` crashes if server returns HTML (500/503 pages)
- **Silent `.catch(() => {})` blocks** — errors swallowed, user sees nothing

### What Should Exist

Minimum `error.tsx` files:

```
src/app/error.tsx                    ← catches errors in root layout children
src/app/dashboard/error.tsx          ← catches errors in any dashboard page
src/app/not-found.tsx                ← branded 404 page
```

Each `error.tsx` should show:
- Friendly message ("Something went wrong")
- "Try Again" button that calls `reset()`
- Option to go back to dashboard

**Total effort: ~1-2 hours** for all three files.

---

## 5. Redux Audit — What to Keep, What to Kill

### Full Slice Usage Map

| Slice | Files That Read It | Files That Write It | Classification | Verdict |
|-------|-------------------|--------------------|----|---------|
| **auth** | 5 files (layout, login, root, AuthComponent, profile) | 3 files | GLOBAL — every page needs auth state | **KEEP** |
| **user** | **28 files** (almost every dashboard page) | 2 files (AuthProvider, ContextSwitcher) | GLOBAL — clinic/context selection affects everything | **KEEP** |
| **organization** | **0 files** (only written in AuthComponent, never read) | 1 file | REDUNDANT — data already in `user.userData.organization` | **DELETE** |
| **clinic** | **1 file** (appointment detail page only) | 1 file | REDUNDANT — data already in `user.currentClinic` | **DELETE** |
| **appointmentDetails** | **1 file** (appointment detail page ONLY) | **1 file** | PAGE-LOCAL — 13 async thunks for a single page | **MIGRATE to TanStack Query** |
| **treatmentProtocol** | **1 file** (TreatmentProtocolModal only) | **1 file** | PAGE-LOCAL + CACHE — 25 actions for CRUD + caching | **MIGRATE to TanStack Query** |
| **availability** | **1 file** (availability page only) | **1 file** | CACHE — single-page API data | **MIGRATE to TanStack Query** |
| **analytics** | **0 files** — completely unused | **0 files** | DEAD CODE | **DELETE** |
| **practice** | **1 file** (availability page only) | **1 file** | PAGE-LOCAL CACHE — 5 fields for one page | **MIGRATE to useState** |

### The Pattern

Your Redux has **2 legitimate global slices** and **7 slices that shouldn't be in Redux at all**.

```
KEEP (2 slices):       auth, user           → Genuinely global, used by 28+ files
DELETE (3 slices):     organization, clinic, analytics → Dead/redundant code
MIGRATE (4 slices):    appointmentDetails, treatmentProtocol, availability, practice
                       → Page-local data pretending to be global state
```

### Why This Matters

The 4 "migrate" slices are all used by **only 1 page each**. They have 50+ async thunks and 70+ actions combined — all for data that never leaves a single page. This is over-engineering that:

1. Makes the Redux store huge (causes broader re-renders)
2. Keeps stale data in store when navigating away and back
3. Doesn't cache intelligently (re-fetches on every mount)
4. Requires manual loading/error state management (verbose boilerplate)

---

## 6. Redux vs TanStack Query — Speed Comparison

### What Changes With TanStack Query

| Feature | Current (Redux Thunks) | With TanStack Query |
|---------|----------------------|---------------------|
| **Caching** | None — re-fetches every time component mounts | Automatic. Data cached by key, configurable stale time |
| **Deduplication** | None — same API can be called 3x simultaneously | Automatic. Identical requests deduplicated |
| **Background refresh** | None — user sees nothing until manual refresh | Automatic stale-while-revalidate: show cached data instantly, refresh in background |
| **Retry on failure** | None — single attempt, then error | Automatic 3x retry with exponential backoff |
| **Loading states** | Manual: 9 separate `loading.xxx` booleans per slice | Automatic: `isLoading`, `isFetching`, `isRefetching` per query |
| **Error states** | Manual: 9 separate `error.xxx` strings per slice | Automatic: `error`, `isError` per query |
| **Optimistic updates** | Must implement manually in every thunk | Built-in `onMutate` → optimistic update, `onError` → rollback |
| **Window focus refetch** | None — stale data after tab switch | Automatic: refetch when user returns to tab |
| **Prefetching** | None | `prefetchQuery()` — preload data before navigation |
| **DevTools** | Redux DevTools (generic) | TanStack Query DevTools (shows cache status, stale time, refetch status per query) |

### Speed Impact Per Page

#### Appointment Detail Page (your most important page)

**Current (Redux):**
```
Navigate to page
  → 5 sequential useEffects fire
  → 5 API calls in waterfall (each waits for previous)
  → Total: ~2-3s before page is interactive
  → Navigate away and back: SAME 2-3s wait (no cache)
```

**With TanStack Query:**
```
First visit:
  → All queries fire in parallel (no waterfall)
  → Total: ~400ms (slowest single call)

Navigate away and back (within staleTime):
  → Cached data shown INSTANTLY (0ms)
  → Background refetch in progress (user doesn't wait)

Navigate away and back (after staleTime):
  → Cached data shown INSTANTLY (0ms)
  → Fresh data replaces it when API responds (~400ms)
```

| Scenario | Redux (Current) | TanStack Query | Improvement |
|----------|-----------------|----------------|-------------|
| First load | ~2-3s (waterfall) | ~400ms (parallel) | **~5-7x faster** |
| Return to page (< 5min) | ~2-3s (re-fetches everything) | **0ms** (cached, background refetch) | **Instant** |
| Return to page (> 5min) | ~2-3s | **0ms** (stale cache shown) + 400ms background | **Perceived instant** |
| Tab switch and return | ~2-3s (if re-mounts) | **0ms** (cached) + optional background refetch | **Instant** |

#### Dashboard Page

**Current:** ~1-3s on every visit (fetches KPIs, charts, lists)
**With TQ:** Instant on return visits (cached), 1-3s only on first load

#### Patients List

**Current:** ~1-2s on every navigation
**With TQ:** Instant on return (cached), with background refresh

### What It Looks Like in Code

**Current (Redux — 517 lines for appointmentDetails.slice.ts):**
```typescript
// In slice: 13 async thunks + 9 loading states + 9 error states
export const fetchAppointmentDetails = createAsyncThunk(
  'appointmentDetails/fetchAppointment',
  async ({ patientId, appointmentId }) => {
    const response = await ApiManager.getVisit(appointmentId)
    if (!response.success) throw new Error(response.message)
    return response.data
  }
)
// + 12 more thunks
// + reducers for pending/fulfilled/rejected for EACH thunk
// + 40+ lines of extra reducer cases

// In component: 7 useAppSelector + 5 useEffects
const appointment = useAppSelector(selectAppointment)
useEffect(() => {
  dispatch(fetchAppointmentDetails({...}))
}, [params.appointmentId])
useEffect(() => {
  if (appointment?.id) dispatch(fetchVisitConditions(appointment.id))
}, [appointment?.id])
// ... 3 more sequential useEffects
```

**With TanStack Query (~30 lines for same functionality):**
```typescript
// In component: simple hooks, parallel by default
const { data: appointment, isLoading } = useQuery({
  queryKey: ['appointment', appointmentId],
  queryFn: () => ApiManager.getVisit(appointmentId),
})

const { data: conditions } = useQuery({
  queryKey: ['conditions', appointmentId],
  queryFn: () => ApiManager.getVisitConditions(appointmentId),
  enabled: !!appointmentId,  // starts immediately (appointmentId from URL)
})

const { data: notes } = useQuery({
  queryKey: ['notes', appointmentId],
  queryFn: () => ApiManager.getVisitNotes(appointmentId),
  enabled: !!appointmentId,  // starts in PARALLEL with conditions
})

// All 3 fire simultaneously. No waterfall.
// Caching, loading, error states all automatic.
// Return to page? Data shown from cache instantly.
```

### Migration Effort & Risk

| Phase | What | Effort | Risk | Lines Removed |
|-------|------|--------|------|---------------|
| 1. Install TanStack Query + Provider | Setup | 30 min | ZERO | 0 |
| 2. Delete analytics slice (unused) | Cleanup | 15 min | ZERO | ~300 lines |
| 3. Delete organization slice (redundant) | Cleanup | 30 min | LOW | ~47 lines |
| 4. Delete clinic slice (redundant) | Cleanup | 1 hr | LOW | ~53 lines |
| 5. Migrate practice → useState | Simple | 1-2 hrs | LOW | ~103 lines |
| 6. Migrate availability → TanStack Query | Medium | 3-4 hrs | LOW | ~360 lines |
| 7. Migrate appointmentDetails → TanStack Query | Large | 1-2 days | MEDIUM | ~517 lines |
| 8. Migrate treatmentProtocol → TanStack Query | Large | 1-2 days | MEDIUM | ~436 lines |

**Total: ~1 week to fully migrate.** Can be done incrementally — TQ and Redux coexist perfectly.

### What You Keep in Redux After Migration

```
Redux Store (lean):
  ├── auth     → isAuthenticated, user, OTP flow (GLOBAL)
  └── user     → userData, currentClinic, currentContext (GLOBAL)

TanStack Query Cache (everything else):
  ├── ['appointment', id]       → appointment details
  ├── ['conditions', visitId]   → visit conditions
  ├── ['insights', conditionId] → clinical insights
  ├── ['protocols', visitId]    → treatment protocols
  ├── ['patients', clinicId]    → patient list
  ├── ['availability', userId]  → availability data
  └── ['analytics', clinicId]   → dashboard analytics
```

**Redux goes from 9 slices / ~2000 lines → 2 slices / ~150 lines.**

---

## Summary: Total UX Improvement Potential

| Fix | Perceived Speed Gain | Effort |
|-----|---------------------|--------|
| Convert 23 `router.push` → `<Link>` | Navigation feels instant (~90% faster per click) | 2-3 hrs |
| Add `loading.tsx` skeletons (9 routes) | No more blank white pages. Feels instant | 3-4 hrs |
| Add `error.tsx` + `not-found.tsx` | No more white screen crashes | 1-2 hrs |
| Optimistic updates (high priority) | Mutations feel instant (< 200ms vs 1-3s) | 1-2 days |
| TanStack Query migration | Return-to-page instant. Appointment page 5-7x faster | 1 week |
| **TOTAL** | App feels like a native app | ~2 weeks |

---

*Generated: 2026-02-28*

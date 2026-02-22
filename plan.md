# Protocol Generator Modal Redesign Plan

## Summary of Changes

Three areas of change in `ProtocolGeneratorModal.tsx`:
1. **Selection step** — Remove Duration picker, remove Home/Clinical split (unified protocol with HEP toggle), remove inline AI recommendations (keep it clean, just config buttons)
2. **Generating step** — Replace the fake 5-phase agent log with centered AIBubbleLoader + clean status text
3. **Results step** — Keep the current 2-panel customization UI mostly as-is, but add a HEP toggle/indicator in the protocol preview (right panel) to show which exercises are also HEP-applicable

## Files to Modify

### 1. `src/components/features/conditions/ProtocolGeneratorModal.tsx`

#### A. Selection Step Redesign (lines 1171-1327)

**Remove:**
- The entire Duration card (lines 1235-1258) — the `programDuration` picker with 4w/6w/8w/12w buttons
- The left column "Protocol Types" section (lines 1186-1205) — the Home/Clinical card selection with `renderPlanTypeCard`
- The `renderPlanTypeCard` function (lines 933-969)
- The `handlePlanTypeToggle` function (lines 409-424)

**Replace with a single-column compact layout:**
```
Generate Protocol for [conditionName]
Patient: [patientName]

┌─ Primary Focus ─────────────────────────────┐
│ [ Pain Relief ] [* Function *] [ Performance ] │
└─────────────────────────────────────────────────┘

┌─ Progression ───────────────────────────────┐
│ [ Conservative ] [* Standard *] [ Aggressive ] │
└─────────────────────────────────────────────────┘

┌─ Protocol Complexity ───────────────────────┐
│ [ Simple ] [* Standard *] [ Comprehensive ]   │
│   3-4 ex.     5-7 ex.       8-10+ ex.        │
└─────────────────────────────────────────────────┘

☑ Include Home Exercise Program (HEP)

                              [ Generate Protocol ▸ ]
```

**Specifics:**
- Rename "Patient Engagement" labels: Low → "Simple (3-4 exercises)", Moderate → "Standard (5-7 exercises)", High → "Comprehensive (8-10+ exercises)"
- Add a `includeHEP` boolean state (default: true) with a toggle switch
- Remove the `selectedPlanTypes` state array — always generate as 'clinical' (the combined protocol)
- Set `preferences.programDuration` to a sensible default (6) without showing it to user — let AI decide based on condition data
- The Generate button should always be enabled once any selection is made (no need to select plan type anymore)
- Center the configuration in the page with `max-w-xl mx-auto`
- No AI reasoning text under options — just clean buttons

#### B. Generating Step Redesign (lines 1330-1451)

**Remove entirely:**
- The `generationPhases` array (lines 92-154) — all 5 fake agent phases
- The `simulateGenerationPhases` function (lines 345-407) — the fake setTimeout chain
- The `scrollToLatestLog` function (lines 324-342)
- The `generationLogs` state (line 66)
- The `scrollContainerRef` state (line 67)
- The `currentPhase` state (line 64)
- The `phaseProgress` state (line 65)
- The entire `step === 'generating'` render block (lines 1330-1451)

**Replace with:**
- Full-height centered layout with dark gradient background (`bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900`)
- `AIBubbleLoader` component (imported from `@/components/ui/AIBubbleLoader`) scaled up 2.5x
- Ambient glow effects behind the loader (radial gradient, animated)
- Below the loader: condition name in white, then a cycling status message:
  - "Analyzing patient profile..."
  - "Building treatment protocol..."
  - "Optimizing exercise prescription..."
  - "Finalizing protocol..."
- Three small animated teal dots under the message
- Clean, cinematic feel — no progress bars, no agent names, no task lists

**Update `handleGenerate`:**
- Remove `simulateGenerationPhases()` call
- Just call `setStep('generating')`, then `await generateProtocol('clinical')`, then `setStep('results')`
- The generating screen shows for however long the API actually takes (no artificial padding)

#### C. Results Step Changes (lines 1453-1578)

**Keep mostly as-is.** The 2-panel layout (left: ProtocolCustomizationStep, right: protocol preview) stays.

**Changes:**
- In the header (lines 1106-1166): Update the stage indicator to not reference 'home' or 'clinical' separately — just show "Protocol"
- In the control bar (lines 1456-1472): Add a small HEP indicator badge next to "Save Protocol" — something like a green badge "HEP Included" if `includeHEP` is true
- In `renderProtocolPhase` (lines 971-1089): Add a small home icon (🏠) badge next to exercises that are HEP-suitable (exercises without clinical equipment requirements). This visually shows which exercises will be in the home program without creating a separate view.
- Pass `planType` as `'clinical'` always to `ProtocolCustomizationStep` (so manual therapy is always available)
- The `SafetyWarnings` `planType` prop should be `'clinical'`

#### D. State & Logic Changes

**Remove:**
- `selectedPlanTypes` state — no longer needed
- `homeProtocol` / `clinicalProtocol` split — use single `protocol` state
- `customizedHomeProtocol` / `customizedClinicalProtocol` split — use single `customizedProtocol` state
- `currentGenerating` state — not needed with single generation

**Add:**
- `includeHEP` state (boolean, default true)
- `protocol` state (replaces homeProtocol/clinicalProtocol)
- `customizedProtocol` state (replaces customizedHomeProtocol/customizedClinicalProtocol)
- `generatingMessage` state for cycling the status text during generation

**Update `handleGenerate`:**
```typescript
const handleGenerate = async () => {
  setLoading(true)
  setError(null)
  setStep('generating')

  try {
    await generateProtocol('clinical') // always clinical (includes everything)
    setStep('results')
  } catch (err) {
    console.error('Error generating protocol:', err)
    setStep('selection') // go back on error
  } finally {
    setLoading(false)
  }
}
```

**Update `generateProtocol`:**
- Always generates as 'clinical'
- Sets single `protocol` and `customizedProtocol` states
- Passes `includeHEP` in the request preferences so the API knows to include home exercise recommendations

**Update `handleSaveProtocol`:**
- References single `protocol` / `customizedProtocol` instead of home/clinical variants
- Sets `protocol_type` to `'clinical'` (or `'combined'` if backend supports it)
- Includes `includeHEP` flag in saved data

#### E. Preferences Default Change

```typescript
const [preferences, setPreferences] = useState<ProtocolPreferences>({
  primaryFocus: 'function',
  progressionApproach: 'standard',
  patientEngagement: 'moderate',
  programDuration: 6,    // kept as default, not shown to user
  setting: 'clinic'      // always clinic now
})
```

### 2. `src/components/ui/AIBubbleLoader.tsx` — No changes needed
Already has the `AIBubbleLoader` component that will be imported.

### 3. `src/components/features/conditions/ProtocolCustomizationStep.tsx` — Minimal changes

- The `planType` prop will always be `'clinical'` now, so manual therapy tab is always available
- No other structural changes — the component works as-is

### 4. Type changes (if needed)
- `ProtocolPreferences` may need an `includeHEP?: boolean` field
- `DirectProtocolGenerationRequest` `planType` will always be `'clinical'`

## What Stays the Same
- The full-screen modal pattern
- The header with Brain icon, patient name, condition name, phase selector
- The ProtocolCustomizationStep left panel (exercises/modalities/manual therapy tabs, inline custom inputs)
- The protocol preview right panel (phase cards with exercises, modalities, manual therapy)
- The SafetyWarnings component
- The Save Protocol flow and all API calls (except simplified to single protocol)
- Goals and phases in the customization step (toggle buttons for static data phases/goals)
- All the protocol save/export logic (adapted for single protocol)

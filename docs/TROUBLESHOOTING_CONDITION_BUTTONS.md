# Troubleshooting: Can't See Edit & Sparkles Buttons in Conditions Tab

**Issue:** Edit and Sparkles (AI Protocol) buttons not visible in Conditions tab
**Status:** Buttons exist in code - troubleshooting visibility issue

---

## ✅ Quick Checklist

Before deep troubleshooting, verify these basics:

- [ ] 1. **You have at least one condition added** for the patient
- [ ] 2. **You're in the Conditions tab** (not Overview, Visits, Notes, or History)
- [ ] 3. **The condition card is fully loaded** (not showing loading spinner)
- [ ] 4. **Your screen width is reasonable** (not too narrow)
- [ ] 5. **Browser zoom is 100%** (not zoomed in/out)

---

## 🔍 Issue #1: No Conditions Added Yet

### Symptoms:
- You see: "No active conditions found"
- Or: "Click 'Add Condition' to add new conditions"

### Solution:
**You need to add a condition first!**

1. Click **"Add Condition"** button (top right of Conditions tab)
2. Select a condition or use Smart Screening
3. Once condition is added, you'll see the card with buttons

---

## 🔍 Issue #2: Wrong Tab Selected

### Symptoms:
- You see patient information but no condition cards
- You're in Overview, Visits, Notes, or History tab

### Solution:
1. Look at the tab bar (should have 5 tabs)
2. Click on **"Conditions"** tab
3. You'll see sub-tabs: Active, Improving, On Hold, Discharged, All
4. Make sure you're in a tab that has conditions

**Tab Layout:**
```
[ Overview ] [ Visits ] [ Notes ] [ CONDITIONS ] [ History ]
                                       ↑
                                  CLICK HERE!
```

**Sub-tabs in Conditions:**
```
[ Active (X) ] [ Improving (X) ] [ On Hold (X) ] [ Discharged (X) ] [ All (X) ]
     ↑
Start here!
```

---

## 🔍 Issue #3: Screen Too Narrow (Responsive Issue)

### Symptoms:
- Buttons are cut off on the right side
- You need to scroll horizontally
- Only see condition name and badges

### Solution:

**Option A: Wider Window**
1. Maximize your browser window
2. Use full screen (F11)
3. Zoom out (Ctrl/Cmd + -)

**Option B: Scroll Horizontally**
1. Try scrolling the condition card to the right
2. Buttons might be off-screen on narrow displays

**Minimum Width Recommended:** 1024px (tablet/desktop)

---

## 🔍 Issue #4: Button Container Layout Issue

### Symptoms:
- You see condition details but no buttons at all
- Right side of card is empty

### Debug Steps:

### Step 1: Open Browser DevTools
- Chrome/Edge: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- Firefox: F12
- Safari: Cmd+Option+I

### Step 2: Inspect the Condition Card
1. Right-click on a condition card
2. Click "Inspect" or "Inspect Element"
3. Look for this in the HTML:

```html
<div class="flex items-start justify-between">
  <div class="flex-1">
    <!-- Condition details here -->
  </div>
  <div class="flex items-center gap-2">
    <!-- BUTTONS SHOULD BE HERE -->
    <button ...><Edit icon></button>
    <button ...><Sparkles icon></button>
    <button ...><Discharge/Delete icons></button>
  </div>
</div>
```

### Step 3: Check if Buttons Exist
- If you see the button elements: **CSS/Layout issue**
- If you don't see button elements: **Rendering issue**

---

## 🔍 Issue #5: CSS Display Issue

### Possible CSS Problems:

1. **Buttons hidden by CSS**
   - Check if buttons have `display: none` or `visibility: hidden`

2. **Flex container issue**
   - Parent div should have `flex items-start justify-between`
   - Button container should have `flex items-center gap-2`

3. **Z-index/Overlay issue**
   - Something else might be covering the buttons

### Quick Fix Test:
In DevTools Console, run:
```javascript
// Make all buttons visible
document.querySelectorAll('button').forEach(btn => {
  btn.style.display = 'inline-flex';
  btn.style.visibility = 'visible';
  btn.style.opacity = '1';
  btn.style.border = '2px solid red'; // So you can see them
});
```

If buttons appear after this, it's a CSS issue.

---

## 🔍 Issue #6: JavaScript Error Preventing Render

### Symptoms:
- Page loads but condition cards look incomplete
- Browser console shows errors

### Debug Steps:

1. **Open Browser Console** (F12 → Console tab)

2. **Look for Red Errors**
   - Check for import errors
   - Check for component errors
   - Check for undefined variables

3. **Common Errors:**
   ```
   ❌ Cannot find module '@/services/api'
   ❌ Sparkles is not defined
   ❌ Edit is not defined
   ❌ TypeError: condition.xxx is undefined
   ```

4. **If you see errors:**
   - Take a screenshot
   - Copy the error message
   - Check if imports at top of file are correct

---

## 🔍 Issue #7: Component Not Updated After Reorganization

### Symptoms:
- Old version of component is being used
- Buttons might be in old location

### Solution:

1. **Clear Build Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Hard Refresh Browser**
   - Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Firefox: Ctrl+F5
   - Safari: Cmd+Option+R

3. **Clear Browser Cache**
   - Chrome: Settings → Privacy → Clear browsing data
   - Or use Incognito/Private mode

---

## 🔎 Detailed Button Layout

Here's exactly what you should see for each condition card:

```
┌────────────────────────────────────────────────────────────────┐
│  🏥 Ankle Sprain (Lateral)                          [🔵 ACTIVE]│
│  └─ MUSCULOSKELETAL • MODERATE • Ankle                        │
│                                                                 │
│  📅 Onset: Jan 15, 2026 • ⏰ Added: Jan 15, 2026             │
│  🩺 Last assessed: Jan 20, 2026 • 3 treatment session(s)     │
│                                                                 │
│  Right Side Actions: ───────────────────────────────────────→  │
│                         [ 📝 ] [ ✨ ] [ 🚪 ] [ 🗑️ ]           │
│                          Edit  Generate Discharge Delete       │
│                                  ↑                              │
│                          THIS IS THE ONE YOU WANT!             │
└────────────────────────────────────────────────────────────────┘
```

**Button Order (left to right):**
1. 📝 **Edit** - Edit condition details
2. ✨ **Sparkles** - Generate AI Protocol ← **THIS ONE!**
3. 🚪 **Discharge** - Mark condition as discharged (or 🔄 Reactivate if already discharged)
4. 🗑️ **Delete** - Delete the condition

---

## 🛠️ Manual Check: Verify Component File

Let's verify the component has the correct code:

```bash
# Check if buttons exist in the file
grep -n "Sparkles\|Generate AI Protocol" src/components/features/conditions/PatientConditionManagement.tsx

# Should show:
# Line 4: Import Sparkles icon
# Line 688: onClick={handleGenerateProtocol}
# Line 690: title="Generate AI Protocol"
# Line 692: <Sparkles className="w-4 h-4" />
```

If this doesn't show results, the file might be outdated.

---

## 🎯 Still Can't See Buttons?

Try these advanced steps:

### 1. Take a Screenshot
- Go to Dashboard → Patients → Select Patient → Conditions Tab
- Take screenshot of what you see
- This will help identify the issue

### 2. Check Patient Has Conditions
Run in browser console:
```javascript
// Check if conditions exist
console.log('Current URL:', window.location.href);
console.log('Patient ID in URL:', window.location.pathname.split('/'));
```

### 3. Force Re-render
In browser console:
```javascript
// Force React to re-render
window.location.reload(true);
```

### 4. Check Network Requests
1. Open DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. Reload page
4. Look for request to `/api/patients/[id]/conditions`
5. Check if response has conditions data

---

## ✅ Expected Behavior

When everything works correctly:

1. **Navigate to Patient**
   - Dashboard → Patients → Click patient

2. **Go to Conditions Tab**
   - See tabs: Overview, Visits, Notes, **Conditions**, History
   - Click "Conditions"

3. **See Sub-tabs**
   - Active, Improving, On Hold, Discharged, All
   - Numbers show how many conditions in each

4. **See Condition Cards**
   - Each card has:
     - Condition name (large text)
     - Badges (status, type, severity, body region)
     - Description
     - Dates (onset, last assessed, added)
     - **→ Action buttons on the RIGHT SIDE ←**

5. **Buttons Visible**
   - Edit (📝)
   - **Sparkles (✨)** ← Generate AI Protocol
   - Discharge (🚪)
   - Delete (🗑️)

---

## 🔧 Quick Fix Attempts

Try these in order:

### Fix 1: Clear & Rebuild
```bash
rm -rf .next
npm run dev
# Wait for build
# Hard refresh browser (Ctrl+Shift+R)
```

### Fix 2: Check Imports
Verify at top of `PatientConditionManagement.tsx`:
```typescript
import { Sparkles, Edit, LogOut, Trash2, PlayCircle } from 'lucide-react'
```

### Fix 3: Verify Component Import
Check `EnhancedPatientDetailsModal.tsx` has:
```typescript
import PatientConditionManagement from '../conditions/PatientConditionManagement';
```

And uses it:
```typescript
{activeTab === 'conditions' && (
  <PatientConditionManagement
    patientId={patientId}
    ...
  />
)}
```

---

## 📞 If Nothing Works

If you've tried everything and still can't see the buttons:

1. **Check Browser Console for errors** (F12 → Console)
2. **Take screenshots** of:
   - The Conditions tab
   - Browser console (any errors)
   - DevTools Elements tab (inspecting condition card)
3. **Verify you're running latest code**:
   ```bash
   git status
   npm run build
   ```

---

## 🎓 Understanding the Layout

The condition card uses **Flexbox** layout:

```
┌─── Card ──────────────────────────────────────────┐
│ ┌─── flex justify-between ────────────────────┐  │
│ │                                              │  │
│ │  ┌─ flex-1 (grow) ──┐    ┌─ gap-2 (fixed) ┐│  │
│ │  │ Condition Details │    │ [📝][✨][🚪][🗑️]││  │
│ │  │ - Name            │    │  Action Buttons ││  │
│ │  │ - Badges          │    │                 ││  │
│ │  │ - Description     │    │                 ││  │
│ │  │ - Dates           │    │                 ││  │
│ │  └───────────────────┘    └──────────────────┘│  │
│ │          ↑                        ↑          │  │
│ │    Takes all space          Fixed width     │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**If screen is narrow:**
- Left side (condition details) shrinks
- Right side (buttons) should stay visible
- But buttons might stack or be cut off

---

## ✅ Resolution Checklist

Once you find the issue:

- [ ] Can see condition cards in Conditions tab
- [ ] Can see all 4 action buttons on each card
- [ ] Edit button (📝) works
- [ ] Sparkles button (✨) visible and clickable
- [ ] Discharge button (🚪) visible
- [ ] Delete button (🗑️) visible
- [ ] Clicking Sparkles opens Protocol Generator modal

---

**Updated:** 2026-02-09
**Status:** Troubleshooting Guide
**Component:** `PatientConditionManagement.tsx` lines 675-739

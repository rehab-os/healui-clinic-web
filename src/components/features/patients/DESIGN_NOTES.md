# Patient Card Design System

## 🎨 Design Philosophy

**Clinical Precision with Warm Modern Touch**

This patient card system balances professional medical aesthetics with thoughtful, human-centered design details. It matches the polished aesthetic of your login page while maintaining functional clarity for daily clinical use.

---

## ✨ Key Design Features

### 1. **Gradient Avatar**
- **Aesthetic**: Circular gradient from brand-teal (#1e5f79) to light-teal (#c8eaeb)
- **Purpose**: Creates visual warmth and brand consistency
- **Detail**: Active status pulse indicator (green dot with animation)

### 2. **Action Hierarchy**
```
PRIMARY:    Start Diagnosis (teal gradient, full-width, bold)
SECONDARY:  Billing (purple outline) + Schedule (gray outline)
TERTIARY:   View/History (hidden in overflow menu)
```

### 3. **Micro-interactions**
- **Card hover**: Subtle lift (-translate-y-1) + enhanced shadow
- **Button hover**: Crosshair icon rotates 90°
- **Shimmer effect**: Gradient sweep on primary button hover
- **Status pulse**: Animated green dot for active patients

### 4. **Visual Depth**
- Subtle grain texture overlay (0.015 opacity)
- Left border accent (4px brand-teal)
- Layered shadows for depth perception
- Backdrop blur on controls bar

---

## 🎯 Component Props

```typescript
interface PatientCardProps {
  patient: {
    id: string;
    patient_code: string;
    full_name: string;
    date_of_birth: Date;
    gender: string;
    status: string;
  };
  viewMode: 'grid' | 'list';
  onStartDiagnosis: () => void;  // Primary action
  onBilling: () => void;          // Secondary action
  onSchedule: () => void;         // Secondary action
  onView?: () => void;            // Tertiary (optional)
  onHistory?: () => void;         // Tertiary (optional)
}
```

---

## 📱 Responsive Behavior

### Grid View
- **Mobile (<640px)**: Single column, full action labels
- **Tablet (640-1024px)**: 2 columns
- **Desktop (>1024px)**: 3 columns

### List View
- Compact table rows with horizontal scroll on mobile
- Full action buttons visible on all breakpoints
- Optimized touch targets (44px minimum)

---

## 🎨 Color Usage

| Element | Color | Usage |
|---------|-------|-------|
| Primary CTA | `#1e5f79 → #2a7a9b` | Start Diagnosis gradient |
| Billing | Purple (`purple-700/200`) | Financial actions |
| Schedule | Gray (`gray-700/200`) | Calendar actions |
| Active Status | Emerald (`emerald-500`) | Patient active indicator |
| Background | `#eff8ff → #c8eaeb` | Page gradient |

---

## ⚡ Performance

- **CSS-only animations**: No JavaScript for hover/transitions
- **Lazy loading**: Icons from lucide-react (tree-shakeable)
- **Optimized shadows**: GPU-accelerated transforms
- **Minimal re-renders**: Event handlers use stopPropagation

---

## 🔧 Usage Example

```tsx
import PatientCard from '@/components/features/patients/PatientCard';

// Grid View
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  {patients.map(patient => (
    <PatientCard
      key={patient.id}
      patient={patient}
      viewMode="grid"
      onStartDiagnosis={() => handleDiagnosis(patient)}
      onBilling={() => handleBilling(patient)}
      onSchedule={() => handleSchedule(patient)}
    />
  ))}
</div>

// List View
<table>
  <tbody>
    {patients.map(patient => (
      <PatientCard
        key={patient.id}
        patient={patient}
        viewMode="list"
        onStartDiagnosis={() => handleDiagnosis(patient)}
        onBilling={() => handleBilling(patient)}
        onSchedule={() => handleSchedule(patient)}
      />
    ))}
  </tbody>
</table>
```

---

## 🚀 What Changed from Previous Design

### Removed
- ❌ Excessive contact info (phone/email visible by default)
- ❌ Intake status complexity
- ❌ Multiple visible secondary actions cluttering the UI
- ❌ "Dx" cryptic label

### Improved
- ✅ Renamed "Dx" → "Start Diagnosis" (clear, professional)
- ✅ Billing elevated to prominent secondary action
- ✅ Cleaner visual hierarchy with gradient primary CTA
- ✅ View/History moved to overflow menu (temp features)
- ✅ Compact spacing without feeling cramped
- ✅ Matching login page aesthetic with gradients

### Added
- ✅ Subtle grain texture for tactile quality
- ✅ Animated status indicators
- ✅ Shimmer effect on primary button
- ✅ Better hover states throughout
- ✅ Left border accent for brand identity
- ✅ Professional typography hierarchy

---

## 📊 Design Metrics

- **Card padding**: 20px (p-5) - Golden ratio
- **Avatar size**: 56px (grid) / 44px (list)
- **Primary button height**: 48px (touch-friendly)
- **Border radius**: 16px (rounded-2xl) - Consistent with login
- **Shadow elevation**: sm → xl on hover (smooth transition)
- **Animation duration**: 200-300ms (feels responsive)

---

## 🎭 Design Inspirations

- **Scandinavian healthcare**: Clean, warm, approachable
- **Modern SaaS products**: Subtle gradients, micro-interactions
- **Apple Design**: Precision spacing, thoughtful hierarchy
- **Material Design 3**: Elevation through shadows

---

## 🔮 Future Enhancements (Optional)

- Skeleton loading states
- Drag-to-reorder in grid view
- Batch selection mode
- Quick actions swipe gesture (mobile)
- Card flip animation for more details
- Accessibility keyboard shortcuts

---

## ✅ Accessibility Checklist

- [x] WCAG AA color contrast
- [x] Keyboard navigation support
- [x] Focus indicators visible
- [x] Touch targets ≥44px
- [x] Screen reader labels (ARIA)
- [x] Reduced motion support (prefers-reduced-motion)

---

Created with attention to detail and clinical professionalism. 🏥✨

/**
 * Lazy-loaded components for better code splitting
 *
 * This file provides lazy-loaded versions of heavy components
 * to reduce initial bundle size and improve performance.
 *
 * Usage:
 * import { LazySmartScreeningChatbot } from '@/components/features/LazyComponents';
 *
 * Then use with Suspense:
 * <Suspense fallback={<LoadingSpinner />}>
 *   <LazySmartScreeningChatbot {...props} />
 * </Suspense>
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for Suspense fallback
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
    <span className="ml-3 text-gray-600">Loading component...</span>
  </div>
);

// Screening Components (Heavy)
export const LazySmartScreeningChatbot = dynamic(
  () => import('./screening/SmartScreeningChatbot'),
  {
    loading: () => <ComponentLoader />,
    ssr: false // Client-side only for better performance
  }
);

export const LazyPhysioAssessmentChatbot = dynamic(
  () => import('./screening/PhysioAssessmentChatbot'),
  {
    loading: () => <ComponentLoader />,
    ssr: false
  }
);

export const LazySmartScreeningModal = dynamic(
  () => import('./screening/SmartScreeningModal'),
  {
    loading: () => <ComponentLoader />
  }
);

// Condition Components (Heavy)
export const LazyTreatmentProtocolModal = dynamic(
  () => import('./conditions/TreatmentProtocolModal'),
  {
    loading: () => <ComponentLoader />
  }
);

export const LazyProtocolGeneratorModal = dynamic(
  () => import('./conditions/ProtocolGeneratorModal'),
  {
    loading: () => <ComponentLoader />
  }
);

export const LazyPatientConditionManagement = dynamic(
  () => import('./conditions/PatientConditionManagement'),
  {
    loading: () => <ComponentLoader />
  }
);

// Patient Components (Heavy)
export const LazyEnhancedPatientDetailsModal = dynamic(
  () => import('./patients/EnhancedPatientDetailsModal'),
  {
    loading: () => <ComponentLoader />
  }
);

export const LazyPatientDetailsModal = dynamic(
  () => import('./patients/PatientDetailsModal'),
  {
    loading: () => <ComponentLoader />
  }
);

// Billing Components (Heavy)
export const LazyBillVisitModal = dynamic(
  () => import('./billing/BillVisitModal'),
  {
    loading: () => <ComponentLoader />
  }
);

export const LazyPatientBillingPanel = dynamic(
  () => import('./billing/PatientBillingPanel'),
  {
    loading: () => <ComponentLoader />
  }
);

// Assessment Components
export const LazyAssessmentFormBuilder = dynamic(
  () => import('./assessments/AssessmentFormBuilder'),
  {
    loading: () => <ComponentLoader />
  }
);

export const LazyClinicalAssessmentModal = dynamic(
  () => import('./assessments/ClinicalAssessmentModal'),
  {
    loading: () => <ComponentLoader />
  }
);

/**
 * Lazy Loading Best Practices:
 *
 * 1. Use for components > 500 lines
 * 2. Use for modals and dialogs (not immediately visible)
 * 3. Use for route-specific components
 * 4. Wrap with Suspense for proper fallback
 * 5. Disable SSR for client-only components
 *
 * Example:
 * ```tsx
 * import { Suspense } from 'react';
 * import { LazySmartScreeningChatbot } from '@/components/features/LazyComponents';
 *
 * function MyPage() {
 *   return (
 *     <Suspense fallback={<ComponentLoader />}>
 *       <LazySmartScreeningChatbot onClose={() => {}} />
 *     </Suspense>
 *   );
 * }
 * ```
 */

// Export all lazy components as a group
export const LazyComponents = {
  // Screening
  SmartScreeningChatbot: LazySmartScreeningChatbot,
  PhysioAssessmentChatbot: LazyPhysioAssessmentChatbot,
  SmartScreeningModal: LazySmartScreeningModal,

  // Conditions
  TreatmentProtocolModal: LazyTreatmentProtocolModal,
  ProtocolGeneratorModal: LazyProtocolGeneratorModal,
  PatientConditionManagement: LazyPatientConditionManagement,

  // Patients
  EnhancedPatientDetailsModal: LazyEnhancedPatientDetailsModal,
  PatientDetailsModal: LazyPatientDetailsModal,

  // Billing
  BillVisitModal: LazyBillVisitModal,
  PatientBillingPanel: LazyPatientBillingPanel,

  // Assessments
  AssessmentFormBuilder: LazyAssessmentFormBuilder,
  ClinicalAssessmentModal: LazyClinicalAssessmentModal,
};

export default LazyComponents;

import React from 'react';
import ConditionRequiredValidator from './ConditionRequiredValidator';

interface WithConditionValidationProps {
  visitConditions: any[];
  onAddCondition?: () => void;
  section: 'protocols' | 'notes' | 'treatment';
  className?: string;
}

/**
 * Higher-order component that wraps components with condition validation
 * Usage: withConditionValidation(YourComponent, 'protocols')
 */
export function withConditionValidation<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  section: 'protocols' | 'notes' | 'treatment'
) {
  return React.forwardRef<any, P & WithConditionValidationProps>((props, ref) => {
    const { visitConditions, onAddCondition, className, ...otherProps } = props;

    return (
      <ConditionRequiredValidator
        visitConditions={visitConditions}
        onAddCondition={onAddCondition}
        section={section}
        className={className}
      >
        <WrappedComponent {...(otherProps as P)} ref={ref} />
      </ConditionRequiredValidator>
    );
  });
}

/**
 * Hook to check if conditions are present and provide validation state
 */
export function useConditionValidation(visitConditions: any[]) {
  const hasConditions = visitConditions && visitConditions.length > 0;
  
  return {
    hasConditions,
    isDisabled: !hasConditions,
    conditionCount: visitConditions?.length || 0,
    validationMessage: hasConditions 
      ? null 
      : 'Add at least one condition to document treatment',
    canProceed: hasConditions
  };
}

/**
 * Simple validation barrier component
 */
interface ConditionBarrierProps {
  visitConditions: any[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAddCondition?: () => void;
}

export const ConditionBarrier: React.FC<ConditionBarrierProps> = ({
  visitConditions,
  children,
  fallback,
  onAddCondition
}) => {
  const { hasConditions } = useConditionValidation(visitConditions);
  
  if (!hasConditions) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-500 mb-2">⚠️</div>
        <p className="text-sm text-gray-600 mb-3">
          Add at least one condition to this visit before accessing treatment options
        </p>
        {onAddCondition && (
          <button
            onClick={onAddCondition}
            className="text-sm text-healui-physio hover:text-healui-physio/80 font-medium"
          >
            Add Condition →
          </button>
        )}
      </div>
    );
  }
  
  return <>{children}</>;
};

export default withConditionValidation;
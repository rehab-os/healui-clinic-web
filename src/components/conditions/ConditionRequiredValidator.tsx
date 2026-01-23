import React from 'react';
import { AlertTriangle, Plus, Target } from 'lucide-react';

interface ConditionRequiredValidatorProps {
  visitConditions: any[];
  children: React.ReactNode;
  onAddCondition?: () => void;
  section: 'protocols' | 'notes' | 'treatment';
  className?: string;
}

const ConditionRequiredValidator: React.FC<ConditionRequiredValidatorProps> = ({
  visitConditions,
  children,
  onAddCondition,
  section,
  className = ''
}) => {
  const hasConditions = visitConditions && visitConditions.length > 0;

  if (hasConditions) {
    return <>{children}</>;
  }

  const getSectionConfig = () => {
    switch (section) {
      case 'protocols':
        return {
          title: 'Treatment Protocols',
          message: 'Add at least one condition to select treatment protocols',
          icon: <Target className="w-5 h-5" />
        };
      case 'notes':
        return {
          title: 'Clinical Notes',
          message: 'Add at least one condition to document treatment notes',
          icon: <Target className="w-5 h-5" />
        };
      case 'treatment':
        return {
          title: 'Treatment Documentation',
          message: 'Add at least one condition to document treatment',
          icon: <Target className="w-5 h-5" />
        };
      default:
        return {
          title: 'Treatment Section',
          message: 'Add at least one condition to proceed',
          icon: <Target className="w-5 h-5" />
        };
    }
  };

  const config = getSectionConfig();

  return (
    <div className={`${className}`}>
      {/* Disabled State Overlay */}
      <div className="relative">
        <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title} Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">{config.message}</p>
            {onAddCondition && (
              <button
                onClick={onAddCondition}
                className="inline-flex items-center gap-2 px-4 py-2 bg-healui-physio text-white rounded-lg font-medium hover:bg-healui-physio/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            )}
          </div>
        </div>
        
        {/* Disabled Content */}
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
      
      {/* Warning Banner */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Clinical Documentation Required</p>
            <p className="text-yellow-700">
              This visit must have at least one documented condition before {section} can be accessed. 
              This ensures proper clinical workflow and documentation standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionRequiredValidator;
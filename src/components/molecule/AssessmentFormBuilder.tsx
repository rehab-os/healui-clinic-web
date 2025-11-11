'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Import assessment data
import assessmentsData from '../../data/ontology-data/entities/clinical_assessments.json';

interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

interface FormField {
  field_name: string;
  field_type: string;
  label: string;
  options?: FieldOption[];
  required?: boolean;
  show_when?: {
    field: string;
    operator: string;
    value?: string;
    values?: string[];
  };
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  max_length?: number;
  description?: string;
}

interface AssessmentData {
  name: string;
  type: string;
  body_regions: string[];
  purpose: string;
  description: string;
  input_schema?: {
    primary_fields: FormField[];
    secondary_fields: FormField[];
    validation_rules?: any;
    field_metadata?: any;
    computed_fields?: any;
    clinical_decision_support?: any;
    display_config?: any;
  };
}

interface AssessmentFormBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onSubmit: (assessmentId: string, formData: any) => void;
  onNext: () => void;
  onSkip: () => void;
  currentIndex: number;
  totalAssessments: number;
}

const AssessmentFormBuilder: React.FC<AssessmentFormBuilderProps> = ({
  isOpen,
  onClose,
  assessmentId,
  onSubmit,
  onNext,
  onSkip,
  currentIndex,
  totalAssessments
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState<'primary' | 'secondary'>('primary');

  const assessment: AssessmentData | null = (assessmentsData as any).assessments[assessmentId] || null;

  console.log('🔧 AssessmentFormBuilder props:', {
    isOpen,
    assessmentId,
    currentIndex,
    totalAssessments
  });

  console.log('🔧 AssessmentFormBuilder assessment lookup:', {
    assessmentId,
    foundAssessment: !!assessment,
    hasInputSchema: !!assessment?.input_schema,
    assessmentName: assessment?.name
  });

  useEffect(() => {
    if (isOpen && assessment) {
      console.log('🔧 AssessmentFormBuilder: Initializing form for:', assessment.name);
      setFormData({});
      setErrors({});
      setCurrentSection('primary');
    }
  }, [isOpen, assessmentId, assessment]);

  if (!assessment || !assessment.input_schema) {
    console.log('❌ AssessmentFormBuilder: No assessment or input_schema found for:', assessmentId);
    return null;
  }

  const { primary_fields = [], secondary_fields = [] } = assessment.input_schema;

  const checkFieldVisibility = (field: FormField): boolean => {
    if (!field.show_when) return true;

    const { field: dependentField, operator, value, values } = field.show_when;
    const dependentValue = formData[dependentField];

    switch (operator) {
      case '==':
        return dependentValue === value;
      case '!=':
        return dependentValue !== value;
      case 'in':
        return values?.includes(dependentValue) || false;
      case '>=':
        return parseInt(dependentValue) >= parseInt(value || '0');
      case '<=':
        return parseInt(dependentValue) <= parseInt(value || '0');
      default:
        return true;
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    const fieldsToValidate = currentSection === 'primary' ? primary_fields : secondary_fields;

    fieldsToValidate.forEach(field => {
      if (field.required && checkFieldVisibility(field)) {
        const value = formData[field.field_name];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.field_name] = `${field.label} is required`;
        }
      }

      // Validate number fields
      if (field.field_type === 'number' && formData[field.field_name] !== undefined) {
        const numValue = parseInt(formData[field.field_name]);
        if (field.min !== undefined && numValue < field.min) {
          newErrors[field.field_name] = `Minimum value is ${field.min}`;
        }
        if (field.max !== undefined && numValue > field.max) {
          newErrors[field.field_name] = `Maximum value is ${field.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (currentSection === 'primary' && secondary_fields.length > 0) {
      setCurrentSection('secondary');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        assessment_id: assessmentId,
        assessment_name: assessment.name,
        timestamp: new Date().toISOString(),
        form_data: formData,
        clinical_metadata: assessment.input_schema?.field_metadata || {},
        computed_results: {} // Could calculate computed fields here
      };

      await onSubmit(assessmentId, submissionData);
      
      // Auto-advance to next assessment or show completion
      if (currentIndex < totalAssessments - 1) {
        onNext();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Assessment submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    if (!checkFieldVisibility(field)) return null;

    const fieldValue = formData[field.field_name] || '';
    const fieldError = errors[field.field_name];

    switch (field.field_type) {
      case 'radio':
        return (
          <div key={field.field_name} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-600 mb-3">{field.description}</p>
            )}
            <div className="space-y-3">
              {field.options?.map(option => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:border-teal-300 ${
                    fieldValue === option.value 
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' 
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name={field.field_name}
                    value={option.value}
                    checked={fieldValue === option.value}
                    onChange={(e) => handleInputChange(field.field_name, e.target.value)}
                    className="mt-1 mr-3 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {fieldError && <p className="text-red-500 text-sm mt-2">{fieldError}</p>}
          </div>
        );

      case 'checkbox_group':
        const checkboxValues = fieldValue || [];
        return (
          <div key={field.field_name} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-600 mb-3">{field.description}</p>
            )}
            <div className="space-y-2">
              {field.options?.map(option => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-teal-300 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={checkboxValues.includes(option.value)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...checkboxValues, option.value]
                        : checkboxValues.filter((v: string) => v !== option.value);
                      handleInputChange(field.field_name, newValues);
                    }}
                    className="mr-3 text-teal-600 focus:ring-teal-500 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600">{option.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {fieldError && <p className="text-red-500 text-sm mt-2">{fieldError}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.field_name} className="mb-6">
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:border-teal-300 transition-all">
              <input
                type="checkbox"
                checked={!!fieldValue}
                onChange={(e) => handleInputChange(field.field_name, e.target.checked)}
                className="mt-1 mr-3 text-teal-600 focus:ring-teal-500 rounded"
              />
              <div>
                <div className="font-semibold text-gray-800">{field.label}</div>
                {field.description && (
                  <div className="text-sm text-gray-600 mt-1">{field.description}</div>
                )}
              </div>
            </label>
            {fieldError && <p className="text-red-500 text-sm mt-2">{fieldError}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.field_name} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-600 mb-3">{field.description}</p>
            )}
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {(field.min !== undefined || field.max !== undefined) && (
              <p className="text-xs text-gray-500 mt-1">
                Range: {field.min || 0} - {field.max || '∞'}
                {field.step && ` (step: ${field.step})`}
              </p>
            )}
            {fieldError && <p className="text-red-500 text-sm mt-2">{fieldError}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.field_name} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-600 mb-3">{field.description}</p>
            )}
            <textarea
              value={fieldValue}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.max_length}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-vertical ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {field.max_length && (
              <p className="text-xs text-gray-500 mt-1">
                {fieldValue.length}/{field.max_length} characters
              </p>
            )}
            {fieldError && <p className="text-red-500 text-sm mt-2">{fieldError}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.field_name} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-600 mb-3">{field.description}</p>
            )}
            <select
              value={fieldValue}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select an option...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError && <p className="text-red-500 text-sm mt-2">{fieldError}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    console.log('🔧 AssessmentFormBuilder: isOpen is false, returning null');
    return null;
  }

  console.log('🔧 AssessmentFormBuilder: About to render modal for:', assessment.name);

  const currentFields = currentSection === 'primary' ? primary_fields : secondary_fields;
  const visibleFields = currentFields.filter(checkFieldVisibility);

  console.log('🔧 AssessmentFormBuilder: Field analysis:', {
    currentSection,
    primaryFieldsCount: primary_fields.length,
    secondaryFieldsCount: secondary_fields.length,
    currentFieldsCount: currentFields.length,
    visibleFieldsCount: visibleFields.length
  });

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🔬 {assessment.name}
              </h2>
              <p className="text-blue-100 mt-1">{assessment.purpose}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  Assessment {currentIndex + 1} of {totalAssessments}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {currentSection === 'primary' ? 'Primary' : 'Additional'} Fields
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Assessment Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <p className="text-gray-700">{assessment.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {assessment.body_regions.map(region => (
              <span key={region} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {region.replace('_', ' ').toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {visibleFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No additional fields to complete for this assessment.
            </div>
          ) : (
            <div className="space-y-6">
              {visibleFields.map(renderField)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="px-6 py-3 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ⏭️ Skip Test
              </button>
            </div>

            <div className="flex gap-3">
              {currentSection === 'secondary' && (
                <button
                  onClick={() => setCurrentSection('primary')}
                  className="px-6 py-3 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  ← Back to Primary
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 text-white rounded-lg font-semibold transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Submitting...
                  </>
                ) : currentSection === 'primary' && secondary_fields.length > 0 ? (
                  'Continue to Additional Fields →'
                ) : currentIndex < totalAssessments - 1 ? (
                  'Complete & Next Assessment →'
                ) : (
                  'Complete Assessment ✓'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default AssessmentFormBuilder;
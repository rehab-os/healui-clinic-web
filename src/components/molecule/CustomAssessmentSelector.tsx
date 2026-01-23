'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

// Import assessment data
import assessmentsData from '../../data/ontology-data/entities/clinical_assessments.json';

interface Assessment {
  id: string;
  name: string;
  type: string;
  body_regions: string[];
  purpose: string;
  description: string;
}

interface CustomAssessmentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssessments: (selectedAssessments: Assessment[]) => void;
  preSelectedIds?: string[];
}

const CustomAssessmentSelector: React.FC<CustomAssessmentSelectorProps> = ({
  isOpen,
  onClose,
  onSelectAssessments,
  preSelectedIds = []
}) => {
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>(preSelectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState('all');

  // Parse assessments data
  const assessments: Assessment[] = useMemo(() => {
    const assessmentsObj = (assessmentsData as any).assessments;
    return Object.entries(assessmentsObj).map(([id, assessment]: [string, any]) => ({
      id,
      name: assessment.name,
      type: assessment.type,
      body_regions: assessment.body_regions || [],
      purpose: assessment.purpose,
      description: assessment.description
    }));
  }, []);

  // Get unique categories and body regions
  const categories = useMemo(() => {
    const uniqueTypes = [...new Set(assessments.map(a => a.type))];
    return uniqueTypes.sort();
  }, [assessments]);

  const bodyRegions = useMemo(() => {
    const allRegions = assessments.flatMap(a => a.body_regions);
    const uniqueRegions = [...new Set(allRegions)];
    return uniqueRegions.sort();
  }, [assessments]);

  // Filter assessments based on search and filters
  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assessment.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || assessment.type === selectedCategory;
      
      const matchesBodyRegion = selectedBodyRegion === 'all' || 
                                assessment.body_regions.includes(selectedBodyRegion);
      
      return matchesSearch && matchesCategory && matchesBodyRegion;
    });
  }, [assessments, searchTerm, selectedCategory, selectedBodyRegion]);

  const handleToggleAssessment = (assessmentId: string) => {
    setSelectedAssessmentIds(prev => 
      prev.includes(assessmentId)
        ? prev.filter(id => id !== assessmentId)
        : [...prev, assessmentId]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredAssessments.map(a => a.id);
    setSelectedAssessmentIds(prev => {
      const newSelection = [...new Set([...prev, ...allFilteredIds])];
      return newSelection;
    });
  };

  const handleClearSelection = () => {
    setSelectedAssessmentIds([]);
  };

  const handleSubmit = () => {
    const selectedAssessments = assessments.filter(a => selectedAssessmentIds.includes(a.id));
    onSelectAssessments(selectedAssessments);
  };

  const getTypeIcon = (type: string) => {
    const typeIcons: { [key: string]: string } = {
      'ligament_stability': '🔗',
      'neurological': '🧠',
      'impingement': '🏀',
      'muscle_strength': '💪',
      'muscle_function': '💪',
      'tendon_assessment': '🎯',
      'meniscal_assessment': '⚙️',
      'range_of_motion': '📐',
      'joint_stability': '🔧',
      'joint_provocation': '⚡',
      'neurological_reflex': '⚡',
      'sensory_assessment': '👋',
      'motor_assessment': '🏃',
      'balance_proprioception': '⚖️',
      'vestibular': '🌀',
      'clinical_decision_rule': '📊',
      'vascular': '❤️',
      'bone_stress': '🦴',
      'alignment_assessment': '📏',
      'joint_mobility': '🔄',
      'functional_assessment': '🏃',
      'movement_assessment': '🏃',
      'soft_tissue_assessment': '🤲'
    };
    return typeIcons[type] || '📋';
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🔍 Choose Custom Assessments
              </h2>
              <p className="text-indigo-100 mt-2">
                Select from {assessments.length} available clinical assessments
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selection Summary */}
          <div className="mt-4 flex items-center gap-4">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              {selectedAssessmentIds.length} selected
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              {filteredAssessments.length} available
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Assessments</label>
              <input
                type="text"
                placeholder="Search by name or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Body Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body Region</label>
              <select
                value={selectedBodyRegion}
                onChange={(e) => setSelectedBodyRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Regions</option>
                {bodyRegions.map(region => (
                  <option key={region} value={region}>
                    {region.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              ✓ Select All Visible
            </button>
            <button
              onClick={handleClearSelection}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              ✗ Clear Selection
            </button>
          </div>
        </div>

        {/* Assessment Grid */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No assessments found</p>
              <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssessments.map(assessment => (
                <div
                  key={assessment.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedAssessmentIds.includes(assessment.id)
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handleToggleAssessment(assessment.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(assessment.type)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{assessment.name}</h4>
                        <p className="text-xs text-gray-600">{assessment.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <input
                      type="checkbox"
                      checked={selectedAssessmentIds.includes(assessment.id)}
                      onChange={() => handleToggleAssessment(assessment.id)}
                      className="text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{assessment.purpose}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {assessment.body_regions.slice(0, 2).map(region => (
                      <span 
                        key={region} 
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {region.replace('_', ' ')}
                      </span>
                    ))}
                    {assessment.body_regions.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{assessment.body_regions.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={selectedAssessmentIds.length === 0}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedAssessmentIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              🔬 Start {selectedAssessmentIds.length} Selected Assessment{selectedAssessmentIds.length !== 1 ? 's' : ''}
            </button>
          </div>

          {selectedAssessmentIds.length > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-800">
                <strong>Selected:</strong> {selectedAssessmentIds.length} assessment{selectedAssessmentIds.length !== 1 ? 's' : ''} ready for execution. 
                Estimated time: {selectedAssessmentIds.length * 4} minutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default CustomAssessmentSelector;
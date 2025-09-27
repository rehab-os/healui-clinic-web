import React, { useState, useEffect } from 'react';
import { Search, X, Info, ChevronDown, ChevronUp, Activity, Target, Zap, Link, Brain } from 'lucide-react';
import { 
  searchAllStructures,
  searchMuscles,
  searchJoints,
  searchTendons,
  searchLigaments,
  searchNeuralStructures,
  MuscleData,
  JointData,
  TendonData,
  LigamentData,
  NeuralData,
  AnatomyStructure 
} from '../../utils/anatomyDataLoader';

interface AnatomySearchSelectProps {
  selectedStructures: any[];
  onStructureSelect: (structure: any) => void;
  onStructureRemove: (structureId: string) => void;
  structureType?: 'muscle' | 'joint' | 'tendon' | 'ligament' | 'neural' | 'all';
}

export const AnatomySearchSelect: React.FC<AnatomySearchSelectProps> = ({
  selectedStructures,
  onStructureSelect,
  onStructureRemove,
  structureType = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnatomyStructure[]>([]);
  const [selectedStructureType, setSelectedStructureType] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Perform search when query or structure type changes
    if (searchQuery.trim()) {
      setIsSearching(true);
      let results: AnatomyStructure[] = [];

      if (selectedStructureType === 'all') {
        results = searchAllStructures(searchQuery);
      } else {
        // Search specific structure type
        switch (selectedStructureType) {
          case 'muscle':
            results = searchMuscles(searchQuery).map(muscle => ({
              id: muscle.id,
              name: muscle.name,
              type: 'muscle' as const,
              region: muscle.muscle_group,
              details: muscle
            }));
            break;
          case 'joint':
            results = searchJoints(searchQuery).map(joint => ({
              id: joint.id,
              name: joint.name,
              type: 'joint' as const,
              region: joint.joint || 'General',
              details: joint
            }));
            break;
          case 'tendon':
            results = searchTendons(searchQuery).map(tendon => ({
              id: tendon.id,
              name: tendon.name,
              type: 'tendon' as const,
              region: tendon.region,
              details: tendon
            }));
            break;
          case 'ligament':
            results = searchLigaments(searchQuery).map(ligament => ({
              id: ligament.id,
              name: ligament.name,
              type: 'ligament' as const,
              region: ligament.region || ligament.joint || 'General',
              details: ligament
            }));
            break;
          case 'neural':
            results = searchNeuralStructures(searchQuery).map(neural => ({
              id: neural.id,
              name: neural.name,
              type: 'neural' as const,
              region: 'Nervous System',
              details: neural
            }));
            break;
        }
      }

      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedStructureType]);

  const handleStructureSelect = (structure: AnatomyStructure) => {
    let protocolStructure: any = {
      type: structure.type.charAt(0).toUpperCase() + structure.type.slice(1),
      name: structure.name,
      details: {}
    };

    // Format details based on structure type
    if (structure.type === 'muscle' && structure.details) {
      const muscle = structure.details as MuscleData;
      protocolStructure.details = {
        origin: muscle.origin?.join(', ') || '',
        insertion: muscle.insertion?.join(', ') || '',
        innervation: muscle.innervation ? `${muscle.innervation.nerve} (${muscle.innervation.nerve_roots?.join(', ')})` : '',
        actions: muscle.actions?.primary.join(', ') || '',
        clinicalNotes: muscle.clinical_relevance || '',
        conditions: muscle.common_conditions?.join(', ') || '',
        referredPain: muscle.referred_pain_patterns?.join(', ') || '',
        assessments: muscle.assessment_methods?.join(', ') || '',
        exercises: muscle.strengthening_exercises?.join(', ') || ''
      };
    } else if (structure.type === 'joint' && structure.details) {
      const joint = structure.details as JointData;
      protocolStructure.details = {
        jointType: joint.type || '',
        location: joint.joint || '',
        functions: joint.functions?.join(', ') || '',
        clinicalNotes: JSON.stringify(joint.pathology) || '',
        assessments: JSON.stringify(joint.clinical_tests) || ''
      };
    } else if (structure.type === 'tendon' && structure.details) {
      const tendon = structure.details as TendonData;
      protocolStructure.details = {
        region: tendon.region || '',
        muscles: tendon.muscles_involved?.join(', ') || '',
        insertion: tendon.insertion || '',
        clinicalNotes: JSON.stringify(tendon.pathology) || '',
        assessments: JSON.stringify(tendon.clinical_tests) || ''
      };
    } else if (structure.type === 'ligament' && structure.details) {
      const ligament = structure.details as LigamentData;
      protocolStructure.details = {
        region: ligament.region || ligament.joint || '',
        functions: ligament.function?.join(', ') || '',
        clinicalNotes: JSON.stringify(ligament.pathology) || '',
        assessments: JSON.stringify(ligament.clinical_tests) || ''
      };
    } else if (structure.type === 'neural' && structure.details) {
      const neural = structure.details as NeuralData;
      protocolStructure.details = {
        nerveRoots: neural.nerve_roots || '',
        origin: neural.origin || '',
        course: neural.course?.join(' → ') || '',
        motorInnervation: JSON.stringify(neural.motor_innervation) || '',
        sensoryInnervation: neural.sensory_innervation?.join(', ') || '',
        compressionSites: neural.common_compression_sites?.join(', ') || '',
        clinicalNotes: JSON.stringify(neural.clinical_conditions) || ''
      };
    }
    
    onStructureSelect(protocolStructure);
    setSearchQuery('');
    setSearchResults([]);
  };

  const isStructureSelected = (structureName: string) => {
    return selectedStructures.some(s => s.name === structureName);
  };

  const getStructureIcon = (type: string) => {
    switch (type) {
      case 'muscle': return <Activity className="h-4 w-4" />;
      case 'joint': return <Target className="h-4 w-4" />;
      case 'tendon': return <Link className="h-4 w-4" />;
      case 'ligament': return <Zap className="h-4 w-4" />;
      case 'neural': return <Brain className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStructureColor = (type: string) => {
    switch (type) {
      case 'muscle': return 'text-red-600 bg-red-50';
      case 'joint': return 'text-blue-600 bg-blue-50';
      case 'tendon': return 'text-green-600 bg-green-50';
      case 'ligament': return 'text-yellow-600 bg-yellow-50';
      case 'neural': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search anatomy structures (muscles, joints, tendons, ligaments, nerves)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter by structure type */}
        <div className="mt-2">
          <select
            value={selectedStructureType}
            onChange={(e) => setSelectedStructureType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Structures</option>
            <option value="muscle">Muscles</option>
            <option value="joint">Joints</option>
            <option value="tendon">Tendons</option>
            <option value="ligament">Ligaments</option>
            <option value="neural">Neural Structures</option>
          </select>
        </div>
      </div>

      {/* Search Results */}
      {(searchResults.length > 0 || isSearching) && (
        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((structure) => {
                const details = structure.details as any;
                const colorClasses = getStructureColor(structure.type);
                
                return (
                  <div key={structure.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorClasses}`}>
                            {getStructureIcon(structure.type)}
                            <span className="ml-1 capitalize">{structure.type}</span>
                          </span>
                          <h4 className="font-medium text-gray-900">
                            {structure.name}
                            {details?.latin_name && (
                              <span className="text-sm text-gray-500 italic ml-2">
                                ({details.latin_name})
                              </span>
                            )}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">{structure.region}</p>
                        
                        {/* Quick preview based on structure type */}
                        <div className="mt-1 text-xs text-gray-500">
                          {structure.type === 'muscle' && details && (
                            <>
                              <p><strong>Actions:</strong> {details.actions?.primary?.slice(0, 2).join(', ') || 'N/A'}</p>
                              {details.common_conditions && details.common_conditions.length > 0 && (
                                <p><strong>Conditions:</strong> {details.common_conditions.slice(0, 2).join(', ')}</p>
                              )}
                            </>
                          )}
                          {structure.type === 'joint' && details && (
                            <>
                              <p><strong>Type:</strong> {details.type || 'N/A'}</p>
                              <p><strong>Location:</strong> {details.joint || 'N/A'}</p>
                            </>
                          )}
                          {structure.type === 'tendon' && details && (
                            <>
                              <p><strong>Region:</strong> {details.region || 'N/A'}</p>
                              <p><strong>Muscles:</strong> {details.muscles_involved?.slice(0, 2).join(', ') || 'N/A'}</p>
                            </>
                          )}
                          {structure.type === 'neural' && details && (
                            <>
                              <p><strong>Nerve Roots:</strong> {details.nerve_roots || 'N/A'}</p>
                              <p><strong>Origin:</strong> {details.origin || 'N/A'}</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Show details button */}
                        <button
                          onClick={() => setShowDetails(showDetails === structure.id ? null : structure.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {showDetails === structure.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>

                        {/* Add/Remove button */}
                        {isStructureSelected(structure.name) ? (
                          <button
                            onClick={() => onStructureRemove(structure.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStructureSelect(structure)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detailed information panel */}
                    {showDetails === structure.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {structure.type === 'muscle' && details && (
                            <>
                              <div>
                                <h5 className="font-semibold text-gray-700">Origin & Insertion</h5>
                                <p className="text-xs"><strong>Origin:</strong> {details.origin?.join(', ') || 'N/A'}</p>
                                <p className="text-xs"><strong>Insertion:</strong> {details.insertion?.join(', ') || 'N/A'}</p>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-700">Innervation</h5>
                                <p className="text-xs">{details.innervation ? `${details.innervation.nerve} (${details.innervation.nerve_roots?.join(', ')})` : 'N/A'}</p>
                              </div>
                            </>
                          )}
                          {structure.type === 'joint' && details && (
                            <>
                              <div>
                                <h5 className="font-semibold text-gray-700">Joint Details</h5>
                                <p className="text-xs"><strong>Type:</strong> {details.type || 'N/A'}</p>
                                <p className="text-xs"><strong>Location:</strong> {details.joint || 'N/A'}</p>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-700">Functions</h5>
                                <p className="text-xs">{details.functions?.join(', ') || 'N/A'}</p>
                              </div>
                            </>
                          )}
                          {structure.type === 'tendon' && details && (
                            <>
                              <div>
                                <h5 className="font-semibold text-gray-700">Tendon Details</h5>
                                <p className="text-xs"><strong>Region:</strong> {details.region || 'N/A'}</p>
                                <p className="text-xs"><strong>Insertion:</strong> {details.insertion || 'N/A'}</p>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-700">Related Muscles</h5>
                                <p className="text-xs">{details.muscles_involved?.join(', ') || 'N/A'}</p>
                              </div>
                            </>
                          )}
                          {structure.type === 'neural' && details && (
                            <>
                              <div>
                                <h5 className="font-semibold text-gray-700">Neural Pathway</h5>
                                <p className="text-xs"><strong>Roots:</strong> {details.nerve_roots || 'N/A'}</p>
                                <p className="text-xs"><strong>Origin:</strong> {details.origin || 'N/A'}</p>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-700">Compression Sites</h5>
                                <p className="text-xs">{details.common_compression_sites?.join(', ') || 'N/A'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected structures display */}
      {selectedStructures.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Structures:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedStructures.map((structure, index) => (
              <div
                key={`${structure.type}-${structure.name}-${index}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                <span className="text-xs font-medium mr-1">{structure.type}:</span>
                {structure.name}
                <button
                  onClick={() => onStructureRemove(structure.name)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';

interface Condition {
  condition_id: string;
  name: string;
  body_region: string;
  specialty: string;
  snomed_ct?: string;
  icd10?: string;
}

interface DiagnosisSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (condition: Condition) => void;
}

const DiagnosisSearchOverlay: React.FC<DiagnosisSearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState('all');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [filteredConditions, setFilteredConditions] = useState<Condition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conditions from conditions.json
  useEffect(() => {
    const loadConditions = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        // Import conditions.json
        const conditionsModule = await import('../../data/ontology-data/entities/conditions.json');
        const conditionsData = conditionsModule.conditions;
        
        // Transform to our format
        const transformedConditions: Condition[] = Object.entries(conditionsData).map(([id, data]: [string, any]) => ({
          condition_id: id,
          name: data.name,
          body_region: data.body_region,
          specialty: data.specialty,
          snomed_ct: data.snomed_ct,
          icd10: data.icd10
        }));

        setConditions(transformedConditions);
        setFilteredConditions(transformedConditions);
      } catch (error) {
        console.error('Error loading conditions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConditions();
  }, [isOpen]);

  // Filter conditions based on search and body region
  useEffect(() => {
    let filtered = conditions;

    // Filter by body region
    if (selectedBodyRegion !== 'all') {
      filtered = filtered.filter(condition => 
        condition.body_region === selectedBodyRegion
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(condition =>
        condition.name?.toLowerCase().includes(searchLower) ||
        (condition.body_region && condition.body_region.toLowerCase().includes(searchLower)) ||
        (condition.specialty && condition.specialty.toLowerCase().includes(searchLower))
      );
    }

    setFilteredConditions(filtered);
  }, [searchTerm, selectedBodyRegion, conditions]);

  // Get unique body regions for filter
  const bodyRegions = Array.from(new Set(conditions.map(c => c.body_region).filter(region => region && typeof region === 'string'))).sort();

  const handleSelect = (condition: Condition) => {
    onSelect(condition);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Search All Conditions</h2>
            <p className="text-sm text-gray-600 mt-1">Browse and search from our comprehensive condition database</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conditions by name, body region, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedBodyRegion}
                onChange={(e) => setSelectedBodyRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">All Body Regions</option>
                {bodyRegions.map(region => (
                  <option key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading conditions...</div>
            </div>
          ) : filteredConditions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-gray-500">No conditions found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredConditions.map((condition) => (
                <Card
                  key={condition.condition_id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  onClick={() => handleSelect(condition)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{condition.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {condition.body_region && (
                          <Badge variant="secondary" className="text-xs">
                            {condition.body_region}
                          </Badge>
                        )}
                        {condition.specialty && (
                          <Badge variant="outline" className="text-xs">
                            {condition.specialty}
                          </Badge>
                        )}
                        {condition.icd10 && (
                          <Badge variant="outline" className="text-xs">
                            ICD-10: {condition.icd10}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {filteredConditions.length} condition{filteredConditions.length !== 1 ? 's' : ''} found
            </p>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisSearchOverlay;
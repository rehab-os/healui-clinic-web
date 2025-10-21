'use client';

import React from 'react';
import { 
  FileText, 
  Filter, 
  Target, 
  Clock, 
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  Search
} from 'lucide-react';
import { VisitCondition, ConditionAwareNoteData } from '../../types/condition-types';

interface Note {
  id: string;
  note_type: 'SOAP' | 'DAP' | 'PROGRESS';
  note_data: any;
  additional_notes?: string;
  condition_associations?: ConditionAwareNoteData;
  is_signed: boolean;
  signed_by?: string;
  signed_at?: string;
  created_at: string;
  visit_id: string;
}

interface ConditionNotesTabProps {
  visitConditions: VisitCondition[];
  notes: Note[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onCreateNote?: (conditionId?: string) => void;
  loading?: boolean;
  className?: string;
}

const ConditionNotesTab: React.FC<ConditionNotesTabProps> = ({
  visitConditions,
  notes,
  activeTab,
  onTabChange,
  onCreateNote,
  loading = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  // Filter notes based on active tab and search term
  const getFilteredNotes = () => {
    let filteredNotes = notes;

    // Filter by condition
    if (activeTab !== 'all' && activeTab !== 'general') {
      filteredNotes = notes.filter(note => {
        // Check if note is associated with the selected condition
        return note.condition_associations?.condition_associations?.some(
          ca => ca.condition_id === activeTab
        );
      });
    } else if (activeTab === 'general') {
      // Show notes not associated with any condition
      filteredNotes = notes.filter(note => 
        !note.condition_associations?.condition_associations?.length
      );
    }

    // Apply search filter
    if (searchTerm) {
      filteredNotes = filteredNotes.filter(note => {
        const searchContent = [
          JSON.stringify(note.note_data).toLowerCase(),
          note.additional_notes?.toLowerCase() || '',
          note.note_type.toLowerCase()
        ].join(' ');
        return searchContent.includes(searchTerm.toLowerCase());
      });
    }

    return filteredNotes;
  };

  const renderNoteContent = (note: Note) => {
    if (note.note_type === 'SOAP') {
      const data = note.note_data as any;
      return (
        <div className="space-y-2">
          {data.subjective && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">S</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.subjective}</p>
            </div>
          )}
          {data.objective && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">O</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.objective}</p>
            </div>
          )}
          {data.assessment && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">A</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.assessment}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">P</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.plan}</p>
            </div>
          )}
        </div>
      );
    } else if (note.note_type === 'DAP') {
      const data = note.note_data as any;
      return (
        <div className="space-y-2">
          {data.data && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">D</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.data}</p>
            </div>
          )}
          {data.assessment && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">A</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.assessment}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">P</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.plan}</p>
            </div>
          )}
        </div>
      );
    } else if (note.note_type === 'PROGRESS') {
      const data = note.note_data as any;
      return (
        <div className="space-y-2">
          {data.progress && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Progress</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.progress}</p>
            </div>
          )}
          {data.interventions && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Interventions</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.interventions}</p>
            </div>
          )}
          {data.response && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Response</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.response}</p>
            </div>
          )}
          {data.plan && (
            <div>
              <h6 className="font-medium text-gray-700 text-xs">Plan</h6>
              <p className="text-xs text-gray-600 mt-0.5">{data.plan}</p>
            </div>
          )}
        </div>
      );
    }
    return <p className="text-xs text-gray-600">Note content available</p>;
  };

  const getConditionName = (conditionId: string) => {
    const visitCondition = visitConditions.find(vc => 
      vc.neo4j_condition_id === conditionId
    );
    return visitCondition?.condition_name || `Condition ${conditionId}`;
  };

  const filteredNotes = getFilteredNotes();

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      {/* Tab Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4 pb-0">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-healui-physio" />
            Clinical Notes
          </h3>
          <button
            onClick={() => onCreateNote?.(activeTab !== 'all' && activeTab !== 'general' ? activeTab : undefined)}
            className="inline-flex items-center px-3 py-1.5 bg-healui-physio text-white text-xs font-medium rounded-lg hover:bg-healui-primary transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Note
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 px-4 pt-3">
          <button
            onClick={() => onTabChange('all')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-healui-physio border-t border-l border-r border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Notes ({notes.length})
          </button>
          
          {visitConditions.map((visitCondition) => (
            <button
              key={visitCondition.neo4j_condition_id}
              onClick={() => onTabChange(visitCondition.neo4j_condition_id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === visitCondition.neo4j_condition_id
                  ? 'bg-white text-healui-physio border-t border-l border-r border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  visitCondition.treatment_focus === 'PRIMARY' ? 'bg-red-500' :
                  visitCondition.treatment_focus === 'SECONDARY' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                <span>
                  {visitCondition.condition_name?.substring(0, 15) || 
                   `Condition ${visitCondition.neo4j_condition_id.substring(0, 8)}`}
                  {(visitCondition.condition_name?.length || 0) > 15 && '...'}
                </span>
              </div>
            </button>
          ))}
          
          <button
            onClick={() => onTabChange('general')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === 'general'
                ? 'bg-white text-healui-physio border-t border-l border-r border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            General Visit
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healui-physio focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-32 h-2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-2 bg-gray-100 rounded animate-pulse"></div>
                  <div className="w-3/4 h-2 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-1">
              {searchTerm ? 'No notes match your search' : 
               activeTab === 'all' ? 'No notes found' :
               activeTab === 'general' ? 'No general notes found' :
               `No notes found for ${getConditionName(activeTab)}`}
            </p>
            {!searchTerm && (
              <button
                onClick={() => onCreateNote?.(activeTab !== 'all' && activeTab !== 'general' ? activeTab : undefined)}
                className="text-healui-physio text-sm hover:underline"
              >
                Create the first note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        note.note_type === 'SOAP' ? 'bg-blue-100' :
                        note.note_type === 'DAP' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        <FileText className={`h-4 w-4 ${
                          note.note_type === 'SOAP' ? 'text-blue-600' :
                          note.note_type === 'DAP' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-700 text-sm">{note.note_type} Note</h5>
                        {note.is_signed && (
                          <div className="flex items-center text-xs text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Signed</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString()}</span>
                        {note.signed_by && (
                          <>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>Dr. {note.signed_by}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Condition Tags */}
                  {note.condition_associations?.condition_associations && note.condition_associations.condition_associations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.condition_associations.condition_associations.map((ca) => (
                        <span
                          key={ca.condition_id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-healui-physio/10 text-healui-physio"
                        >
                          <Target className="h-2 w-2 mr-1" />
                          {getConditionName(ca.condition_id || '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Note Content */}
                <div className="mt-3">
                  {renderNoteContent(note)}
                  
                  {note.additional_notes && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border-l-2 border-l-yellow-400">
                      <h6 className="font-medium text-gray-700 text-xs mb-1">Additional Notes</h6>
                      <p className="text-xs text-gray-600">{note.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionNotesTab;
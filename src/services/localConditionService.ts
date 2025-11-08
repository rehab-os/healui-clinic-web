// Local condition service using ontology data as fallback
import type { Neo4jConditionResponseDto } from '../lib/types'

// Import with error handling
let conditionsData: any = { conditions: {} }
try {
  conditionsData = require('../data/ontology-data/entities/conditions.json')
} catch (importError) {
  console.warn('Could not import conditions.json, using fallback data:', importError)
  // Provide minimal fallback data
  conditionsData = {
    conditions: {
      'FALLBACK_001': {
        name: 'General Shoulder Pain',
        body_region: 'shoulder',
        specialty: 'orthopedic',
        chronicity: '6-12 weeks'
      },
      'FALLBACK_002': {
        name: 'Lower Back Pain',
        body_region: 'back',
        specialty: 'orthopedic', 
        chronicity: '4-8 weeks'
      },
      'FALLBACK_003': {
        name: 'Knee Pain',
        body_region: 'knee',
        specialty: 'orthopedic',
        chronicity: '2-6 weeks'
      }
    }
  }
}

export interface LocalCondition {
  condition_id: string
  name: string
  snomed_ct: string
  icd10: string
  body_region: string
  specialty: string
  typical_age_range: string
  chronicity: string
  treatment_protocol?: any
}

class LocalConditionService {
  private conditions: Neo4jConditionResponseDto[] = []

  constructor() {
    this.initializeConditions()
  }

  private initializeConditions() {
    try {
      // Convert the JSON data to our format
      const rawConditions = conditionsData.conditions
      
      if (!rawConditions || typeof rawConditions !== 'object') {
        console.error('Invalid conditions data format')
        this.conditions = []
        return
      }
      
      this.conditions = Object.entries(rawConditions)
        .filter(([conditionId, data]) => {
          // Filter out invalid entries
          return conditionId && data && typeof data === 'object' && data.name
        })
        .map(([conditionId, data]: [string, any]) => {
          try {
            return {
              condition_id: conditionId,
              condition_name: data.name || 'Unknown Condition',
              description: this.generateDescription(data),
              body_region: this.formatBodyRegion(data.body_region),
              category: data.specialty || 'General',
              severity_levels: ['MILD', 'MODERATE', 'SEVERE'],
              typical_duration_weeks: this.extractDurationWeeks(data.chronicity),
              contraindications: [],
              risk_factors: [],
              assessment_criteria: [],
              treatment_protocols: data.treatment_protocol ? [
                {
                  protocol_id: `PROTO_${conditionId}`,
                  protocol_name: `${data.name || 'Condition'} Treatment Protocol`,
                  phase: 'INITIAL',
                  duration_weeks: this.extractDurationWeeks(data.treatment_protocol.total_duration_weeks),
                  goals: data.treatment_protocol.phases?.[0]?.goals || [],
                  precautions: data.treatment_protocol.phases?.[0]?.precautions || [],
                  progression_criteria: [],
                  exercises: data.treatment_protocol.phases?.[0]?.exercises || []
                }
              ] : []
            }
          } catch (itemError) {
            console.warn(`Error processing condition ${conditionId}:`, itemError)
            return null
          }
        })
        .filter(Boolean) as Neo4jConditionResponseDto[] // Remove null entries

      console.log(`Successfully loaded ${this.conditions.length} conditions from local ontology data`)
      
    } catch (error) {
      console.error('Error initializing conditions from local data:', error)
      this.conditions = []
    }
  }

  private generateDescription(data: any): string {
    const parts = []
    
    // Handle case where data might be incomplete
    if (!data) {
      return 'Physiotherapy condition requiring professional assessment.'
    }
    
    if (data.typical_age_range) {
      parts.push(`Typically affects patients aged ${data.typical_age_range}`)
    }
    
    if (data.gender_ratio && data.gender_ratio !== '1:1') {
      parts.push(`Gender ratio: ${data.gender_ratio}`)
    }
    
    if (data.chronicity) {
      parts.push(`Duration: ${data.chronicity}`)
    }
    
    return parts.join('. ') + '.'
  }

  private formatBodyRegion(region: string | undefined | null): string {
    // Handle undefined, null, or empty regions
    if (!region || typeof region !== 'string') {
      return 'General'
    }
    
    const regionMap: Record<string, string> = {
      'shoulder': 'Shoulder',
      'knee': 'Knee',
      'back': 'Back',
      'neck': 'Neck',
      'hip': 'Hip',
      'ankle': 'Ankle',
      'elbow': 'Elbow',
      'wrist': 'Wrist',
      'spine': 'Spine',
      'lumbar': 'Lumbar Spine',
      'cervical': 'Cervical Spine',
      'thoracic': 'Thoracic Spine'
    }
    
    const normalizedRegion = region.toLowerCase().trim()
    return regionMap[normalizedRegion] || region.charAt(0).toUpperCase() + region.slice(1)
  }

  private extractDurationWeeks(duration: string | undefined | null): number {
    if (!duration || typeof duration !== 'string') return 8
    
    // Extract number from strings like "12-18 months", "6-8 weeks", etc.
    const match = duration.match(/(\d+)/)
    if (match) {
      const num = parseInt(match[1])
      // Convert months to weeks if needed
      if (duration.includes('month')) {
        return num * 4
      }
      return num
    }
    
    return 8 // Default
  }

  // Search conditions locally
  searchConditions(searchTerm: string, limit: number = 10): Neo4jConditionResponseDto[] {
    try {
      if (!searchTerm.trim()) {
        return this.conditions.slice(0, limit)
      }

      const term = searchTerm.toLowerCase()
      
      const filtered = this.conditions.filter(condition => {
        try {
          return (
            (condition.condition_name || '').toLowerCase().includes(term) ||
            (condition.description || '').toLowerCase().includes(term) ||
            (condition.body_region || '').toLowerCase().includes(term) ||
            (condition.category || '').toLowerCase().includes(term)
          )
        } catch (filterError) {
          console.warn('Error filtering condition:', condition.condition_id, filterError)
          return false
        }
      })

      // Sort by relevance (exact matches first, then partial matches)
      const sorted = filtered.sort((a, b) => {
        try {
          const aNameMatch = (a.condition_name || '').toLowerCase().includes(term)
          const bNameMatch = (b.condition_name || '').toLowerCase().includes(term)
          
          if (aNameMatch && !bNameMatch) return -1
          if (!aNameMatch && bNameMatch) return 1
          
          return (a.condition_name || '').localeCompare(b.condition_name || '')
        } catch (sortError) {
          console.warn('Error sorting conditions:', sortError)
          return 0
        }
      })

      return sorted.slice(0, limit)
    } catch (error) {
      console.error('Error searching conditions:', error)
      return []
    }
  }

  // Get all conditions
  getAllConditions(limit?: number): Neo4jConditionResponseDto[] {
    return limit ? this.conditions.slice(0, limit) : this.conditions
  }

  // Get conditions by body region
  getConditionsByBodyRegion(bodyRegion: string): Neo4jConditionResponseDto[] {
    const region = bodyRegion.toLowerCase()
    return this.conditions.filter(condition => 
      condition.body_region.toLowerCase().includes(region)
    )
  }

  // Get condition by ID
  getConditionById(conditionId: string): Neo4jConditionResponseDto | null {
    return this.conditions.find(condition => 
      condition.condition_id === conditionId
    ) || null
  }

  // Get recommended conditions based on symptoms (basic implementation)
  getRecommendedConditions(symptoms: {
    bodyRegion?: string
    painLevel?: number
    symptomDuration?: string
    functionalImpact?: string
  }): Neo4jConditionResponseDto[] {
    let filtered = [...this.conditions]

    // Filter by body region if provided
    if (symptoms.bodyRegion) {
      const region = symptoms.bodyRegion.toLowerCase()
      filtered = filtered.filter(condition => 
        condition.body_region.toLowerCase().includes(region) ||
        condition.condition_name.toLowerCase().includes(region)
      )
    }

    // Simple scoring based on symptom severity
    const scored = filtered.map(condition => ({
      condition,
      score: this.calculateConditionScore(condition, symptoms)
    }))

    // Sort by score and return top matches
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.condition)
  }

  private calculateConditionScore(condition: Neo4jConditionResponseDto, symptoms: any): number {
    let score = 0

    // Body region match
    if (symptoms.bodyRegion) {
      const regionMatch = condition.body_region.toLowerCase().includes(
        symptoms.bodyRegion.toLowerCase()
      )
      if (regionMatch) score += 10
    }

    // Duration considerations
    if (symptoms.symptomDuration) {
      if (symptoms.symptomDuration === 'CHRONIC' && condition.typical_duration_weeks && condition.typical_duration_weeks > 12) {
        score += 5
      } else if (symptoms.symptomDuration === 'ACUTE' && condition.typical_duration_weeks && condition.typical_duration_weeks < 8) {
        score += 5
      }
    }

    // Pain level considerations
    if (symptoms.painLevel) {
      if (symptoms.painLevel >= 7) {
        score += 3 // High pain conditions get slight boost
      }
    }

    // Functional impact
    if (symptoms.functionalImpact === 'SEVERE') {
      score += 2
    }

    return score
  }

  // Get statistics
  getStats() {
    const totalConditions = this.conditions.length
    const bodyRegions = [...new Set(this.conditions.map(c => c.body_region))]
    const categories = [...new Set(this.conditions.map(c => c.category))]

    return {
      totalConditions,
      bodyRegions: bodyRegions.length,
      categories: categories.length,
      availableRegions: bodyRegions,
      availableCategories: categories
    }
  }
}

// Create a singleton instance
export const localConditionService = new LocalConditionService()

export default localConditionService
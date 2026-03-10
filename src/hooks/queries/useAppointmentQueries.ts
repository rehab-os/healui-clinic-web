import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ApiManager from '@/services/api/api.service'
import { createOptimisticId } from './optimistic-utils'
import type { AddClinicalInsightDto, UpdateClinicalInsightDto } from '@/types/clinical-insights.types'
import type { CreateVisitConditionDto } from '@/lib/types'

// ── Query Keys ─────────────────────────────────────────────

export const appointmentKeys = {
  all: ['appointments'] as const,
  detail: (id: string) => ['appointments', id] as const,
  conditions: (visitId: string) => ['appointments', visitId, 'conditions'] as const,
  insights: (patientConditionId: string) => ['appointments', 'insights', patientConditionId] as const,
  treatmentHistory: (patientConditionId: string) => ['appointments', 'treatmentHistory', patientConditionId] as const,
  patient: (patientId: string) => ['patients', patientId] as const,
  patientVisits: (patientId: string) => ['patients', patientId, 'visits'] as const,
  protocols: (visitId: string) => ['appointments', visitId, 'protocols'] as const,
  visitNotes: (visitId: string) => ['appointments', visitId, 'notes'] as const,
}

// ── Queries ────────────────────────────────────────────────

export function useAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.detail(appointmentId!),
    queryFn: async () => {
      const response = await ApiManager.getVisit(appointmentId!)
      if (!response.success) throw new Error(response.message || 'Failed to fetch appointment')
      return response.data
    },
    enabled: !!appointmentId,
  })
}

export function useVisitConditions(visitId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.conditions(visitId!),
    queryFn: async () => {
      const response = await ApiManager.getVisitConditions(visitId!)
      if (!response.success) throw new Error(response.message || 'Failed to fetch conditions')
      return response.data
    },
    enabled: !!visitId,
  })
}

export function useClinicalInsights(patientConditionId: string | undefined, params?: any) {
  return useQuery({
    queryKey: [...appointmentKeys.insights(patientConditionId!), params],
    queryFn: async () => {
      const response = await ApiManager.getClinicalInsights(patientConditionId!, params)
      if (!response.success) throw new Error(response.message || 'Failed to fetch insights')
      const payload = response.data
      return {
        data: payload.insights || payload.data || [],
        total: payload.total || 0,
      }
    },
    enabled: !!patientConditionId,
  })
}

export function useTreatmentHistory(patientConditionId: string | undefined, params?: any) {
  return useQuery({
    queryKey: [...appointmentKeys.treatmentHistory(patientConditionId!), params],
    queryFn: async () => {
      const response = await ApiManager.getTreatmentHistory(patientConditionId!, params)
      if (!response.success) throw new Error(response.message || 'Failed to fetch treatment history')
      return response.data
    },
    enabled: !!patientConditionId,
  })
}

export function usePatientDetails(patientId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.patient(patientId!),
    queryFn: async () => {
      const response = await ApiManager.getPatient(patientId!)
      if (!response.success) throw new Error(response.message || 'Failed to fetch patient')
      return response.data
    },
    enabled: !!patientId,
  })
}

export function usePatientVisits(patientId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.patientVisits(patientId!),
    queryFn: async () => {
      const response = await ApiManager.getPatientVisits(patientId!)
      if (!response.success) throw new Error(response.message || 'Failed to fetch patient visits')
      return response.data?.visits || []
    },
    enabled: !!patientId,
  })
}

export function useTreatmentProtocols(visitId: string | undefined, conditions: any[]) {
  return useQuery({
    queryKey: appointmentKeys.protocols(visitId!),
    queryFn: async () => {
      const response = await ApiManager.getTreatmentProtocols({ visit_id: visitId! })
      if (!response.success) throw new Error(response.message || 'Failed to fetch protocols')
      const protocols = response.data?.protocols || response.data || []
      const protocolMap: Record<string, { home?: any; clinical?: any }> = {}
      protocols.forEach((protocol: any) => {
        let match = conditions.find((vc: any) => protocol.visit_condition_id && vc.id === protocol.visit_condition_id)
        if (!match && protocol.patient_condition_id) match = conditions.find((vc: any) => vc.patient_condition_id === protocol.patient_condition_id)
        if (!match && protocol.condition_id) match = conditions.find((vc: any) => vc.condition_id === protocol.condition_id)
        if (match) {
          if (!protocolMap[match.id]) protocolMap[match.id] = {}
          protocolMap[match.id][protocol.protocol_type || 'home'] = protocol
        }
      })
      return protocolMap
    },
    enabled: !!visitId && conditions.length > 0,
  })
}

export function useVisitNotes(visitId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.visitNotes(visitId!),
    queryFn: async () => {
      const response = await ApiManager.getVisitNotes(visitId!)
      if (!response.success) throw new Error(response.message || 'Failed to fetch visit notes')
      return response.data?.notes || []
    },
    enabled: !!visitId,
  })
}

// ── Insight Optimistic Helpers ─────────────────────────────

type InsightsCache = { data: any[]; total: number }

function snapshotInsights(queryClient: ReturnType<typeof useQueryClient>, patientConditionId: string) {
  const key = appointmentKeys.insights(patientConditionId)
  const entries = queryClient.getQueriesData<InsightsCache>({ queryKey: key })
  return entries
}

function restoreInsights(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: [readonly unknown[], InsightsCache | undefined][],
) {
  for (const [key, data] of snapshot) {
    if (data !== undefined) queryClient.setQueryData(key, data)
  }
}

// ── Mutations ──────────────────────────────────────────────

export function useAddClinicalInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ patientConditionId, data }: { patientConditionId: string; data: AddClinicalInsightDto }) => {
      const response = await ApiManager.addClinicalInsight(patientConditionId, data)
      if (!response.success) throw new Error(response.message || 'Failed to add insight')
      return response.data
    },
    onMutate: async ({ patientConditionId, data }) => {
      await queryClient.cancelQueries({ queryKey: appointmentKeys.insights(patientConditionId) })
      const snapshot = snapshotInsights(queryClient, patientConditionId)

      const optimisticInsight = {
        id: createOptimisticId(),
        patient_condition_id: patientConditionId,
        visit_id: data.visit_id,
        visit_condition_id: data.visit_condition_id,
        insight_text: data.insight_text,
        insight_type: data.insight_type || 'OBSERVATION',
        created_at: new Date().toISOString(),
        created_by: 'current-user',
        used_in_protocol_generation: false,
      }

      for (const [key, existing] of snapshot) {
        if (existing) {
          queryClient.setQueryData(key, {
            data: [optimisticInsight, ...existing.data],
            total: existing.total + 1,
          })
        }
      }

      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) restoreInsights(queryClient, context.snapshot)
    },
    onSettled: (_data, _err, { patientConditionId }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.insights(patientConditionId) })
    },
  })
}

export function useUpdateClinicalInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ insightId, data }: { insightId: string; patientConditionId: string; data: UpdateClinicalInsightDto }) => {
      const response = await ApiManager.updateClinicalInsight(insightId, data)
      if (!response.success) throw new Error(response.message || 'Failed to update insight')
      return response.data
    },
    onMutate: async ({ insightId, patientConditionId, data }) => {
      await queryClient.cancelQueries({ queryKey: appointmentKeys.insights(patientConditionId) })
      const snapshot = snapshotInsights(queryClient, patientConditionId)

      for (const [key, existing] of snapshot) {
        if (existing) {
          queryClient.setQueryData(key, {
            ...existing,
            data: existing.data.map((insight: any) =>
              insight.id === insightId ? { ...insight, ...data } : insight,
            ),
          })
        }
      }

      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) restoreInsights(queryClient, context.snapshot)
    },
    onSettled: (_data, _err, { patientConditionId }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.insights(patientConditionId) })
    },
  })
}

export function useDeleteClinicalInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ insightId }: { insightId: string; patientConditionId: string }) => {
      const response = await ApiManager.deleteClinicalInsight(insightId)
      if (!response.success) throw new Error(response.message || 'Failed to delete insight')
      return insightId
    },
    onMutate: async ({ insightId, patientConditionId }) => {
      await queryClient.cancelQueries({ queryKey: appointmentKeys.insights(patientConditionId) })
      const snapshot = snapshotInsights(queryClient, patientConditionId)

      for (const [key, existing] of snapshot) {
        if (existing) {
          queryClient.setQueryData(key, {
            data: existing.data.filter((insight: any) => insight.id !== insightId),
            total: Math.max(0, existing.total - 1),
          })
        }
      }

      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) restoreInsights(queryClient, context.snapshot)
    },
    onSettled: (_data, _err, { patientConditionId }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.insights(patientConditionId) })
    },
  })
}

// ── Visit Notes Mutation ───────────────────────────────────

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ notePayload }: { notePayload: any }) => {
      const response = await ApiManager.createNote(notePayload)
      if (!response.success) throw new Error(response.message || 'Failed to create note')
      return response.data
    },
    onMutate: async ({ notePayload }) => {
      const visitId = notePayload.visit_id
      await queryClient.cancelQueries({ queryKey: appointmentKeys.visitNotes(visitId) })
      const previousNotes = queryClient.getQueryData<any[]>(appointmentKeys.visitNotes(visitId))

      const optimisticNote = {
        id: createOptimisticId(),
        visit_id: visitId,
        note_type: notePayload.note_type,
        note_data: notePayload.note_data,
        additional_notes: notePayload.additional_notes,
        visit_condition_id: notePayload.visit_condition_id,
        treatment_codes: notePayload.treatment_codes || [],
        treatment_details: notePayload.treatment_details || {},
        goals: notePayload.goals || {},
        outcome_measures: notePayload.outcome_measures || {},
        is_signed: false,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (previousNotes) {
        queryClient.setQueryData(appointmentKeys.visitNotes(visitId), [optimisticNote, ...previousNotes])
      }

      return { previousNotes, visitId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotes !== undefined) {
        queryClient.setQueryData(appointmentKeys.visitNotes(context.visitId), context.previousNotes)
      }
    },
    onSettled: (_data, _err, { notePayload }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.visitNotes(notePayload.visit_id) })
    },
  })
}

// ── Visit Conditions Mutation ──────────────────────────────

export function useAddConditionsToVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ visitId, conditions }: {
      visitId: string
      conditions: Array<{ patientConditionId: string; conditionName: string; dto: CreateVisitConditionDto }>
    }) => {
      const results = await Promise.all(
        conditions.map(c => ApiManager.addConditionToVisit(visitId, c.dto))
      )
      const failed = results.filter(r => !r.success)
      if (failed.length > 0) throw new Error(`Failed to add ${failed.length} condition(s) to visit`)
      return results.map(r => r.data)
    },
    onMutate: async ({ visitId, conditions }) => {
      await queryClient.cancelQueries({ queryKey: appointmentKeys.conditions(visitId) })
      const previousConditions = queryClient.getQueryData<any[]>(appointmentKeys.conditions(visitId))

      const optimisticConditions = conditions.map(c => ({
        id: createOptimisticId(),
        visit_id: visitId,
        patient_condition_id: c.patientConditionId,
        condition_name: c.conditionName,
        treatment_focus: c.dto.treatment_focus || 'PRIMARY',
        chief_complaint: c.dto.chief_complaint,
        session_goals: c.dto.session_goals || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      if (previousConditions) {
        queryClient.setQueryData(
          appointmentKeys.conditions(visitId),
          [...previousConditions, ...optimisticConditions],
        )
      }

      return { previousConditions, visitId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousConditions !== undefined) {
        queryClient.setQueryData(appointmentKeys.conditions(context.visitId), context.previousConditions)
      }
    },
    onSettled: (_data, _err, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.conditions(visitId) })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ApiManager from '@/services/api/api.service'
import type {
  CreateTreatmentProtocolDto,
  UpdateTreatmentProtocolDto,
} from '@/lib/types'

// ── Query Keys ─────────────────────────────────────────────

export const protocolKeys = {
  all: ['protocol'] as const,
  byVisit: (visitId: string) => ['protocol', 'visit', visitId] as const,
  exists: (visitId: string) => ['protocol', 'exists', visitId] as const,
  single: (id: string) => ['protocol', 'single', id] as const,
}

// ── Queries ────────────────────────────────────────────────

export function useProtocolByVisit(visitId: string | undefined) {
  return useQuery({
    queryKey: protocolKeys.byVisit(visitId!),
    queryFn: async () => {
      const response = await ApiManager.getTreatmentProtocolByVisit(visitId!)
      if (response.success && response.data) {
        const protocols = Array.isArray(response.data) ? response.data : [response.data]
        return protocols.length > 0 ? protocols[0] : null
      }
      return null
    },
    enabled: !!visitId,
  })
}

export function useProtocolExists(visitId: string | undefined) {
  return useQuery({
    queryKey: protocolKeys.exists(visitId!),
    queryFn: async () => {
      const response = await ApiManager.checkTreatmentProtocolExists(visitId!)
      if (response.success && response.data) {
        return response.data
      }
      return { exists: false }
    },
    enabled: !!visitId,
  })
}

// ── Mutations ──────────────────────────────────────────────

export function useCreateProtocol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTreatmentProtocolDto) => {
      const response = await ApiManager.createTreatmentProtocol(data)
      if (!response.success) throw new Error(response.message || 'Failed to create treatment protocol')
      return response.data
    },
    onSuccess: (data) => {
      if (data?.visit_id) {
        queryClient.invalidateQueries({ queryKey: protocolKeys.byVisit(data.visit_id) })
        queryClient.invalidateQueries({ queryKey: protocolKeys.exists(data.visit_id) })
      }
    },
  })
}

export function useUpdateProtocol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTreatmentProtocolDto }) => {
      const response = await ApiManager.updateTreatmentProtocol(id, data)
      if (!response.success) throw new Error(response.message || 'Failed to update treatment protocol')
      return response.data
    },
    onSuccess: (data) => {
      if (data?.visit_id) {
        queryClient.invalidateQueries({ queryKey: protocolKeys.byVisit(data.visit_id) })
      }
    },
  })
}

export function useFinalizeProtocol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; visitId: string }) => {
      const response = await ApiManager.finalizeTreatmentProtocol(id)
      if (!response.success) throw new Error(response.message || 'Failed to finalize treatment protocol')
      return response.data
    },
    onMutate: async ({ visitId }) => {
      await queryClient.cancelQueries({ queryKey: protocolKeys.byVisit(visitId) })
      const previousProtocol = queryClient.getQueryData<any>(protocolKeys.byVisit(visitId))

      if (previousProtocol) {
        queryClient.setQueryData(protocolKeys.byVisit(visitId), {
          ...previousProtocol,
          status: 'FINALIZED',
          finalized_at: new Date().toISOString(),
        })
      }

      return { previousProtocol, visitId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProtocol !== undefined) {
        queryClient.setQueryData(protocolKeys.byVisit(context.visitId), context.previousProtocol)
      }
    },
    onSettled: (_data, _err, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.byVisit(visitId) })
      queryClient.invalidateQueries({ queryKey: protocolKeys.exists(visitId) })
    },
  })
}

export function useSendProtocolToPatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; visitId: string }) => {
      const response = await ApiManager.sendTreatmentProtocolToPatient(id)
      if (!response.success) throw new Error(response.message || 'Failed to send protocol to patient')
      return response.data
    },
    onMutate: async ({ visitId }) => {
      await queryClient.cancelQueries({ queryKey: protocolKeys.byVisit(visitId) })
      const previousProtocol = queryClient.getQueryData<any>(protocolKeys.byVisit(visitId))

      if (previousProtocol) {
        queryClient.setQueryData(protocolKeys.byVisit(visitId), {
          ...previousProtocol,
          status: 'SENT_TO_PATIENT',
          sent_to_patient_at: new Date().toISOString(),
        })
      }

      return { previousProtocol, visitId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProtocol !== undefined) {
        queryClient.setQueryData(protocolKeys.byVisit(context.visitId), context.previousProtocol)
      }
    },
    onSettled: (_data, _err, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.byVisit(visitId) })
    },
  })
}

export function useGenerateProtocolPDF() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await ApiManager.generateTreatmentProtocolPDF(id)
      if (!response.success) throw new Error(response.message || 'Failed to generate PDF')
      return response.data
    },
  })
}

export function useDeleteProtocol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, visitId }: { id: string; visitId?: string }) => {
      const response = await ApiManager.deleteTreatmentProtocol(id)
      if (!response.success) throw new Error(response.message || 'Failed to delete treatment protocol')
      return { id, visitId }
    },
    onSuccess: (_data, { visitId }) => {
      if (visitId) {
        queryClient.invalidateQueries({ queryKey: protocolKeys.byVisit(visitId) })
        queryClient.invalidateQueries({ queryKey: protocolKeys.exists(visitId) })
      }
    },
  })
}

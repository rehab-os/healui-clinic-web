import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ApiManager from '@/services/api/api.service'

// ── Query Keys ─────────────────────────────────────────────

export const availabilityKeys = {
  all: ['availability'] as const,
  list: () => ['availability', 'list'] as const,
  serviceLocations: (userId: string) => ['availability', 'serviceLocations', userId] as const,
  serviceArea: () => ['availability', 'serviceArea'] as const,
  practiceSettings: () => ['practice', 'settings'] as const,
  specializations: () => ['practice', 'specializations'] as const,
  specialtyPricings: () => ['practice', 'specialtyPricings'] as const,
}

// ── Queries ────────────────────────────────────────────────

export function useAvailabilities() {
  return useQuery({
    queryKey: availabilityKeys.list(),
    queryFn: async () => {
      const response = await ApiManager.getMyAvailability()
      if (!response.success) throw new Error(response.message || 'Failed to fetch availability')
      return response.data || []
    },
  })
}

export function useServiceLocations(userId: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.serviceLocations(userId!),
    queryFn: async () => {
      const response = await ApiManager.getServiceLocations(userId!)
      if (!response.success) throw new Error(response.message || 'Failed to fetch service locations')
      return response.data || []
    },
    enabled: !!userId,
  })
}

export function useServiceArea() {
  return useQuery({
    queryKey: availabilityKeys.serviceArea(),
    queryFn: async () => {
      const response = await ApiManager.getMyServiceArea()
      if (!response.success) return null
      return response.data
    },
  })
}

export function usePracticeSettings() {
  return useQuery({
    queryKey: availabilityKeys.practiceSettings(),
    queryFn: async () => {
      const response = await ApiManager.getPhysiotherapistProfile()
      if (!response.success) throw new Error(response.message || 'Failed to fetch practice settings')
      return response.data
    },
  })
}

export function useSpecializations() {
  return useQuery({
    queryKey: availabilityKeys.specializations(),
    queryFn: async () => {
      const response = await ApiManager.getSpecializations()
      if (!response.success) throw new Error(response.message || 'Failed to fetch specializations')
      return response.data || []
    },
  })
}

export function useSpecialtyPricings() {
  return useQuery({
    queryKey: availabilityKeys.specialtyPricings(),
    queryFn: async () => {
      const response = await ApiManager.getMySpecialtyPricings()
      if (!response.success) throw new Error(response.message || 'Failed to fetch specialty pricings')
      return response.data || []
    },
  })
}

// ── Mutations ──────────────────────────────────────────────

export function useCreateAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await ApiManager.createAvailability(data)
      if (!response.success) throw new Error(response.message || 'Failed to create availability')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() })
    },
  })
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await ApiManager.updateAvailability(id, data)
      if (!response.success) throw new Error(response.message || 'Failed to update availability')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() })
    },
  })
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await ApiManager.deleteAvailability(id)
      if (!response.success) throw new Error(response.message || 'Failed to delete availability')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() })
    },
  })
}

export function useSetDefaultAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await ApiManager.setDefaultAvailability()
      if (!response.success) throw new Error(response.message || 'Failed to set default availability')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() })
    },
  })
}

export function useCreateServiceLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await ApiManager.createServiceLocation(userId, data)
      if (!response.success) throw new Error(response.message || 'Failed to create service location')
      return response.data
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceLocations(userId) })
    },
  })
}

export function useUpdateServiceLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, id, data }: { userId: string; id: string; data: any }) => {
      const response = await ApiManager.updateServiceLocation(userId, id, data)
      if (!response.success) throw new Error(response.message || 'Failed to update service location')
      return response.data
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceLocations(userId) })
    },
  })
}

export function useDeleteServiceLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, id }: { userId: string; id: string }) => {
      const response = await ApiManager.deleteServiceLocation(userId, id)
      if (!response.success) throw new Error(response.message || 'Failed to delete service location')
      return id
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceLocations(userId) })
    },
  })
}

export function useUpdatePracticeSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await ApiManager.updatePracticeSettings(data)
      if (!response.success) throw new Error(response.message || 'Failed to update practice settings')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.practiceSettings() })
    },
  })
}

export function useCreateServiceArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await ApiManager.createServiceArea(data)
      if (!response.success) throw new Error(response.message || 'Failed to create service area')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceArea() })
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceLocations('') })
    },
  })
}

export function useUpdateServiceArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await ApiManager.updateServiceArea(data)
      if (!response.success) throw new Error(response.message || 'Failed to update service area')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceArea() })
    },
  })
}

export function useDeleteServiceArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await ApiManager.deleteServiceArea()
      if (!response.success) throw new Error(response.message || 'Failed to delete service area')
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceArea() })
      queryClient.invalidateQueries({ queryKey: availabilityKeys.serviceLocations('') })
    },
  })
}

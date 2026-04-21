import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { AssetType, Location, Department, Employee } from '../types'

export function useAssetTypes() {
  return useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: () => api.get('/catalog/asset-types').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => api.get('/catalog/locations').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/catalog/departments').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useEmployeeList() {
  return useQuery<{ items: Employee[] }>({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/employees?size=200&status=active').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })
}

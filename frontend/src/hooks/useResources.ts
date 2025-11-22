/**
 * Custom hook for resource queries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ResourceCreate, ResourceUpdate } from "@/types/index";

export function useResources(params?: {
  type?: string;
  tag?: string;
  search?: string;
  status?: string;
  discipline?: string;
  tools?: string;
  min_time_saved?: number;
  sort_by?: string;
  skip?: number;
  limit?: number;
}) {
  // Create a unique, serializable query key that captures all parameters
  // This ensures different parameter combinations don't share the same cache
  // (e.g., FilterSidebar with limit:100 vs ResourcesPage with filters applied)
  const queryKey = ["resources", JSON.stringify(params || {})];

  return useQuery({
    queryKey,
    queryFn: () => apiClient.listResources(params),
    // Use staleTime instead of 0 to avoid constant refetches
    // This allows React Query to deduplicate requests automatically
    // Data is fresh enough for 30 seconds, then can be refetched if explicitly requested
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused queries for 5 minutes
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ["resource", id],
    queryFn: () => apiClient.getResource(id),
    enabled: !!id,
    staleTime: 5000, // Consider data stale after 5 seconds for real-time updates
  });
}

export function useResourceSolutions(id: string) {
  return useQuery({
    queryKey: ["resourceSolutions", id],
    queryFn: () => apiClient.getResourceSolutions(id),
    enabled: !!id,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResourceCreate) => apiClient.createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ResourceUpdate;
    }) => apiClient.updateResource(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resource", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

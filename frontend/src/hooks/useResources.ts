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
  collaboration_status?: string;
  min_time_saved?: number;
  sort_by?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["resources", params],
    queryFn: () => apiClient.listResources(params),
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ["resource", id],
    queryFn: () => apiClient.getResource(id),
    enabled: !!id,
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

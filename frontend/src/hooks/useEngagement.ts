import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface SaveResponse {
  resource_id: string;
  is_saved: boolean;
  save_count: number;
  status: "saved" | "unsaved";
}

interface TriedResponse {
  resource_id: string;
  tried_count: number;
  status: "tracked";
}

interface IsSavedResponse {
  resource_id: string;
  is_saved: boolean;
}

interface SavedResource {
  id: string;
  title: string;
  content_text: string;
  type: string;
  discipline: string | null;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  saved_at: string;
  // Include other resource fields as needed
  [key: string]: unknown;
}

/**
 * Toggle save status for a resource
 */
export const useSaveResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await apiClient.post<SaveResponse>(
        `/resources/${resourceId}/save`
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate saved resources list
      queryClient.invalidateQueries({ queryKey: ["savedResources"] });
      // Invalidate is-saved check for this resource
      queryClient.invalidateQueries({
        queryKey: ["isResourceSaved", data.resource_id],
      });
      // Invalidate the individual resource query to refresh engagement stats
      queryClient.invalidateQueries({
        queryKey: ["resource", data.resource_id],
      });
    },
  });
};

/**
 * Check if current user has saved a resource
 */
export const useIsResourceSaved = (resourceId: string) => {
  return useQuery({
    queryKey: ["isResourceSaved", resourceId],
    queryFn: async () => {
      const response = await apiClient.get<IsSavedResponse>(
        `/resources/${resourceId}/is-saved`
      );
      return response.data.is_saved;
    },
    enabled: !!resourceId,
  });
};

/**
 * Track "tried it" action for a resource
 */
export const useTriedResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await apiClient.post<TriedResponse>(
        `/resources/${resourceId}/tried`
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate resource list to refresh analytics
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      // Invalidate the individual resource query to refresh engagement stats
      queryClient.invalidateQueries({
        queryKey: ["resource", data.resource_id],
      });
    },
  });
};

/**
 * Get all resources saved by current user
 */
export const useUserSavedResources = (options?: {
  skip?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["savedResources", options?.skip ?? 0, options?.limit ?? 100],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.skip !== undefined) params.append("skip", String(options.skip));
      if (options?.limit !== undefined) params.append("limit", String(options.limit));

      const response = await apiClient.get<SavedResource[]>(
        `/users/me/saved-resources?${params.toString()}`
      );
      return response.data;
    },
  });
};

/**
 * Get users who tried implementing a resource
 */
interface UserTriedInfo {
  id: string;
  full_name: string;
  email: string;
  tried_at: string;
}

export const useResourceUsersTried = (resourceId: string) => {
  return useQuery({
    queryKey: ["resourceUsersTried", resourceId],
    queryFn: async () => {
      const response = await apiClient.get<UserTriedInfo[]>(
        `/resources/${resourceId}/users-tried-it`
      );
      return response.data;
    },
    enabled: !!resourceId,
  });
};

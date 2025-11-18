/**
 * Admin resources management hooks
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Resource } from "@/types/index";

/**
 * Mark resource as verified
 */
export function useVerifyResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.patch<Resource>(
        `/admin/resources/${resourceId}/verify`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

/**
 * Hide resource from public view
 */
export function useHideResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.patch<Resource>(
        `/admin/resources/${resourceId}/hide`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

/**
 * Unhide resource to make visible again
 */
export function useUnhideResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await api.patch<Resource>(
        `/admin/resources/${resourceId}/unhide`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

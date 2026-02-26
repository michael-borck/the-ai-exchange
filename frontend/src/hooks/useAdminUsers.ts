/**
 * Admin users management hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/types/index";

export interface ListUsersParams {
  skip?: number;
  limit?: number;
}

/**
 * Fetch list of all users (admin only)
 */
export function useAdminUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const response = await api.get<User[]>("/admin/users", {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 20,
        },
      });
      return response.data;
    },
  });
}

/**
 * Update user role (ADMIN or STAFF)
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { userId: string; role: "ADMIN" | "STAFF" }) => {
      const response = await api.patch<User>(`/admin/users/${vars.userId}/role`, {
        role: vars.role,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

/**
 * Update user active status
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { userId: string; isActive: boolean }) => {
      const response = await api.patch<User>(
        `/admin/users/${vars.userId}/status`,
        {
          is_active: vars.isActive,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

/**
 * Approve user for external domain
 */
export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch<User>(
        `/admin/users/${userId}/approve`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

/**
 * Force-verify a user's email (admin only)
 */
export function useVerifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch<User>(
        `/admin/users/${userId}/verify`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

/**
 * Delete user and all their resources
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

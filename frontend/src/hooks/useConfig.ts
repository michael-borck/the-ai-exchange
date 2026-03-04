/**
 * Hook for fetching configurable values (specialties, professional roles, resource types)
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ConfigResponse, ConfigValue } from "@/types/index";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const response = await apiClient.get<ConfigResponse>("/config/all");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: ["config", "specialties"],
    queryFn: async () => {
      const response = await apiClient.get<{ items: ConfigValue[] }>("/config/specialties");
      return response.data.items;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProfessionalRoles() {
  return useQuery({
    queryKey: ["config", "professional-roles"],
    queryFn: async () => {
      const response = await apiClient.get<{ items: ConfigValue[] }>("/config/professional-roles");
      return response.data.items;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useResourceTypes() {
  return useQuery({
    queryKey: ["config", "resource-types"],
    queryFn: async () => {
      const response = await apiClient.get<{ items: ConfigValue[] }>("/config/resource-types");
      return response.data.items;
    },
    staleTime: 1000 * 60 * 5,
  });
}

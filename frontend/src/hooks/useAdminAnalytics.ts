import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface TopResource {
  resource_id: string;
  view_count: number;
  save_count: number;
  tried_count: number;
  title?: string;
}

interface PlatformAnalytics {
  platform_stats: {
    total_resources: number;
    total_views: number;
    total_saves: number;
    total_tried: number;
    total_forks: number;
    total_comments: number;
    avg_views_per_resource: number;
    avg_saves_per_resource: number;
  };
  top_resources: TopResource[];
}

interface SpecialtyStats {
  count: number;
  total_views: number;
  total_saves: number;
}

interface AnalyticsBySpecialty {
  by_specialty: Record<string, SpecialtyStats>;
}

/**
 * Fetch platform-wide analytics for admin dashboard
 */
export const usePlatformAnalytics = () => {
  return useQuery({
    queryKey: ["adminPlatformAnalytics"],
    queryFn: async () => {
      const response = await apiClient.get<PlatformAnalytics>(
        "/admin/analytics"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch analytics breakdown by specialty
 */
export const useAnalyticsBySpecialty = () => {
  return useQuery({
    queryKey: ["adminAnalyticsBySpecialty"],
    queryFn: async () => {
      const response = await apiClient.get<AnalyticsBySpecialty>(
        "/admin/analytics/by-specialty"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

import { useQuery } from "@tanstack/react-query";
import { investmentService, Investment } from "@/lib/investment-service";
import { useAuth } from "./useAuth";
import { apiClient } from "@/lib/api-client";
import { INVESTMENTS_ENABLED } from "@/lib/product-features";

export function useInvestments() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id || user?._id || null;

  return useQuery<Investment[], Error>({
    queryKey: ["contributions", "me", userId, INVESTMENTS_ENABLED],
    queryFn: async () => {
      const donations = await apiClient.get<Investment[]>(
        "/projects/donations/me",
      );
      if (!INVESTMENTS_ENABLED) return donations.data;
      return [
        ...donations.data,
        ...(await investmentService.getMyInvestments()),
      ];
    },
    enabled: !!isAuthenticated && !!userId,
    staleTime: 30_000,
  });
}

export function useProjectInvestments(projectId: string) {
  return useQuery<Investment[], Error>({
    queryKey: ["investments", "project", projectId],
    queryFn: () => investmentService.getProjectInvestments(projectId),
    enabled: !!projectId,
    staleTime: 30000,
  });
}

export function useInvestment(id: string) {
  return useQuery<Investment, Error>({
    queryKey: ["investment", id],
    queryFn: () => investmentService.getInvestment(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

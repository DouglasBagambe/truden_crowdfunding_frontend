import { useQuery } from '@tanstack/react-query';
import { investmentService, Investment } from '@/lib/investment-service';
import { useAuth } from './useAuth';

export function useInvestments() {
    const { isAuthenticated } = useAuth();

    return useQuery<Investment[], Error>({
        queryKey: ['investments', 'me'],
        queryFn: () => investmentService.getMyInvestments(), // ← calls GET /investments/me
        enabled: !!isAuthenticated,
        staleTime: 30_000,
    });
}

export function useProjectInvestments(projectId: string) {
    return useQuery<Investment[], Error>({
        queryKey: ['investments', 'project', projectId],
        queryFn: () => investmentService.getProjectInvestments(projectId),
        enabled: !!projectId,
        staleTime: 30000,
    });
}

export function useInvestment(id: string) {
    return useQuery<Investment, Error>({
        queryKey: ['investment', id],
        queryFn: () => investmentService.getInvestment(id),
        enabled: !!id,
        staleTime: 30000,
    });
}

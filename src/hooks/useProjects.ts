import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/project-service';
import { useAuth } from './useAuth';

export function useProjects(params?: any) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectService.getProjects(params),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
}

export function useMyProjects() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || user?._id || null;

  return useQuery({
    queryKey: ['my-projects', userId],
    queryFn: () => projectService.getMyProjects(),
    enabled: !!isAuthenticated && !!userId,
    staleTime: 30_000,
  });
}

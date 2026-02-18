import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/project-service';

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
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectService.getMyProjects(),
    staleTime: 30_000,
  });
}

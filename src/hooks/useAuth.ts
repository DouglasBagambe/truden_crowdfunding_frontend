import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../lib/user-service';
import { authService } from '../lib/auth-service';
import { useEffect } from 'react';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: userService.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAuthenticated = !!user && !error;

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        queryClient.invalidateQueries({ queryKey: ['me'] });
      }
    }
  });

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['me'], null);
    window.location.href = '/login';
  };

  return {
    user: user?.user || user, // Handle both nested and flat responses
    isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    refetchUser: refetch
  };
}

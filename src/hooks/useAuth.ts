import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../lib/user-service';
import { authService } from '../lib/auth-service';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
        try {
            return await userService.getMe();
        } catch (e) {
            return null;
        }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAuthenticated = !!user;

  const loginMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('[AUTH_FRONTEND_DEBUG] Attempting login with:', data.email);
      return authService.login(data);
    },
    onSuccess: (data) => {
      console.log('[AUTH_FRONTEND_DEBUG] Login success response:', data);
      if (data.accessToken || data.access_token) {
        const token = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token;
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        // Set a cookie so Next.js middleware can read auth state on the server
        try {
          const maxAge = 60 * 60 * 24 * 7; // 7 days
          document.cookie = `token=${token}; Max-Age=${maxAge}; Path=/`;
        } catch {}
        queryClient.invalidateQueries({ queryKey: ['me'] });
        toast.success(`Welcome back, ${data.user?.firstName || data.user?.profile?.firstName || 'Legacy Builder'}!`);
        try {
          const sp = new URLSearchParams(window.location.search);
          const next = sp.get('next') || '/';
          window.location.href = next;
        } catch {}
      }
    },
    onError: (error: any) => {
        console.error('[AUTH_FRONTEND_DEBUG] Login error:', error);
        console.error('[AUTH_FRONTEND_DEBUG] Error response data:', error.response?.data);
        toast.error(error.response?.data?.message || 'Authentication failed');
    }
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Clear cookie used by middleware
    try {
      document.cookie = 'token=; Max-Age=0; Path=/';
    } catch {}
    queryClient.setQueryData(['me'], null);
    toast.success('Securely signed out');
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

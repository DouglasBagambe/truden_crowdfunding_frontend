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
    mutationFn: (data: any) => authService.login(data),
    onSuccess: (data) => {
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
        } catch { }
        queryClient.invalidateQueries({ queryKey: ['me'] });
        toast.success(`Welcome back, ${data.user?.firstName || data.user?.profile?.firstName || 'Legacy Builder'}!`);
        try {
          const sp = new URLSearchParams(window.location.search);
          const next = sp.get('next') || '/';
          window.location.href = next;
        } catch { }
      }
    },
    onError: (error: any, variables: any) => {
      const msg: string = error.response?.data?.message || 'Authentication failed';
      if (msg.toLowerCase().includes('not verified')) {
        toast.error('Please verify your email first.');
        const email = (variables as any)?.email || '';
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      } else {
        toast.error(msg);
      }
    }
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Clear cookie used by middleware
    try {
      document.cookie = 'token=; Max-Age=0; Path=/';
    } catch { }
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

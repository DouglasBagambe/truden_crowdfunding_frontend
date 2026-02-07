'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  INNOVATOR = 'INNOVATOR',
  APPROVER = 'APPROVER',
  INVESTOR = 'INVESTOR',
  TREASURY = 'TREASURY',
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${pathname}`);
      } else if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
        const hasRequiredRole = 
          userRoles.includes(UserRole.SUPERADMIN) || 
          requiredRoles.some(role => userRoles.includes(role));
          
        if (!hasRequiredRole) {
          toast.error("You don't have permission to access this area");
          router.push('/dashboard');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Verifying Protocol Access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
    const hasRequiredRole = 
      userRoles.includes(UserRole.SUPERADMIN) || 
      requiredRoles.some(role => userRoles.includes(role));
      
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}

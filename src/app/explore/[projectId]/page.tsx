'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    if (projectId) {
      router.replace(`/projects/${projectId}`);
    } else {
      router.replace('/explore');
    }
  }, [projectId, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[var(--text-muted)] font-medium">Redirecting...</p>
      </div>
    </div>
  );
}

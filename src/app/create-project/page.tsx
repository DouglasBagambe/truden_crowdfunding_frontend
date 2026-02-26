'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CreateProjectRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard?create=true');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        </div>
    );
}

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, authBootstrapError, retryAuth } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-xl px-4 pt-4" aria-live="polite">
        {isLoading && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Checking your existing session. You can still sign in below.
          </p>
        )}
        {authBootstrapError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            <span>{authBootstrapError}</span>
            <button
              type="button"
              onClick={() => void retryAuth()}
              className="font-bold underline underline-offset-2"
            >
              Retry session check
            </button>
          </div>
        )}
      </div>
      {children}
    </>
  );
}

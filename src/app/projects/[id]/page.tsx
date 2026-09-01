"use client";

import dynamic from "next/dynamic";

const ProjectDetailPageClient = dynamic(
  () => import("./ProjectDetailPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin mx-auto" />
          <p className="text-[var(--text-muted)] font-medium">
            Loading project...
          </p>
        </div>
      </div>
    ),
  },
);

export default function ProjectDetailPage() {
  return <ProjectDetailPageClient />;
}

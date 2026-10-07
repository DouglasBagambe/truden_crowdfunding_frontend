"use client";

import { useState } from "react";
import { resolveCampaignVideo } from "@/lib/campaign-video";

export default function CampaignVideo({
  url,
  title = "Campaign video",
}: {
  url: string;
  title?: string;
}) {
  const source = resolveCampaignVideo(url);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!source)
    return (
      <p role="status" className="p-4 text-sm text-[var(--text-muted)]">
        This video URL is not supported.
      </p>
    );
  if (failedSource === source.src)
    return (
      <div className="flex h-full items-center justify-center p-4">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-main)] underline"
        >
          Open campaign video
        </a>
      </div>
    );
  return source.kind === "embed" ? (
    <iframe
      key={source.src}
      src={source.src}
      title={`${title} (${source.provider})`}
      className="h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onError={() => setFailedSource(source.src)}
    />
  ) : (
    <video
      key={source.src}
      src={source.src}
      aria-label={title}
      controls
      playsInline
      preload="metadata"
      className="h-full w-full object-contain"
      onError={() => setFailedSource(source.src)}
    />
  );
}

export type CampaignVideoSource = {
  kind: "embed" | "direct";
  src: string;
  url: string;
  provider: "YouTube" | "Vimeo" | "Video";
};

// The Create flow supports provider URLs, direct video files and uploaded files.
// Never embed arbitrary HTML pages or accept provider lookalike hostnames.
export function resolveCampaignVideo(
  value: unknown,
): CampaignVideoSource | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const raw = value.trim();
    const url = new URL(raw, "https://keibo.invalid");
    if (!/^https?:$/.test(url.protocol) || url.username || url.password)
      return null;
    const host = url.hostname.toLowerCase();
    const segments = url.pathname.split("/").filter(Boolean);
    const youtube = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ];
    if (
      youtube.includes(host) ||
      host === "youtu.be" ||
      host === "www.youtu.be"
    ) {
      if (url.port) return null;
      const id = host.endsWith("youtu.be")
        ? segments[0]
        : url.pathname === "/watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live"].includes(segments[0])
            ? segments[1]
            : null;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      return {
        kind: "embed",
        provider: "YouTube",
        url: `https://www.youtube.com/watch?v=${id}`,
        src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1`,
      };
    }
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
      if (url.port) return null;
      const id =
        host === "player.vimeo.com" && segments[0] === "video"
          ? segments[1]
          : segments[0];
      if (!id || !/^\d+$/.test(id)) return null;
      const hash =
        url.searchParams.get("h") ||
        (host !== "player.vimeo.com" ? segments[1] : undefined);
      if (hash && !/^[A-Za-z0-9]+$/.test(hash)) return null;
      const src = new URL(`https://player.vimeo.com/video/${id}`);
      if (hash) src.searchParams.set("h", hash);
      return {
        kind: "embed",
        provider: "Vimeo",
        url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`,
        src: src.toString(),
      };
    }
    const uploaded = /^\/api\/projects\/files\/[a-f\d]{24}$/i.test(
      url.pathname,
    );
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname) || uploaded) {
      if (
        url.origin === "https://keibo.invalid" &&
        !raw.startsWith("/api/projects/files/")
      )
        return null;
      return { kind: "direct", provider: "Video", url: raw, src: raw };
    }
    return null;
  } catch {
    return null;
  }
}

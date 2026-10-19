/** Only permit paths within this application after authentication. */
export function safeRedirectPath(value: string | null, fallback = "/"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    /^\/[/\\]/.test(value) ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return fallback;
  try {
    const origin = "https://keibo.invalid";
    const url = new URL(value, origin);
    return url.origin === origin
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

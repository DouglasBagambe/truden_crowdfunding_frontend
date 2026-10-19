/** Keep KEIBO uploads independent of a particular backend deployment. */
export function campaignMediaUrl(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      [
        "keibo-full-uat-api.onrender.com",
        "keibo-full-uat-api-po8w.onrender.com",
      ].includes(url.hostname) &&
      /^\/api\/projects\/files\/[a-f0-9]{24}$/i.test(url.pathname)
    )
      return url.pathname;
  } catch {
    // Relative API paths and external media keep their original representation.
  }
  return value;
}

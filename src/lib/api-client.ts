import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const REQUEST_TIMEOUT_MS = 8_000;

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : configuredApiUrl || "http://localhost:3000/api";
const transport = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

export function financialErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object" || !("response" in error)) return fallback;
  const response = error.response;
  if (!response || typeof response !== "object") return fallback;
  const status = "status" in response ? response.status : undefined;
  const data = "data" in response && response.data && typeof response.data === "object" ? response.data as Record<string, unknown> : {};
  if (status === 410 && data.code === "KEIBO_LEGACY_ROUTE_DISABLED") return "This legacy feature has been replaced and is unavailable in KEIBO.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You are not eligible to perform this action.";
  if (status === 409) return "This request has already been processed or conflicts with the current state.";
  if (status === 400 || status === 422) return typeof data.message === "string" ? data.message : "Please check the submitted details.";
  if (status === 503) return "This service is temporarily unavailable. No action was completed.";
  return typeof data.message === "string" ? data.message : fallback;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

async function getCsrfToken(): Promise<string> {
  const existing = readCookie("keibo_csrf");
  if (existing) return decodeURIComponent(existing);
  const response = await transport.get<{ csrfToken: string }>("/auth/csrf");
  return response.data.csrfToken;
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "get").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      config.headers.set("X-CSRF-Token", await getCsrfToken());
    }
    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _sessionRetry?: boolean }) | undefined;
    const path = original?.url || "";
    const canRefresh =
      error.response?.status === 401 &&
      original &&
      !original._sessionRetry &&
      !path.startsWith("/auth/login") &&
      !path.startsWith("/auth/register") &&
      !path.startsWith("/auth/refresh");

    if (!canRefresh) return Promise.reject(error);

    original._sessionRetry = true;
    try {
      const csrfToken = await getCsrfToken();
      await transport.post("/auth/refresh", undefined, {
        headers: { "X-CSRF-Token": csrfToken },
      });
      return apiClient(original);
    } catch {
      // Callers decide how to present an expired session. Redirecting here turns
      // an expected guest 401 from a public route into an unrelated login jump.
      return Promise.reject(error);
    }
  },
);

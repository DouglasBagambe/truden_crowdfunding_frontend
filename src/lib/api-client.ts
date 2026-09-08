import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
if (process.env.NODE_ENV === "production" && !configuredApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required in production");
}

const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : configuredApiUrl || "http://localhost:3000/api";
const transport = axios.create({ baseURL: API_URL, withCredentials: true });

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

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
      if (typeof window !== "undefined") window.location.replace("/login");
      return Promise.reject(error);
    }
  },
);

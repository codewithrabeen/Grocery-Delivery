import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const fallbackBaseUrl = import.meta.env.PROD
  ? "https://grocery-delivery-server-nu.vercel.app/api"
  : "http://localhost:8000/api";

export const API_BASE_URL =
  import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") ??
  fallbackBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const originalRequest = error.config as RetriableRequestConfig | undefined;
      const refreshToken = localStorage.getItem("auth_refresh_token");

      if (originalRequest && !originalRequest._retry && refreshToken) {
        originalRequest._retry = true;

        try {
          const { data } = await axios.post<{
            token: string;
            refreshToken?: string;
            user?: unknown;
          }>(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });

          localStorage.setItem("auth_token", data.token);
          if (data.refreshToken) localStorage.setItem("auth_refresh_token", data.refreshToken);
          if (data.user) localStorage.setItem("auth_user", JSON.stringify(data.user));
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch {
          // Fall through to session cleanup below.
        }
      }

      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
      window.dispatchEvent(new Event("auth:unauthorized"));

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default api;

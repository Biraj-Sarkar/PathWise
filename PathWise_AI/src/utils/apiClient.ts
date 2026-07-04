import { store } from "../store/store.tsx";
import { setCredentials, clearCredentials } from "./authSlice";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const toAbsoluteUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${normalizedPath}`;
};

let refreshPromise: Promise<boolean> | null = null;

export const silentRefresh = async (dispatch: any) => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const payload = data.data || data;

      dispatch(
        setCredentials({ userInfo: payload.user, token: payload.token })
      );

      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      dispatch(clearCredentials());
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
};

export const apiClient = async (endpoint: string, options: RequestInit = {}, dispatch: any, token?: string) => {
  const storedToken = token || store.getState().auth.token;
  const url = toAbsoluteUrl(endpoint);
  const isFormData = options.body instanceof FormData;


  const headers: HeadersInit = {
    ...(options.headers || {}),
    ...({ Authorization: `Bearer ${storedToken}` }),
    ...(isFormData ? {} : { "Content-Type": "application/json" })
  };

  let response = await fetch(url, { ...options, headers, credentials: "include" });

  if (response.status !== 401) return response;
  if (endpoint === "/auth/refresh") return response;

  const refreshed = await silentRefresh(dispatch);
  if (!refreshed) return response;

  const newToken = localStorage.getItem("token");

  response = await fetch(url, { 
    ...options, 
    headers: {
      ...headers,
      Authorization: `Bearer ${newToken}`
    }, 
    credentials: "include" 
  });

  return response;
}
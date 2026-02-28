import axios from "axios";

import { store } from "@/app/store/store";
import { env } from "@/shared/config/env";

export const http = axios.create({
  baseURL: env.apiBaseUrl,
});

http.interceptors.request.use((config) => {
  // Only attach auth header in the browser.
  if (typeof window === "undefined") return config;

  const token = store.getState().auth.token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

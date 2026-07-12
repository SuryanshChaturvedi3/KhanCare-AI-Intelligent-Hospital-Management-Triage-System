import axios from "axios";

// Single source of truth for API URLs
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000";

// Pre-configured axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api, API_URL, AI_URL };
export default api;

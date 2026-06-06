import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 15000,
});

// Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("cs_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — auto logout
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout if we receive 401 on routes OTHER than login
    if (error.response?.status === 401 && !error.config?.url?.includes("/login")) {
      localStorage.removeItem("cs_token");
      localStorage.removeItem("cs_user");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default API;

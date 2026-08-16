import axios from "axios";

/* Autenticação via cookie httpOnly (nunca via localStorage/Authorization header) —
   por isso withCredentials:true, pra sempre mandar o cookie junto nas requisições. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/verify-otp");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("finly_auth");
      sessionStorage.removeItem("finly_auth");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
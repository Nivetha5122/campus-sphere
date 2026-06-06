import API from "./api";

export const registerUser  = (data) => API.post("/auth/register", data);
export const loginUser     = (data) => API.post("/auth/login", data);
export const getMe         = ()     => API.get("/auth/me");
export const getAllUsers    = (params) => API.get("/auth/users", { params });
export const updateUserRole = (id, data) => API.patch(`/auth/users/${id}`, data);

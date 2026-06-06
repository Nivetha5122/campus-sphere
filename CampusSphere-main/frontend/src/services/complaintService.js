import API from "./api";
export const getComplaints    = ()         => API.get("/complaints");
export const createComplaint  = (data)     => API.post("/complaints", data);
export const updateStatus     = (id, data) => API.patch(`/complaints/${id}/status`, data);

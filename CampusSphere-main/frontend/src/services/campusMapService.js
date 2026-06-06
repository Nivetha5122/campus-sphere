import API from "./api";
export const getLocations   = (params) => API.get("/campus-map", { params });
export const seedLocations  = ()       => API.post("/campus-map/seed");
export const createLocation = (data)   => API.post("/campus-map", data);

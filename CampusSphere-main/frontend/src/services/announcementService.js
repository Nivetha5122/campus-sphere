import API from "./api";
export const getAnnouncements   = ()     => API.get("/announcements");
export const createAnnouncement = (data) => API.post("/announcements", data);
export const deleteAnnouncement = (id)   => API.delete(`/announcements/${id}`);

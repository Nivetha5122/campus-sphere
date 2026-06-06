import API from "./api";
export const getEvents    = ()     => API.get("/events");
export const createEvent  = (data) => API.post("/events", data);
export const deleteEvent  = (id)   => API.delete(`/events/${id}`);

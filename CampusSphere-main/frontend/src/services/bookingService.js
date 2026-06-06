import API from "./api";
export const getBookings   = ()     => API.get("/bookings");
export const createBooking = (data) => API.post("/bookings", data);
export const cancelBooking = (id)   => API.delete(`/bookings/${id}`);

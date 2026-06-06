import API from "./api";
export const getNotifications  = ()   => API.get("/notifications");
export const markRead          = (id) => API.patch(`/notifications/${id}/read`);
export const markAllRead       = ()   => API.patch("/notifications/read-all");
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

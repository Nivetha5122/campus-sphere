import API from "./api";
export const getLostItems  = ()     => API.get("/lost-found");
export const createItem    = (data) => API.post("/lost-found", data);
export const updateItem    = (id, data) => API.patch(`/lost-found/${id}`, data);

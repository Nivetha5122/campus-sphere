import API from "./api";

export const getNotes = (params) => API.get("/notes", { params });

// Accept optional axios config (e.g. { onUploadProgress }) to enable progress tracking
export const uploadNote = (formData, config = {}) =>
  API.post("/notes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  });

export const downloadNote = async (id, originalName) => {
  const res = await API.get(`/notes/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = originalName || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const deleteNote = (id) => API.delete(`/notes/${id}`);

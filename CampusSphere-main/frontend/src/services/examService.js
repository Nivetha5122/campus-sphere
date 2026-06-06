import API from "./api";
export const getExams       = ()          => API.get("/exams");
export const getMyMarks     = ()          => API.get("/exams/my-marks");
export const getExamDetail  = (id)        => API.get(`/exams/${id}`);
export const createExam     = (data)      => API.post("/exams", data);
export const deleteExam     = (id)        => API.delete(`/exams/${id}`);
export const addSection     = (id, data)  => API.post(`/exams/${id}/sections`, data);
export const updateMarks    = (id, sid, data) => API.patch(`/exams/${id}/sections/${sid}`, data);
export const deleteSection  = (id, sid)   => API.delete(`/exams/${id}/sections/${sid}`);

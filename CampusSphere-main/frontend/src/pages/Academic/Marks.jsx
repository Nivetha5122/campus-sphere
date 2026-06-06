import { useState, useEffect } from "react";
import {
  BarChart2,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Save,
  Edit3,
  Check,
  Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getExams,
  getMyMarks,
  getExamDetail,
  createExam,
  deleteExam,
  addSection,
  updateMarks,
  deleteSection,
} from "../../services/examService";

const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Management",
  "Biotechnology",
  "Other",
];

const gradeOf = (s, max) => {
  const pct = (s / max) * 100;
  return pct >= 90
    ? "S"
    : pct >= 80
      ? "A+"
      : pct >= 70
        ? "A"
        : pct >= 60
          ? "B+"
          : pct >= 50
            ? "B"
            : "F";
};
const gradeColor = (s, max) => {
  const pct = (s / max) * 100;
  return pct >= 70
    ? "text-green-400"
    : pct >= 50
      ? "text-yellow-400"
      : "text-red-400";
};

// ─── Student view ─────────────────────────────────────────────────────────────
function StudentMarks() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMarks()
      .then((r) => setExams(r.data.exams))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="py-12 text-center text-soft">Loading your marks...</div>
    );
  if (!exams.length)
    return (
      <div className="py-12 text-center text-soft">No marks published yet.</div>
    );

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <div
          key={exam._id}
          className="bg-primary border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between gap-3">
            <span className="text-white font-semibold truncate">{exam.subject}</span>
            {exam.teacher && (
              <span className="text-soft text-[10px] shrink-0">by {exam.teacher}</span>
            )}
          </div>
          {exam.sections.length === 0 ? (
            <p className="px-5 py-4 text-soft text-sm">No sections yet.</p>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-soft text-xs">
                      <th className="text-left px-5 py-2.5 font-medium">Section</th>
                      <th className="text-center px-5 py-2.5 font-medium">Score</th>
                      <th className="text-center px-5 py-2.5 font-medium">Grade</th>
                      <th className="text-left px-5 py-2.5 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {exam.sections.map((sec) => (
                      <tr key={sec._id} className="hover:bg-white/[0.03] transition">
                        <td className="px-5 py-3 text-white font-medium">{sec.title}</td>
                        <td className="px-5 py-3 text-center">
                          {sec.score === null ? (
                            <span className="text-soft text-xs">Pending</span>
                          ) : (
                            <span className={`font-bold ${gradeColor(sec.score, sec.maxScore)}`}>
                              {sec.score}/{sec.maxScore}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {sec.score !== null && (
                            <span className={`font-bold text-xs ${gradeColor(sec.score, sec.maxScore)}`}>
                              {gradeOf(sec.score, sec.maxScore)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-soft text-xs">{sec.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden divide-y divide-white/5">
                {exam.sections.map((sec) => (
                  <div key={sec._id} className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium text-sm">{sec.title}</span>
                      <div className="text-right">
                        {sec.score === null ? (
                          <span className="text-soft text-[10px]">Pending</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${gradeColor(sec.score, sec.maxScore)}`}>
                              {sec.score}/{sec.maxScore}
                            </span>
                            <span className={`font-bold text-[10px] ${gradeColor(sec.score, sec.maxScore)}`}>
                              Grade: {gradeOf(sec.score, sec.maxScore)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {sec.remarks && <p className="text-soft text-[10px] italic">"{sec.remarks}"</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Teacher / Admin view ─────────────────────────────────────────────────────
function TeacherMarks() {
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null); // full detail
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showNewExam, setShowNewExam] = useState(false);
  const [showNewSec, setShowNewSec] = useState(false);
  const { isAdmin, user } = useAuth();
  const [newExam, setNewExam] = useState({ subject: "", department: "" });
  const [newSec, setNewSec] = useState({ title: "", maxScore: 100 });
  const [saving, setSaving] = useState(false);
  // edited scores buffer: { [studentId]: { score, remarks } }
  const [edits, setEdits] = useState({});
  const [editSection, setEditSection] = useState(null); // sectionId being edited

  const fetchExams = () => {
    setLoading(true);
    getExams()
      .then((r) => setExams(r.data.exams))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const loadDetail = async (exam) => {
    setDetailLoading(true);
    setEditSection(null);
    setEdits({});
    try {
      const r = await getExamDetail(exam._id);
      setActiveExam(r.data.exam);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await createExam(newExam);
      setExams((prev) => [r.data.exam, ...prev]);
      setShowNewExam(false);
      setNewExam({ subject: "", department: "" });
    } finally {
      setSaving(false);
    }
  };

  // Auto-set department for non-admin (teachers) from logged-in user
  useEffect(() => {
    if (!isAdmin && user?.department)
      setNewExam((prev) => ({ ...prev, department: user.department }));
  }, [isAdmin, user]);

  const handleAddSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addSection(activeExam._id, newSec);
      await loadDetail(activeExam);
      setShowNewSec(false);
      setNewSec({ title: "", maxScore: 100 });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMarks = async (sectionId) => {
    setSaving(true);
    const marks = Object.entries(edits).map(([studentId, v]) => ({
      studentId,
      ...v,
    }));
    try {
      await updateMarks(activeExam._id, sectionId, { marks });
      await loadDetail(activeExam);
      setEditSection(null);
      setEdits({});
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm("Delete this section?")) return;
    await deleteSection(activeExam._id, sectionId);
    await loadDetail(activeExam);
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm("Delete this exam record?")) return;
    await deleteExam(examId);
    setExams((prev) => prev.filter((e) => e._id !== examId));
    if (activeExam?._id === examId) setActiveExam(null);
  };

  const downloadCSV = () => {
    if (!activeExam) return;
    const { subject, department, sections } = activeExam;

    // Collect all unique students (by _id) across all sections
    const studentMap = {};
    sections.forEach((sec) => {
      sec.marks.forEach((m) => {
        const id = m.student?._id || m.student;
        if (id && !studentMap[id]) {
          studentMap[id] = {
            name: m.student?.name || "—",
            studentId: m.student?.studentId || "—",
          };
        }
      });
    });

    const students = Object.entries(studentMap); // [[_id, {name, studentId}]]

    // Header row
    const secHeaders = sections.map((s) => [`${s.title} (/${s.maxScore})`, `${s.title} Grade`]).flat();
    const headers = ["Student Name", "Student ID", ...secHeaders, "Total Score", "Max Total", "Overall Grade"];

    // Data rows
    const rows = students.map(([sid, info]) => {
      let total = 0;
      let maxTotal = 0;
      const sectionCols = sections.map((sec) => {
        const entry = sec.marks.find((m) => (m.student?._id || m.student)?.toString() === sid);
        const score = entry?.score ?? 0;
        total += score;
        maxTotal += sec.maxScore;
        return [score, gradeOf(score, sec.maxScore)];
      }).flat();
      return [info.name, info.studentId, ...sectionCols, total, maxTotal, gradeOf(total, maxTotal)];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subject}_${department}_marks.csv`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* Exam list */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <button
          onClick={() => setShowNewExam(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-soft text-white text-sm font-medium transition"
        >
          <Plus size={14} /> New Exam
        </button>

        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto py-1 md:py-0 pb-3 md:pb-0 scrollbar-hide">
          {loading ? (
            <div className="text-center text-soft text-sm py-4 w-full">Loading...</div>
          ) : exams.length === 0 ? (
            <div className="text-center text-soft text-sm py-4 w-full">No exams yet.</div>
          ) : (
            exams.map((ex) => (
              <div
                key={ex._id}
                onClick={() => loadDetail(ex)}
                className={`flex-shrink-0 w-48 md:w-full px-3 py-2.5 rounded-xl border cursor-pointer transition-all group ${activeExam?._id === ex._id ? "border-accent/40 bg-accent/8" : "border-white/10 bg-primary hover:border-accent/20"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate leading-tight">
                      {ex.subject}
                    </p>
                    <p className="text-soft text-[10px] leading-tight mt-0.5">{ex.department}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExam(ex._id);
                    }}
                    className="md:opacity-0 group-hover:opacity-100 text-soft hover:text-red-400 transition shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 min-w-0">
        {!activeExam ? (
          <div className="h-64 flex items-center justify-center text-soft text-sm border border-white/10 rounded-2xl bg-primary">
            Select an exam to manage sections and marks
          </div>
        ) : detailLoading ? (
          <div className="h-64 flex items-center justify-center text-soft">
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-base">
                  {activeExam.subject}
                </h2>
                <p className="text-soft text-xs">{activeExam.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-soft hover:text-white hover:border-accent/30 text-xs transition"
                  title="Download marks as CSV"
                >
                  <Download size={13} /> Download CSV
                </button>
                <button
                  onClick={() => setShowNewSec(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-soft hover:text-white hover:border-accent/30 text-xs transition"
                >
                  <Plus size={13} /> Add Section
                </button>
              </div>
            </div>

            {activeExam.sections.length === 0 ? (
              <div className="py-10 text-center text-soft text-sm border border-white/10 rounded-2xl bg-primary">
                No sections yet. Add one above.
              </div>
            ) : (
              activeExam.sections.map((sec) => (
                <div
                  key={sec._id}
                  className="bg-primary border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Section header */}
                  <div className="px-4 md:px-5 py-3 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-semibold text-sm block truncate">
                        {sec.title}
                      </span>
                      <span className="text-soft text-[10px]">
                        Max Score: {sec.maxScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {editSection === sec._id ? (
                        <>
                          <button
                            onClick={() => handleSaveMarks(sec._id)}
                            disabled={saving}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs transition disabled:opacity-50"
                          >
                            <Save size={12} />
                            {saving ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditSection(null);
                              setEdits({});
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-white/10 text-soft text-xs hover:bg-white/5 transition text-center"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditSection(sec._id);
                            setEdits({});
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-soft text-xs hover:border-accent/30 hover:text-white transition"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSection(sec._id)}
                        className="p-1.5 text-soft hover:text-red-400 transition shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Marks table */}
                  {sec.marks.length === 0 ? (
                    <p className="px-5 py-4 text-soft text-sm">
                      No students in this department yet.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 text-soft text-xs">
                          <th className="text-left px-5 py-2.5 font-medium">
                            Student
                          </th>
                          <th className="text-left px-5 py-2.5 font-medium hidden md:table-cell">
                            ID
                          </th>
                          <th className="text-center px-5 py-2.5 font-medium">
                            Score /{sec.maxScore}
                          </th>
                          <th className="text-center px-5 py-2.5 font-medium">
                            Grade
                          </th>
                          <th className="text-left px-5 py-2.5 font-medium hidden lg:table-cell">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sec.marks.map((m) => {
                          const sid = m.student?._id || m.student;
                          const editVal = edits[sid];
                          const score =
                            editSection === sec._id && editVal !== undefined
                              ? editVal.score
                              : m.score;
                          const remarks =
                            editSection === sec._id && editVal !== undefined
                              ? editVal.remarks
                              : m.remarks;
                          return (
                            <tr
                              key={sid}
                              className="hover:bg-white/[0.03] transition"
                            >
                              <td className="px-5 py-3 text-white font-medium">
                                {m.student?.name || "—"}
                              </td>
                              <td className="px-5 py-3 text-soft font-mono text-xs hidden md:table-cell">
                                {m.student?.studentId || "—"}
                              </td>
                              <td className="px-5 py-3 text-center">
                                {editSection === sec._id ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={sec.maxScore}
                                    value={score}
                                    onChange={(e) =>
                                      setEdits((prev) => ({
                                        ...prev,
                                        [sid]: {
                                          score: +e.target.value,
                                          remarks:
                                            prev[sid]?.remarks ?? m.remarks,
                                        },
                                      }))
                                    }
                                    className="w-16 bg-background border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-accent/60"
                                  />
                                ) : (
                                  <span
                                    className={`font-bold text-xs ${gradeColor(score, sec.maxScore)}`}
                                  >
                                    {score}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={`font-bold text-xs ${gradeColor(score, sec.maxScore)}`}
                                >
                                  {gradeOf(score, sec.maxScore)}
                                </span>
                              </td>
                              <td className="px-5 py-3 hidden lg:table-cell">
                                {editSection === sec._id ? (
                                  <input
                                    type="text"
                                    placeholder="Remarks"
                                    value={remarks}
                                    onChange={(e) =>
                                      setEdits((prev) => ({
                                        ...prev,
                                        [sid]: {
                                          score: prev[sid]?.score ?? m.score,
                                          remarks: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full bg-background border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent/60"
                                  />
                                ) : (
                                  <span className="text-soft text-xs">
                                    {remarks || "—"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* New Exam modal */}
      {showNewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">New Exam</h2>
              <button onClick={() => setShowNewExam(false)}>
                <X size={18} className="text-soft hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <input
                placeholder="Subject name"
                value={newExam.subject}
                onChange={(e) =>
                  setNewExam({ ...newExam, subject: e.target.value })
                }
                required
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-soft/40 outline-none focus:border-accent/60"
              />
              {isAdmin ? (
                <div className="relative">
                  <select
                    value={newExam.department}
                    onChange={(e) =>
                      setNewExam({ ...newExam, department: e.target.value })
                    }
                    required
                    className="w-full appearance-none bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent/60"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-soft pointer-events-none"
                  />
                </div>
              ) : (
                <div className="text-soft text-xs">
                  Department: {newExam.department || user?.department || "—"}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewExam(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-soft text-sm hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-soft transition disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Section modal */}
      {showNewSec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Add Section</h2>
              <button onClick={() => setShowNewSec(false)}>
                <X size={18} className="text-soft hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleAddSection} className="space-y-3">
              <input
                placeholder="Section title (e.g. Mid Sem 1)"
                value={newSec.title}
                onChange={(e) =>
                  setNewSec({ ...newSec, title: e.target.value })
                }
                required
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-soft/40 outline-none focus:border-accent/60"
              />
              <div>
                <label className="text-soft text-xs mb-1 block">
                  Max Score
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newSec.maxScore}
                  onChange={(e) =>
                    setNewSec({ ...newSec, maxScore: +e.target.value })
                  }
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent/60"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewSec(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-soft text-sm hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-soft transition disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function Marks() {
  const { isTeacher, isAdmin } = useAuth();
  const canEdit = isTeacher || isAdmin;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={20} className="text-accent" /> Marks
        </h1>
        <p className="text-soft text-sm mt-0.5">
          {canEdit
            ? "Create exam sections and enter marks — students are fetched from DB"
            : "Your academic performance"}
        </p>
      </div>
      {canEdit ? <TeacherMarks /> : <StudentMarks />}
    </div>
  );
}

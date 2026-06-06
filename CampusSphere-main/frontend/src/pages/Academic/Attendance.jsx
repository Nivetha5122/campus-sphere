import { useState, useEffect } from "react";
import { ClipboardList, Check, X, Minus, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

const SUBJECTS = ["Data Structures","Operating Systems","DBMS","Computer Networks","Software Engineering","Machine Learning"];
const STUDENTS_MOCK = [
  { id: "22BCE1001", name: "Nivetha" },
  { id: "22BCE1002", name: "Arun" },
  { id: "22BCE1003", name: "Faraz" },
  { id: "22BCE1004", name: "Prasaadh" },
  { id: "22BCE1005", name: "Sharjil" },
];

const statusColor = { P:"text-green-400", A:"text-red-400", L:"text-yellow-400" };
const statusLabel = { P:"Present", A:"Absent", L:"Late" };

export default function Attendance() {
  const { isTeacher, isAdmin, user } = useAuth();
  const canEdit = isTeacher || isAdmin;

  // Teacher: mark attendance; Student: view own
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [attendance, setAttendance] = useState(() =>
    STUDENTS_MOCK.reduce((acc, s) => ({ ...acc, [s.id]: "P" }), {})
  );
  const [saved, setSaved] = useState(false);

  // Student attendance summary (mock)
  const studentSummary = SUBJECTS.map(sub => ({
    subject: sub,
    present: Math.floor(Math.random() * 20) + 30,
    total: 50,
  }));

  const toggle = (id) => {
    setAttendance(prev => {
      const cycle = { P:"A", A:"L", L:"P" };
      return { ...prev, [id]: cycle[prev[id]] };
    });
    setSaved(false);
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList size={20} className="text-accent" /> Attendance
          </h1>
          <p className="text-soft text-sm mt-0.5">{canEdit ? "Mark and manage attendance" : "Your attendance overview"}</p>
        </div>
      </div>

      {canEdit ? (
        <>
          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="appearance-none bg-primary border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50 pr-9">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-soft pointer-events-none" />
            </div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-primary border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50" />
            <button onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-green-500 text-white" : "bg-accent hover:bg-soft text-white"}`}>
              {saved ? "✓ Saved" : "Save Attendance"}
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-soft">
            {Object.entries(statusLabel).map(([k,v]) => (
              <span key={k} className={`flex items-center gap-1.5 ${statusColor[k]}`}>
                <span className="w-2 h-2 rounded-full bg-current" />{v}
              </span>
            ))}
            <span className="text-soft/50">· Click to cycle status</span>
          </div>

          {/* Table */}
          <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{subject}</span>
              <span className="text-xs text-soft">{date}</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8 text-soft text-xs">
                <th className="text-left px-5 py-3 font-medium">Student ID</th>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-center">Toggle</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {STUDENTS_MOCK.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.03] transition">
                    <td className="px-5 py-3 text-soft font-mono text-xs">{s.id}</td>
                    <td className="px-5 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold text-xs ${statusColor[attendance[s.id]]}`}>
                        {statusLabel[attendance[s.id]]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggle(s.id)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                          attendance[s.id]==="P" ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25" :
                          attendance[s.id]==="A" ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25" :
                          "bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25"
                        }`}>
                        {attendance[s.id]==="P" ? <Check size={14}/> : attendance[s.id]==="A" ? <X size={14}/> : <Minus size={14}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Student view */
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[["Overall","82%","text-green-400"],["This Month","78%","text-yellow-400"],["Best Subject","95%","text-accent"]].map(([l,v,c]) => (
              <div key={l} className="bg-primary border border-white/10 rounded-2xl p-4 text-center card-hover">
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
                <p className="text-soft text-xs mt-1">{l}</p>
              </div>
            ))}
          </div>
          <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 text-sm font-semibold text-white">Subject-wise Attendance</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8 text-soft text-xs">
                <th className="text-left px-5 py-3 font-medium">Subject</th>
                <th className="text-left px-5 py-3 font-medium">Present / Total</th>
                <th className="text-left px-5 py-3 font-medium">Percentage</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {studentSummary.map(r => {
                  const pct = Math.round((r.present/r.total)*100);
                  const ok = pct >= 75;
                  return (
                    <tr key={r.subject} className="hover:bg-white/[0.03] transition">
                      <td className="px-5 py-3 text-white font-medium">{r.subject}</td>
                      <td className="px-5 py-3 text-soft">{r.present} / {r.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${ok?"bg-green-400":"bg-red-400"}`} style={{width:`${pct}%`}} />
                          </div>
                          <span className={`text-xs font-semibold ${ok?"text-green-400":"text-red-400"}`}>{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ok?"bg-green-500/10 text-green-400 border-green-500/30":"bg-red-500/10 text-red-400 border-red-500/30"}`}>
                          {ok?"On Track":"Low"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

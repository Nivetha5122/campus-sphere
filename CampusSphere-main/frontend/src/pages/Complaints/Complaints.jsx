import { useState, useEffect } from "react";
import { AlertCircle, Plus, X } from "lucide-react";
import { getComplaints, createComplaint, updateStatus } from "../../services/complaintService";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS = { pending: "text-yellow-400", "in-progress": "text-accent", resolved: "text-green-400" };

export default function Complaints() {
  const { isAdmin } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ title: "", description: "", category: "infrastructure", location: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComplaints().then((r) => setComplaints(r.data.complaints)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createComplaint(form);
      setComplaints((p) => [res.data.complaint, ...p]);
      setShowForm(false);
      setForm({ title: "", description: "", category: "infrastructure", location: "" });
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleStatus = async (id, status) => {
    await updateStatus(id, { status });
    setComplaints((p) => p.map((c) => c._id === id ? { ...c, status } : c));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><AlertCircle size={20} className="text-accent" /> Complaints</h1>
          <p className="text-soft text-sm mt-0.5">{isAdmin ? "Manage all campus complaints" : "Track your submitted complaints"}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-soft text-white text-sm rounded-lg transition">
          <Plus size={15} /> New Complaint
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Complaint</h2>
              <button onClick={() => setShowForm(false)} className="text-soft hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60">
                {["infrastructure","cleanliness","electrical","water","internet","other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Location (e.g. Block A, Room 101)" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <textarea placeholder="Describe the issue..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required rows={3}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60 resize-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-soft text-sm hover:bg-white/5 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-accent text-white text-sm hover:bg-soft transition disabled:opacity-50">{submitting ? "Submitting..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-soft">Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="px-4 py-12 text-center text-soft">No complaints yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-soft">
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              {isAdmin && <th className="text-left px-4 py-3 font-medium">Action</th>}
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {complaints.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{c.title}</p>
                    {c.createdBy && <p className="text-xs text-soft">{c.createdBy.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-soft capitalize hidden md:table-cell">{c.category}</td>
                  <td className="px-4 py-3 text-soft hidden md:table-cell">{c.location}</td>
                  <td className="px-4 py-3 capitalize font-medium text-xs"><span className={STATUS_COLORS[c.status]}>{c.status}</span></td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <select value={c.status} onChange={(e) => handleStatus(c._id, e.target.value)}
                        className="bg-background border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent/40 cursor-pointer">
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Megaphone, Plus, X, Trash2 } from "lucide-react";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../../services/announcementService";
import { useAuth } from "../../context/AuthContext";

const PRIORITY_COLORS = { urgent: "text-red-400 border-red-500/30 bg-red-500/10", normal: "text-accent border-accent/30 bg-accent/10", info: "text-soft border-white/20 bg-white/5" };

export default function Announcements() {
  const { isAdmin, isTeacher } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: "", content: "", category: "general", priority: "normal" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAnnouncements().then((r) => setAnnouncements(r.data.announcements)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createAnnouncement(form);
      setAnnouncements((p) => [res.data.announcement, ...p]);
      setShowForm(false);
      setForm({ title: "", content: "", category: "general", priority: "normal" });
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    setAnnouncements((p) => p.filter((a) => a._id !== id));
  };

  const canCreate = isAdmin || isTeacher;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone size={20} className="text-accent" /> Announcements</h1>
          <p className="text-soft text-sm mt-0.5">Official campus notices</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-soft text-white text-sm rounded-lg transition">
            <Plus size={15} /> New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Announcement</h2>
              <button onClick={() => setShowForm(false)} className="text-soft hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <div className="flex gap-2">
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60">
                  {["general","academic","hostel","events","exam","holiday","other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <textarea placeholder="Content..." value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} required rows={4}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60 resize-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-soft text-sm hover:bg-white/5 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-accent text-white text-sm hover:bg-soft transition disabled:opacity-50">{submitting ? "Posting..." : "Post"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? <div className="py-12 text-center text-soft">Loading...</div>
        : announcements.length === 0 ? <div className="py-12 text-center text-soft">No announcements yet.</div>
        : announcements.map((a) => (
          <div key={a._id} className="bg-primary border border-white/10 rounded-xl px-4 py-3.5 hover:border-accent/20 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.info}`}>{a.priority}</span>
                  {a.category && <span className="text-xs text-soft capitalize">{a.category}</span>}
                </div>
                <h3 className="text-white font-semibold">{a.title}</h3>
                <p className="text-soft text-sm mt-1">{a.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-soft/60">
                  {a.createdBy && <span>{a.createdBy.name}</span>}
                  <span>·</span>
                  <span>{new Date(a.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short"})}</span>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(a._id)} className="text-soft hover:text-red-400 transition shrink-0 p-1"><Trash2 size={14} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

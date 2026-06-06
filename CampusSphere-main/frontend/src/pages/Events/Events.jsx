import { useState, useEffect } from "react";
import { Calendar, Plus, X, Trash2 } from "lucide-react";
import { getEvents, createEvent, deleteEvent } from "../../services/eventService";
import { useAuth } from "../../context/AuthContext";

export default function Events() {
  const { isAdmin, isTeacher } = useAuth();
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: "", description: "", date: "", venue: "", department: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEvents().then((r) => setEvents(r.data.events)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createEvent(form);
      setEvents((p) => [res.data.event, ...p]);
      setShowForm(false);
      setForm({ title: "", description: "", date: "", venue: "", department: "" });
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    setEvents((p) => p.filter((e) => e._id !== id));
  };

  const canCreate = isAdmin || isTeacher;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Calendar size={20} className="text-accent" /> Events</h1>
          <p className="text-soft text-sm mt-0.5">Campus events and activities</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-soft text-white text-sm rounded-lg transition">
            <Plus size={15} /> New Event
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Event</h2>
              <button onClick={() => setShowForm(false)} className="text-soft hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Event title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <input type="datetime-local" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60" />
              <input placeholder="Venue" value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <input placeholder="Department (or All)" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60 resize-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-soft text-sm hover:bg-white/5 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-accent text-white text-sm hover:bg-soft transition disabled:opacity-50">{submitting ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
        {loading ? <div className="py-12 text-center text-soft">Loading...</div>
        : events.length === 0 ? <div className="py-12 text-center text-soft">No events yet.</div>
        : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-soft">
              <th className="text-left px-4 py-3 font-medium">Event</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Venue</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Dept</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {events.map((ev) => (
                <tr key={ev._id} className="hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{ev.title}</p>
                    {ev.createdBy && <p className="text-xs text-soft">{ev.createdBy.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-soft hidden md:table-cell">{ev.date ? new Date(ev.date).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"}) : "—"}</td>
                  <td className="px-4 py-3 text-soft hidden md:table-cell">{ev.venue || "—"}</td>
                  <td className="px-4 py-3 text-soft hidden md:table-cell">{ev.department || "All"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(ev._id)} className="text-soft hover:text-red-400 transition p-1"><Trash2 size={14} /></button>
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

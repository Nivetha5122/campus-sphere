import { useState, useEffect } from "react";
import { Package, Plus, X } from "lucide-react";
import { getLostItems, createItem } from "../../services/lostFoundService";

const STATUS_COLORS = { lost: "text-red-400", found: "text-green-400", claimed: "text-soft" };

export default function LostFound() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType]         = useState("lost");
  const [form, setForm]         = useState({ title: "", description: "", location: "", contactInfo: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLostItems().then((r) => setItems(r.data.items || r.data.lostItems || [])).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createItem({ ...form, status: type });
      setItems((p) => [res.data.item || res.data.lostItem, ...p]);
      setShowForm(false);
      setForm({ title: "", description: "", location: "", contactInfo: "" });
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Package size={20} className="text-accent" /> Lost & Found</h1>
          <p className="text-soft text-sm mt-0.5">Report and track lost or found items</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-soft text-white text-sm rounded-lg transition">
          <Plus size={15} /> Report Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Report Item</h2>
              <button onClick={() => setShowForm(false)} className="text-soft hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-4">
              {["lost","found"].map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm border capitalize transition ${type === t ? "bg-accent border-accent text-white" : "border-white/10 text-soft hover:border-accent/40"}`}>{t}</button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Item name" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <input placeholder="Last seen / found at location" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <input placeholder="Contact info" value={form.contactInfo} onChange={(e) => setForm({...form, contactInfo: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60 resize-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-soft text-sm hover:bg-white/5 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-accent text-white text-sm hover:bg-soft transition disabled:opacity-50">{submitting ? "Reporting..." : "Report"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-soft">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-soft">No items reported yet.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-soft">
                    <th className="text-left px-4 py-3 font-medium">Item</th>
                    <th className="text-left px-4 py-3 font-medium">Location</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Reported by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.03] transition">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{item.title || item.itemName}</p>
                        {item.description && <p className="text-xs text-soft truncate max-w-sm">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-soft">{item.location || "—"}</td>
                      <td className="px-4 py-3 capitalize font-medium text-xs">
                        <span className={STATUS_COLORS[item.status] || "text-soft"}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-soft text-xs">{item.reportedBy?.name || item.createdBy?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {items.map((item) => (
                <div key={item._id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{item.title || item.itemName}</h3>
                      <p className="text-xs text-soft mt-0.5 capitalize flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'lost' ? 'bg-red-400' : 'bg-green-400'}`} />
                        {item.status}
                      </p>
                    </div>
                    <span className="text-[10px] text-soft bg-white/5 px-2 py-1 rounded border border-white/10">
                      {item.location || "Unknown"}
                    </span>
                  </div>
                  {item.description && <p className="text-xs text-soft italic line-clamp-2">"{item.description}"</p>}
                  <div className="flex justify-between items-center pt-1">
                     <span className="text-[10px] text-soft/60">By {item.reportedBy?.name || item.createdBy?.name || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

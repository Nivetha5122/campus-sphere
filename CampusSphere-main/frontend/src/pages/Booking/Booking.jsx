import { useState, useEffect } from "react";
import { Building, Plus, X } from "lucide-react";
import { getBookings, createBooking, cancelBooking } from "../../services/bookingService";

const ROOMS = ["Room 101","Room 102","Room 201","Lab A","Lab B","Seminar Hall","Conference Room","Auditorium"];

export default function Booking() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ venue: "", date: "", startTime: "", endTime: "", purpose: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBookings().then((r) => setBookings(r.data.bookings || [])).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent past date/time
    const bookingDateTime = new Date(`${form.date}T${form.startTime}`);
    const now = new Date();
    if (bookingDateTime < now) {
      alert("Cannot book a room for a past date or time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBooking(form);
      setBookings((p) => [res.data.booking, ...p]);
      setShowForm(false);
      setForm({ venue: "", date: "", startTime: "", endTime: "", purpose: "" });
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    await cancelBooking(id);
    setBookings((p) => p.filter((b) => b._id !== id));
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()); // actually today
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Building size={20} className="text-accent" /> Room Booking</h1>
          <p className="text-soft text-sm mt-0.5">Reserve campus facilities</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-soft text-white text-sm rounded-lg transition">
          <Plus size={15} /> New Booking
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-primary border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Booking</h2>
              <button onClick={() => setShowForm(false)} className="text-soft hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60">
                <option value="">Select venue</option>
                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type="date" value={form.date} min={minDate} onChange={(e) => setForm({...form, date: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60" />
              <div className="flex gap-2">
                <input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} required
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60" />
                <input type="time" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} required
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent/60" />
              </div>
              <input placeholder="Purpose" value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})} required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-soft/50 outline-none focus:border-accent/60" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-soft text-sm hover:bg-white/5 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-accent text-white text-sm hover:bg-soft transition disabled:opacity-50">{submitting ? "Booking..." : "Book"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-soft">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-soft">No bookings yet.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-soft">
                    <th className="text-left px-4 py-3 font-medium">Venue</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Time</th>
                    <th className="text-left px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-white/[0.03] transition">
                      <td className="px-4 py-3 text-white font-medium">{b.venue || b.facility}</td>
                      <td className="px-4 py-3 text-soft">{b.date ? new Date(b.date).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="px-4 py-3 text-soft">{b.startTime} – {b.endTime}</td>
                      <td className="px-4 py-3 text-soft">{b.purpose || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleCancel(b._id)} className="text-xs text-red-400/80 hover:text-red-400 transition font-medium">Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {bookings.map((b) => (
                <div key={b._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{b.venue || b.facility}</h3>
                      <p className="text-xs text-soft">{b.date ? new Date(b.date).toLocaleDateString("en-IN") : "—"}</p>
                    </div>
                    <button onClick={() => handleCancel(b._id)} className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] uppercase tracking-wider font-bold rounded border border-red-500/20">Cancel</button>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-soft"><span className="text-white/40 mr-1">Time:</span> {b.startTime} - {b.endTime}</div>
                    <div className="text-soft truncate"><span className="text-white/40 mr-1">For:</span> {b.purpose || "—"}</div>
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

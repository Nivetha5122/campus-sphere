import { useRef, useEffect } from "react";
import { Bell, X, CheckCheck, Trash2, AlertCircle, Calendar, Megaphone, BarChart2, Package, Building, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TYPE_META = {
  complaint:    { icon: AlertCircle, color: "text-red-400",    bg: "bg-red-500/10"    },
  event:        { icon: Calendar,    color: "text-yellow-400", bg: "bg-yellow-500/10" },
  announcement: { icon: Megaphone,   color: "text-accent",     bg: "bg-accent/10"     },
  marks:        { icon: BarChart2,   color: "text-green-400",  bg: "bg-green-500/10"  },
  lost_found:   { icon: Package,     color: "text-purple-400", bg: "bg-purple-500/10" },
  booking:      { icon: Building,    color: "text-blue-400",   bg: "bg-blue-500/10"   },
  system:       { icon: Info,        color: "text-soft",       bg: "bg-white/5"       },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function NotificationPanel({ notifications, unreadCount, onMarkRead, onMarkAllRead, onDelete, onClose }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleClick = (n) => {
    if (!n.isRead) onMarkRead(n._id);
    if (n.link) { navigate(n.link); onClose(); }
  };

  return (
    <div ref={ref}
      className="absolute right-0 top-12 w-80 bg-primary border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
      style={{ boxShadow:"0 8px 40px rgba(2,16,36,0.8)" }}>

      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-accent" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} title="Mark all read"
              className="text-soft hover:text-accent transition p-1.5 rounded-lg hover:bg-white/5">
              <CheckCheck size={14} />
            </button>
          )}
          <button onClick={onClose} className="text-soft hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell size={28} className="mx-auto text-soft/20 mb-2" />
            <p className="text-soft text-sm">You're all caught up!</p>
          </div>
        ) : notifications.map(n => {
          const meta = TYPE_META[n.type] || TYPE_META.system;
          const Icon = meta.icon;
          return (
            <div key={n._id} onClick={() => handleClick(n)}
              className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-white/[0.04] transition-colors ${n.isRead ? "opacity-60" : ""}`}>
              <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={14} className={meta.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold leading-snug ${n.isRead ? "text-soft" : "text-white"}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />}
                </div>
                <p className="text-[11px] text-soft mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-soft/50 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onDelete(n._id); }}
                className="text-soft/30 hover:text-red-400 transition shrink-0 mt-1">
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-white/8 text-center">
          <p className="text-[10px] text-soft/40">Notifications expire after 36 hours</p>
        </div>
      )}
    </div>
  );
}

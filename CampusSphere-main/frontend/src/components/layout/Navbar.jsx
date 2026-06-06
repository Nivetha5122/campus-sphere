import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationPanel from "../notifications/NotificationPanel";

const ROLE_COLORS = { admin: "text-red-400", teacher: "text-yellow-400", student: "text-accent" };

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  const { notifications, unreadCount, handleMarkRead, handleMarkAllRead, handleDelete } = useNotifications();

  return (
    <div className="h-14 border-b border-white/8 flex items-center justify-between px-4 md:px-5 bg-primary shrink-0 z-[9997]">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-white/5 text-soft hover:text-white transition"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell with dot indicator */}
        <div className="relative">
          <button onClick={() => setShowPanel(v => !v)}
            className="relative p-2 rounded-xl hover:bg-white/5 transition text-soft hover:text-white">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow-lg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {showPanel && (
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onDelete={handleDelete}
              onClose={() => setShowPanel(false)}
            />
          )}
        </div>

        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-soft flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-xs font-semibold leading-none">{user?.name}</p>
            <p className={`text-[10px] leading-none mt-0.5 capitalize font-medium ${ROLE_COLORS[user?.role] || "text-soft"}`}>{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

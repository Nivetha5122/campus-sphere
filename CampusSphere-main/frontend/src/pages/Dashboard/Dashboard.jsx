import {
  Package,
  AlertCircle,
  Calendar,
  Megaphone,
  Users,
  BookOpen,
  ClipboardList,
  BarChart2,
  FileText,
  Bus,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const ROLE_GRAD = {
  admin: "from-red-500/20 via-primary to-primary",
  teacher: "from-yellow-500/15 via-primary to-primary",
  student: "from-accent/20 via-primary to-primary",
};
const ROLE_COLOR = {
  admin: "text-red-400",
  teacher: "text-yellow-400",
  student: "text-accent",
};

function StatCard({ title, value, icon: Icon, color, to }) {
  const inner = (
    <div
      className={`bg-primary border border-white/10 rounded-2xl p-4 flex items-center gap-4 card-hover cursor-pointer ${to ? "" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-soft text-xs">{title}</p>
        <p className="text-white text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickLink({ to, icon: Icon, label, color }) {
  return (
    <Link
      to={to}
      className="bg-primary border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 card-hover text-center"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon size={18} />
      </div>
      <span className="text-soft text-xs font-medium">{label}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const roleGrad = ROLE_GRAD[user?.role] || ROLE_GRAD.student;
  const roleColor = ROLE_COLOR[user?.role] || ROLE_COLOR.student;

  const stats = [
    {
      title: "Active Complaints",
      value: "5",
      icon: AlertCircle,
      color: "bg-red-500/15 text-red-400",
      to: "/complaints",
    },
    {
      title: "Upcoming Events",
      value: "3",
      icon: Calendar,
      color: "bg-yellow-500/15 text-yellow-400",
      to: "/events",
    },
    {
      title: "My Bookings",
      value: "2",
      icon: BookOpen,
      color: "bg-blue-500/15 text-blue-400",
      to: "/booking",
    },
    {
      title: "Lost Items",
      value: "12",
      icon: Package,
      color: "bg-purple-500/15 text-purple-400",
      to: "/lost-found",
    },
    ...(isAdmin
      ? [
          {
            title: "Total Users",
            value: "60",
            icon: Users,
            color: "bg-green-500/15 text-green-400",
            to: "/admin/users",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${roleGrad} border border-white/10 p-6`}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p
                className={`text-sm font-semibold capitalize mb-1 ${roleColor}`}
              >
                {user?.role} Portal
              </p>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-soft text-sm mt-1">
                {user?.department || "CampusSphere Academic Platform"}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-soft text-xs">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {user?.studentId && (
                <p className="text-soft text-xs mt-0.5 font-mono">
                  {user.studentId}
                </p>
              )}
              {user?.employeeId && (
                <p className="text-soft text-xs mt-0.5 font-mono">
                  {user.employeeId}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              user?.role && { label: user.role, cls: roleColor },
              user?.department && { label: user.department, cls: "text-soft" },
            ]
              .filter(Boolean)
              .map((b, i) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 capitalize font-medium ${b.cls}`}
                >
                  {b.label}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-sm font-semibold text-soft mb-3">Quick Access</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <QuickLink
            to="/attendance"
            icon={ClipboardList}
            label="Attendance"
            color="bg-green-500/15 text-green-400"
          />
          <QuickLink
            to="/marks"
            icon={BarChart2}
            label="Marks"
            color="bg-blue-500/15 text-blue-400"
          />
          <QuickLink
            to="/notes"
            icon={FileText}
            label="Notes"
            color="bg-yellow-500/15 text-yellow-400"
          />
          <QuickLink
            to="/announcements"
            icon={Megaphone}
            label="Notices"
            color="bg-accent/15 text-accent"
          />
          <QuickLink
            to="/bus-tracker"
            icon={Bus}
            label="Bus Tracker"
            color="bg-purple-500/15 text-purple-400"
          />
          <QuickLink
            to="/campus-map"
            icon={TrendingUp}
            label="Campus Map"
            color="bg-red-500/15 text-red-400"
          />
        </div>
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
            <Megaphone size={14} className="text-accent" />
            <span className="text-sm font-semibold text-white">
              Latest Announcements
            </span>
          </div>
          {[
            { t: "Holiday on Monday", p: "Urgent", c: "text-red-400" },
            { t: "Exam schedule released", p: "Info", c: "text-accent" },
            { t: "Library extended hours", p: "Notice", c: "text-yellow-400" },
          ].map((a) => (
            <div
              key={a.t}
              className="px-5 py-3 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.03] transition"
            >
              <span className="text-sm text-white/80">{a.t}</span>
              <span className={`text-xs font-medium ${a.c}`}>{a.p}</span>
            </div>
          ))}
        </div>

        <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
            <Calendar size={14} className="text-accent" />
            <span className="text-sm font-semibold text-white">
              Upcoming Events
            </span>
          </div>
          {[
            { n: "Tech Fest 2025", d: "Apr 20", dp: "CSE" },
            { n: "Guest Lecture: AI", d: "Apr 22", dp: "All" },
            { n: "Sports Day", d: "Apr 25", dp: "All" },
          ].map((ev) => (
            <div
              key={ev.n}
              className="px-5 py-3 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.03] transition"
            >
              <div>
                <p className="text-sm text-white/80">{ev.n}</p>
                <p className="text-xs text-soft">{ev.dp}</p>
              </div>
              <span className="text-xs font-medium text-accent">{ev.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

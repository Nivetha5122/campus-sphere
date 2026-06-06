import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  AlertCircle,
  Calendar,
  Megaphone,
  BookOpen,
  Building,
  FileText,
  BarChart2,
  TrendingUp,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
  ChevronDown,
  Search,
} from "lucide-react";
import { getAdminStats } from "../../services/adminService";
import { getAllUsers, updateUserRole } from "../../services/authService";

const ROLE_BADGE = {
  admin: "bg-red-500/15 text-red-400 border-red-500/30",
  teacher: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  student: "bg-accent/15 text-accent border-accent/30",
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function Stat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-primary border border-white/10 rounded-2xl p-4 flex items-center gap-3 card-hover">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={17} />
      </div>
      <div>
        <p className="text-soft text-xs">{label}</p>
        <p className="text-white text-xl font-bold mt-0.5">{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  const fetch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllUsers({ search, role: roleFilter || undefined });
      setUsers(res.data.users);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [search, roleFilter]);

  const handleRole = async (id, role) => {
    setUpdating(id);
    try {
      await updateUserRole(id, { role });
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch {
      setError("Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggle = async (id, isActive) => {
    setUpdating(id);
    try {
      await updateUserRole(id, { isActive: !isActive });
      setUsers((p) =>
        p.map((u) => (u.id === id ? { ...u, isActive: !isActive } : u)),
      );
    } catch {
      setError("Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-primary border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-48 focus-within:border-accent/40 transition">
          <Search size={13} className="text-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="bg-transparent text-sm text-white placeholder-soft/40 outline-none w-full"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none bg-primary border border-white/10 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none focus:border-accent/40"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-soft pointer-events-none"
          />
        </div>
        <button
          onClick={fetch}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-soft hover:text-white text-sm transition"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-soft text-xs">
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                Dept / ID
              </th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-soft">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-soft">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-soft flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-soft text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-soft text-xs">{u.department || "—"}</p>
                    <p className="text-soft/60 text-[10px] font-mono">
                      {u.studentId || u.employeeId || ""}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${ROLE_BADGE[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium ${u.isActive ? "text-green-400" : "text-red-400"}`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={u.role}
                          disabled={updating === u.id}
                          onChange={(e) => handleRole(u.id, e.target.value)}
                          className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-2 pr-6 py-1 text-xs text-white outline-none focus:border-accent/40 cursor-pointer disabled:opacity-40"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                        <ChevronDown
                          size={10}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-soft pointer-events-none"
                        />
                      </div>
                      <button
                        disabled={updating === u.id}
                        onClick={() => handleToggle(u.id, u.isActive)}
                        className={`p-1.5 rounded-lg border transition disabled:opacity-40 ${u.isActive ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}
                      >
                        {u.isActive ? (
                          <UserX size={13} />
                        ) : (
                          <UserCheck size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && users.length > 0 && (
          <div className="px-5 py-2.5 border-t border-white/8 text-xs text-soft">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="py-12 text-center text-soft">Loading stats...</div>;
  if (!data)
    return <div className="py-12 text-center text-soft">Failed to load.</div>;

  const { stats, recentUsers, recentComplaints, deptGroups } = data;

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-accent/15 text-accent"
        />
        <Stat
          label="Students"
          value={stats.students}
          icon={BookOpen}
          color="bg-blue-500/15 text-blue-400"
        />
        <Stat
          label="Teachers"
          value={stats.teachers}
          icon={Shield}
          color="bg-yellow-500/15 text-yellow-400"
        />
        <Stat
          label="Open Complaints"
          value={stats.openComplaints}
          icon={AlertCircle}
          color="bg-red-500/15 text-red-400"
        />
        <Stat
          label="Events"
          value={stats.events}
          icon={Calendar}
          color="bg-green-500/15 text-green-400"
        />
        <Stat
          label="Announcements"
          value={stats.announcements}
          icon={Megaphone}
          color="bg-purple-500/15 text-purple-400"
        />
        <Stat
          label="Bookings"
          value={stats.bookings}
          icon={Building}
          color="bg-pink-500/15 text-pink-400"
        />
        <Stat
          label="Exams Created"
          value={stats.exams}
          icon={BarChart2}
          color="bg-orange-500/15 text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent users */}
        <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 text-sm font-semibold text-white">
            Recent Registrations
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.map((u) => (
              <div
                key={u._id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-soft flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {u.name}
                  </p>
                  <p className="text-soft text-xs">
                    {u.department || "No dept"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${ROLE_BADGE[u.role]}`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent complaints */}
        <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 text-sm font-semibold text-white">
            Recent Complaints
          </div>
          <div className="divide-y divide-white/5">
            {recentComplaints.map((c) => {
              const sColor = {
                pending: "text-yellow-400",
                "in-progress": "text-accent",
                resolved: "text-green-400",
              };
              return (
                <div
                  key={c._id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.03] transition"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{c.title}</p>
                    <p className="text-soft text-xs">{c.createdBy?.name}</p>
                  </div>
                  <span
                    className={`text-xs font-medium capitalize shrink-0 ${sColor[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dept breakdown */}
        <div className="bg-primary border border-white/10 rounded-2xl overflow-hidden md:col-span-2">
          <div className="px-5 py-3 border-b border-white/8 text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" /> Students by
            Department
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {deptGroups.map((d) => {
              const pct = Math.round((d.count / stats.students) * 100) || 1;
              return (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-soft text-xs w-36 truncate shrink-0">
                    {d._id || "Unknown"}
                  </span>
                  <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-white text-xs font-medium w-8 text-right">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "users", label: "User Management", icon: Users },
];

export default function AdminPanel() {
  const location = useLocation();
  const defaultTab =
    location.pathname && location.pathname.includes("/admin/users")
      ? "users"
      : "overview";
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    if (location.pathname.includes("/admin/users")) setTab("users");
    else if (
      location.pathname === "/admin" ||
      location.pathname.includes("/admin")
    )
      setTab("overview");
  }, [location.pathname]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <Shield size={16} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-soft text-xs mt-0.5">
            System overview and management
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-primary border border-white/10 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-accent text-white" : "text-soft hover:text-white"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? <OverviewTab /> : <UsersTab />}
    </div>
  );
}

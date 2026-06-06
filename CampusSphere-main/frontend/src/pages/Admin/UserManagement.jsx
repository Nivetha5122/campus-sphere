import { useState, useEffect } from "react";
import { Users, Search, Shield, UserCheck, UserX, ChevronDown, RefreshCw } from "lucide-react";
import { getAllUsers, updateUserRole } from "../../services/authService";

const ROLE_BADGE = {
  admin:   "bg-red-500/15 text-red-400 border-red-500/30",
  teacher: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  student: "bg-accent/15 text-accent border-accent/30",
};

function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updating, setUpdating] = useState(null);
  const [error, setError]       = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllUsers({ search, role: roleFilter });
      setUsers(res.data.users);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      setError("Failed to update user role.");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !isActive } : u));
    } catch {
      setError("Failed to update user status.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-accent" /> User Management
          </h1>
          <p className="text-soft text-sm mt-0.5">Manage roles and access for all campus users</p>
        </div>
        <button onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-soft hover:text-white text-sm transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-primary border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48 focus-within:border-accent/40 transition">
          <Search size={14} className="text-soft" />
          <input placeholder="Search by name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-white placeholder-soft/50 w-full" />
        </div>

        <div className="relative">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none bg-primary border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-white outline-none focus:border-accent/40 transition">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-soft pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-soft">
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">ID / Dept</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-soft">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Loading users...
                </div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-soft">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.03] transition">
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-soft text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* ID / Dept */}
                <td className="px-4 py-3 text-soft">
                  <p>{u.studentId || u.employeeId || "—"}</p>
                  <p className="text-xs">{u.department || ""}</p>
                </td>

                {/* Role badge */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded border text-xs font-medium capitalize ${ROLE_BADGE[u.role]}`}>
                    {u.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.isActive ? "text-green-400" : "text-red-400"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Promote / demote role */}
                    <div className="relative">
                      <select
                        value={u.role}
                        disabled={updating === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-2 pr-6 py-1 text-xs text-white outline-none focus:border-accent/40 transition cursor-pointer disabled:opacity-40"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-soft pointer-events-none" />
                    </div>

                    {/* Toggle active */}
                    <button
                      disabled={updating === u.id}
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      title={u.isActive ? "Deactivate" : "Activate"}
                      className={`p-1.5 rounded-lg border transition disabled:opacity-40 ${
                        u.isActive
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && users.length > 0 && (
          <div className="px-4 py-2.5 border-t border-white/10 text-xs text-soft">
            {users.length} user{users.length !== 1 ? "s" : ""} found
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;

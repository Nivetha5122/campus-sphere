import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RoleRoute — renders children only if user has one of the allowed roles.
 * Usage: <RoleRoute roles={["admin"]}><AdminPage /></RoleRoute>
 */
function RoleRoute({ children, roles }) {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!hasRole(...roles)) return <Navigate to="/dashboard" replace />;

  return children;
}

export default RoleRoute;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout      from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute    from "./routes/PublicRoute";
import RoleRoute      from "./routes/RoleRoute";

import Login         from "./pages/Auth/Login";
import Dashboard     from "./pages/Dashboard/Dashboard";
import LostFound     from "./pages/LostFound/LostFound";
import Complaints    from "./pages/Complaints/Complaints";
import Events        from "./pages/Events/Events";
import Announcements from "./pages/Announcements/Announcements";
import Booking       from "./pages/Booking/Booking";
import CampusMap     from "./pages/CampusMap/CampusMap";
import Attendance    from "./pages/Academic/Attendance";
import Marks         from "./pages/Academic/Marks";
import Notes         from "./pages/Academic/Notes";
import AdminPanel    from "./pages/Admin/AdminPanel";

const AppRoute = ({ children }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
);
const AdminRoute = ({ children }) => (
  <RoleRoute roles={["admin"]}><AppLayout>{children}</AppLayout></RoleRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<PublicRoute><Login/></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Login/></PublicRoute>} />
          <Route path="/dashboard"     element={<AppRoute><Dashboard/></AppRoute>} />
          <Route path="/lost-found"    element={<AppRoute><LostFound/></AppRoute>} />
          <Route path="/complaints"    element={<AppRoute><Complaints/></AppRoute>} />
          <Route path="/events"        element={<AppRoute><Events/></AppRoute>} />
          <Route path="/announcements" element={<AppRoute><Announcements/></AppRoute>} />
          <Route path="/booking"       element={<AppRoute><Booking/></AppRoute>} />
          <Route path="/campus-map"    element={<AppRoute><CampusMap/></AppRoute>} />
          <Route path="/bus-tracker"   element={<AppRoute><CampusMap/></AppRoute>} />
          <Route path="/attendance"    element={<AppRoute><Attendance/></AppRoute>} />
          <Route path="/marks"         element={<AppRoute><Marks/></AppRoute>} />
          <Route path="/notes"         element={<AppRoute><Notes/></AppRoute>} />
          <Route path="/admin"         element={<AdminRoute><AdminPanel/></AdminRoute>} />
          <Route path="/admin/users"   element={<AdminRoute><AdminPanel/></AdminRoute>} />
          <Route path="*"              element={<PublicRoute><Login/></PublicRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

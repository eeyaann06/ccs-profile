import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import FacultyLayout from "./layouts/FacultyLayout";
import StudentLayout from "./layouts/StudentLayout";
import Login from "./pages/login";
import SeedPage from "./pages/SeedPage";
import StudentProfiles from "./pages/StudentProfiles";
import FacultyProfiles from "./pages/FacultyProfiles";
import Events from "./pages/Events";
import FacultyEvents from "./pages/FacultyEvents";
import Curriculum from "./pages/Curriculum";
import Scheduling from "./pages/Scheduling";
import Research from "./pages/CollegeResearch";
import FacultyMyProfile from "./pages/FacultyMyProfile";
import AdminSyllabus from "./pages/AdminSyllabus";
import FacultySyllabus from "./pages/FacultySyllabus";
import FacultyClassroomCalendar from "./pages/FacultyClassroomCalendar";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentMyProfile from "./pages/StudentMyProfile";
import StudentClassroom from "./pages/StudentClassroom";
import StudentEvents from "./pages/StudentEvents";
import AdminReports from "./pages/AdminReports";
import FacultyReports from "./pages/FacultyReports";
import StudentReports from "./pages/StudentReports";
import "./App.css";

function IdleRedirect() {
  const { idleLoggedOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (idleLoggedOut) navigate("/login", { replace: true });
  }, [idleLoggedOut, navigate]);
  return null;
}

function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "Admin") return <Navigate to="/login" replace />;
  return children;
}

function FacultyRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "Faculty") return <Navigate to="/login" replace />;
  return children;
}

function StudentRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "Student") return <Navigate to="/login" replace />;
  return children;
}

function NotFound() {
  return (
    <div className="placeholder-page">
      <span className="placeholder-icon">🔍</span>
      <h1>404 — Page Not Found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <a className="app-back-link" href="/login">
        Back to Login
      </a>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <IdleRedirect />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/seed" element={<SeedPage />} />

        {/* ── ADMIN PORTAL ── */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminDashboard />} />
          <Route path="students" element={<StudentProfiles />} />
          <Route path="faculty" element={<FacultyProfiles />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="schedule" element={<Scheduling />} />
          <Route path="syllabus" element={<AdminSyllabus />} />
          <Route path="events" element={<Events />} />
          <Route path="research" element={<Research />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* ── FACULTY PORTAL ── */}
        <Route
          path="/faculty"
          element={
            <FacultyRoute>
              <FacultyLayout />
            </FacultyRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
          <Route path="profile" element={<FacultyMyProfile />} />
          <Route path="classrooms" element={<FacultyClassroomCalendar />} />
          <Route path="syllabus" element={<FacultySyllabus />} />
          <Route path="events" element={<FacultyEvents />} />
          <Route path="reports" element={<FacultyReports />} />
        </Route>

        {/* ── STUDENT PORTAL ── */}
        <Route
          path="/student"
          element={
            <StudentRoute>
              <StudentLayout />
            </StudentRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentMyProfile />} />
          <Route path="classroom" element={<StudentClassroom />} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="reports" element={<StudentReports />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

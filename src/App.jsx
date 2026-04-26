import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/login";
import SeedPage from "./pages/SeedPage";
import StudentProfiles from "./pages/StudentProfiles";
import FacultyProfiles from "./pages/FacultyProfiles";
import Events from "./pages/Events";
import Research from "./pages/CollegeResearch";
import "./App.css";

// ─── Route Guards ──────────────────────────────────────────
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "Admin") return <Navigate to="/login" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

// ─── Placeholder pages ─────────────────────────────────────
function Placeholder({ icon, title, description }) {
  return (
    <div className="placeholder-page">
      <span className="placeholder-icon">{icon}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
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

// ─── App ───────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/seed" element={<SeedPage />} />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="overview"
          element={
            <Placeholder
              icon="🏠"
              title="Dashboard"
              description="Welcome to the CCS Admin Portal."
            />
          }
        />
        <Route path="students" element={<StudentProfiles />} />
        <Route path="faculty" element={<FacultyProfiles />} />
        <Route path="events" element={<Events />} /> {/* 👈 swapped */}
        <Route
          path="scheduling"
          element={
            <Placeholder
              icon="🗓️"
              title="Scheduling"
              description="Manage class schedules."
            />
          }
        />
        <Route path="research" element={<Research />} />
        <Route
          path="syllabus"
          element={
            <Placeholder
              icon="📋"
              title="Syllabus"
              description="Manage course syllabi."
            />
          }
        />
        <Route
          path="curriculum"
          element={
            <Placeholder
              icon="📚"
              title="Curriculum"
              description="Manage program curricula."
            />
          }
        />
        <Route
          path="lessons"
          element={
            <Placeholder
              icon="📝"
              title="Lessons"
              description="Manage lesson materials."
            />
          }
        />
      </Route>

      <Route
        path="/faculty"
        element={
          <AuthRoute>
            <Placeholder
              icon="🎓"
              title="Faculty Dashboard"
              description="Your classes and materials."
            />
          </AuthRoute>
        }
      />
      <Route
        path="/student"
        element={
          <AuthRoute>
            <Placeholder
              icon="📚"
              title="Student Dashboard"
              description="Your subjects and grades."
            />
          </AuthRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
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

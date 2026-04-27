// src/layouts/StudentLayout.jsx
// ─────────────────────────────────────────────────────────────
// Sidebar shell for the Student portal
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/StudentPages.css";

const NAV_ITEMS = [
  { to: "dashboard", icon: "🏠", label: "Dashboard" },
  { to: "profile", icon: "👤", label: "My Profile" },
  { to: "classroom", icon: "📅", label: "Classroom" },
  { to: "events", icon: "🎉", label: "Events" },
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  profile: "My Profile",
  classroom: "Classroom Schedule",
  events: "Events",
};

export default function StudentLayout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  // Derive page title from URL
  const segment = window.location.pathname.split("/").pop();
  const pageTitle = PAGE_TITLES[segment] ?? "Student Portal";

  const initial = (currentUser?.name ?? currentUser?.email ?? "S")
    .charAt(0)
    .toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    await signOut(auth).catch(() => {});
    navigate("/login", { replace: true });
  }

  return (
    <div className="stu-layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="stu-sidebar">
        {/* Logo */}
        <div className="stu-sidebar-logo">
          <div className="stu-sidebar-badge">CCS</div>
          <div>
            <div className="stu-sidebar-brand">Student Portal</div>
            <div className="stu-sidebar-sub">College of Computer Studies</div>
          </div>
        </div>

        {/* Nav */}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `stu-nav-link${isActive ? " stu-nav-link--active" : ""}`
            }
          >
            <span className="stu-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Footer — sign out */}
        <div className="stu-sidebar-footer">
          <button
            className="stu-nav-link"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ color: "#fca5a5" }}
          >
            <span className="stu-nav-icon">🚪</span>
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="stu-main">
        {/* Topbar */}
        <header className="stu-topbar">
          <h1 className="stu-topbar-title">{pageTitle}</h1>
          <div className="stu-topbar-pill">
            <div className="stu-topbar-avatar">{initial}</div>
            <div>
              <div className="stu-topbar-name">
                {currentUser?.name ?? "Student"}
              </div>
              <div className="stu-topbar-role">Student</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="stu-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

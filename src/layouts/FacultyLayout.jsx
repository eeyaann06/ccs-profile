import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../config/firebase";

import "../styles/AdminLayout.css";
import "../styles/Sidebar.css";
import "../styles/Header.css";

const NAV = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", icon: "🏠", path: "/faculty/dashboard" }],
  },
  {
    section: "Personal",
    items: [{ label: "My Profile", icon: "👩‍🏫", path: "/faculty/profile" }],
  },
  {
    section: "Academics",
    items: [
      { label: "Classrooms", icon: "🏫", path: "/faculty/classrooms" },
      { label: "Syllabus", icon: "📋", path: "/faculty/syllabus" },
    ],
  },
  {
    section: "Campus",
    items: [
      { label: "Events", icon: "📅", path: "/faculty/events" },
      { label: "Reports", icon: "📊", path: "/faculty/reports" },
    ],
  },
];

const PAGE_TITLES = {
  "/faculty/dashboard": { title: "Dashboard", icon: "🏠" },
  "/faculty/profile": { title: "My Profile", icon: "👩‍🏫" },
  "/faculty/classrooms": { title: "Classrooms", icon: "🏫" },
  "/faculty/syllabus": { title: "Syllabus", icon: "📋" },
  "/faculty/events": { title: "Events", icon: "📅" },
  "/faculty/reports": { title: "Reports", icon: "📊" },
};

function FacultySidebar({ collapsed, onToggle }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          unsubscribe();
          resolve();
        }
      });
    });
    navigate("/login");
  }

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-badge">CCS</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">CCS Portal</span>
            <span className="sidebar-logo-sub">Faculty Console</span>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {!collapsed && currentUser && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {currentUser.name?.charAt(0) ?? "F"}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser.name}</span>
            <span className="sidebar-user-role">
              {currentUser.role || "Faculty"}
            </span>
          </div>
        </div>
      )}
      {collapsed && currentUser && (
        <div
          className="sidebar-user sidebar-user--mini"
          title={currentUser.name}
        >
          <div className="sidebar-user-avatar">
            {currentUser.name?.charAt(0) ?? "F"}
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ section, items }) => (
          <div key={section} className="sidebar-section">
            {!collapsed && (
              <span className="sidebar-section-label">{section}</span>
            )}
            {items.map(({ label, icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
                }
                title={collapsed ? label : undefined}
              >
                <span className="sidebar-link-icon">{icon}</span>
                {!collapsed && (
                  <span className="sidebar-link-label">{label}</span>
                )}
                {!collapsed && (
                  <span className="sidebar-link-indicator" aria-hidden="true" />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-logout"
          onClick={handleLogout}
          title="Sign out"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function FacultyHeader({ sidebarCollapsed }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  const page = PAGE_TITLES[location.pathname] ?? {
    title: "Faculty Portal",
    icon: "📚",
  };

  const dateStr = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="header" style={{ left: sidebarCollapsed ? 68 : 260 }}>
      <div className="header-left">
        <span className="header-page-icon">{page.icon}</span>
        <div className="header-page-info">
          <h2 className="header-page-title">{page.title}</h2>
          <p className="header-date">{dateStr}</p>
        </div>
      </div>
      <div className="header-right">
        {currentUser && (
          <div className="header-avatar" title={currentUser.name}>
            {currentUser.name?.charAt(0) ?? "F"}
          </div>
        )}
      </div>
    </header>
  );
}

export default function FacultyLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <FacultySidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <div className="admin-main" style={{ marginLeft: collapsed ? 68 : 260 }}>
        <FacultyHeader sidebarCollapsed={collapsed} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

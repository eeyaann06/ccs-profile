import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../config/firebase"; // ✅ add this import
import "../styles/Sidebar.css";

const NAV = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", icon: "🏠", path: "/admin/overview" }],
  },
  {
    section: "Profiles",
    items: [
      { label: "Student Profiles", icon: "🎓", path: "/admin/students" },
      { label: "Faculty Profiles", icon: "👩‍🏫", path: "/admin/faculty" },
    ],
  },
  {
    section: "Academic",
    items: [
      { label: "Curriculum", icon: "📚", path: "/admin/curriculum" },
      { label: "Scheduling", icon: "🗓️", path: "/admin/schedule" },
      { label: "Events", icon: "📅", path: "/admin/events" },
      { label: "College Research", icon: "🔬", path: "/admin/research" },
    ],
  },
  {
    section: "Instructions",
    items: [{ label: "Syllabus", icon: "📋", path: "/admin/syllabus" }],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();

    // ✅ Wait for Firebase auth state to fully clear before navigating
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
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-badge">CCS</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">CCS Portal</span>
            <span className="sidebar-logo-sub">Admin Console</span>
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

      {/* User pill */}
      {!collapsed && currentUser && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {currentUser.name?.charAt(0) ?? "A"}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser.name}</span>
            <span className="sidebar-user-role">{currentUser.role}</span>
          </div>
        </div>
      )}
      {collapsed && currentUser && (
        <div
          className="sidebar-user sidebar-user--mini"
          title={currentUser.name}
        >
          <div className="sidebar-user-avatar">
            {currentUser.name?.charAt(0) ?? "A"}
          </div>
        </div>
      )}

      {/* Nav */}
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

      {/* Logout */}
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

import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Header.css";

// Map paths to readable page titles
const PAGE_TITLES = {
  "/admin/overview": { title: "Dashboard", icon: "🏠" },
  "/admin/students": { title: "Student Profiles", icon: "🎓" },
  "/admin/faculty": { title: "Faculty Profiles", icon: "👩‍🏫" },
  "/admin/events": { title: "Events", icon: "📅" },
  "/admin/scheduling": { title: "Scheduling", icon: "🗓️" },
  "/admin/research": { title: "College Research", icon: "🔬" },
  "/admin/syllabus": { title: "Syllabus", icon: "📋" },
  "/admin/curriculum": { title: "Curriculum", icon: "📚" },
  "/admin/lessons": { title: "Lessons", icon: "📝" },
};

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Header({ sidebarCollapsed }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] ?? {
    title: "Admin Portal",
    icon: "🛡️",
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="header" style={{ left: sidebarCollapsed ? 68 : 260 }}>
      {/* Left — page identity */}
      <div className="header-left">
        <span className="header-page-icon">{page.icon}</span>
        <div className="header-page-info">
          <h2 className="header-page-title">{page.title}</h2>
          <p className="header-date">{dateStr}</p>
        </div>
      </div>

      {/* Right — actions */}
      <div className="header-right">
        {/* Search bar */}
        <div className="header-search">
          <SearchIcon />
          <input
            className="header-search-input"
            type="text"
            placeholder="Search…"
            aria-label="Search"
          />
        </div>

        {/* Bell */}
        <button className="header-icon-btn" aria-label="Notifications">
          <BellIcon />
          <span className="header-badge" aria-hidden="true" />
        </button>

        {/* Avatar */}
        {currentUser && (
          <div className="header-avatar" title={currentUser.name}>
            {currentUser.name?.charAt(0) ?? "A"}
          </div>
        )}
      </div>
    </header>
  );
}

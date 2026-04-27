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

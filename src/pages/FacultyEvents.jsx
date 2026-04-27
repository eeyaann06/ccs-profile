import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import "../styles/Events.css";

// ── Constants ──────────────────────────────────────────────
const TYPE_COLORS = {
  Academic: { bg: "rgba(99,102,241,0.18)", text: "#a5b4fc", dot: "#6366f1" },
  Cultural: { bg: "rgba(236,72,153,0.18)", text: "#f9a8d4", dot: "#ec4899" },
  Sports: { bg: "rgba(34,197,94,0.18)", text: "#86efac", dot: "#22c55e" },
  Seminar: { bg: "rgba(249,115,22,0.18)", text: "#fdba74", dot: "#f97316" },
  Workshop: { bg: "rgba(251,191,36,0.18)", text: "#fde68a", dot: "#fbbf24" },
  Meeting: { bg: "rgba(20,184,166,0.18)", text: "#99f6e4", dot: "#14b8a6" },
  Other: { bg: "rgba(148,163,184,0.18)", text: "#cbd5e1", dot: "#94a3b8" },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, min] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${min} ${hour < 12 ? "AM" : "PM"}`;
}

// ── Icons ──────────────────────────────────────────────────
function ChevronIcon({ dir = "left" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      {dir === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{
        animation: "ev-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CloseIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Upcoming: "ev-badge--upcoming",
    Ongoing: "ev-badge--ongoing",
    Completed: "ev-badge--completed",
    Cancelled: "ev-badge--cancelled",
  };
  return <span className={`ev-badge ${map[status] ?? ""}`}>{status}</span>;
}

// ── Type chip ──────────────────────────────────────────────
function TypeChip({ type }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.Other;
  return (
    <span className="ev-type-chip" style={{ background: c.bg, color: c.text }}>
      <span className="ev-type-dot" style={{ background: c.dot }} />
      {type}
    </span>
  );
}

// ── Event Detail Panel (slide-in, no edit/delete) ──────────
function EventDetailPanel({ event, onClose }) {
  if (!event) return null;
  return (
    <div className="fac-ev-panel">
      <div className="fac-ev-panel-header">
        <div
          className="ev-modal-icon"
          style={{
            background: TYPE_COLORS[event.type]?.bg ?? "rgba(249,115,22,0.15)",
          }}
        >
          📅
        </div>
        <div className="ev-modal-identity" style={{ flex: 1 }}>
          <h2 className="ev-modal-title">{event.title}</h2>
          <div className="ev-modal-chips">
            <TypeChip type={event.type} />
            <StatusBadge status={event.status} />
          </div>
        </div>
        <button className="ev-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="fac-ev-panel-body">
        <div className="ev-view-meta">
          <div className="ev-meta-item">
            <CalendarIcon />
            <span>{formatDate(event.date)}</span>
          </div>
          {(event.timeStart || event.timeEnd) && (
            <div className="ev-meta-item">
              <ClockIcon />
              <span>
                {formatTime(event.timeStart)}
                {event.timeEnd ? ` – ${formatTime(event.timeEnd)}` : ""}
              </span>
            </div>
          )}
          {event.location && (
            <div className="ev-meta-item">
              <MapPinIcon />
              <span>{event.location}</span>
            </div>
          )}
          {event.organizer && (
            <div className="ev-meta-item">
              <UserIcon />
              <span>{event.organizer}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="ev-view-desc">
            <span className="ev-view-label">Description</span>
            <p>{event.description}</p>
          </div>
        )}
      </div>

      <div className="ev-form-actions" style={{ padding: "0 1.25rem 1.25rem" }}>
        <button className="ev-btn ev-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────
function FacultyCalendarView({ events, onEventClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.date) return;
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="ev-calendar">
      <div className="ev-cal-header">
        <button className="ev-cal-nav" onClick={prevMonth}>
          <ChevronIcon dir="left" />
        </button>
        <h3 className="ev-cal-title">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button className="ev-cal-nav" onClick={nextMonth}>
          <ChevronIcon dir="right" />
        </button>
        <button
          className="ev-cal-today"
          onClick={() => {
            setViewMonth(today.getMonth());
            setViewYear(today.getFullYear());
          }}
        >
          Today
        </button>
      </div>

      <div className="ev-cal-days">
        {DAYS.map((d) => (
          <div key={d} className="ev-cal-day-label">
            {d}
          </div>
        ))}
      </div>

      <div className="ev-cal-grid">
        {cells.map((day, idx) => {
          if (!day)
            return (
              <div
                key={`empty-${idx}`}
                className="ev-cal-cell ev-cal-cell--empty"
              />
            );

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventMap[dateStr] ?? [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`ev-cal-cell ${isToday ? "ev-cal-cell--today" : ""} ${
                dayEvents.length ? "ev-cal-cell--has-events" : ""
              }`}
            >
              <span className="ev-cal-date">{day}</span>
              <div className="ev-cal-dots">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <button
                    key={i}
                    className="ev-cal-event-pill"
                    style={{
                      background: TYPE_COLORS[ev.type]?.bg,
                      color: TYPE_COLORS[ev.type]?.text,
                    }}
                    onClick={() => onEventClick(ev)}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="ev-cal-more">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FACULTY EVENTS PAGE  (read-only calendar)
// ═══════════════════════════════════════════════════════════
export default function FacultyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // event shown in detail panel

  // ── Fetch (read-only) ──────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "events"));
      setEvents(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load events: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Stats (upcoming / ongoing / total) ────────────────
  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) => e.status === "Upcoming").length,
      ongoing: events.filter((e) => e.status === "Ongoing").length,
      completed: events.filter((e) => e.status === "Completed").length,
    }),
    [events]
  );

  return (
    <div className="ev-page" style={{ position: "relative" }}>
      {/* Error banner */}
      {error && (
        <div className="ev-error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="ev-stats">
        {[
          { label: "Total Events", value: stats.total, cls: "" },
          {
            label: "Upcoming",
            value: stats.upcoming,
            cls: "ev-stat--upcoming",
          },
          { label: "Ongoing", value: stats.ongoing, cls: "ev-stat--ongoing" },
          {
            label: "Completed",
            value: stats.completed,
            cls: "ev-stat--completed",
          },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`ev-stat ${cls}`}>
            <span className="ev-stat-value">{value}</span>
            <span className="ev-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar — refresh only, no add/edit/delete */}
      <div className="ev-toolbar" style={{ justifyContent: "flex-end" }}>
        <button
          className="ev-btn ev-btn--ghost ev-btn--sm"
          onClick={fetchEvents}
          title="Refresh"
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="ev-loading">
          <SpinnerIcon />
          <span>Loading events…</span>
        </div>
      ) : (
        <div
          style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <FacultyCalendarView events={events} onEventClick={setSelected} />
          </div>

          {/* Side detail panel */}
          {selected && (
            <div style={{ width: 320, flexShrink: 0 }}>
              <EventDetailPanel
                event={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

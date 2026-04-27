// src/pages/StudentEvents.jsx
// ─────────────────────────────────────────────────────────────
// Student Portal — Read-only Events page
//   Mini calendar on the left, filterable event list on the
//   right, event detail card on click.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import "../styles/StudentPages.css";

// ── Constants ─────────────────────────────────────────────────
const TYPE_COLORS = {
  Academic: { bg: "rgba(99,102,241,.18)", text: "#a5b4fc", dot: "#6366f1" },
  Cultural: { bg: "rgba(236,72,153,.18)", text: "#f9a8d4", dot: "#ec4899" },
  Sports: { bg: "rgba(34,197,94,.18)", text: "#86efac", dot: "#22c55e" },
  Seminar: { bg: "rgba(249,115,22,.18)", text: "#fdba74", dot: "#f97316" },
  Workshop: { bg: "rgba(251,191,36,.18)", text: "#fde68a", dot: "#fbbf24" },
  Meeting: { bg: "rgba(20,184,166,.18)", text: "#99f6e4", dot: "#14b8a6" },
  Other: { bg: "rgba(148,163,184,.18)", text: "#cbd5e1", dot: "#94a3b8" },
};
const TYPES = ["All", ...Object.keys(TYPE_COLORS)];
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
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ───────────────────────────────────────────────────
function formatDate(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? "AM" : "PM"}`;
}
function eventDateParts(dateStr) {
  if (!dateStr) return { day: "—", mon: "—" };
  const [, m, d] = dateStr.split("-");
  return { day: parseInt(d), mon: MONTHS_SHORT[parseInt(m) - 1] };
}
function isoToday() {
  return new Date().toISOString().split("T")[0];
}

// ── Icons ─────────────────────────────────────────────────────
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
function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────
function MiniCalendar({ events, selectedDate, onSelectDate }) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const todayStr = isoToday();

  // Dates that have events
  const eventDates = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.date) set.add(e.date);
    });
    return set;
  }, [events]);

  // Build calendar grid
  const calDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();
    const grid = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push({ day: prevDays - i, current: false, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      grid.push({ day: d, current: true, date: `${viewYear}-${mm}-${dd}` });
    }
    while (grid.length % 7 !== 0) {
      const extra = grid.length - (firstDay + daysInMonth) + 1;
      grid.push({ day: extra, current: false, date: null });
    }
    return grid;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  return (
    <div className="stu-cal-panel">
      <div className="stu-cal-header">
        <button className="stu-cal-nav" onClick={prevMonth}>
          <ChevronIcon dir="left" />
        </button>
        <div className="stu-cal-month">
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button className="stu-cal-nav" onClick={nextMonth}>
          <ChevronIcon dir="right" />
        </button>
      </div>
      <div className="stu-cal-grid">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="stu-cal-day-label">
            {d}
          </div>
        ))}
        {calDays.map((cell, i) => {
          const isToday = cell.date === todayStr;
          const isSelected = cell.date === selectedDate;
          const hasEvent = cell.date && eventDates.has(cell.date);
          const isOther = !cell.current;
          let cls = "stu-cal-day";
          if (isOther) cls += " stu-cal-day--other";
          if (isToday) cls += " stu-cal-day--today";
          if (isSelected) cls += " stu-cal-day--selected";
          if (hasEvent && !isOther) cls += " stu-cal-day--has-event";
          return (
            <div
              key={i}
              className={cls}
              onClick={() =>
                cell.date &&
                onSelectDate(cell.date === selectedDate ? null : cell.date)
              }
            >
              {cell.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEv, setSelectedEv] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "events"));
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
        setEvents(data);
      } catch (err) {
        console.error("StudentEvents load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        !search ||
        ev.title?.toLowerCase().includes(search.toLowerCase()) ||
        ev.description?.toLowerCase().includes(search.toLowerCase()) ||
        ev.location?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || ev.type === typeFilter;
      const matchDate = !selectedDate || ev.date === selectedDate;
      return matchSearch && matchType && matchDate;
    });
  }, [events, search, typeFilter, selectedDate]);

  const todayStr = isoToday();
  const upcomingCount = events.filter((e) => (e.date ?? "") >= todayStr).length;

  return (
    <div className="stu-page">
      {/* ── Summary row ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.25rem",
        }}
      >
        {[
          { label: "Total Events", value: events.length, color: "#f97316" },
          { label: "Upcoming", value: upcomingCount, color: "#22c55e" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: `${s.color}10`,
              border: `1px solid ${s.color}28`,
              borderRadius: 8,
              padding: "0.4rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.2rem",
                color: s.color,
                lineHeight: 1,
              }}
            >
              {loading ? "…" : s.value}
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              background: "rgba(249,115,22,.08)",
              border: "1px solid rgba(249,115,22,.3)",
              borderRadius: 8,
              padding: "0.4rem 0.85rem",
              color: "#f97316",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            ✕ {formatDate(selectedDate)}
          </button>
        )}
      </div>

      {/* ── Two-column layout ────────────────────────── */}
      <div className="stu-ev-wrap">
        {/* Left — Mini calendar */}
        <div>
          <MiniCalendar
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Type filter below calendar */}
          <div
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 12,
              padding: "0.85rem",
              marginTop: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Filter by Type
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              {TYPES.map((t) => {
                const c = TYPE_COLORS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background:
                        typeFilter === t
                          ? c
                            ? `${c.dot}18`
                            : "rgba(249,115,22,.12)"
                          : "transparent",
                      border:
                        "1px solid " +
                        (typeFilter === t
                          ? c
                            ? `${c.dot}40`
                            : "rgba(249,115,22,.4)"
                          : "transparent"),
                      borderRadius: 7,
                      padding: "0.38rem 0.65rem",
                      color:
                        typeFilter === t ? (c ? c.text : "#f97316") : "#94a3b8",
                      font: "inherit",
                      fontSize: "0.82rem",
                      fontWeight: typeFilter === t ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all .15s",
                    }}
                  >
                    {c && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: c.dot,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Events list + detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Toolbar */}
          <div className="stu-ev-list-panel">
            <div className="stu-ev-toolbar">
              <div className="stu-ev-search-wrap">
                <SearchIcon />
                <input
                  className="stu-ev-search"
                  placeholder="Search events…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* List */}
            {loading ? (
              <div className="stu-center" style={{ padding: "3rem" }}>
                <div className="stu-spinner" />
                <span style={{ color: "#94a3b8" }}>Loading events…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="stu-empty" style={{ padding: "3rem" }}>
                <span>📭</span>
                No events found{search ? ` for "${search}"` : ""}.
                {(search || typeFilter !== "All" || selectedDate) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("All");
                      setSelectedDate(null);
                    }}
                    style={{
                      background: "rgba(249,115,22,.1)",
                      border: "1px solid rgba(249,115,22,.3)",
                      borderRadius: 8,
                      padding: "0.35rem 0.85rem",
                      color: "#f97316",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      marginTop: "0.5rem",
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="stu-ev-list">
                {filtered.map((ev) => {
                  const c = TYPE_COLORS[ev.type] ?? TYPE_COLORS.Other;
                  const p = eventDateParts(ev.date);
                  const isPast = (ev.date ?? "") < todayStr;
                  return (
                    <div
                      key={ev.id}
                      className={`stu-ev-card${
                        selectedEv?.id === ev.id ? " stu-ev-card--selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedEv(selectedEv?.id === ev.id ? null : ev)
                      }
                      style={{ opacity: isPast ? 0.6 : 1 }}
                    >
                      <div className="stu-ev-date-box">
                        <div className="stu-ev-date-day">{p.day}</div>
                        <div className="stu-ev-date-mon">{p.mon}</div>
                      </div>
                      <div className="stu-ev-info">
                        <div className="stu-ev-title">{ev.title}</div>
                        <div className="stu-ev-meta">
                          <span>📍 {ev.location || "TBA"}</span>
                          {ev.timeStart && (
                            <span>🕐 {formatTime(ev.timeStart)}</span>
                          )}
                          <span
                            style={{
                              background: c.bg,
                              color: c.text,
                              border: `1px solid ${c.dot}30`,
                              borderRadius: 99,
                              padding: "1px 7px",
                              fontSize: "0.68rem",
                              fontWeight: 600,
                            }}
                          >
                            {ev.type ?? "Other"}
                          </span>
                          {isPast && (
                            <span
                              style={{ color: "#64748b", fontSize: "0.68rem" }}
                            >
                              Past
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="stu-ev-type-dot"
                        style={{
                          background: c.dot,
                          boxShadow: `0 0 6px ${c.dot}80`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Event detail */}
          {selectedEv && (
            <div className="stu-ev-detail">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: (
                        TYPE_COLORS[selectedEv.type] ?? TYPE_COLORS.Other
                      ).bg,
                      color: (TYPE_COLORS[selectedEv.type] ?? TYPE_COLORS.Other)
                        .text,
                      border: `1px solid ${
                        (TYPE_COLORS[selectedEv.type] ?? TYPE_COLORS.Other).dot
                      }35`,
                      borderRadius: 99,
                      padding: "0.25rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: (
                          TYPE_COLORS[selectedEv.type] ?? TYPE_COLORS.Other
                        ).dot,
                      }}
                    />
                    {selectedEv.type ?? "Other"}
                  </div>
                  <div className="stu-ev-detail-title">{selectedEv.title}</div>
                </div>
                <button
                  onClick={() => setSelectedEv(null)}
                  style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 7,
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="stu-ev-detail-row">
                <span className="stu-ev-detail-label">📅 Date</span>
                <span className="stu-ev-detail-value">
                  {formatDate(selectedEv.date)}
                </span>
              </div>
              {(selectedEv.timeStart || selectedEv.timeEnd) && (
                <div className="stu-ev-detail-row">
                  <span className="stu-ev-detail-label">🕐 Time</span>
                  <span className="stu-ev-detail-value">
                    {formatTime(selectedEv.timeStart)}
                    {selectedEv.timeEnd
                      ? ` – ${formatTime(selectedEv.timeEnd)}`
                      : ""}
                  </span>
                </div>
              )}
              {selectedEv.location && (
                <div className="stu-ev-detail-row">
                  <span className="stu-ev-detail-label">📍 Location</span>
                  <span className="stu-ev-detail-value">
                    {selectedEv.location}
                  </span>
                </div>
              )}
              {selectedEv.status && (
                <div className="stu-ev-detail-row">
                  <span className="stu-ev-detail-label">Status</span>
                  <span className="stu-ev-detail-value">
                    <span
                      style={{
                        background:
                          selectedEv.status === "Ongoing"
                            ? "rgba(34,197,94,.15)"
                            : "rgba(99,102,241,.15)",
                        color:
                          selectedEv.status === "Ongoing"
                            ? "#86efac"
                            : "#a5b4fc",
                        border: `1px solid ${
                          selectedEv.status === "Ongoing"
                            ? "rgba(34,197,94,.3)"
                            : "rgba(99,102,241,.3)"
                        }`,
                        borderRadius: 99,
                        padding: "2px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {selectedEv.status}
                    </span>
                  </span>
                </div>
              )}
              {selectedEv.description && (
                <div className="stu-ev-detail-desc">
                  {selectedEv.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

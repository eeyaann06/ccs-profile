// src/pages/StudentDashboard.jsx
// ─────────────────────────────────────────────────────────────
// Student Portal — Personal Dashboard
//   • GWA summary, enrolled subjects count, upcoming events,
//     today's classes
//   • All data is scoped to the logged-in student's section
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/StudentPages.css";

// ── Helpers ───────────────────────────────────────────────────
const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function today() {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
}

function formatDate(s) {
  if (!s) return "—";
  const [y, mo, d] = s.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(mo) - 1]} ${parseInt(d)}, ${y}`;
}

function gwaColor(gwa) {
  if (!gwa) return "#94a3b8";
  const n = parseFloat(gwa);
  if (n <= 1.75) return "#6ee7b7";
  if (n <= 2.5) return "#fcd34d";
  return "#fca5a5";
}

const SUBJECT_COLORS = [
  "#f97316",
  "#6366f1",
  "#22c55e",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#8b5cf6",
  "#06b6d4",
];
function subjectColor(code = "") {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return SUBJECT_COLORS[n % SUBJECT_COLORS.length];
}

// ── Main ──────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [studentDoc, setStudentDoc] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive studentId from user_id (e.g. "USR-2023-0001" → "2023-0001")
  const studentId = currentUser?.user_id?.replace(/^USR-/, "") ?? "";

  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      try {
        // 1. Student profile from `students` collection
        const stuSnap = await getDocs(
          query(collection(db, "students"), where("studentId", "==", studentId))
        );
        const stu = stuSnap.empty ? null : stuSnap.docs[0].data();
        setStudentDoc(stu);

        // 2. Schedules for this student's section
        if (stu?.section) {
          const schedSnap = await getDocs(
            query(
              collection(db, "schedules"),
              where("sectionName", "==", stu.section)
            )
          );
          setSchedules(schedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }

        // 3. Upcoming events
        const evSnap = await getDocs(collection(db, "events"));
        const today = new Date().toISOString().split("T")[0];
        const upcoming = evSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => (e.date ?? "") >= today)
          .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
          .slice(0, 8);
        setEvents(upcoming);
      } catch (err) {
        console.error("StudentDashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  const todayDay = today();
  const todaySchedules = useMemo(
    () =>
      schedules
        .filter((s) => (s.days ?? []).includes(todayDay))
        .sort((a, b) => (a.timeStart ?? "").localeCompare(b.timeStart ?? "")),
    [schedules, todayDay]
  );

  // GWA from academic history
  const latestGwa = useMemo(() => {
    const hist = studentDoc?.academicHistory ?? [];
    if (!hist.length) return null;
    return hist[hist.length - 1]?.gwa ?? null;
  }, [studentDoc]);

  const name = studentDoc?.name ?? currentUser?.name ?? "Student";
  const initial = name.charAt(0).toUpperCase();

  const stats = [
    {
      label: "Enrolled Subjects",
      value: schedules.length,
      color: "#f97316",
      icon: "📚",
    },
    {
      label: "Today's Classes",
      value: todaySchedules.length,
      color: "#6366f1",
      icon: "🎒",
    },
    {
      label: "Upcoming Events",
      value: events.length,
      color: "#22c55e",
      icon: "📅",
    },
    {
      label: "GWA",
      value: latestGwa ?? "—",
      color: latestGwa ? gwaColor(latestGwa) : "#94a3b8",
      icon: "🏅",
    },
  ];

  return (
    <div className="stu-page">
      {/* ── Greeting ────────────────────────────────────── */}
      <div className="stu-dash-header">
        <h1 className="stu-dash-greeting">👋 Hello, {name.split(" ")[0]}!</h1>
        <p className="stu-dash-sub">
          {studentDoc
            ? `${studentDoc.course} · Year ${studentDoc.year} · Section ${studentDoc.section}`
            : "Welcome back to your student portal."}
          &nbsp;—{" "}
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="stu-stat-grid">
        {stats.map((s, i) => (
          <div
            className="stu-stat-card"
            key={s.label}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="stu-stat-bar" style={{ background: s.color }} />
            <div className="stu-stat-value" style={{ color: s.color }}>
              {loading ? "…" : s.value}
            </div>
            <div className="stu-stat-label">{s.label}</div>
            <div className="stu-stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ── Today's schedule + Upcoming events ──────────── */}
      <div className="stu-panel-row">
        {/* Today's classes */}
        <div className="stu-panel">
          <div className="stu-panel-header">
            <h3 className="stu-panel-title">
              🎒 Today's Classes
              <span
                style={{
                  fontSize: "0.73rem",
                  color: "#94a3b8",
                  fontWeight: 400,
                }}
              >
                — {todayDay}
              </span>
            </h3>
            <span className="stu-panel-count">
              {todaySchedules.length} classes
            </span>
          </div>
          <div className="stu-panel-body">
            {loading ? (
              <div className="stu-center">
                <div className="stu-spinner" />
                <span>Loading…</span>
              </div>
            ) : todaySchedules.length === 0 ? (
              <div className="stu-empty">
                <span>🌤️</span>
                No classes scheduled for today. Enjoy your break!
              </div>
            ) : (
              todaySchedules.map((s) => {
                const c = subjectColor(s.subjectCode);
                return (
                  <div
                    key={s.id}
                    className="stu-subject-card"
                    style={{
                      background: `linear-gradient(135deg, ${c}18, ${c}06)`,
                      border: `1px solid ${c}28`,
                    }}
                  >
                    <div className="stu-subject-code" style={{ color: c }}>
                      {s.subjectCode}
                    </div>
                    <div className="stu-subject-name">{s.subjectName}</div>
                    <div className="stu-subject-meta">
                      <span>
                        🕐 {formatTime(s.timeStart)} – {formatTime(s.timeEnd)}
                      </span>
                      <span>📍 {s.room || "TBA"}</span>
                      <span>👤 {s.facultyName || "TBA"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="stu-panel">
          <div className="stu-panel-header">
            <h3 className="stu-panel-title">📅 Upcoming Events</h3>
            <span className="stu-panel-count">{events.length}</span>
          </div>
          <div className="stu-panel-body">
            {loading ? (
              <div className="stu-center">
                <div className="stu-spinner" />
              </div>
            ) : events.length === 0 ? (
              <div className="stu-empty">
                <span>📭</span>No upcoming events.
              </div>
            ) : (
              events.map((ev) => {
                const TYPE_COLORS = {
                  Academic: "#6366f1",
                  Cultural: "#ec4899",
                  Sports: "#22c55e",
                  Seminar: "#f97316",
                  Workshop: "#fbbf24",
                  Meeting: "#14b8a6",
                  Other: "#94a3b8",
                };
                const dotColor = TYPE_COLORS[ev.type] ?? "#94a3b8";
                return (
                  <div key={ev.id} className="stu-row-item">
                    <div
                      className="stu-row-dot"
                      style={{
                        background: dotColor,
                        boxShadow: `0 0 6px ${dotColor}80`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="stu-row-name">{ev.title}</div>
                      <div className="stu-row-sub">
                        {formatDate(ev.date)}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </div>
                    </div>
                    <span
                      className="stu-badge"
                      style={{
                        background: `${dotColor}20`,
                        color: dotColor,
                        border: `1px solid ${dotColor}35`,
                      }}
                    >
                      {ev.type ?? "Other"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Full weekly schedule preview ─────────────────── */}
      <div className="stu-panel">
        <div className="stu-panel-header">
          <h3 className="stu-panel-title">🗓️ Weekly Schedule</h3>
          <span className="stu-panel-count">{schedules.length} subjects</span>
        </div>
        <div style={{ padding: "0.5rem 0.9rem 0.75rem" }}>
          {loading ? (
            <div className="stu-center">
              <div className="stu-spinner" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="stu-empty">
              <span>📋</span>No schedules found for your section.
            </div>
          ) : (
            DAYS_ORDER.map((day) => {
              const dayScheds = schedules
                .filter((s) => (s.days ?? []).includes(day))
                .sort((a, b) =>
                  (a.timeStart ?? "").localeCompare(b.timeStart ?? "")
                );
              if (!dayScheds.length) return null;
              return (
                <div key={day} style={{ marginBottom: "0.85rem" }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: day === todayDay ? "#f97316" : "#6366f1",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.35rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {day === todayDay && (
                      <span
                        style={{
                          background: "#f97316",
                          color: "#fff",
                          fontSize: "0.6rem",
                          borderRadius: "99px",
                          padding: "1px 6px",
                          fontWeight: 800,
                        }}
                      >
                        TODAY
                      </span>
                    )}
                    {day}
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {dayScheds.map((s, i) => {
                      const c = subjectColor(s.subjectCode);
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            background: `${c}10`,
                            border: `1px solid ${c}28`,
                            borderRadius: 8,
                            padding: "0.4rem 0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: 3,
                              height: 24,
                              borderRadius: 99,
                              background: c,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                color: c,
                              }}
                            >
                              {s.subjectCode}
                            </div>
                            <div
                              style={{ fontSize: "0.7rem", color: "#94a3b8" }}
                            >
                              {formatTime(s.timeStart)}–{formatTime(s.timeEnd)}{" "}
                              · {s.room || "TBA"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

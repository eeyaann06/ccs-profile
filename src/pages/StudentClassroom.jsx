// src/pages/StudentClassroom.jsx
// ─────────────────────────────────────────────────────────────
// Student Portal — Weekly Class Schedule + Lesson Viewer
//   • Calendar/List view of the student's section schedule
//   • Clicking a class opens a read-only classroom showing
//     only APPROVED lessons posted by the faculty for that
//     section + subject
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/StudentPages.css";

// ── Constants ─────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_START = 7;
const HOUR_END = 21;

const LESSON_TYPES = ["Lecture", "Lab", "Workshop", "Discussion", "Assessment"];

const PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

// ── Helpers ───────────────────────────────────────────────────
function toMins(t = "00:00") {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fmt12(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
}

// ── SVG Icons ─────────────────────────────────────────────────
const Ico = ({ d, size = 16, sw = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);
const IcoChevL = () => (
  <Ico size={16} d={<polyline points="15 18 9 12 15 6" />} />
);
const IcoRefresh = () => (
  <Ico
    size={14}
    d={
      <>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </>
    }
  />
);
const IcoDL = () => (
  <Ico
    size={14}
    d={
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    }
  />
);
const IcoUsers = () => (
  <Ico
    size={14}
    d={
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    }
  />
);
const IcoBook = () => (
  <Ico
    size={20}
    d={
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    }
  />
);

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{
        animation: "fcc-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Color helpers ─────────────────────────────────────────────
function buildColorMap(schedules) {
  const map = {};
  [...new Set(schedules.map((s) => s.subjectCode))].forEach((code, i) => {
    map[code] = PALETTE[i % PALETTE.length];
  });
  return map;
}

// ── Student Lesson Viewer (read-only classroom) ───────────────
function StudentLessonView({ schedule, colorMap, onBack }) {
  const accentColor = colorMap[schedule.subjectCode] ?? PALETTE[0];

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      // Query approved lessons for this section + subject
      const q = query(
        collection(db, "lessons"),
        where("section_name", "==", schedule.sectionName),
        where("subject_code", "==", schedule.subjectCode),
        where("status", "==", "Approved")
      );
      const snap = await getDocs(q);
      setLessons(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0)
          )
      );
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [schedule.sectionName, schedule.subjectCode]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const filtered = useMemo(
    () =>
      filterType
        ? lessons.filter((l) => l.lesson_type === filterType)
        : lessons,
    [lessons, filterType]
  );

  return (
    <div className="fcc-classroom">
      {/* Header */}
      <div className="fcc-cr-header" style={{ "--accent": accentColor }}>
        <button className="fcc-back-btn" onClick={onBack}>
          <IcoChevL /> Back to Schedule
        </button>
        <div className="fcc-cr-hero">
          <div className="fcc-cr-icon-wrap" style={{ background: accentColor }}>
            <IcoBook />
          </div>
          <div className="fcc-cr-info">
            <h1 className="fcc-cr-subject">{schedule.subjectName}</h1>
            <div className="fcc-cr-meta">
              <span
                className="fcc-cr-badge"
                style={{ background: accentColor + "22", color: accentColor }}
              >
                {schedule.subjectCode}
              </span>
              <span className="fcc-cr-sep">·</span>
              <IcoUsers />
              <span>{schedule.sectionName}</span>
              <span className="fcc-cr-sep">·</span>
              <span>🏫 {schedule.room || "TBA"}</span>
              <span className="fcc-cr-sep">·</span>
              <span>
                ⏰ {fmt12(schedule.timeStart)} – {fmt12(schedule.timeEnd)}
              </span>
              <span className="fcc-cr-sep">·</span>
              <span>👨‍🏫 {schedule.facultyName || "—"}</span>
              <span className="fcc-cr-sep">·</span>
              <span>📅 {(schedule.days ?? []).join(", ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="fcc-cr-toolbar">
        <div className="fcc-cr-toolbar-left">
          <span className="fcc-cr-count">
            {filtered.length} lesson{filtered.length !== 1 ? "s" : ""}
          </span>
          <select
            className="fcc-sel"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {LESSON_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="fcc-cr-toolbar-right">
          <button
            className="fcc-btn fcc-btn--ghost fcc-btn--sm"
            onClick={fetchLessons}
          >
            <IcoRefresh />
          </button>
        </div>
      </div>

      {/* Lessons */}
      <div className="fcc-cr-lessons">
        {loading ? (
          <div className="fcc-loading">
            <Spinner />
            <span>Loading lessons…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="fcc-empty">
            <span>📚</span>
            <p>
              {lessons.length === 0
                ? "No lessons available yet."
                : "No matches for selected type."}
            </p>
            {lessons.length === 0 && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                  marginTop: "0.25rem",
                }}
              >
                Your faculty hasn't posted any approved lessons for this subject
                yet.
              </p>
            )}
          </div>
        ) : (
          <div className="fcc-lessons-grid">
            {filtered.map((l) => (
              <div key={l.id} className="fcc-lesson-card">
                <div className="fcc-lc-top">
                  <div
                    className="fcc-lc-strip"
                    style={{ background: accentColor }}
                  />
                  <div className="fcc-lc-badges">
                    <span className="fcc-badge fcc-badge--type">
                      {l.lesson_type}
                    </span>
                    {/* No status badge for students — only Approved shown */}
                  </div>
                </div>
                <h3 className="fcc-lc-title">{l.title}</h3>
                {l.description && (
                  <p className="fcc-lc-desc">{l.description}</p>
                )}
                {l.objectives && (
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                      marginTop: "0.4rem",
                      padding: "0.5rem 0.75rem",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#64748b",
                        display: "block",
                        marginBottom: "0.2rem",
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      Objectives
                    </span>
                    {l.objectives}
                  </div>
                )}
                <div className="fcc-lc-actions">
                  {l.file_url && (
                    <a
                      className="fcc-icon-btn fcc-icon-btn--dl"
                      href={l.file_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Download Lesson File"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.78rem",
                      }}
                    >
                      <IcoDL />
                      <span>{l.file_name || "Download"}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Week Calendar ─────────────────────────────────────────────
function WeekCalendar({ schedules, colorMap, onSelect }) {
  const TOTAL = (HOUR_END - HOUR_START) * 60;
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i
  );

  return (
    <div className="fcc-cal">
      {/* Time gutter */}
      <div className="fcc-cal-gutter">
        <div className="fcc-cal-corner" />
        {hours.map((h) => (
          <div key={h} className="fcc-cal-hour">
            {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {DAYS.map((day) => {
        const dayScheds = schedules.filter((s) => (s.days ?? []).includes(day));
        return (
          <div key={day} className="fcc-cal-day">
            <div className="fcc-cal-day-hd">{day}</div>
            <div className="fcc-cal-day-body">
              {hours.map((h) => (
                <div key={h} className="fcc-cal-cell" />
              ))}
              {dayScheds.map((s, i) => {
                const start = toMins(s.timeStart) - HOUR_START * 60;
                const end = toMins(s.timeEnd) - HOUR_START * 60;
                const top = (start / TOTAL) * 100;
                const height = Math.max(((end - start) / TOTAL) * 100, 3);
                const color = colorMap[s.subjectCode] ?? PALETTE[0];
                return (
                  <button
                    key={i}
                    className="fcc-cal-block"
                    title={`${s.subjectName} — click to view lessons`}
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      background: color,
                    }}
                    onClick={() => onSelect(s)}
                  >
                    <span className="fcc-cal-code">{s.subjectCode}</span>
                    <span className="fcc-cal-sec">{s.sectionName}</span>
                    <span className="fcc-cal-room">{s.room}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Schedule List ─────────────────────────────────────────────
function ScheduleList({ schedules, colorMap, onSelect }) {
  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map((d) => [d, []]));
    schedules.forEach((s) =>
      (s.days ?? []).forEach((d) => {
        if (map[d]) map[d].push(s);
      })
    );
    return map;
  }, [schedules]);

  return (
    <div className="fcc-list">
      {DAYS.map((day) =>
        byDay[day].length === 0 ? null : (
          <div key={day} className="fcc-list-day">
            <div className="fcc-list-day-hd">
              <span className="fcc-list-day-dot" />
              {day}
              <span className="fcc-list-day-ct">{byDay[day].length}</span>
            </div>
            {byDay[day]
              .sort((a, b) =>
                (a.timeStart ?? "").localeCompare(b.timeStart ?? "")
              )
              .map((s, i) => {
                const color = colorMap[s.subjectCode] ?? PALETTE[0];
                return (
                  <button
                    key={i}
                    className="fcc-list-entry"
                    onClick={() => onSelect(s)}
                  >
                    <div
                      className="fcc-le-strip"
                      style={{ background: color }}
                    />
                    <div className="fcc-le-time">
                      <span>{fmt12(s.timeStart)}</span>
                      <span className="fcc-le-sep">–</span>
                      <span>{fmt12(s.timeEnd)}</span>
                    </div>
                    <div className="fcc-le-main">
                      <span className="fcc-le-code" style={{ color }}>
                        {s.subjectCode}
                      </span>
                      <span className="fcc-le-name">{s.subjectName}</span>
                    </div>
                    <div className="fcc-le-meta">
                      <span>👨‍🏫 {s.facultyName || "—"}</span>
                      <span>🏫 {s.room || "TBA"}</span>
                    </div>
                    <div className="fcc-le-arrow">›</div>
                  </button>
                );
              })}
          </div>
        )
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function StudentClassroom() {
  const { currentUser } = useAuth();
  const studentId = currentUser?.user_id?.replace(/^USR-/, "") ?? "";

  const [section, setSection] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("calendar"); // "calendar" | "list"
  const [classroom, setClassroom] = useState(null); // selected schedule

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      // 1. Get student's section
      const stuSnap = await getDocs(
        query(collection(db, "students"), where("studentId", "==", studentId))
      );
      if (stuSnap.empty) {
        setError("Student record not found.");
        return;
      }
      const stu = stuSnap.docs[0].data();
      const sec = stu.section ?? "";
      setSection(sec);

      if (!sec) {
        setError("No section assigned yet. Contact your administrator.");
        return;
      }

      // 2. Get schedules for that section
      const schedSnap = await getDocs(
        query(collection(db, "schedules"), where("sectionName", "==", sec))
      );
      setSchedules(schedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load schedule: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const colorMap = useMemo(() => buildColorMap(schedules), [schedules]);

  // Summary
  const totalSubjects = new Set(schedules.map((s) => s.subjectCode)).size;

  // ── Classroom / lesson view ───────────────────────────────
  if (classroom) {
    return (
      <StudentLessonView
        schedule={classroom}
        colorMap={colorMap}
        onBack={() => setClassroom(null)}
      />
    );
  }

  // ── Schedule view ─────────────────────────────────────────
  return (
    <div className="fcc-page">
      {/* Page header */}
      <div className="fcc-page-hd">
        <div>
          <h1 className="fcc-page-title">My Schedule</h1>
          <p className="fcc-page-sub">
            {loading ? (
              "Loading…"
            ) : section ? (
              <>
                Class schedule for{" "}
                <strong style={{ color: "#f97316" }}>Section {section}</strong>{" "}
                — click any class to view lessons.
              </>
            ) : (
              "No section assigned."
            )}
          </p>
        </div>

        <div className="fcc-page-hd-right">
          {/* Summary badges */}
          {!loading && schedules.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "Subjects", value: totalSubjects, color: "#f97316" },
                {
                  label: "Sessions",
                  value: schedules.length,
                  color: "#6366f1",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: `${s.color}10`,
                    border: `1px solid ${s.color}28`,
                    borderRadius: 8,
                    padding: "0.3rem 0.75rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="fcc-btn fcc-btn--ghost fcc-btn--sm"
            onClick={fetchData}
          >
            <IcoRefresh />
          </button>

          {/* View toggle */}
          <div className="fcc-view-toggle">
            <button
              className={`fcc-vt-btn ${
                view === "calendar" ? "fcc-vt-btn--on" : ""
              }`}
              onClick={() => setView("calendar")}
              title="Calendar"
            >
              <svg
                width="15"
                height="15"
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
            </button>
            <button
              className={`fcc-vt-btn ${
                view === "list" ? "fcc-vt-btn--on" : ""
              }`}
              onClick={() => setView("list")}
              title="List"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="fcc-alert">⚠ {error}</div>}

      {/* Subject legend */}
      {!loading && schedules.length > 0 && (
        <div className="fcc-legend">
          {[...new Set(schedules.map((s) => s.subjectCode))].map((code) => {
            const s = schedules.find((x) => x.subjectCode === code);
            return (
              <div key={code} className="fcc-legend-item">
                <div
                  className="fcc-legend-dot"
                  style={{ background: colorMap[code] }}
                />
                <span className="fcc-legend-code">{code}</span>
                <span className="fcc-legend-name">{s?.subjectName}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Click hint */}
      {!loading && schedules.length > 0 && (
        <div className="fcc-hint-bar">
          💡 Click any class block to view the lessons posted by your faculty.
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="fcc-loading">
          <Spinner />
          <span>Loading schedule…</span>
        </div>
      ) : schedules.length === 0 && !error ? (
        <div className="fcc-empty">
          <span>📅</span>
          <p>No schedule found for your section yet.</p>
          <p className="fcc-empty-sub">
            Your administrator will assign your classes and time slots.
          </p>
        </div>
      ) : view === "calendar" ? (
        <div className="fcc-cal-wrap">
          <WeekCalendar
            schedules={schedules}
            colorMap={colorMap}
            onSelect={setClassroom}
          />
        </div>
      ) : (
        <ScheduleList
          schedules={schedules}
          colorMap={colorMap}
          onSelect={setClassroom}
        />
      )}
    </div>
  );
}

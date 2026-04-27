// src/pages/StudentClassroom.jsx
// ─────────────────────────────────────────────────────────────
// Student Portal — Weekly Class Schedule
//   Reads the student's section from the `students` collection,
//   then queries `schedules` where sectionName == that section.
//   Displays a timetable grouped by day.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/StudentPages.css";

// ── Constants ─────────────────────────────────────────────────
const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TYPE_COLORS = {
  Lecture: {
    bg: "rgba(99,102,241,.15)",
    text: "#a5b4fc",
    border: "rgba(99,102,241,.3)",
  },
  Lab: {
    bg: "rgba(34,197,94,.12)",
    text: "#86efac",
    border: "rgba(34,197,94,.3)",
  },
  PE: {
    bg: "rgba(236,72,153,.12)",
    text: "#f9a8d4",
    border: "rgba(236,72,153,.3)",
  },
  Online: {
    bg: "rgba(251,191,36,.12)",
    text: "#fde68a",
    border: "rgba(251,191,36,.3)",
  },
  Hybrid: {
    bg: "rgba(20,184,166,.12)",
    text: "#99f6e4",
    border: "rgba(20,184,166,.3)",
  },
};

function typeStyle(type) {
  return (
    TYPE_COLORS[type] ?? {
      bg: "rgba(148,163,184,.12)",
      text: "#cbd5e1",
      border: "rgba(148,163,184,.3)",
    }
  );
}

const SUBJECT_PALETTE = [
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
  return SUBJECT_PALETTE[n % SUBJECT_PALETTE.length];
}

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? "AM" : "PM"}`;
}

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

// ── Main ──────────────────────────────────────────────────────
export default function StudentClassroom() {
  const { currentUser } = useAuth();
  const studentId = currentUser?.user_id?.replace(/^USR-/, "") ?? "";

  const [section, setSection] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDay, setFilterDay] = useState("All");

  const todayDay = today();

  useEffect(() => {
    if (!studentId) return;
    async function load() {
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
        const data = schedSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.timeStart ?? "").localeCompare(b.timeStart ?? ""));
        setSchedules(data);
      } catch (err) {
        setError("Failed to load schedule: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  // Filter by selected day
  const activeDays = useMemo(
    () =>
      DAYS_ORDER.filter((d) =>
        schedules.some((s) => (s.days ?? []).includes(d))
      ),
    [schedules]
  );

  const visibleDays = filterDay === "All" ? activeDays : [filterDay];

  // Summary counts
  const totalSubjects = new Set(schedules.map((s) => s.subjectCode)).size;

  return (
    <div className="stu-page">
      {/* ── Section info ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "0.25rem",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
            {loading ? (
              "Loading…"
            ) : section ? (
              <>
                Your class schedule for{" "}
                <strong style={{ color: "#f97316" }}>Section {section}</strong>
              </>
            ) : (
              "No section assigned."
            )}
          </p>
        </div>
        {!loading && schedules.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {[
              { label: "Subjects", value: totalSubjects, color: "#f97316" },
              { label: "Sessions", value: schedules.length, color: "#6366f1" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}28`,
                  borderRadius: 8,
                  padding: "0.35rem 0.85rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
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
      </div>

      {/* ── Error ────────────────────────────────────── */}
      {error && <div className="stu-alert stu-alert--error">⚠ {error}</div>}

      {/* ── Day filter ───────────────────────────────── */}
      {!loading && schedules.length > 0 && (
        <div className="stu-cls-toolbar">
          <div className="stu-cls-filter-group">
            {["All", ...activeDays].map((d) => (
              <button
                key={d}
                className={`stu-cls-filter-btn${
                  filterDay === d ? " stu-cls-filter-btn--active" : ""
                }`}
                onClick={() => setFilterDay(d)}
              >
                {d === todayDay ? `${d} ★` : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────── */}
      {loading && (
        <div className="stu-center">
          <div className="stu-spinner" />
          <span style={{ color: "#94a3b8" }}>Loading schedule…</span>
        </div>
      )}

      {/* ── Empty ────────────────────────────────────── */}
      {!loading && !error && schedules.length === 0 && (
        <div className="stu-timetable">
          <div className="stu-cls-empty">
            <span>📋</span>
            No schedule entries found for your section yet.
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Your administrator hasn't assigned schedules for Section {section}{" "}
              yet.
            </span>
          </div>
        </div>
      )}

      {/* ── Timetable ────────────────────────────────── */}
      {!loading && schedules.length > 0 && (
        <div className="stu-timetable">
          {/* Column headers */}
          <div className="stu-sched-row-header">
            <div>Time</div>
            <div>Subject</div>
            <div>Faculty</div>
            <div>Room</div>
            <div>Type</div>
          </div>

          {visibleDays.map((day) => {
            const dayScheds = schedules.filter((s) =>
              (s.days ?? []).includes(day)
            );
            return (
              <div key={day} className="stu-day-section">
                {/* Day header */}
                <div className="stu-day-header">
                  <div
                    className="stu-day-dot"
                    style={
                      day === todayDay
                        ? {}
                        : {
                            background: "#6366f1",
                            boxShadow: "0 0 6px rgba(99,102,241,.6)",
                          }
                    }
                  />
                  {day}
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
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.7rem",
                      color: "#64748b",
                      fontWeight: 400,
                    }}
                  >
                    {dayScheds.length} class{dayScheds.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Schedule rows */}
                <div className="stu-day-entries">
                  {dayScheds.length === 0 ? (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      No classes this day.
                    </div>
                  ) : (
                    dayScheds.map((s) => {
                      const ts = typeStyle(s.type);
                      const sc = subjectColor(s.subjectCode);
                      return (
                        <div key={s.id} className="stu-sched-row">
                          {/* Time */}
                          <div className="stu-sched-time">
                            <div>{formatTime(s.timeStart)}</div>
                            <div
                              style={{ color: "#64748b", fontSize: "0.7rem" }}
                            >
                              –{formatTime(s.timeEnd)}
                            </div>
                          </div>

                          {/* Subject */}
                          <div className="stu-sched-subject">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                              }}
                            >
                              <div
                                style={{
                                  width: 3,
                                  height: 28,
                                  borderRadius: 99,
                                  background: sc,
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <div
                                  className="stu-sched-code"
                                  style={{ color: sc }}
                                >
                                  {s.subjectCode}
                                </div>
                                <div className="stu-sched-sname">
                                  {s.subjectName}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Faculty */}
                          <div className="stu-sched-faculty">
                            {s.facultyName || "—"}
                          </div>

                          {/* Room */}
                          <div className="stu-sched-room">
                            <span style={{ marginRight: "0.25rem" }}>📍</span>
                            {s.room || "TBA"}
                          </div>

                          {/* Type badge */}
                          <div>
                            <span
                              className="stu-sched-type-tag"
                              style={{
                                background: ts.bg,
                                color: ts.text,
                                border: `1px solid ${ts.border}`,
                              }}
                            >
                              {s.type || "Lecture"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Subject legend ────────────────────────────── */}
      {!loading && schedules.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#64748b",
              marginBottom: "0.6rem",
            }}
          >
            Subject Legend
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {[
              ...new Map(schedules.map((s) => [s.subjectCode, s])).values(),
            ].map((s) => {
              const c = subjectColor(s.subjectCode);
              return (
                <div
                  key={s.subjectCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: `${c}10`,
                    border: `1px solid ${c}28`,
                    borderRadius: 99,
                    padding: "0.25rem 0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: "0.78rem", fontWeight: 600, color: c }}
                  >
                    {s.subjectCode}
                  </span>
                  <span style={{ fontSize: "0.73rem", color: "#94a3b8" }}>
                    {s.subjectName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

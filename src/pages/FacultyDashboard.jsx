// src/pages/FacultyDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

// ── Theme tokens (orange dark) ────────────────────────────
const T = {
  orange: "#f97316",
  orangeDark: "#ea6c0a",
  orangeDeep: "#c2560a",
  amber: "#fbbf24",
  green: "#22c55e",
  red: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  pink: "#ec4899",
  blue: "#06b6d4",
};

const PALETTE = [
  T.orange,
  T.green,
  T.amber,
  T.pink,
  T.teal,
  T.purple,
  T.red,
  T.blue,
];

const AVATAR_COLORS = [
  T.orange,
  T.purple,
  T.teal,
  T.pink,
  T.green,
  T.amber,
  T.red,
];

function pickColor(str = "", arr = PALETTE) {
  let n = 0;
  for (const c of str) n += c.charCodeAt(0);
  return arr[n % arr.length];
}

// ── Inline styles ─────────────────────────────────────────
const S = {
  page: {
    padding: "2rem",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    color: "var(--clr-text, #e8e8f0)",
    maxWidth: 1280,
    margin: "0 auto",
  },
  header: {
    marginBottom: "2rem",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  greeting: {
    fontSize: "1.65rem",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    margin: 0,
    color: "var(--clr-text, #f1f5f9)",
  },
  sub: {
    fontSize: ".875rem",
    color: "var(--clr-text-muted, #94a3b8)",
    marginTop: ".25rem",
  },
  profilePill: {
    display: "flex",
    alignItems: "center",
    gap: ".75rem",
    background: "var(--clr-surface, rgba(255,255,255,.06))",
    border: "1px solid rgba(249,115,22,0.25)",
    borderRadius: 99,
    padding: ".5rem 1rem .5rem .6rem",
  },
  pillAvatar: (color) => ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: ".9rem",
    color: "#fff",
    border: "2px solid rgba(249,115,22,0.35)",
  }),
  pillName: {
    fontWeight: 600,
    fontSize: ".875rem",
    color: "var(--clr-text, #e2e8f0)",
  },
  pillRole: { fontSize: ".73rem", color: "var(--clr-text-muted, #64748b)" },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  statCard: {
    background: "var(--clr-surface, rgba(255,255,255,.05))",
    border: "1px solid rgba(249,115,22,0.12)",
    borderRadius: 14,
    padding: "1.2rem 1.4rem",
    position: "relative",
    overflow: "hidden",
  },
  statAccent: (color) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: color,
    borderRadius: "14px 14px 0 0",
  }),
  statValue: (color) => ({
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    color,
    marginBottom: ".3rem",
  }),
  statLabel: {
    fontSize: ".76rem",
    color: "var(--clr-text-muted, #94a3b8)",
    textTransform: "uppercase",
    letterSpacing: ".06em",
    fontWeight: 600,
  },
  statIcon: {
    position: "absolute",
    right: "1.1rem",
    bottom: ".9rem",
    fontSize: "1.6rem",
    opacity: 0.12,
    userSelect: "none",
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.25rem",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.25rem",
  },
  panel: {
    background: "var(--clr-surface, rgba(255,255,255,.05))",
    border: "1px solid rgba(249,115,22,0.1)",
    borderRadius: 14,
    overflow: "hidden",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid rgba(249,115,22,0.08)",
  },
  panelTitle: {
    fontSize: ".95rem",
    fontWeight: 700,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: ".5rem",
  },
  panelCount: {
    fontSize: ".75rem",
    color: "var(--clr-text-muted, #64748b)",
    background: "rgba(249,115,22,0.1)",
    border: "1px solid rgba(249,115,22,0.2)",
    color: T.orange,
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: ".72rem",
    fontWeight: 600,
  },
  panelBody: { padding: "1rem 1.25rem" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: ".75rem",
    padding: ".55rem 0",
    borderBottom: "1px solid rgba(249,115,22,0.06)",
  },
  avatar: (color) => ({
    width: 34,
    height: 34,
    borderRadius: 10,
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".8rem",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    border: `1px solid ${color}50`,
  }),
  rowName: {
    fontSize: ".875rem",
    fontWeight: 600,
    color: "var(--clr-text, #e2e8f0)",
    flex: 1,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowSub: {
    fontSize: ".75rem",
    color: "var(--clr-text-muted, #64748b)",
    marginTop: ".1rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  badge: (color, bg) => ({
    fontSize: ".7rem",
    fontWeight: 600,
    padding: "3px 9px",
    borderRadius: 99,
    background: bg,
    color: color,
    border: `1px solid ${color}40`,
    whiteSpace: "nowrap",
  }),
  subjectCard: (color) => ({
    background: `linear-gradient(135deg,${color}12,${color}06)`,
    border: `1px solid ${color}30`,
    borderRadius: 12,
    padding: "1rem",
    marginBottom: ".75rem",
    position: "relative",
    overflow: "hidden",
  }),
  subjectCode: (color) => ({
    fontSize: ".75rem",
    fontWeight: 800,
    color,
    textTransform: "uppercase",
    letterSpacing: ".06em",
    marginBottom: ".25rem",
  }),
  subjectName: {
    fontSize: ".9rem",
    fontWeight: 600,
    color: "var(--clr-text, #e2e8f0)",
    marginBottom: ".35rem",
  },
  subjectMeta: {
    display: "flex",
    alignItems: "center",
    gap: ".5rem",
    flexWrap: "wrap",
    fontSize: ".75rem",
    color: "var(--clr-text-muted, #64748b)",
  },
  subjectDot: (color) => ({
    position: "absolute",
    top: "1rem",
    right: "1rem",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 8px ${color}80`,
  }),
  schedTag: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: ".3rem",
    fontSize: ".73rem",
    fontWeight: 600,
    background: `${color}20`,
    color,
    padding: "2px 8px",
    borderRadius: 99,
  }),
  dot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  barWrap: { marginBottom: ".85rem" },
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: ".8rem",
    marginBottom: ".35rem",
    color: "var(--clr-text-muted, #94a3b8)",
  },
  barBg: {
    height: 7,
    borderRadius: 99,
    background: "rgba(249,115,22,0.08)",
    overflow: "hidden",
  },
  barFill: (pct, color) => ({
    height: "100%",
    width: `${pct}%`,
    background: color,
    borderRadius: 99,
    transition: "width .7s cubic-bezier(.4,0,.2,1)",
  }),
  emptyMsg: {
    textAlign: "center",
    color: "var(--clr-text-muted, #64748b)",
    padding: "2rem",
    fontSize: ".875rem",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(249,115,22,0.15)",
    borderTopColor: T.orange,
    borderRadius: "50%",
    animation: "fac-spin 0.8s linear infinite",
    margin: "2.5rem auto",
    display: "block",
  },
  loadWrap: { textAlign: "center", padding: "2.5rem" },
};

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
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
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, min] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${min}${hour < 12 ? "am" : "pm"}`;
}

function BarRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={S.barWrap}>
      <div style={S.barLabel}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: "var(--clr-text, #e2e8f0)" }}>
          {value}
          <span style={{ fontWeight: 400, opacity: 0.5 }}> ({pct}%)</span>
        </span>
      </div>
      <div style={S.barBg}>
        <div style={S.barFill(pct, color)} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, loading }) {
  return (
    <div style={S.statCard}>
      <div style={S.statAccent(color)} />
      <div style={S.statValue(color)}>{loading ? "—" : value}</div>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statIcon}>{icon}</div>
    </div>
  );
}

export default function FacultyDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mySchedules, setMySchedules] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [mySyllabi, setMySyllabi] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!currentUser?.user_id) return;
    async function load() {
      setLoading(true);
      try {
        const [schedSnap, stuSnap, secSnap, sylSnap, evSnap] =
          await Promise.all([
            getDocs(
              query(
                collection(db, "schedules"),
                where("facultyId", "==", currentUser.user_id)
              )
            ),
            getDocs(collection(db, "students")),
            getDocs(collection(db, "sections")),
            getDocs(
              query(
                collection(db, "syllabi"),
                where("faculty_id", "==", currentUser.user_id)
              )
            ),
            getDocs(collection(db, "events")),
          ]);
        setMySchedules(schedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllStudents(stuSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllSections(secSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMySyllabi(sylSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Faculty dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  const mySectionIds = useMemo(
    () => [...new Set(mySchedules.map((s) => s.sectionId))],
    [mySchedules]
  );
  const mySectionNames = useMemo(
    () => [...new Set(mySchedules.map((s) => s.sectionName).filter(Boolean))],
    [mySchedules]
  );
  const mySections = useMemo(
    () => allSections.filter((s) => mySectionIds.includes(s.id)),
    [allSections, mySectionIds]
  );
  const myStudents = useMemo(
    () => allStudents.filter((s) => mySectionNames.includes(s.section)),
    [allStudents, mySectionNames]
  );
  const mySubjects = useMemo(() => {
    const seen = new Set();
    return mySchedules.filter((s) => {
      if (seen.has(s.subjectCode)) return false;
      seen.add(s.subjectCode);
      return true;
    });
  }, [mySchedules]);

  const syllabiStats = useMemo(
    () => ({
      Pending: mySyllabi.filter((s) => s.status === "Pending").length,
      Approved: mySyllabi.filter((s) => s.status === "Approved").length,
      Rejected: mySyllabi.filter((s) => s.status === "Rejected").length,
    }),
    [mySyllabi]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === "Upcoming" || e.status === "Ongoing")
        .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
        .slice(0, 5),
    [events]
  );

  const studentsByCourse = useMemo(() => {
    const map = {};
    myStudents.forEach((s) => {
      map[s.course] = (map[s.course] ?? 0) + 1;
    });
    return map;
  }, [myStudents]);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const facName = currentUser?.name?.split(" ")?.[0] ?? "Faculty";

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fac-spin { to { transform: rotate(360deg); } }
        .fac-row:last-child { border-bottom: none !important; }
        .fac-subject-card:hover { opacity: .88; transform: translateY(-1px); transition: all .2s; }
        .fac-stat-card:hover { border-color: rgba(249,115,22,0.3) !important; transition: border-color .2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.greeting}>
            {greeting}, {facName} 👋
          </h1>
          <p style={S.sub}>Here's your teaching overview for this semester.</p>
        </div>
        <div style={S.profilePill}>
          <div
            style={S.pillAvatar(pickColor(currentUser?.name, AVATAR_COLORS))}
          >
            {currentUser?.name?.charAt(0)?.toUpperCase() ?? "F"}
          </div>
          <div>
            <div style={S.pillName}>{currentUser?.name}</div>
            <div style={S.pillRole}>Faculty · {currentUser?.user_id}</div>
          </div>
        </div>
      </div>

      {/* ── Stat Strip ── */}
      <div style={S.statGrid}>
        <StatCard
          label="My Subjects"
          value={mySubjects.length}
          icon="📚"
          color={T.orange}
          loading={loading}
        />
        <StatCard
          label="My Sections"
          value={mySections.length}
          icon="🏫"
          color={T.green}
          loading={loading}
        />
        <StatCard
          label="My Students"
          value={myStudents.length}
          icon="🎓"
          color={T.amber}
          loading={loading}
        />
        <StatCard
          label="Syllabi Uploaded"
          value={mySyllabi.length}
          icon="📋"
          color={T.pink}
          loading={loading}
        />
        <StatCard
          label="Pending Review"
          value={syllabiStats.Pending}
          icon="⏳"
          color={T.red}
          loading={loading}
        />
      </div>

      {/* ── Row 1: Subjects + Right column ── */}
      <div style={S.grid3}>
        {/* My Subjects */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <h3 style={S.panelTitle}>📚 My Subjects</h3>
            <span style={S.panelCount}>
              {mySubjects.length} subject{mySubjects.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={S.panelBody}>
            {loading ? (
              <div style={S.loadWrap}>
                <div style={S.spinner} />
              </div>
            ) : mySubjects.length === 0 ? (
              <p style={S.emptyMsg}>No subjects assigned yet.</p>
            ) : (
              mySubjects.map((sched) => {
                const color = pickColor(sched.subjectCode);
                const entries = mySchedules.filter(
                  (s) => s.subjectCode === sched.subjectCode
                );
                const sections = [
                  ...new Set(entries.map((e) => e.sectionName).filter(Boolean)),
                ];
                const rooms = [
                  ...new Set(entries.map((e) => e.room).filter(Boolean)),
                ];
                return (
                  <div
                    key={sched.id}
                    style={S.subjectCard(color)}
                    className="fac-subject-card"
                  >
                    <div style={S.subjectDot(color)} />
                    <div style={S.subjectCode(color)}>{sched.subjectCode}</div>
                    <div style={S.subjectName}>{sched.subjectName}</div>
                    <div style={S.subjectMeta}>
                      <span style={S.schedTag(color)}>{sched.units} units</span>
                      <span style={S.schedTag("#94a3b8")}>{sched.type}</span>
                      {sections.map((sec) => (
                        <span key={sec} style={S.schedTag(T.orange)}>
                          {sec}
                        </span>
                      ))}
                      {rooms.length > 0 && <span>📍 {rooms.join(", ")}</span>}
                    </div>
                    <div
                      style={{
                        marginTop: ".5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: ".35rem",
                      }}
                    >
                      {entries.map((e, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: ".73rem",
                            color: "var(--clr-text-muted, #64748b)",
                          }}
                        >
                          {(e.days ?? []).join("/")} {formatTime(e.timeStart)}–
                          {formatTime(e.timeEnd)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* My Sections */}
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <h3 style={S.panelTitle}>🏫 My Sections</h3>
              <span style={S.panelCount}>{mySectionNames.length}</span>
            </div>
            <div style={{ ...S.panelBody, padding: ".5rem .75rem" }}>
              {loading ? (
                <div style={S.loadWrap}>
                  <div style={S.spinner} />
                </div>
              ) : mySectionNames.length === 0 ? (
                <p style={S.emptyMsg}>No sections assigned.</p>
              ) : (
                mySectionNames.map((secName) => {
                  const sec = allSections.find(
                    (s) => s.sectionName === secName
                  );
                  const stuCount = myStudents.filter(
                    (s) => s.section === secName
                  ).length;
                  const color = pickColor(secName);
                  return (
                    <div key={secName} style={S.row} className="fac-row">
                      <div
                        style={{
                          ...S.avatar(color),
                          borderRadius: 8,
                          fontSize: ".7rem",
                          fontWeight: 800,
                        }}
                      >
                        {secName.slice(0, 4)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.rowName}>{secName}</div>
                        <div style={S.rowSub}>
                          {sec ? `${sec.course} · Year ${sec.yearLevel}` : "—"}
                        </div>
                      </div>
                      <span style={S.badge("#86efac", "rgba(34,197,94,.15)")}>
                        {stuCount} students
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Syllabus Status */}
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <h3 style={S.panelTitle}>📋 Syllabus Status</h3>
              <span style={S.panelCount}>{mySyllabi.length}</span>
            </div>
            <div style={S.panelBody}>
              {loading ? (
                <div style={S.loadWrap}>
                  <div style={S.spinner} />
                </div>
              ) : mySyllabi.length === 0 ? (
                <p style={S.emptyMsg}>No syllabi uploaded yet.</p>
              ) : (
                [
                  {
                    label: "Approved",
                    count: syllabiStats.Approved,
                    color: T.green,
                  },
                  {
                    label: "Pending",
                    count: syllabiStats.Pending,
                    color: T.amber,
                  },
                  {
                    label: "Rejected",
                    count: syllabiStats.Rejected,
                    color: T.red,
                  },
                ].map((item) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    total={mySyllabi.length || 1}
                    color={item.color}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Students + Events + Schedule ── */}
      <div style={S.grid2}>
        {/* My Students */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <h3 style={S.panelTitle}>🎓 My Students</h3>
            <span style={S.panelCount}>{myStudents.length} total</span>
          </div>
          {!loading && myStudents.length > 0 && (
            <div
              style={{
                padding: "1rem 1.25rem .25rem",
                borderBottom: "1px solid rgba(249,115,22,0.08)",
              }}
            >
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {Object.entries(studentsByCourse).map(([course, count]) => (
                  <span
                    key={course}
                    style={S.badge(T.orange, "rgba(249,115,22,0.12)")}
                  >
                    {course}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              ...S.panelBody,
              padding: ".5rem .75rem",
              maxHeight: 340,
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div style={S.loadWrap}>
                <div style={S.spinner} />
              </div>
            ) : myStudents.length === 0 ? (
              <p style={S.emptyMsg}>No students found in your sections.</p>
            ) : (
              myStudents.map((stu) => (
                <div key={stu.id} style={S.row} className="fac-row">
                  <div style={S.avatar(pickColor(stu.name, AVATAR_COLORS))}>
                    {stu.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.rowName}>{stu.name}</div>
                    <div style={S.rowSub}>
                      {stu.studentId} · {stu.section}
                    </div>
                  </div>
                  <span
                    style={S.badge(
                      stu.status === "Active" ? "#86efac" : "#fde68a",
                      stu.status === "Active"
                        ? "rgba(34,197,94,.15)"
                        : "rgba(245,158,11,.15)"
                    )}
                  >
                    {stu.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Events + Schedule */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Upcoming Events */}
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <h3 style={S.panelTitle}>📅 Upcoming Events</h3>
              <span style={S.panelCount}>{upcomingEvents.length}</span>
            </div>
            <div style={{ ...S.panelBody, padding: ".5rem .75rem" }}>
              {loading ? (
                <div style={S.loadWrap}>
                  <div style={S.spinner} />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p style={S.emptyMsg}>No upcoming events.</p>
              ) : (
                upcomingEvents.map((ev) => (
                  <div key={ev.id} style={S.row} className="fac-row">
                    <div
                      style={S.dot(
                        ev.status === "Ongoing" ? T.green : T.orange
                      )}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.rowName}>{ev.title}</div>
                      <div style={S.rowSub}>
                        {formatDate(ev.date)} · {ev.location || "TBA"}
                      </div>
                    </div>
                    <span
                      style={S.badge(
                        ev.status === "Ongoing" ? "#86efac" : T.orange,
                        ev.status === "Ongoing"
                          ? "rgba(34,197,94,.15)"
                          : "rgba(249,115,22,.15)"
                      )}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <h3 style={S.panelTitle}>🗓️ Weekly Schedule</h3>
            </div>
            <div style={{ ...S.panelBody, padding: ".5rem .75rem" }}>
              {loading ? (
                <div style={S.loadWrap}>
                  <div style={S.spinner} />
                </div>
              ) : mySchedules.length === 0 ? (
                <p style={S.emptyMsg}>No schedule entries yet.</p>
              ) : (
                DAYS_ORDER.map((day) => {
                  const dayScheds = mySchedules
                    .filter((s) => (s.days ?? []).includes(day))
                    .sort((a, b) =>
                      (a.timeStart ?? "").localeCompare(b.timeStart ?? "")
                    );
                  if (dayScheds.length === 0) return null;
                  return (
                    <div key={day} style={{ marginBottom: ".75rem" }}>
                      <div
                        style={{
                          fontSize: ".72rem",
                          fontWeight: 700,
                          color: T.orange,
                          textTransform: "uppercase",
                          letterSpacing: ".08em",
                          marginBottom: ".35rem",
                        }}
                      >
                        {day}
                      </div>
                      {dayScheds.map((s, i) => {
                        const color = pickColor(s.subjectCode);
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: ".5rem",
                              marginBottom: ".3rem",
                            }}
                          >
                            <div
                              style={{
                                width: 3,
                                height: 30,
                                borderRadius: 99,
                                background: color,
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: ".8rem",
                                  fontWeight: 600,
                                  color: "var(--clr-text, #e2e8f0)",
                                }}
                              >
                                {s.subjectCode}
                                <span
                                  style={{
                                    fontWeight: 400,
                                    color: "var(--clr-text-muted, #64748b)",
                                    marginLeft: ".35rem",
                                  }}
                                >
                                  {s.sectionName}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: ".73rem",
                                  color: "var(--clr-text-muted, #64748b)",
                                }}
                              >
                                {formatTime(s.timeStart)}–
                                {formatTime(s.timeEnd)} · {s.room}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

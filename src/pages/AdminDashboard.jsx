// src/pages/AdminDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

// ── Theme tokens ──────────────────────────────────────────
const T = {
  orange: "#f97316",
  orangeDark: "#ea6c0a",
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

// ── Styles ────────────────────────────────────────────────
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
  pillName: { fontWeight: 600, fontSize: ".875rem" },
  pillRole: { fontSize: ".73rem", color: "var(--clr-text-muted, #64748b)" },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))",
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

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.25rem",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
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
    fontSize: ".72rem",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 99,
    background: "rgba(249,115,22,0.1)",
    border: "1px solid rgba(249,115,22,0.2)",
    color: T.orange,
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
  avatarRound: (color) => ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".85rem",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    border: `2px solid ${color}50`,
  }),
  rowName: {
    fontSize: ".875rem",
    fontWeight: 600,
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
    color,
    border: `1px solid ${color}40`,
    whiteSpace: "nowrap",
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
    animation: "adm-spin 0.8s linear infinite",
    margin: "2.5rem auto",
    display: "block",
  },
  loadWrap: { textAlign: "center", padding: "2.5rem" },

  courseChip: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    fontSize: ".72rem",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 99,
    background: `${color}18`,
    color,
    border: `1px solid ${color}35`,
  }),
};

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

// ── Section Activity Ring ─────────────────────────────────
function MiniRing({ pct, color, size = 48 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [sections, setSections] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stuSnap, facSnap, secSnap, schSnap, sylSnap, evSnap] =
          await Promise.all([
            getDocs(collection(db, "students")),
            getDocs(collection(db, "faculty")),
            getDocs(collection(db, "sections")),
            getDocs(collection(db, "schedules")),
            getDocs(collection(db, "syllabi")),
            getDocs(collection(db, "events")),
          ]);
        setStudents(stuSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFaculty(facSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSections(secSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSchedules(schSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSyllabi(sylSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Admin dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived ───────────────────────────────────────────
  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "Active").length,
    [students]
  );
  const irregStudents = useMemo(
    () => students.filter((s) => s.status === "Irregular").length,
    [students]
  );

  const syllabiStats = useMemo(
    () => ({
      Approved: syllabi.filter((s) => s.status === "Approved").length,
      Pending: syllabi.filter((s) => s.status === "Pending").length,
      Rejected: syllabi.filter((s) => s.status === "Rejected").length,
    }),
    [syllabi]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === "Upcoming" || e.status === "Ongoing")
        .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
        .slice(0, 5),
    [events]
  );

  const recentStudents = useMemo(() => students.slice(0, 8), [students]);

  const studentsByCourse = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      map[s.course] = (map[s.course] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const facultyWithLoad = useMemo(
    () =>
      faculty
        .map((f) => ({
          ...f,
          subjectCount: [
            ...new Set(
              schedules
                .filter((s) => s.facultyId === f.user_id)
                .map((s) => s.subjectCode)
            ),
          ].length,
        }))
        .slice(0, 6),
    [faculty, schedules]
  );

  const sectionsFilled = useMemo(
    () =>
      sections
        .map((sec) => {
          const count = students.filter(
            (s) => s.section === sec.sectionName
          ).length;
          const cap = sec.capacity ?? 40;
          return {
            ...sec,
            count,
            cap,
            pct: Math.min(Math.round((count / cap) * 100), 100),
          };
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5),
    [sections, students]
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const adminName = currentUser?.name?.split(" ")?.[0] ?? "Admin";

  return (
    <div style={S.page}>
      <style>{`
        @keyframes adm-spin { to { transform: rotate(360deg); } }
        .adm-row:last-child { border-bottom: none !important; }
        .adm-panel:hover { border-color: rgba(249,115,22,0.22) !important; transition: border-color .2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.greeting}>
            {greeting}, {adminName} 👋
          </h1>
          <p style={S.sub}>
            Here's the complete portal overview for this semester.
          </p>
        </div>
        <div style={S.profilePill}>
          <div style={S.pillAvatar(T.orange)}>
            {currentUser?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div>
            <div style={S.pillName}>{currentUser?.name}</div>
            <div style={S.pillRole}>Administrator · {currentUser?.user_id}</div>
          </div>
        </div>
      </div>

      {/* ── Stat Strip ── */}
      <div style={S.statGrid}>
        <StatCard
          label="Total Students"
          value={students.length}
          icon="🎓"
          color={T.orange}
          loading={loading}
        />
        <StatCard
          label="Active Students"
          value={activeStudents}
          icon="✅"
          color={T.green}
          loading={loading}
        />
        <StatCard
          label="Irregular"
          value={irregStudents}
          icon="⚠️"
          color={T.amber}
          loading={loading}
        />
        <StatCard
          label="Faculty"
          value={faculty.length}
          icon="👩‍🏫"
          color={T.purple}
          loading={loading}
        />
        <StatCard
          label="Sections"
          value={sections.length}
          icon="🏫"
          color={T.teal}
          loading={loading}
        />
        <StatCard
          label="Syllabi"
          value={syllabi.length}
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
        <StatCard
          label="Events"
          value={events.length}
          icon="📅"
          color={T.blue}
          loading={loading}
        />
      </div>

      {/* ── Row 1: Students + Faculty ── */}
      <div style={S.grid2}>
        {/* Recent Students */}
        <div style={{ ...S.panel }} className="adm-panel">
          <div style={S.panelHeader}>
            <h3 style={S.panelTitle}>🎓 Recent Students</h3>
            <span style={S.panelCount}>{students.length} total</span>
          </div>

          {/* Course breakdown chips */}
          {!loading && studentsByCourse.length > 0 && (
            <div
              style={{
                padding: ".75rem 1.25rem",
                borderBottom: "1px solid rgba(249,115,22,0.08)",
                display: "flex",
                gap: ".5rem",
                flexWrap: "wrap",
              }}
            >
              {studentsByCourse.map(([course, count]) => (
                <span key={course} style={S.courseChip(pickColor(course))}>
                  {course}: {count}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              ...S.panelBody,
              padding: ".5rem .75rem",
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div style={S.loadWrap}>
                <div style={S.spinner} />
              </div>
            ) : recentStudents.length === 0 ? (
              <p style={S.emptyMsg}>No students found.</p>
            ) : (
              recentStudents.map((stu) => (
                <div key={stu.id} style={S.row} className="adm-row">
                  <div
                    style={S.avatarRound(pickColor(stu.name, AVATAR_COLORS))}
                  >
                    {stu.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.rowName}>{stu.name}</div>
                    <div style={S.rowSub}>
                      {stu.studentId} · {stu.section} · {stu.course}
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

        {/* Faculty + Load */}
        <div style={{ ...S.panel }} className="adm-panel">
          <div style={S.panelHeader}>
            <h3 style={S.panelTitle}>👩‍🏫 Faculty & Load</h3>
            <span style={S.panelCount}>{faculty.length} members</span>
          </div>
          <div
            style={{
              ...S.panelBody,
              padding: ".5rem .75rem",
              maxHeight: 380,
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div style={S.loadWrap}>
                <div style={S.spinner} />
              </div>
            ) : facultyWithLoad.length === 0 ? (
              <p style={S.emptyMsg}>No faculty records.</p>
            ) : (
              facultyWithLoad.map((fac) => (
                <div key={fac.id} style={S.row} className="adm-row">
                  <div
                    style={S.avatarRound(pickColor(fac.name, AVATAR_COLORS))}
                  >
                    {fac.name?.charAt(0)?.toUpperCase() ?? "F"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.rowName}>{fac.name}</div>
                    <div style={S.rowSub}>
                      {fac.user_id} · {fac.department ?? "CCS"}
                    </div>
                  </div>
                  <span style={S.badge(T.orange, "rgba(249,115,22,0.12)")}>
                    {fac.subjectCount} subj
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Syllabus + Sections + Events ── */}
      <div style={S.grid3}>
        {/* Section Enrollment */}
        <div style={{ ...S.panel }} className="adm-panel">
          <div style={S.panelHeader}>
            <h3 style={S.panelTitle}>🏫 Section Enrollment</h3>
            <span style={S.panelCount}>{sections.length} sections</span>
          </div>
          <div style={S.panelBody}>
            {loading ? (
              <div style={S.loadWrap}>
                <div style={S.spinner} />
              </div>
            ) : sectionsFilled.length === 0 ? (
              <p style={S.emptyMsg}>No sections found.</p>
            ) : (
              sectionsFilled.map((sec) => {
                const color = pickColor(sec.sectionName);
                return (
                  <div
                    key={sec.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <MiniRing pct={sec.pct} color={color} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: ".875rem",
                          fontWeight: 600,
                          marginBottom: ".2rem",
                        }}
                      >
                        {sec.sectionName}
                      </div>
                      <div
                        style={{
                          fontSize: ".75rem",
                          color: "var(--clr-text-muted,#94a3b8)",
                          marginBottom: ".35rem",
                        }}
                      >
                        {sec.course} · Year {sec.yearLevel} · {sec.count}/
                        {sec.cap} students
                      </div>
                      <div style={S.barBg}>
                        <div style={S.barFill(sec.pct, color)} />
                      </div>
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
          {/* Syllabus status */}
          <div style={{ ...S.panel }} className="adm-panel">
            <div style={S.panelHeader}>
              <h3 style={S.panelTitle}>📋 Syllabus Status</h3>
              <span style={S.panelCount}>{syllabi.length}</span>
            </div>
            <div style={S.panelBody}>
              {loading ? (
                <div style={S.loadWrap}>
                  <div style={S.spinner} />
                </div>
              ) : syllabi.length === 0 ? (
                <p style={S.emptyMsg}>No syllabi found.</p>
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
                    total={syllabi.length || 1}
                    color={item.color}
                  />
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div style={{ ...S.panel }} className="adm-panel">
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
                  <div key={ev.id} style={S.row} className="adm-row">
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
        </div>
      </div>
    </div>
  );
}

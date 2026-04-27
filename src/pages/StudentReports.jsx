// src/pages/StudentReports.jsx
// ─────────────────────────────────────────────────────────────
// Student Portal — Report Generation (Own Data Only)
// Covers: My Profile, My Class Schedule, My Events
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
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
import "../styles/report.css";

// ── Theme ─────────────────────────────────────────────────────
const T = {
  orange: "#f97316",
  orangeLight: "rgba(249,115,22,0.12)",
  surface: "var(--clr-surface, rgba(255,255,255,.06))",
  text: "var(--clr-text, #e8e8f0)",
  muted: "var(--clr-text-muted, #94a3b8)",
  border: "var(--clr-border, rgba(255,255,255,0.08))",
  card: "var(--clr-card, rgba(255,255,255,0.04))",
};

const REPORT_TYPES = [
  {
    id: "profile",
    label: "My Profile",
    icon: "👤",
    color: "#06b6d4",
    desc: "Personal & academic info",
  },
  {
    id: "schedule",
    label: "My Schedule",
    icon: "🗓️",
    color: "#22c55e",
    desc: "My class timetable",
  },
  {
    id: "events",
    label: "My Events",
    icon: "📅",
    color: "#f97316",
    desc: "Events for my section",
  },
];

const COLUMNS = {
  profile: [
    { key: "field", label: "Field" },
    { key: "value", label: "Value" },
  ],
  schedule: [
    { key: "subject", label: "Subject" },
    { key: "facultyName", label: "Faculty" },
    { key: "day", label: "Day" },
    { key: "timeStart", label: "Start" },
    { key: "timeEnd", label: "End" },
    { key: "room", label: "Room" },
  ],
  events: [
    { key: "title", label: "Title" },
    { key: "date", label: "Date" },
    { key: "location", label: "Location" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
  ],
};

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    padding: "2rem",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    color: T.text,
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: { marginBottom: "2rem" },
  pageTitle: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    margin: 0,
  },
  pageSub: { color: T.muted, fontSize: ".875rem", marginTop: ".3rem" },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: ".75rem",
    marginBottom: "2rem",
  },
  typeCard: (active, color) => ({
    background: active ? `${color}18` : T.card,
    border: `1.5px solid ${active ? color : T.border}`,
    borderRadius: 12,
    padding: "1rem 1.1rem",
    cursor: "pointer",
    transition: "all .15s",
    textAlign: "left",
  }),
  typeIcon: { fontSize: "1.4rem", marginBottom: ".4rem" },
  typeLabel: (active, color) => ({
    fontWeight: 600,
    fontSize: ".875rem",
    color: active ? color : T.text,
  }),
  typeDesc: { fontSize: ".73rem", color: T.muted, marginTop: ".1rem" },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: ".75rem",
    marginBottom: "1.25rem",
    flexWrap: "wrap",
  },
  printBtn: {
    display: "flex",
    alignItems: "center",
    gap: ".4rem",
    padding: ".55rem 1.1rem",
    borderRadius: 8,
    background: T.orange,
    color: "#fff",
    border: "none",
    fontWeight: 600,
    fontSize: ".875rem",
    cursor: "pointer",
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: ".4rem",
    padding: ".55rem 1.1rem",
    borderRadius: 8,
    background: T.surface,
    color: T.text,
    border: `1px solid ${T.border}`,
    fontWeight: 500,
    fontSize: ".875rem",
    cursor: "pointer",
  },
  countBadge: {
    padding: ".25rem .7rem",
    borderRadius: 99,
    background: T.orangeLight,
    color: T.orange,
    fontSize: ".8rem",
    fontWeight: 600,
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 12,
    border: `1px solid ${T.border}`,
    background: T.card,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: ".83rem" },
  th: {
    padding: ".7rem 1rem",
    textAlign: "left",
    fontWeight: 600,
    color: T.muted,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: "nowrap",
    background: "rgba(0,0,0,.15)",
    fontSize: ".78rem",
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  td: {
    padding: ".65rem 1rem",
    borderBottom: `1px solid rgba(255,255,255,.04)`,
    color: T.text,
    verticalAlign: "middle",
  },
  fieldLabel: {
    color: T.muted,
    fontWeight: 500,
    fontSize: ".82rem",
  },
  empty: {
    textAlign: "center",
    padding: "4rem 2rem",
    color: T.muted,
    fontSize: ".9rem",
  },
  loader: { textAlign: "center", padding: "3rem", color: T.muted },

  // Profile summary card (shown above profile table)
  profileCard: {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: "1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  avatar: (color) => ({
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1.3rem",
    color: "#fff",
    flexShrink: 0,
  }),
};

// ── Helpers ───────────────────────────────────────────────────
const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function fmt12(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
}

function cellValue(row, key) {
  const v = row[key];
  if (v === null || v === undefined || v === "") return "—";
  if (key === "timeStart" || key === "timeEnd") return fmt12(String(v));
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function exportCSV(columns, rows, filename) {
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((r) => columns.map((c) => `"${cellValue(r, c.key)}"`).join(","))
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pickColor(str = "") {
  const colors = [
    "#f97316",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#ec4899",
    "#fbbf24",
  ];
  let n = 0;
  for (const c of str) n += c.charCodeAt(0);
  return colors[n % colors.length];
}

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.orange}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "srpt-spin .8s linear infinite", display: "inline" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Profile rows builder ──────────────────────────────────────
function buildProfileRows(profile) {
  return [
    { field: "Full Name", value: profile.name ?? "—" },
    { field: "Student ID", value: profile.user_id ?? "—" },
    { field: "Gender", value: profile.gender ?? "—" },
    { field: "Section", value: profile.section ?? "—" },
    { field: "Year Level", value: profile.yearLevel ?? "—" },
    { field: "Course", value: profile.course ?? "—" },
    { field: "Email", value: profile.email ?? "—" },
    { field: "Contact", value: profile.contact ?? "—" },
    {
      field: "Username",
      value: profile.username ? `@${profile.username}` : "—",
    },
    { field: "Status", value: profile.status ?? "Active" },
  ];
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function StudentReports() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState("profile");
  const [rows, setRows] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const studentId = currentUser?.user_id;

  const fetchReport = useCallback(
    async (type) => {
      if (!studentId) return;
      setLoading(true);
      setError("");
      setRows([]);
      try {
        if (type === "profile") {
          // Load own profile
          const snap = await getDoc(doc(db, "users", studentId));
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            setRows(buildProfileRows(data));
          }
        } else if (type === "schedule") {
          // Fetch student's own profile to get sectionId or section name
          const studentSnap = await getDoc(doc(db, "users", studentId));
          const studentData = studentSnap.exists() ? studentSnap.data() : {};
          setProfile(studentData);

          // Find the matching section
          const secSnap = await getDocs(collection(db, "sections"));
          const matchedSec = secSnap.docs.find(
            (d) =>
              d.data().name === studentData.section ||
              d.id === studentData.sectionId
          );

          if (!matchedSec) {
            setRows([]);
            return;
          }

          // Fetch schedules for that section
          const [schedSnap, userSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, "schedules"),
                where("sectionId", "==", matchedSec.id)
              )
            ),
            getDocs(
              query(collection(db, "users"), where("role", "==", "Faculty"))
            ),
          ]);

          const facultyMap = Object.fromEntries(
            userSnap.docs.map((d) => [d.data().user_id, d.data().name])
          );

          const data = schedSnap.docs.map((d) => ({
            _id: d.id,
            ...d.data(),
            facultyName: facultyMap[d.data().facultyId] ?? "—",
          }));

          // Sort by day then time
          const dayIdx = (d) => DAYS_ORDER.indexOf(d) ?? 99;
          data.sort(
            (a, b) =>
              dayIdx(a.day) - dayIdx(b.day) ||
              (a.timeStart ?? "").localeCompare(b.timeStart ?? "")
          );
          setRows(data);
        } else if (type === "events") {
          // All events (students see school-wide events)
          const snap = await getDocs(collection(db, "events"));
          const data = snap.docs
            .map((d) => ({ _id: d.id, ...d.data() }))
            .filter((e) => {
              // Only upcoming or recent events
              if (!e.date) return true;
              return e.date >= new Date().toISOString().slice(0, 10);
            });
          data.sort((a, b) => (a.date > b.date ? 1 : -1));
          setRows(data);
        }
      } catch (err) {
        setError("Failed to load report: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [studentId]
  );

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType, fetchReport]);

  const cols = COLUMNS[reportType] ?? [];
  const activeType = REPORT_TYPES.find((t) => t.id === reportType);
  const avatarColor = pickColor(profile?.name ?? "S");
  const initial = (profile?.name ?? currentUser?.name ?? "S")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <style>{`
        @keyframes srpt-spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          #srpt-printzone, #srpt-printzone * { visibility: visible; }
          #srpt-printzone { position: absolute; top: 0; left: 0; width: 100%; }
          .srpt-no-print { display: none !important; }
          .srpt-print-show { display: block !important; }
          table { font-size: 11px; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>

      <div style={S.page}>
        <div style={S.header} className="srpt-no-print">
          <h1 style={S.pageTitle}>📋 My Reports</h1>
          <p style={S.pageSub}>View and export your personal academic data.</p>
        </div>

        {/* Report Type Selector */}
        <div style={S.typeGrid} className="srpt-no-print">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.id}
              style={S.typeCard(reportType === t.id, t.color)}
              onClick={() => setReportType(t.id)}
            >
              <div style={S.typeIcon}>{t.icon}</div>
              <div style={S.typeLabel(reportType === t.id, t.color)}>
                {t.label}
              </div>
              <div style={S.typeDesc}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div id="srpt-printzone">
          {/* Print header */}
          <div
            className="srpt-print-show"
            style={{
              display: "none",
              marginBottom: "1rem",
              borderBottom: `2px solid ${T.orange}`,
              paddingBottom: "1rem",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111" }}>
              College of Computer Studies — {activeType?.label}
            </div>
            <div
              style={{ fontSize: ".8rem", color: "#555", marginTop: ".2rem" }}
            >
              Student: {profile?.name ?? currentUser?.name ?? "—"} · ID:{" "}
              {studentId} · Generated: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Profile summary card for non-profile views */}
          {profile && reportType !== "profile" && (
            <div style={S.profileCard} className="srpt-no-print">
              <div style={S.avatar(avatarColor)}>{initial}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {profile.name}
                </div>
                <div style={{ fontSize: ".8rem", color: T.muted }}>
                  {profile.user_id} · {profile.section ?? "—"} ·{" "}
                  {profile.course ?? "—"}
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div style={S.toolbar}>
            <span style={{ flex: 1 }} />
            <span style={S.countBadge} className="srpt-no-print">
              {rows.length} record{rows.length !== 1 ? "s" : ""}
            </span>
            <button
              style={S.exportBtn}
              onClick={() =>
                exportCSV(
                  cols,
                  rows,
                  `My_${activeType?.label}_${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`
                )
              }
              className="srpt-no-print"
              disabled={loading || !rows.length}
            >
              ⬇ Export CSV
            </button>
            <button
              style={S.printBtn}
              onClick={() => window.print()}
              className="srpt-no-print"
              disabled={loading || !rows.length}
            >
              🖨 Print
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: ".8rem 1rem",
                borderRadius: 8,
                background: "#ef444420",
                color: "#ef4444",
                fontSize: ".875rem",
                marginBottom: "1rem",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={S.loader}>
              <Spinner /> Loading {activeType?.label}…
            </div>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {reportType !== "profile" && (
                      <th style={{ ...S.th, width: 40 }}>#</th>
                    )}
                    {cols.map((c) => (
                      <th key={c.key} style={S.th}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={
                          cols.length + (reportType !== "profile" ? 1 : 0)
                        }
                        style={S.empty}
                      >
                        No {activeType?.label} data found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => (
                      <tr
                        key={row._id ?? i}
                        style={{
                          background:
                            i % 2 === 0
                              ? "transparent"
                              : "rgba(255,255,255,.02)",
                        }}
                      >
                        {reportType !== "profile" && (
                          <td
                            style={{
                              ...S.td,
                              color: T.muted,
                              fontSize: ".75rem",
                            }}
                          >
                            {i + 1}
                          </td>
                        )}
                        {cols.map((c) =>
                          c.key === "field" ? (
                            <td
                              key={c.key}
                              style={{ ...S.td, ...S.fieldLabel }}
                            >
                              {cellValue(row, c.key)}
                            </td>
                          ) : (
                            <td key={c.key} style={S.td}>
                              {cellValue(row, c.key)}
                            </td>
                          )
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div
            className="srpt-print-show"
            style={{
              display: "none",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #ccc",
              fontSize: ".75rem",
              color: "#888",
            }}
          >
            Confidential — Personal Record of {profile?.name ?? "Student"}
          </div>
        </div>
      </div>
    </>
  );
}

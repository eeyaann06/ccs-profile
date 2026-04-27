// src/pages/FacultyReports.jsx
// ─────────────────────────────────────────────────────────────
// Faculty Portal — Report Generation (Own Classes Only)
// Covers: My Class Roster, My Schedules, My Lessons, My Syllabi
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
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
    id: "roster",
    label: "Class Roster",
    icon: "👥",
    color: "#06b6d4",
    desc: "Students in my sections",
  },
  {
    id: "schedules",
    label: "My Schedules",
    icon: "🗓️",
    color: "#22c55e",
    desc: "My assigned class slots",
  },
  {
    id: "lessons",
    label: "Lessons Posted",
    icon: "📖",
    color: "#8b5cf6",
    desc: "Materials I've posted",
  },
  {
    id: "syllabus",
    label: "My Syllabi",
    icon: "📝",
    color: "#fbbf24",
    desc: "Syllabi I've uploaded",
  },
];

const COLUMNS = {
  roster: [
    { key: "user_id", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "section", label: "Section" },
    { key: "yearLevel", label: "Year" },
    { key: "course", label: "Course" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ],
  schedules: [
    { key: "sectionName", label: "Section" },
    { key: "subject", label: "Subject" },
    { key: "day", label: "Day" },
    { key: "timeStart", label: "Start" },
    { key: "timeEnd", label: "End" },
    { key: "room", label: "Room" },
  ],
  lessons: [
    { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "sectionName", label: "Section" },
    { key: "subject", label: "Subject" },
    { key: "postedAt", label: "Date Posted" },
    { key: "description", label: "Description" },
  ],
  syllabus: [
    { key: "subject", label: "Subject" },
    { key: "sectionName", label: "Section" },
    { key: "semester", label: "Semester" },
    { key: "uploadedAt", label: "Uploaded" },
    { key: "status", label: "Status" },
  ],
};

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    padding: "2rem",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    color: T.text,
    maxWidth: 1200,
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
  searchInput: {
    flex: 1,
    minWidth: 200,
    padding: ".55rem .9rem",
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    fontSize: ".875rem",
    outline: "none",
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
  empty: {
    textAlign: "center",
    padding: "4rem 2rem",
    color: T.muted,
    fontSize: ".9rem",
  },
  loader: { textAlign: "center", padding: "3rem", color: T.muted },
};

// ── Helpers ───────────────────────────────────────────────────
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
  if (key === "uploadedAt" || key === "postedAt") {
    try {
      return v?.toDate
        ? v.toDate().toLocaleDateString()
        : new Date(v).toLocaleDateString();
    } catch {
      return String(v);
    }
  }
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
      style={{ animation: "frpt-spin .8s linear infinite", display: "inline" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function StatusChip({ value }) {
  if (!value || value === "—") return <span style={{ color: T.muted }}>—</span>;
  const color =
    value === "Active"
      ? "#22c55e"
      : value === "Inactive"
      ? "#ef4444"
      : "#94a3b8";
  return (
    <span
      style={{
        padding: ".2rem .6rem",
        borderRadius: 99,
        background: `${color}20`,
        color,
        fontSize: ".75rem",
        fontWeight: 600,
      }}
    >
      {value}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function FacultyReports() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState("roster");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const facultyId = currentUser?.user_id;

  const fetchReport = useCallback(
    async (type) => {
      if (!facultyId) return;
      setLoading(true);
      setError("");
      setRows([]);
      try {
        let data = [];

        if (type === "roster") {
          // Get sections this faculty teaches → then get students in those sections
          const schedSnap = await getDocs(
            query(
              collection(db, "schedules"),
              where("facultyId", "==", facultyId)
            )
          );
          const sectionIds = [
            ...new Set(schedSnap.docs.map((d) => d.data().sectionId)),
          ];
          if (!sectionIds.length) {
            setRows([]);
            return;
          }
          // Get sections to know their name/course/year
          const secSnap = await getDocs(collection(db, "sections"));
          const sections = Object.fromEntries(
            secSnap.docs.map((d) => [d.id, d.data()])
          );
          // Get students whose section matches
          const studentSnap = await getDocs(
            query(collection(db, "users"), where("role", "==", "Student"))
          );
          data = studentSnap.docs
            .map((d) => ({ _id: d.id, ...d.data() }))
            .filter((s) => {
              // match by sectionId field or section name
              return sectionIds.some(
                (sid) =>
                  s.sectionId === sid || s.section === sections[sid]?.name
              );
            });
        } else if (type === "schedules") {
          const [schedSnap, secSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, "schedules"),
                where("facultyId", "==", facultyId)
              )
            ),
            getDocs(collection(db, "sections")),
          ]);
          const sections = Object.fromEntries(
            secSnap.docs.map((d) => [d.id, d.data()])
          );
          data = schedSnap.docs.map((d) => {
            const s = d.data();
            return {
              _id: d.id,
              ...s,
              sectionName: sections[s.sectionId]?.name ?? s.sectionId ?? "—",
            };
          });
        } else if (type === "lessons") {
          const [lessonSnap, secSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, "lessons"),
                where("facultyId", "==", facultyId)
              )
            ),
            getDocs(collection(db, "sections")),
          ]);
          const sections = Object.fromEntries(
            secSnap.docs.map((d) => [d.id, d.data()])
          );
          data = lessonSnap.docs.map((d) => {
            const s = d.data();
            return {
              _id: d.id,
              ...s,
              sectionName: sections[s.sectionId]?.name ?? s.sectionId ?? "—",
            };
          });
          data.sort((a, b) => {
            const ta = a.postedAt?.toDate?.() ?? new Date(a.postedAt ?? 0);
            const tb = b.postedAt?.toDate?.() ?? new Date(b.postedAt ?? 0);
            return tb - ta;
          });
        } else if (type === "syllabus") {
          const [sylSnap, secSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, "syllabus"),
                where("facultyId", "==", facultyId)
              )
            ),
            getDocs(collection(db, "sections")),
          ]);
          const sections = Object.fromEntries(
            secSnap.docs.map((d) => [d.id, d.data()])
          );
          data = sylSnap.docs.map((d) => {
            const s = d.data();
            return {
              _id: d.id,
              ...s,
              sectionName: sections[s.sectionId]?.name ?? s.sectionId ?? "—",
            };
          });
        }

        setRows(data);
      } catch (err) {
        setError("Failed to load report: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [facultyId]
  );

  useEffect(() => {
    fetchReport(reportType);
    setSearch("");
  }, [reportType, fetchReport]);

  const cols = COLUMNS[reportType] ?? [];
  const filtered = search.trim()
    ? rows.filter((r) =>
        cols.some((c) =>
          cellValue(r, c.key).toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows;

  const activeType = REPORT_TYPES.find((t) => t.id === reportType);

  return (
    <>
      <style>{`
        @keyframes frpt-spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          #frpt-printzone, #frpt-printzone * { visibility: visible; }
          #frpt-printzone { position: absolute; top: 0; left: 0; width: 100%; }
          .frpt-no-print { display: none !important; }
          .frpt-print-show { display: block !important; }
          table { font-size: 11px; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>

      <div style={S.page}>
        <div style={S.header} className="frpt-no-print">
          <h1 style={S.pageTitle}>📊 My Class Reports</h1>
          <p style={S.pageSub}>
            Reports are scoped to your assigned classes only.
          </p>
        </div>

        {/* Report Type Selector */}
        <div style={S.typeGrid} className="frpt-no-print">
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

        <div id="frpt-printzone">
          {/* Print header */}
          <div
            className="frpt-print-show"
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
              Faculty: {currentUser?.name ?? "—"} · Generated:{" "}
              {new Date().toLocaleString()}
            </div>
          </div>

          {/* Toolbar */}
          <div style={S.toolbar}>
            <input
              style={S.searchInput}
              placeholder={`Search ${activeType?.label}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="frpt-no-print"
            />
            <span style={S.countBadge} className="frpt-no-print">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              style={S.exportBtn}
              onClick={() =>
                exportCSV(
                  cols,
                  filtered,
                  `${activeType?.label}_${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`
                )
              }
              className="frpt-no-print"
              disabled={loading || !filtered.length}
            >
              ⬇ Export CSV
            </button>
            <button
              style={S.printBtn}
              onClick={() => window.print()}
              className="frpt-no-print"
              disabled={loading || !filtered.length}
            >
              🖨 Print Report
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
                    <th style={{ ...S.th, width: 40 }}>#</th>
                    {cols.map((c) => (
                      <th key={c.key} style={S.th}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!filtered.length ? (
                    <tr>
                      <td colSpan={cols.length + 1} style={S.empty}>
                        {search
                          ? "No records match your search."
                          : `No ${activeType?.label} records found for your account.`}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, i) => (
                      <tr
                        key={row._id ?? i}
                        style={{
                          background:
                            i % 2 === 0
                              ? "transparent"
                              : "rgba(255,255,255,.02)",
                        }}
                      >
                        <td
                          style={{
                            ...S.td,
                            color: T.muted,
                            fontSize: ".75rem",
                          }}
                        >
                          {i + 1}
                        </td>
                        {cols.map((c) =>
                          c.key === "status" ? (
                            <td key={c.key} style={S.td}>
                              <StatusChip value={cellValue(row, c.key)} />
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
            className="frpt-print-show"
            style={{
              display: "none",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #ccc",
              fontSize: ".75rem",
              color: "#888",
            }}
          >
            Total: {filtered.length} record{filtered.length !== 1 ? "s" : ""} ·
            Confidential — For Faculty Use Only
          </div>
        </div>
      </div>
    </>
  );
}

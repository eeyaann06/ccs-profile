// src/pages/AdminReports.jsx
// ─────────────────────────────────────────────────────────────
// Admin Portal — Report Generation (All Reports)
// Covers: Students, Faculty, Events, Schedules, Curriculum
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import '../styles/report.css';

// ── Theme ─────────────────────────────────────────────────────
const T = {
  orange: "#f97316",
  orangeLight: "rgba(249,115,22,0.12)",
  orangeBorder: "rgba(249,115,22,0.3)",
  surface: "var(--clr-surface, rgba(255,255,255,.06))",
  bg: "var(--clr-bg, #0f1117)",
  text: "var(--clr-text, #e8e8f0)",
  muted: "var(--clr-text-muted, #94a3b8)",
  border: "var(--clr-border, rgba(255,255,255,0.08))",
  card: "var(--clr-card, rgba(255,255,255,0.04))",
};

// ── Report definitions ────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: "students",
    label: "Student Directory",
    icon: "🎓",
    color: "#06b6d4",
    desc: "All enrolled students",
  },
  {
    id: "faculty",
    label: "Faculty Roster",
    icon: "👨‍🏫",
    color: "#8b5cf6",
    desc: "All teaching staff",
  },
  {
    id: "events",
    label: "Events Log",
    icon: "📅",
    color: "#f97316",
    desc: "All school events",
  },
  {
    id: "schedules",
    label: "Class Schedules",
    icon: "🗓️",
    color: "#22c55e",
    desc: "All section schedules",
  },
  {
    id: "curriculum",
    label: "Curriculum",
    icon: "📚",
    color: "#ec4899",
    desc: "All curriculum records",
  },
  {
    id: "syllabus",
    label: "Syllabus Records",
    icon: "📝",
    color: "#fbbf24",
    desc: "All uploaded syllabi",
  },
];

// ── Column definitions per report ─────────────────────────────
const COLUMNS = {
  students: [
    { key: "user_id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "section", label: "Section" },
    { key: "yearLevel", label: "Year" },
    { key: "course", label: "Course" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ],
  faculty: [
    { key: "user_id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "department", label: "Department" },
    { key: "specialization", label: "Specialization" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ],
  events: [
    { key: "title", label: "Title" },
    { key: "date", label: "Date" },
    { key: "location", label: "Location" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
  ],
  schedules: [
    { key: "sectionName", label: "Section" },
    { key: "subject", label: "Subject" },
    { key: "facultyName", label: "Faculty" },
    { key: "day", label: "Day" },
    { key: "timeStart", label: "Start" },
    { key: "timeEnd", label: "End" },
    { key: "room", label: "Room" },
  ],
  curriculum: [
    { key: "course", label: "Course" },
    { key: "yearLevel", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "subject", label: "Subject" },
    { key: "units", label: "Units" },
    { key: "type", label: "Type" },
  ],
  syllabus: [
    { key: "subject", label: "Subject" },
    { key: "facultyName", label: "Faculty" },
    { key: "sectionName", label: "Section" },
    { key: "semester", label: "Semester" },
    { key: "uploadedAt", label: "Uploaded" },
    { key: "status", label: "Status" },
  ],
};

// ── Inline Styles ─────────────────────────────────────────────
const S = {
  page: {
    padding: "2rem",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    color: T.text,
    maxWidth: 1300,
    margin: "0 auto",
  },
  header: { marginBottom: "2rem" },
  pageTitle: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: ".5rem",
  },
  pageSub: { color: T.muted, fontSize: ".875rem", marginTop: ".3rem" },

  // Type selector grid
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  typeCard: (active, color) => ({
    background: active ? `${color}18` : T.card,
    border: `1.5px solid ${active ? color : T.border}`,
    borderRadius: 12,
    padding: "1rem 1.2rem",
    cursor: "pointer",
    transition: "all .15s",
    textAlign: "left",
  }),
  typeIcon: { fontSize: "1.5rem", marginBottom: ".5rem" },
  typeLabel: (active, color) => ({
    fontWeight: 600,
    fontSize: ".9rem",
    color: active ? color : T.text,
  }),
  typeDesc: { fontSize: ".75rem", color: T.muted, marginTop: ".15rem" },

  // Toolbar
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

  // Table
  tableWrap: {
    overflowX: "auto",
    borderRadius: 12,
    border: `1px solid ${T.border}`,
    background: T.card,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: ".83rem",
  },
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

  // Loading
  loader: {
    textAlign: "center",
    padding: "3rem",
    color: T.muted,
    fontSize: ".9rem",
  },

  // Report header (for print)
  printHeader: {
    display: "none",
    marginBottom: "1rem",
    borderBottom: `2px solid ${T.orange}`,
    paddingBottom: "1rem",
  },
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
  if (key === "uploadedAt") {
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

// ── Spinner ───────────────────────────────────────────────────
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
      style={{ animation: "rpt-spin .8s linear infinite", display: "inline" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Status chip ───────────────────────────────────────────────
function StatusChip({ value }) {
  if (!value || value === "—") return <span style={{ color: T.muted }}>—</span>;
  const color =
    value === "Active"
      ? "#22c55e"
      : value === "Inactive"
      ? "#ef4444"
      : value === "On Leave"
      ? "#f59e0b"
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
export default function AdminReports() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState("students");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // ── Fetch ─────────────────────────────────────────────────
  const fetchReport = useCallback(async (type) => {
    setLoading(true);
    setError("");
    setRows([]);
    try {
      let data = [];
      if (type === "students") {
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "==", "Student"))
        );
        data = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
      } else if (type === "faculty") {
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "==", "Faculty"))
        );
        data = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
      } else if (type === "events") {
        const snap = await getDocs(collection(db, "events"));
        data = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
        data.sort((a, b) => (a.date < b.date ? 1 : -1));
      } else if (type === "schedules") {
        // Join schedules with sections for readable names
        const [schedSnap, secSnap, userSnap] = await Promise.all([
          getDocs(collection(db, "schedules")),
          getDocs(collection(db, "sections")),
          getDocs(
            query(collection(db, "users"), where("role", "==", "Faculty"))
          ),
        ]);
        const sections = Object.fromEntries(
          secSnap.docs.map((d) => [d.id, d.data()])
        );
        const faculty = Object.fromEntries(
          userSnap.docs.map((d) => [d.data().user_id, d.data().name])
        );
        data = schedSnap.docs.map((d) => {
          const s = d.data();
          const sec = sections[s.sectionId] ?? {};
          return {
            _id: d.id,
            ...s,
            sectionName: sec.name ?? s.sectionId ?? "—",
            facultyName: faculty[s.facultyId] ?? s.facultyId ?? "—",
          };
        });
      } else if (type === "curriculum") {
        const snap = await getDocs(collection(db, "curriculum"));
        data = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
      } else if (type === "syllabus") {
        const [sylSnap, userSnap, secSnap] = await Promise.all([
          getDocs(collection(db, "syllabus")),
          getDocs(
            query(collection(db, "users"), where("role", "==", "Faculty"))
          ),
          getDocs(collection(db, "sections")),
        ]);
        const faculty = Object.fromEntries(
          userSnap.docs.map((d) => [d.data().user_id, d.data().name])
        );
        const sections = Object.fromEntries(
          secSnap.docs.map((d) => [d.id, d.data().name ?? d.id])
        );
        data = sylSnap.docs.map((d) => {
          const s = d.data();
          return {
            _id: d.id,
            ...s,
            facultyName: faculty[s.facultyId] ?? s.facultyId ?? "—",
            sectionName: sections[s.sectionId] ?? s.sectionId ?? "—",
          };
        });
      }
      setRows(data);
    } catch (err) {
      setError("Failed to load report: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(reportType);
    setSearch("");
  }, [reportType, fetchReport]);

  // ── Filter ────────────────────────────────────────────────
  const cols = COLUMNS[reportType] ?? [];
  const filtered = search.trim()
    ? rows.filter((r) =>
        cols.some((c) =>
          cellValue(r, c.key).toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows;

  const activeType = REPORT_TYPES.find((t) => t.id === reportType);

  // ── Print ─────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  function handleExport() {
    exportCSV(
      cols,
      filtered,
      `${activeType?.label ?? reportType}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @keyframes rpt-spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          #rpt-printzone, #rpt-printzone * { visibility: visible; }
          #rpt-printzone { position: absolute; top: 0; left: 0; width: 100%; }
          .rpt-no-print { display: none !important; }
          .rpt-print-header { display: block !important; }
          table { font-size: 11px; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>

      <div style={S.page}>
        {/* Header */}
        <div style={S.header} className="rpt-no-print">
          <h1 style={S.pageTitle}>📊 Report Generation</h1>
          <p style={S.pageSub}>
            Generate, filter, and export reports across all system data.
          </p>
        </div>

        {/* Report Type Selector */}
        <div style={S.typeGrid} className="rpt-no-print">
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

        {/* Printable zone */}
        <div id="rpt-printzone">
          {/* Print header (hidden on screen) */}
          <div
            className="rpt-print-header"
            style={{ ...S.printHeader, display: "none" }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111" }}>
              College of Computer Studies — {activeType?.label} Report
            </div>
            <div
              style={{ fontSize: ".8rem", color: "#555", marginTop: ".2rem" }}
            >
              Generated: {new Date().toLocaleString()} · Admin:{" "}
              {currentUser?.name ?? "—"}
            </div>
          </div>

          {/* Toolbar */}
          <div style={S.toolbar}>
            <input
              style={S.searchInput}
              placeholder={`Search ${activeType?.label ?? ""}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rpt-no-print"
            />
            <span style={S.countBadge} className="rpt-no-print">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              style={S.exportBtn}
              onClick={handleExport}
              className="rpt-no-print"
              disabled={loading || !filtered.length}
            >
              ⬇ Export CSV
            </button>
            <button
              style={S.printBtn}
              onClick={handlePrint}
              className="rpt-no-print"
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

          {/* Table */}
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
                          : `No ${activeType?.label} records found.`}
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

          {/* Print footer */}
          <div
            className="rpt-print-header"
            style={{
              display: "none",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #ccc",
              fontSize: ".75rem",
              color: "#888",
            }}
          >
            Total Records: {filtered.length} · Confidential — For Internal Use
            Only
          </div>
        </div>
      </div>
    </>
  );
}

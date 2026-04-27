import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";
import "../styles/Syllabus.css";

// ── Status Meta ────────────────────────────────────────────────────────────
const STATUS_META = {
  Pending: { cls: "syl-chip--pending", label: "Pending" },
  Approved: { cls: "syl-chip--approved", label: "Approved" },
  Rejected: { cls: "syl-chip--rejected", label: "Rejected" },
};

// ── Icons ──────────────────────────────────────────────────────────────────
function Icon({ d, size = 16, fill = "none", sw = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d}
    </svg>
  );
}

const CloseIcon = ({ size = 16 }) => (
  <Icon
    size={size}
    sw={2.5}
    d={
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    }
  />
);
const CheckIcon = () => (
  <Icon size={15} d={<polyline points="20 6 9 17 4 12" />} />
);
const XIcon = () => (
  <Icon
    size={15}
    d={
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    }
  />
);
const EyeIcon = () => (
  <Icon
    size={14}
    d={
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    }
  />
);
const FileIcon = () => (
  <Icon
    size={14}
    d={
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    }
  />
);
const SearchIcon = () => (
  <Icon
    size={15}
    d={
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    }
  />
);
const RefreshIcon = () => (
  <Icon
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
const DownloadIcon = () => (
  <Icon
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
const SpinnerIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{
      animation: "syl-spin 0.8s linear infinite",
      display: "inline-block",
    }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Modal Base ─────────────────────────────────────────────────────────────
function ModalBase({ onClose, children, maxWidth = "640px" }) {
  return createPortal(
    <div className="syl-overlay" onClick={onClose}>
      <div
        className="syl-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ── Review Modal ───────────────────────────────────────────────────────────
function ReviewModal({ syllabus, onClose, onAction, acting }) {
  const [notes, setNotes] = useState(syllabus.admin_notes || "");
  const meta = STATUS_META[syllabus.status] ?? STATUS_META.Pending;

  return (
    <ModalBase onClose={onClose}>
      <div className="syl-modal-header">
        <div>
          <h2 className="syl-modal-title">{syllabus.subject}</h2>
          <p className="syl-modal-sub">
            {syllabus.faculty_name} • {syllabus.course_code || "—"} •{" "}
            {syllabus.semester}
          </p>
        </div>
        <button className="syl-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="syl-modal-body">
        <div className="syl-view-chips">
          <span className={`syl-chip ${meta.cls}`}>{meta.label}</span>
          <span className="syl-chip syl-chip--sem">{syllabus.semester}</span>
          <span className="syl-chip syl-chip--ay">
            {syllabus.academic_year}
          </span>
        </div>

        {syllabus.description && (
          <div className="syl-view-section">
            <div className="syl-view-label">Description</div>
            <p className="syl-view-text">{syllabus.description}</p>
          </div>
        )}

        {/* Faculty info */}
        <div className="syl-review-faculty">
          <div className="syl-review-faculty-item">
            <span className="syl-view-label">Faculty</span>
            <span>{syllabus.faculty_name}</span>
          </div>
          <div className="syl-review-faculty-item">
            <span className="syl-view-label">Faculty ID</span>
            <code className="syl-id-code">{syllabus.faculty_id}</code>
          </div>
          <div className="syl-review-faculty-item">
            <span className="syl-view-label">Submitted</span>
            <span>
              {syllabus.created_at?.toDate?.()?.toLocaleDateString("en-PH") ??
                "—"}
            </span>
          </div>
        </div>

        {syllabus.file_url && (
          <div className="syl-view-section">
            <div className="syl-view-label">Attached File</div>
            <a
              className="syl-file-link"
              href={syllabus.file_url}
              target="_blank"
              rel="noreferrer"
            >
              <FileIcon /> {syllabus.file_name || "View File"} <DownloadIcon />
            </a>
          </div>
        )}

        {/* Admin note */}
        <div className="syl-view-section">
          <div className="syl-view-label">Admin Note (shown to faculty)</div>
          <textarea
            className="syl-notes-area"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional feedback or reason for rejection…"
          />
        </div>
      </div>

      <div className="syl-form-actions">
        <button
          className="syl-btn syl-btn--ghost"
          onClick={onClose}
          disabled={acting}
        >
          Close
        </button>
        <button
          className="syl-btn syl-btn--danger"
          onClick={() => onAction("Rejected", notes)}
          disabled={acting || syllabus.status === "Rejected"}
        >
          {acting === "Rejected" ? (
            <>
              <SpinnerIcon /> Rejecting…
            </>
          ) : (
            <>
              <XIcon /> Reject
            </>
          )}
        </button>
        <button
          className="syl-btn syl-btn--success"
          onClick={() => onAction("Approved", notes)}
          disabled={acting || syllabus.status === "Approved"}
        >
          {acting === "Approved" ? (
            <>
              <SpinnerIcon /> Approving…
            </>
          ) : (
            <>
              <CheckIcon /> Approve
            </>
          )}
        </button>
      </div>
    </ModalBase>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────
function StatsBar({ syllabi }) {
  const pending = syllabi.filter((s) => s.status === "Pending").length;
  const approved = syllabi.filter((s) => s.status === "Approved").length;
  const rejected = syllabi.filter((s) => s.status === "Rejected").length;

  return (
    <div className="syl-stats-bar">
      <div className="syl-stat syl-stat--total">
        <span className="syl-stat-val">{syllabi.length}</span>
        <span className="syl-stat-label">Total</span>
      </div>
      <div className="syl-stat syl-stat--pending">
        <span className="syl-stat-val">{pending}</span>
        <span className="syl-stat-label">Pending</span>
      </div>
      <div className="syl-stat syl-stat--approved">
        <span className="syl-stat-val">{approved}</span>
        <span className="syl-stat-label">Approved</span>
      </div>
      <div className="syl-stat syl-stat--rejected">
        <span className="syl-stat-val">{rejected}</span>
        <span className="syl-stat-label">Rejected</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminSyllabus() {
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [acting, setActing] = useState(null); // "Approved" | "Rejected"

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchSyllabi = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "syllabi"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      setSyllabi(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load syllabi: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSyllabi();
  }, [fetchSyllabi]);

  // ── Approve / Reject ──────────────────────────────────────────────────────
  async function handleAction(status, notes) {
    if (!reviewTarget) return;
    setActing(status);
    try {
      await updateDoc(doc(db, "syllabi", reviewTarget.id), {
        status,
        admin_notes: notes,
        reviewed_at: serverTimestamp(),
      });
      setReviewTarget(null);
      fetchSyllabi();
    } catch (err) {
      setError("Action failed: " + err.message);
    } finally {
      setActing(null);
    }
  }

  // ── Unique faculty names for filter ──────────────────────────────────────
  const faculties = useMemo(
    () =>
      [...new Set(syllabi.map((s) => s.faculty_name).filter(Boolean))].sort(),
    [syllabi]
  );

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return syllabi.filter(
      (s) =>
        (!q ||
          s.subject?.toLowerCase().includes(q) ||
          s.faculty_name?.toLowerCase().includes(q) ||
          s.course_code?.toLowerCase().includes(q)) &&
        (!filterStatus || s.status === filterStatus) &&
        (!filterFaculty || s.faculty_name === filterFaculty)
    );
  }, [syllabi, search, filterStatus, filterFaculty]);

  return (
    <div className="syl-page">
      {error && (
        <div className="syl-error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      <StatsBar syllabi={syllabi} />

      {/* Toolbar */}
      <div className="syl-toolbar">
        <div className="syl-search-wrap">
          <SearchIcon />
          <input
            className="syl-search"
            placeholder="Search subject, faculty, or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="syl-search-clear" onClick={() => setSearch("")}>
              <CloseIcon size={13} />
            </button>
          )}
        </div>
        <select
          className="syl-select"
          value={filterFaculty}
          onChange={(e) => setFilterFaculty(e.target.value)}
        >
          <option value="">All Faculty</option>
          {faculties.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select
          className="syl-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {["Pending", "Approved", "Rejected"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="syl-toolbar-right">
          <span className="syl-count">{filtered.length} syllabi</span>
          <button
            className="syl-btn syl-btn--ghost syl-btn--sm"
            onClick={fetchSyllabi}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="syl-table-wrap">
        {loading ? (
          <div className="syl-loading">
            <SpinnerIcon />
            <span>Loading syllabi…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="syl-empty">
            <span>📋</span>
            <p>No syllabi found.</p>
          </div>
        ) : (
          <table className="syl-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Code</th>
                <th>Semester</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.Pending;
                return (
                  <tr key={s.id} className="syl-row">
                    <td>
                      <div className="syl-row-subject">{s.subject}</div>
                      {s.description && (
                        <div className="syl-row-desc">
                          {s.description.slice(0, 60)}
                          {s.description.length > 60 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="syl-row-faculty">{s.faculty_name}</div>
                      <code className="syl-id-code syl-id-code--sm">
                        {s.faculty_id}
                      </code>
                    </td>
                    <td>{s.course_code || "—"}</td>
                    <td>{s.semester}</td>
                    <td className="syl-row-date">
                      {s.created_at?.toDate?.()?.toLocaleDateString("en-PH") ??
                        "—"}
                    </td>
                    <td>
                      <span className={`syl-chip ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <div className="syl-row-actions">
                        <button
                          className="syl-action-btn"
                          onClick={() => setReviewTarget(s)}
                          title="Review"
                        >
                          <EyeIcon />
                        </button>
                        {s.file_url && (
                          <a
                            className="syl-action-btn syl-action-btn--download"
                            href={s.file_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Download"
                          >
                            <DownloadIcon />
                          </a>
                        )}
                        {s.status === "Pending" && (
                          <>
                            <button
                              className="syl-action-btn syl-action-btn--approve"
                              title="Quick Approve"
                              onClick={() => {
                                setReviewTarget(s);
                              }}
                            >
                              <CheckIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          syllabus={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onAction={handleAction}
          acting={acting}
        />
      )}
    </div>
  );
}

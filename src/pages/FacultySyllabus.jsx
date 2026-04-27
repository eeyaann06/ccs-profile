import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/Syllabus.css";

// ── Constants ──────────────────────────────────────────────────────────────
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const CURRENT_AY = "2024–2025";

const STATUS_META = {
  Pending: { cls: "syl-chip--pending", label: "Pending" },
  Approved: { cls: "syl-chip--approved", label: "Approved" },
  Rejected: { cls: "syl-chip--rejected", label: "Rejected" },
};

// ── Cloudinary Config (same as CollegeResearch & FacultyLessons) ───────────
const CLOUDINARY_CLOUD = "dimsjx2gq";
const CLOUDINARY_PRESET = "research";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/raw/upload`;

function genId() {
  return "SYL-" + Date.now().toString(36).toUpperCase();
}

// ── Shared Icons ───────────────────────────────────────────────────────────
function Icon({ d, size = 16, fill = "none", strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d}
    </svg>
  );
}

const PlusIcon = () => (
  <Icon
    size={15}
    strokeWidth={2.5}
    d={
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    }
  />
);
const CloseIcon = ({ size = 16 }) => (
  <Icon
    size={size}
    strokeWidth={2.5}
    d={
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    }
  />
);
const EditIcon = () => (
  <Icon
    size={14}
    d={
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    }
  />
);
const TrashIcon = () => (
  <Icon
    size={14}
    d={
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
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
const UploadIcon = () => (
  <Icon
    size={20}
    strokeWidth={1.5}
    d={
      <>
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
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

// ── Modal Portal ───────────────────────────────────────────────────────────
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

function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="syl-modal-header">
      <div>
        <h2 className="syl-modal-title">{title}</h2>
        {sub && <p className="syl-modal-sub">{sub}</p>}
      </div>
      <button className="syl-modal-close" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
}

// ── Upload Drop Zone ───────────────────────────────────────────────────────
function FileDropZone({ file, onFile, accept = ".pdf,.doc,.docx", disabled }) {
  const [drag, setDrag] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div
      className={`syl-dropzone ${drag ? "syl-dropzone--drag" : ""} ${
        file ? "syl-dropzone--has-file" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() =>
        !disabled && document.getElementById("syl-file-input")?.click()
      }
    >
      <input
        id="syl-file-input"
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="syl-dropzone-file">
          <FileIcon />
          <span className="syl-dropzone-name">{file.name || file}</span>
          {!disabled && (
            <button
              type="button"
              className="syl-dropzone-remove"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
            >
              <CloseIcon size={13} />
            </button>
          )}
        </div>
      ) : (
        <>
          <UploadIcon />
          <p className="syl-dropzone-hint">
            Drop file here or <span>browse</span>
          </p>
          <p className="syl-dropzone-types">PDF, DOC, DOCX</p>
        </>
      )}
    </div>
  );
}

// ── Upload Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ value }) {
  return (
    <div className="syl-progress-wrap">
      <div className="syl-progress-bar" style={{ width: `${value}%` }} />
      <span className="syl-progress-label">{Math.round(value)}%</span>
    </div>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────
function SyllabusFormModal({
  initial,
  onSave,
  onClose,
  saving,
  error,
  progress,
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() => ({
    subject: initial?.subject || "",
    course_code: initial?.course_code || "",
    semester: initial?.semester || SEMESTERS[0],
    academic_year: initial?.academic_year || CURRENT_AY,
    description: initial?.description || "",
  }));
  const [file, setFile] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalBase onClose={onClose} maxWidth="660px">
      <ModalHeader
        title={isEdit ? "Edit Syllabus" : "Upload New Syllabus"}
        sub={
          isEdit
            ? `Editing: ${initial.subject}`
            : "Fill in details and attach the syllabus file"
        }
        onClose={onClose}
      />
      <div className="syl-modal-body">
        <form
          className="syl-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form, file);
          }}
        >
          <div className="syl-form-grid">
            <div className="syl-form-group syl-form-group--full">
              <label>Subject / Course Name *</label>
              <input
                required
                value={form.subject}
                placeholder="e.g. Data Structures and Algorithms"
                onChange={(e) => set("subject", e.target.value)}
              />
            </div>
            <div className="syl-form-group">
              <label>Course Code</label>
              <input
                value={form.course_code}
                placeholder="e.g. CS 201"
                onChange={(e) => set("course_code", e.target.value)}
              />
            </div>
            <div className="syl-form-group">
              <label>Semester *</label>
              <select
                value={form.semester}
                onChange={(e) => set("semester", e.target.value)}
              >
                {SEMESTERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="syl-form-group">
              <label>Academic Year</label>
              <input
                value={form.academic_year}
                placeholder="e.g. 2024–2025"
                onChange={(e) => set("academic_year", e.target.value)}
              />
            </div>
            <div className="syl-form-group syl-form-group--full">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                placeholder="Brief overview of the course content and objectives…"
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="syl-form-group syl-form-group--full">
              <label>
                {isEdit ? "Replace File (optional)" : "Syllabus File *"}
              </label>
              <FileDropZone file={file} onFile={setFile} disabled={saving} />
              {isEdit && initial.file_name && !file && (
                <span className="syl-form-hint">
                  Current: {initial.file_name}
                </span>
              )}
            </div>
          </div>

          {progress > 0 && progress < 100 && <ProgressBar value={progress} />}
          {error && <div className="syl-form-error">⚠ {error}</div>}

          <div className="syl-form-actions">
            <button
              type="button"
              className="syl-btn syl-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="syl-btn syl-btn--primary"
              disabled={saving || (!isEdit && !file)}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Uploading…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Upload Syllabus"
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBase>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────
function ViewModal({ syllabus, onClose, onEdit, onDelete }) {
  const meta = STATUS_META[syllabus.status] ?? STATUS_META.Pending;
  return (
    <ModalBase onClose={onClose}>
      <ModalHeader
        title={syllabus.subject}
        sub={syllabus.course_code}
        onClose={onClose}
      />
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

        {syllabus.admin_notes && (
          <div
            className={`syl-admin-note syl-admin-note--${syllabus.status?.toLowerCase()}`}
          >
            <strong>Admin Note:</strong> {syllabus.admin_notes}
          </div>
        )}

        <div className="syl-view-meta">
          <span>
            Uploaded:{" "}
            {syllabus.created_at?.toDate?.()?.toLocaleDateString("en-PH") ??
              "—"}
          </span>
          {syllabus.updated_at && (
            <span>
              Updated:{" "}
              {syllabus.updated_at?.toDate?.()?.toLocaleDateString("en-PH")}
            </span>
          )}
        </div>
      </div>
      <div className="syl-form-actions">
        <button className="syl-btn syl-btn--ghost" onClick={onClose}>
          Close
        </button>
        <button
          className="syl-btn syl-btn--danger-ghost"
          onClick={() => {
            onClose();
            onDelete(syllabus);
          }}
        >
          <TrashIcon /> Delete
        </button>
        <button
          className="syl-btn syl-btn--primary"
          onClick={() => {
            onClose();
            onEdit(syllabus);
          }}
        >
          <EditIcon /> Edit
        </button>
      </div>
    </ModalBase>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────
function DeleteModal({ syllabus, onConfirm, onClose, deleting }) {
  return (
    <ModalBase onClose={onClose} maxWidth="400px">
      <div className="syl-confirm">
        <div className="syl-confirm-icon">🗑️</div>
        <h3>Delete Syllabus?</h3>
        <p>
          Permanently delete <strong>{syllabus.subject}</strong>? The file will
          also be removed.
        </p>
        <div className="syl-form-actions syl-form-actions--center">
          <button
            className="syl-btn syl-btn--ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="syl-btn syl-btn--danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <SpinnerIcon /> Deleting…
              </>
            ) : (
              "Yes, Delete"
            )}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function FacultySyllabus() {
  const { currentUser } = useAuth();
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [progress, setProgress] = useState(0);

  // ── Fetch ────────────────────────────────────────────────────────────────
  // FIX: removed orderBy("created_at", "desc") — it requires a composite
  //      Firestore index. We sort client-side by created_at.seconds instead.
  const fetchSyllabi = useCallback(async () => {
    if (!currentUser?.user_id) return;
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "syllabi"),
        where("faculty_id", "==", currentUser.user_id)
      );
      const snap = await getDocs(q);
      setSyllabi(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0)
          )
      );
    } catch (err) {
      setError("Failed to load syllabi: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSyllabi();
  }, [fetchSyllabi]);

  // ── Upload via Cloudinary (XHR for real progress tracking) ───────────────
  async function uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve({ url: data.secure_url, name: file.name });
          } else {
            reject(
              new Error(
                data.error?.message || "Upload failed — check Cloudinary preset"
              )
            );
          }
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      });

      xhr.addEventListener("error", () =>
        reject(new Error("Network error during upload"))
      );

      xhr.open("POST", CLOUDINARY_UPLOAD_URL);
      xhr.send(formData);
    });
  }

  // ── Create ───────────────────────────────────────────────────────────────
  async function handleCreate(form, file) {
    if (!file) {
      setFormError("Please select a file to upload.");
      return;
    }
    setSaving(true);
    setFormError("");
    setProgress(0);
    try {
      const syllabusId = genId();
      const { url, name } = await uploadFile(file, setProgress);
      await addDoc(collection(db, "syllabi"), {
        syllabus_id: syllabusId,
        faculty_id: currentUser.user_id,
        faculty_name: currentUser.name,
        subject: form.subject,
        course_code: form.course_code || "",
        semester: form.semester,
        academic_year: form.academic_year,
        description: form.description || "",
        file_url: url,
        file_name: name,
        status: "Pending",
        admin_notes: "",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setAddOpen(false);
      fetchSyllabi();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
      setProgress(0);
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────
  async function handleUpdate(form, file) {
    setSaving(true);
    setFormError("");
    setProgress(0);
    try {
      const updates = {
        subject: form.subject,
        course_code: form.course_code || "",
        semester: form.semester,
        academic_year: form.academic_year,
        description: form.description || "",
        status: "Pending",
        admin_notes: "",
        updated_at: serverTimestamp(),
      };

      // Only re-upload if a new file was selected
      if (file) {
        const { url, name } = await uploadFile(file, setProgress);
        updates.file_url = url;
        updates.file_name = name;
      }

      await updateDoc(doc(db, "syllabi", editTarget.id), updates);
      setEditTarget(null);
      fetchSyllabi();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
      setProgress(0);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  // NOTE: Cloudinary deletion requires a server-side signed request.
  // We delete the Firestore document only.
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "syllabi", deleteTarget.id));
      setDeleteTarget(null);
      fetchSyllabi();
    } catch (err) {
      setError("Delete failed: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return syllabi.filter((s) => {
      const matchQ =
        !q ||
        s.subject?.toLowerCase().includes(q) ||
        s.course_code?.toLowerCase().includes(q);
      const matchSem = !filterSem || s.semester === filterSem;
      const matchSt = !filterStatus || s.status === filterStatus;
      return matchQ && matchSem && matchSt;
    });
  }, [syllabi, search, filterSem, filterStatus]);

  // ── Render ────────────────────────────────────────────────────────────────
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

      {/* Toolbar */}
      <div className="syl-toolbar">
        <div className="syl-search-wrap">
          <SearchIcon />
          <input
            className="syl-search"
            placeholder="Search subject or course code…"
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
          value={filterSem}
          onChange={(e) => setFilterSem(e.target.value)}
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => (
            <option key={s}>{s}</option>
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
          <span className="syl-count">
            {filtered.length} syllab{filtered.length === 1 ? "us" : "i"}
          </span>
          <button
            className="syl-btn syl-btn--ghost syl-btn--sm"
            onClick={fetchSyllabi}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
          <button
            className="syl-btn syl-btn--primary syl-btn--sm"
            onClick={() => {
              setFormError("");
              setAddOpen(true);
            }}
          >
            <PlusIcon /> Upload Syllabus
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="syl-grid">
        {loading ? (
          <div className="syl-loading">
            <SpinnerIcon />
            <span>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="syl-empty">
            <span>{syllabi.length === 0 ? "📋" : "🔍"}</span>
            <p>
              {syllabi.length === 0
                ? "No syllabi uploaded yet."
                : "No matches found."}
            </p>
            {syllabi.length === 0 && (
              <button
                className="syl-btn syl-btn--primary"
                onClick={() => {
                  setFormError("");
                  setAddOpen(true);
                }}
              >
                <PlusIcon /> Upload First Syllabus
              </button>
            )}
          </div>
        ) : (
          filtered.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.Pending;
            return (
              <div key={s.id} className="syl-card">
                <div className="syl-card-top">
                  <div className="syl-card-icon">📋</div>
                  <span className={`syl-chip ${meta.cls}`}>{meta.label}</span>
                </div>
                <h3 className="syl-card-subject">{s.subject}</h3>
                <div className="syl-card-meta">
                  {s.course_code && (
                    <span className="syl-card-code">{s.course_code}</span>
                  )}
                  <span>{s.semester}</span>
                  <span>{s.academic_year}</span>
                </div>
                {s.description && (
                  <p className="syl-card-desc">{s.description}</p>
                )}
                {s.admin_notes && s.status === "Rejected" && (
                  <div className="syl-card-note">💬 {s.admin_notes}</div>
                )}
                <div className="syl-card-actions">
                  <button
                    className="syl-action-btn"
                    onClick={() => setViewTarget(s)}
                    title="View"
                  >
                    <EyeIcon />
                  </button>
                  <button
                    className="syl-action-btn syl-action-btn--edit"
                    onClick={() => {
                      setFormError("");
                      setEditTarget(s);
                    }}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="syl-action-btn syl-action-btn--delete"
                    onClick={() => setDeleteTarget(s)}
                    title="Delete"
                  >
                    <TrashIcon />
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {viewTarget && (
        <ViewModal
          syllabus={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={(s) => {
            setFormError("");
            setEditTarget(s);
          }}
          onDelete={(s) => setDeleteTarget(s)}
        />
      )}
      {addOpen && (
        <SyllabusFormModal
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
          saving={saving}
          error={formError}
          progress={progress}
        />
      )}
      {editTarget && (
        <SyllabusFormModal
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          saving={saving}
          error={formError}
          progress={progress}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          syllabus={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, secondaryAuth, storage } from "../config/firebase";
import "../styles/CollegeResearch.css";

// ── Constants ──────────────────────────────────────────────
const CATEGORIES = [
  "Thesis",
  "Capstone Project",
  "Journal Article",
  "Research Paper",
  "Conference Paper",
  "Other",
];

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Information Systems",
  "Computer Engineering",
  "General Education",
];

const STATUSES = ["Published", "Under Review", "Draft", "Archived"];

const CAT_COLORS = {
  Thesis: { bg: "rgba(99,102,241,0.18)", text: "#a5b4fc", dot: "#6366f1" },
  "Capstone Project": {
    bg: "rgba(249,115,22,0.18)",
    text: "#fdba74",
    dot: "#f97316",
  },
  "Journal Article": {
    bg: "rgba(34,197,94,0.18)",
    text: "#86efac",
    dot: "#22c55e",
  },
  "Research Paper": {
    bg: "rgba(251,191,36,0.18)",
    text: "#fde68a",
    dot: "#fbbf24",
  },
  "Conference Paper": {
    bg: "rgba(236,72,153,0.18)",
    text: "#f9a8d4",
    dot: "#ec4899",
  },
  Other: { bg: "rgba(148,163,184,0.18)", text: "#cbd5e1", dot: "#94a3b8" },
};

const EMPTY_FORM = {
  title: "",
  abstract: "",
  authorsRaw: "",
  department: "",
  category: "Research Paper",
  year: new Date().getFullYear().toString(),
  status: "Published",
  keywordsRaw: "",
  pdfUrl: "",
  pdfName: "",
};

// ── Helpers ────────────────────────────────────────────────
function splitTags(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinTags(arr) {
  return (arr ?? []).join(", ");
}

// ── Portal ─────────────────────────────────────────────────
function ModalPortal({ children }) {
  return createPortal(children, document.body);
}
function ModalBase({ onClose, children, maxWidth = "680px" }) {
  return (
    <ModalPortal>
      <div className="cr-overlay" onClick={onClose}>
        <div
          className="cr-modal"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// ── Icons ──────────────────────────────────────────────────
const Icon = ({ d, size = 15, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {d}
  </svg>
);
const PlusIcon = () => (
  <Icon
    size={15}
    d={
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    }
    strokeWidth="2.5"
  />
);
const EditIcon = () => (
  <Icon
    size={13}
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
    size={13}
    d={
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
      </>
    }
  />
);
const CloseIcon = ({ size = 16 }) => (
  <Icon
    size={size}
    d={
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    }
    strokeWidth="2.5"
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
const EyeIcon = () => (
  <Icon
    size={13}
    d={
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    }
  />
);
const PdfIcon = () => (
  <Icon
    size={28}
    d={
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </>
    }
  />
);
const UploadIcon = () => (
  <Icon
    size={22}
    d={
      <>
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </>
    }
  />
);
const LinkIcon = () => (
  <Icon
    size={13}
    d={
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    }
  />
);
const UserIcon = () => (
  <Icon
    size={12}
    d={
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    }
  />
);
const TagIcon = () => (
  <Icon
    size={12}
    d={
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    }
  />
);
const BookIcon = () => (
  <Icon
    size={12}
    d={
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
      animation: "cr-spin 0.8s linear infinite",
      display: "inline-block",
    }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Badges ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Published: "cr-badge--published",
    "Under Review": "cr-badge--review",
    Draft: "cr-badge--draft",
    Archived: "cr-badge--archived",
  };
  return <span className={`cr-badge ${map[status] ?? ""}`}>{status}</span>;
}
function CatChip({ cat }) {
  const c = CAT_COLORS[cat] ?? CAT_COLORS.Other;
  return (
    <span className="cr-cat-chip" style={{ background: c.bg, color: c.text }}>
      <span className="cr-cat-dot" style={{ background: c.dot }} />
      {cat}
    </span>
  );
}

// ── PDF Upload Zone ────────────────────────────────────────
function PdfUploadZone({
  pdfName,
  pdfUrl,
  onUpload,
  onClear,
  uploading,
  progress,
}) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (!file || file.type !== "application/pdf") return;
    onUpload(file);
  }

  return (
    <div className="cr-upload-zone-wrap">
      {pdfUrl ? (
        <div className="cr-pdf-attached">
          <div className="cr-pdf-icon-wrap">
            <PdfIcon />
          </div>
          <div className="cr-pdf-info">
            <span className="cr-pdf-name">{pdfName || "research.pdf"}</span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cr-pdf-link"
            >
              <LinkIcon /> View PDF
            </a>
          </div>
          <button
            type="button"
            className="cr-pdf-remove"
            onClick={onClear}
            title="Remove PDF"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`cr-upload-zone ${
            dragging ? "cr-upload-zone--drag" : ""
          } ${uploading ? "cr-upload-zone--uploading" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="cr-upload-progress">
              <SpinnerIcon />
              <span>Uploading… {progress}%</span>
              <div className="cr-progress-bar">
                <div
                  className="cr-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="cr-upload-prompt">
              <UploadIcon />
              <span className="cr-upload-label">
                Drop PDF here or <u>browse</u>
              </span>
              <span className="cr-upload-hint">PDF files only</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────
function ViewModal({ research, onClose, onEdit, onDelete }) {
  if (!research) return null;
  const authors = research.authors ?? [];
  const keywords = research.keywords ?? [];

  return (
    <ModalBase onClose={onClose} maxWidth="720px">
      <div className="cr-modal-header">
        <div
          className="cr-modal-icon"
          style={{ background: CAT_COLORS[research.category]?.bg }}
        >
          🔬
        </div>
        <div className="cr-modal-identity">
          <h2 className="cr-modal-title">{research.title}</h2>
          <div className="cr-modal-chips">
            <CatChip cat={research.category} />
            <StatusBadge status={research.status} />
            {research.year && (
              <span className="cr-year-chip">{research.year}</span>
            )}
          </div>
        </div>
        <button className="cr-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="cr-modal-body">
        {/* Meta row */}
        <div className="cr-view-meta">
          {research.department && (
            <div className="cr-meta-item">
              <BookIcon />
              <span>{research.department}</span>
            </div>
          )}
          {authors.length > 0 && (
            <div className="cr-meta-item">
              <UserIcon />
              <span>{authors.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Abstract */}
        {research.abstract && (
          <div className="cr-view-section">
            <span className="cr-view-label">Abstract</span>
            <p className="cr-abstract-text">{research.abstract}</p>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="cr-view-section">
            <span className="cr-view-label">Keywords</span>
            <div className="cr-keyword-tags">
              {keywords.map((k) => (
                <span key={k} className="cr-keyword-tag">
                  <TagIcon /> {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PDF */}
        {research.pdfUrl ? (
          <div className="cr-view-section">
            <span className="cr-view-label">Research Document</span>
            <div className="cr-pdf-preview-row">
              <div className="cr-pdf-preview-icon">
                <PdfIcon />
              </div>
              <div className="cr-pdf-preview-info">
                <span className="cr-pdf-name">
                  {research.pdfName || "research.pdf"}
                </span>
                <div className="cr-pdf-preview-actions">
                  <a
                    href={research.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cr-btn cr-btn--ghost cr-btn--sm"
                  >
                    <EyeIcon /> View PDF
                  </a>
                  <a
                    href={research.pdfUrl}
                    download={research.pdfName || "research.pdf"}
                    className="cr-btn cr-btn--primary cr-btn--sm"
                  >
                    ⬇ Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="cr-no-pdf">📄 No PDF attached to this research.</div>
        )}
      </div>

      <div className="cr-form-actions">
        <button className="cr-btn cr-btn--ghost" onClick={onClose}>
          Close
        </button>
        <button
          className="cr-btn cr-btn--danger-ghost"
          onClick={() => {
            onClose();
            onDelete(research);
          }}
        >
          <TrashIcon /> Delete
        </button>
        <button
          className="cr-btn cr-btn--primary"
          onClick={() => {
            onClose();
            onEdit(research);
          }}
        >
          <EditIcon /> Edit
        </button>
      </div>
    </ModalBase>
  );
}

// ── Form Modal ─────────────────────────────────────────────
function ResearchFormModal({ initial, onSave, onClose, saving, error }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_FORM,
          ...initial,
          authorsRaw: joinTags(initial.authors),
          keywordsRaw: joinTags(initial.keywords),
        }
      : { ...EMPTY_FORM }
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleUpload(file) {
    setUploading(true);
    setUploadProgress(50); // Optional: simulate progress

    const formData = new FormData();
    formData.append("file", file);
    // Replace these with your actual Cloudinary details
    formData.append("upload_preset", "research");

    try {
      // Note: 'raw' is used for PDFs/documents in Cloudinary, 'image' for pictures
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dimsjx2gq/raw/upload", // 👈 Changed back to raw
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        // Just use the direct URL Cloudinary gives us
        let finalUrl = data.secure_url;

        // Ensure it has the .pdf extension so Chrome knows how to read it
        if (!finalUrl.toLowerCase().endsWith(".pdf")) {
          finalUrl += ".pdf";
        }

        set("pdfUrl", finalUrl);
        set("pdfName", file.name);
        setUploadProgress(100);
      } else {
        console.error("Upload Error:", data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleClearPdf() {
    set("pdfUrl", "");
    set("pdfName", "");
  }

  return (
    <ModalBase onClose={onClose} maxWidth="720px">
      <div className="cr-modal-header">
        <div
          className="cr-modal-icon"
          style={{
            background:
              CAT_COLORS[form.category]?.bg ?? "rgba(249,115,22,0.15)",
          }}
        >
          🔬
        </div>
        <div className="cr-modal-identity">
          <h2 className="cr-modal-title">
            {isEdit ? "Edit Research" : "Publish Research"}
          </h2>
          <p className="cr-modal-sub">
            {isEdit
              ? "Update research record"
              : "Add a new research publication"}
          </p>
        </div>
        <button className="cr-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="cr-modal-body cr-modal-body--form">
        <form
          className="cr-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...form,
              authors: splitTags(form.authorsRaw),
              keywords: splitTags(form.keywordsRaw),
            });
          }}
        >
          <div className="cr-form-scroll">
            <div className="cr-form-section-title">Publication Details</div>
            <div className="cr-form-grid">
              <div className="cr-form-group cr-form-group--full">
                <label>Research Title *</label>
                <input
                  required
                  value={form.title}
                  placeholder="e.g. Deep Learning Approaches for Student Performance Prediction"
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="cr-form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="cr-form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="cr-form-group">
                <label>Department</label>
                <select
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="cr-form-group">
                <label>Year Published</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </div>
              <div className="cr-form-group cr-form-group--full">
                <label>
                  Authors{" "}
                  <span className="cr-form-hint">(comma-separated)</span>
                </label>
                <input
                  value={form.authorsRaw}
                  placeholder="e.g. Juan Dela Cruz, Maria Santos"
                  onChange={(e) => set("authorsRaw", e.target.value)}
                />
              </div>
              <div className="cr-form-group cr-form-group--full">
                <label>Abstract</label>
                <textarea
                  rows={4}
                  value={form.abstract}
                  placeholder="Brief summary of the research…"
                  onChange={(e) => set("abstract", e.target.value)}
                />
              </div>
              <div className="cr-form-group cr-form-group--full">
                <label>
                  Keywords{" "}
                  <span className="cr-form-hint">(comma-separated)</span>
                </label>
                <input
                  value={form.keywordsRaw}
                  placeholder="e.g. Machine Learning, Neural Networks, Education"
                  onChange={(e) => set("keywordsRaw", e.target.value)}
                />
              </div>
            </div>

            <div className="cr-form-section-title">Research Document (PDF)</div>
            <PdfUploadZone
              pdfName={form.pdfName}
              pdfUrl={form.pdfUrl}
              onUpload={handleUpload}
              onClear={handleClearPdf}
              uploading={uploading}
              progress={uploadProgress}
            />
          </div>

          {error && (
            <div className="cr-form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="cr-form-actions">
            <button
              type="button"
              className="cr-btn cr-btn--ghost"
              onClick={onClose}
              disabled={saving || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cr-btn cr-btn--primary"
              disabled={saving || uploading}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Publish Research"
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBase>
  );
}

// ── Delete Modal ───────────────────────────────────────────
function DeleteModal({ research, onConfirm, onClose, deleting }) {
  return (
    <ModalBase onClose={onClose} maxWidth="420px">
      <div className="cr-confirm-body">
        <div className="cr-confirm-icon">🗑️</div>
        <h3>Delete Research?</h3>
        <p>
          You are about to permanently delete{" "}
          <strong>"{research.title}"</strong>. The attached PDF will also be
          removed. This cannot be undone.
        </p>
        <div className="cr-form-actions cr-form-actions--center">
          <button
            className="cr-btn cr-btn--ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="cr-btn cr-btn--danger"
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

// ── Research Card ──────────────────────────────────────────
function ResearchCard({ research, onView, onEdit, onDelete, index }) {
  const authors = research.authors ?? [];
  const keywords = research.keywords ?? [];
  const c = CAT_COLORS[research.category] ?? CAT_COLORS.Other;

  return (
    <div className="cr-card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="cr-card-glow" style={{ background: c.dot }} />
      <div className="cr-card-top">
        <div className="cr-card-chips">
          <CatChip cat={research.category} />
          <StatusBadge status={research.status} />
          {research.year && (
            <span className="cr-year-chip">{research.year}</span>
          )}
        </div>
        <div className="cr-card-actions">
          <button
            className="cr-action-btn cr-action-btn--view"
            title="View"
            onClick={() => onView(research)}
          >
            <EyeIcon />
          </button>
          <button
            className="cr-action-btn cr-action-btn--edit"
            title="Edit"
            onClick={() => onEdit(research)}
          >
            <EditIcon />
          </button>
          <button
            className="cr-action-btn cr-action-btn--delete"
            title="Delete"
            onClick={() => onDelete(research)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <h3 className="cr-card-title" onClick={() => onView(research)}>
        {research.title}
      </h3>

      {authors.length > 0 && (
        <div className="cr-card-authors">
          <UserIcon />
          <span>
            {authors.slice(0, 3).join(", ")}
            {authors.length > 3 ? ` +${authors.length - 3} more` : ""}
          </span>
        </div>
      )}

      {research.department && (
        <div className="cr-card-dept">
          <BookIcon /> {research.department}
        </div>
      )}

      {research.abstract && (
        <p className="cr-card-abstract">{research.abstract}</p>
      )}

      {keywords.length > 0 && (
        <div className="cr-card-keywords">
          {keywords.slice(0, 4).map((k) => (
            <span key={k} className="cr-keyword-tag cr-keyword-tag--sm">
              {k}
            </span>
          ))}
          {keywords.length > 4 && (
            <span className="cr-keyword-more">+{keywords.length - 4}</span>
          )}
        </div>
      )}

      <div className="cr-card-footer">
        {research.pdfUrl ? (
          <a
            href={research.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cr-pdf-btn"
          >
            <PdfIcon /> View PDF
          </a>
        ) : (
          <span className="cr-no-pdf-label">No PDF attached</span>
        )}
        <button
          className="cr-btn cr-btn--ghost cr-btn--xs"
          onClick={() => onView(research)}
        >
          Read More →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function CollegeResearch() {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Fetch ──────────────────────────────────────────────
  const fetchResearch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "research"));
      setResearch(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load research: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  // ── CRUD ───────────────────────────────────────────────
  async function handleCreate(form) {
    setSaving(true);
    setFormError("");
    try {
      const { _docId, authorsRaw, keywordsRaw, ...data } = form;
      const ref2 = await addDoc(collection(db, "research"), data);
      setResearch((prev) => [...prev, { _docId: ref2.id, ...data }]);
      setAddOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(form) {
    setSaving(true);
    setFormError("");
    try {
      const { _docId, authorsRaw, keywordsRaw, ...data } = form;
      await updateDoc(doc(db, "research", editTarget._docId), data);
      setResearch((prev) =>
        prev.map((r) =>
          r._docId === editTarget._docId
            ? { _docId: editTarget._docId, ...data }
            : r
        )
      );
      setEditTarget(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Remove PDF from storage if exists
      if (deleteTarget.pdfUrl) {
        try {
          const pdfRef = ref(storage, deleteTarget.pdfUrl);
          await deleteObject(pdfRef);
        } catch (_) {
          /* ignore if already deleted */
        }
      }
      await deleteDoc(doc(db, "research", deleteTarget._docId));
      setResearch((prev) =>
        prev.filter((r) => r._docId !== deleteTarget._docId)
      );
      setDeleteTarget(null);
    } catch (err) {
      setError("Failed to delete: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Filter ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return research
      .filter((r) => {
        const matchSearch =
          !q ||
          r.title?.toLowerCase().includes(q) ||
          (r.authors ?? []).some((a) => a.toLowerCase().includes(q)) ||
          (r.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
          r.abstract?.toLowerCase().includes(q);
        const matchCat = !filterCat || r.category === filterCat;
        const matchDept = !filterDept || r.department === filterDept;
        const matchStatus = !filterStatus || r.status === filterStatus;
        return matchSearch && matchCat && matchDept && matchStatus;
      })
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }, [research, search, filterCat, filterDept, filterStatus]);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: research.length,
      published: research.filter((r) => r.status === "Published").length,
      review: research.filter((r) => r.status === "Under Review").length,
      withPdf: research.filter((r) => r.pdfUrl).length,
    }),
    [research]
  );

  return (
    <div className="cr-page">
      {error && (
        <div className="cr-error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="cr-stats">
        {[
          { label: "Total Research", value: stats.total, cls: "" },
          {
            label: "Published",
            value: stats.published,
            cls: "cr-stat--published",
          },
          {
            label: "Under Review",
            value: stats.review,
            cls: "cr-stat--review",
          },
          { label: "With PDF", value: stats.withPdf, cls: "cr-stat--pdf" },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`cr-stat ${cls}`}>
            <span className="cr-stat-value">{value}</span>
            <span className="cr-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="cr-toolbar">
        <div className="cr-search-wrap">
          <SearchIcon />
          <input
            className="cr-search-input"
            placeholder="Search by title, author, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="cr-search-clear" onClick={() => setSearch("")}>
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        <select
          className="cr-select"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="cr-select"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          className="cr-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <div className="cr-toolbar-right">
          <span className="cr-count">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            className="cr-btn cr-btn--ghost cr-btn--sm"
            onClick={fetchResearch}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
          <button
            className="cr-btn cr-btn--primary cr-btn--sm"
            onClick={() => {
              setFormError("");
              setAddOpen(true);
            }}
          >
            <PlusIcon /> Publish Research
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="cr-loading">
          <SpinnerIcon />
          <span>Loading research…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cr-empty-state">
          <span>{research.length === 0 ? "🔬" : "🔍"}</span>
          <p>
            {research.length === 0
              ? "No research published yet."
              : "No research matches the filters."}
          </p>
          {research.length === 0 && (
            <button
              className="cr-btn cr-btn--primary"
              onClick={() => {
                setFormError("");
                setAddOpen(true);
              }}
            >
              <PlusIcon /> Publish First Research
            </button>
          )}
        </div>
      ) : (
        <div className="cr-grid">
          {filtered.map((r, i) => (
            <ResearchCard
              key={r._docId}
              research={r}
              index={i}
              onView={setViewTarget}
              onEdit={(r) => {
                setFormError("");
                setEditTarget(r);
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {viewTarget && (
        <ViewModal
          research={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={(r) => {
            setFormError("");
            setEditTarget(r);
          }}
          onDelete={setDeleteTarget}
        />
      )}
      {addOpen && (
        <ResearchFormModal
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
          saving={saving}
          error={formError}
        />
      )}
      {editTarget && (
        <ResearchFormModal
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          saving={saving}
          error={formError}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          research={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

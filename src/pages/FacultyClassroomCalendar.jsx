// FacultyClassroomCalendar.jsx
// ─────────────────────────────────────────────────────────────────────────
// Weekly calendar of assigned sections → click opens Classroom view
// Classroom: post & manage lessons scoped to that section + subject
// ─────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/FacultyClassroomCalendar.css";

// ── Constants ─────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_START = 7;
const HOUR_END = 21;

const LESSON_TYPES = ["Lecture", "Lab", "Workshop", "Discussion", "Assessment"];
const CLOUDINARY_CLOUD = "dimsjx2gq";
const CLOUDINARY_PRESET = "research";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/raw/upload`;

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

// ── Helpers ───────────────────────────────────────────────────────────────
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
function genId(p = "ID") {
  return `${p}-${Date.now().toString(36).toUpperCase()}`;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────
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
const IcoClose = () => (
  <Ico
    size={15}
    sw={2.5}
    d={
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    }
  />
);
const IcoPlus = () => (
  <Ico
    size={15}
    sw={2.5}
    d={
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    }
  />
);
const IcoTrash = () => (
  <Ico
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
const IcoEdit = () => (
  <Ico
    size={14}
    d={
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    }
  />
);
const IcoUpload = () => (
  <Ico
    size={18}
    sw={1.5}
    d={
      <>
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </>
    }
  />
);
const IcoFile = () => (
  <Ico
    size={14}
    d={
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    }
  />
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
const IcoChevL = () => (
  <Ico size={16} d={<polyline points="15 18 9 12 15 6" />} />
);
const IcoChevR = () => (
  <Ico size={16} d={<polyline points="9 18 15 12 9 6" />} />
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

// ── File Drop Zone ────────────────────────────────────────────────────────
function DropZone({ file, onFile, disabled }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`fcc-drop ${drag ? "fcc-drop--active" : ""} ${
        file ? "fcc-drop--has" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!disabled && e.dataTransfer.files?.[0])
          onFile(e.dataTransfer.files[0]);
      }}
      onClick={() =>
        !disabled && document.getElementById("fcc-file-input")?.click()
      }
    >
      <input
        id="fcc-file-input"
        type="file"
        accept=".pdf,.pptx,.docx,.mp4,.zip"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="fcc-drop-file">
          <IcoFile />
          <span>{file.name || file}</span>
          {!disabled && (
            <button
              type="button"
              className="fcc-drop-rm"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
            >
              <IcoClose />
            </button>
          )}
        </div>
      ) : (
        <>
          <IcoUpload />
          <p>
            Drop file or <span>browse</span>
          </p>
          <p className="fcc-drop-hint">PDF · PPTX · DOCX · MP4 · ZIP</p>
        </>
      )}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="fcc-prog-wrap">
      <div className="fcc-prog-bar" style={{ width: `${value}%` }} />
      <span>{Math.round(value)}%</span>
    </div>
  );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────
function Modal({ onClose, children, maxW = "680px" }) {
  return createPortal(
    <div className="fcc-overlay" onClick={onClose}>
      <div
        className="fcc-modal"
        style={{ maxWidth: maxW }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ── Lesson Form Modal ─────────────────────────────────────────────────────
function LessonFormModal({
  initial,
  sectionId,
  sectionName,
  subjectCode,
  subjectName,
  onSave,
  onClose,
  saving,
  error,
  progress,
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    title: initial?.title || "",
    lesson_type: initial?.lesson_type || LESSON_TYPES[0],
    description: initial?.description || "",
    objectives: initial?.objectives || "",
  });
  const [file, setFile] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal onClose={onClose}>
      <div className="fcc-mhd">
        <div>
          <h2>{isEdit ? "Edit Lesson" : "Post New Lesson"}</h2>
          <p>
            {sectionName} · {subjectCode} – {subjectName}
          </p>
        </div>
        <button className="fcc-mhd-close" onClick={onClose}>
          <IcoClose />
        </button>
      </div>

      <form
        className="fcc-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form, file);
        }}
      >
        <div className="fcc-form-grid">
          <div className="fcc-fg fcc-fg--full">
            <label>Lesson Title *</label>
            <input
              required
              value={form.title}
              placeholder="e.g. Introduction to Variables"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="fcc-fg">
            <label>Lesson Type</label>
            <select
              value={form.lesson_type}
              onChange={(e) => set("lesson_type", e.target.value)}
            >
              {LESSON_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="fcc-fg fcc-fg--full">
            <label>Description</label>
            <textarea
              rows={2}
              value={form.description}
              placeholder="Brief overview…"
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="fcc-fg fcc-fg--full">
            <label>Learning Objectives</label>
            <textarea
              rows={3}
              value={form.objectives}
              placeholder="By the end of this lesson, students should be able to…"
              onChange={(e) => set("objectives", e.target.value)}
            />
          </div>
          <div className="fcc-fg fcc-fg--full">
            <label>
              {isEdit ? "Replace File (optional)" : "Lesson File *"}
            </label>
            <DropZone file={file} onFile={setFile} disabled={saving} />
            {isEdit && initial.file_name && !file && (
              <span className="fcc-hint">Current: {initial.file_name}</span>
            )}
          </div>
        </div>

        {progress > 0 && progress < 100 && <ProgressBar value={progress} />}
        {error && <div className="fcc-err">⚠ {error}</div>}

        <div className="fcc-form-actions">
          <button
            type="button"
            className="fcc-btn fcc-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="fcc-btn fcc-btn--primary"
            disabled={saving || (!isEdit && !file)}
          >
            {saving ? (
              <>
                <Spinner /> Uploading…
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Post Lesson"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onClose, busy }) {
  return (
    <Modal onClose={onClose} maxW="380px">
      <div className="fcc-confirm">
        <div className="fcc-confirm-ico">🗑️</div>
        <h3>Delete Lesson?</h3>
        <p>
          Permanently remove <strong>{title}</strong>? This cannot be undone.
        </p>
        <div className="fcc-form-actions fcc-form-actions--center">
          <button
            className="fcc-btn fcc-btn--ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="fcc-btn fcc-btn--danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <Spinner /> Deleting…
              </>
            ) : (
              "Yes, Delete"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Classroom Panel ───────────────────────────────────────────────────────
function Classroom({ schedule, colorMap, onBack, currentUser }) {
  const accentColor = colorMap[schedule.subjectCode] ?? PALETTE[0];

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [prog, setProg] = useState(0);
  const [filterType, setFilterType] = useState("");

  // Fetch lessons for this section + subject
  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "lessons"),
        where("faculty_id", "==", currentUser.user_id),
        where("section_id", "==", schedule.sectionId),
        where("subject_code", "==", schedule.subjectCode)
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
  }, [currentUser.user_id, schedule.sectionId, schedule.subjectCode]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Upload helper
  async function uploadFile(file, onProg) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProg(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url)
            resolve({ url: data.secure_url, name: file.name });
          else reject(new Error(data.error?.message || "Upload failed"));
        } catch {
          reject(new Error("Invalid Cloudinary response"));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("POST", CLOUDINARY_URL);
      xhr.send(fd);
    });
  }

  async function handleCreate(form, file) {
    if (!file) {
      setFormErr("Please select a file.");
      return;
    }
    setSaving(true);
    setFormErr("");
    setProg(0);
    try {
      const { url, name } = await uploadFile(file, setProg);
      await addDoc(collection(db, "lessons"), {
        lesson_id: genId("LES"),
        faculty_id: currentUser.user_id,
        faculty_name: currentUser.name,
        section_id: schedule.sectionId,
        section_name: schedule.sectionName,
        subject_code: schedule.subjectCode,
        subject_name: schedule.subjectName,
        title: form.title,
        lesson_type: form.lesson_type,
        description: form.description || "",
        objectives: form.objectives || "",
        file_url: url,
        file_name: name,
        status: "Pending",
        admin_notes: "",
        quizzes: [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setAddOpen(false);
      fetchLessons();
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
      setProg(0);
    }
  }

  async function handleUpdate(form, file) {
    setSaving(true);
    setFormErr("");
    setProg(0);
    try {
      const updates = {
        title: form.title,
        lesson_type: form.lesson_type,
        description: form.description || "",
        objectives: form.objectives || "",
        status: "Pending",
        admin_notes: "",
        updated_at: serverTimestamp(),
      };
      if (file) {
        const { url, name } = await uploadFile(file, setProg);
        updates.file_url = url;
        updates.file_name = name;
      }
      await updateDoc(doc(db, "lessons", editItem.id), updates);
      setEditItem(null);
      fetchLessons();
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
      setProg(0);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "lessons", delItem.id));
      setDelItem(null);
      fetchLessons();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(
    () =>
      filterType
        ? lessons.filter((l) => l.lesson_type === filterType)
        : lessons,
    [lessons, filterType]
  );

  const STATUS_CLS = {
    Approved: "fcc-badge--approved",
    Rejected: "fcc-badge--rejected",
    Pending: "fcc-badge--pending",
  };

  return (
    <div className="fcc-classroom">
      {/* Classroom header */}
      <div className="fcc-cr-header" style={{ "--accent": accentColor }}>
        <button className="fcc-back-btn" onClick={onBack}>
          <IcoChevL /> Back to Calendar
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
              <span>🏫 {schedule.room}</span>
              <span className="fcc-cr-sep">·</span>
              <span>
                ⏰ {fmt12(schedule.timeStart)} – {fmt12(schedule.timeEnd)}
              </span>
              <span className="fcc-cr-sep">·</span>
              <span>📅 {(schedule.days ?? []).join(", ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom toolbar */}
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
          <button
            className="fcc-btn fcc-btn--primary fcc-btn--sm"
            style={{ "--accent": accentColor }}
            onClick={() => {
              setFormErr("");
              setAddOpen(true);
            }}
          >
            <IcoPlus /> Post Lesson
          </button>
        </div>
      </div>

      {/* Lesson list */}
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
              {lessons.length === 0 ? "No lessons posted yet." : "No matches."}
            </p>
            {lessons.length === 0 && (
              <button
                className="fcc-btn fcc-btn--primary"
                style={{ "--accent": accentColor }}
                onClick={() => {
                  setFormErr("");
                  setAddOpen(true);
                }}
              >
                <IcoPlus /> Post First Lesson
              </button>
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
                    <span
                      className={`fcc-badge ${
                        STATUS_CLS[l.status] ?? "fcc-badge--pending"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                </div>
                <h3 className="fcc-lc-title">{l.title}</h3>
                {l.description && (
                  <p className="fcc-lc-desc">{l.description}</p>
                )}
                {l.admin_notes && l.status === "Rejected" && (
                  <div className="fcc-lc-note">💬 {l.admin_notes}</div>
                )}
                <div className="fcc-lc-actions">
                  {l.file_url && (
                    <a
                      className="fcc-icon-btn fcc-icon-btn--dl"
                      href={l.file_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Download"
                    >
                      <IcoDL />
                    </a>
                  )}
                  <button
                    className="fcc-icon-btn fcc-icon-btn--edit"
                    onClick={() => {
                      setFormErr("");
                      setEditItem(l);
                    }}
                    title="Edit"
                  >
                    <IcoEdit />
                  </button>
                  <button
                    className="fcc-icon-btn fcc-icon-btn--del"
                    onClick={() => setDelItem(l)}
                    title="Delete"
                  >
                    <IcoTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && (
        <LessonFormModal
          sectionId={schedule.sectionId}
          sectionName={schedule.sectionName}
          subjectCode={schedule.subjectCode}
          subjectName={schedule.subjectName}
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
          saving={saving}
          error={formErr}
          progress={prog}
        />
      )}
      {editItem && (
        <LessonFormModal
          initial={editItem}
          sectionId={schedule.sectionId}
          sectionName={schedule.sectionName}
          subjectCode={schedule.subjectCode}
          subjectName={schedule.subjectName}
          onSave={handleUpdate}
          onClose={() => setEditItem(null)}
          saving={saving}
          error={formErr}
          progress={prog}
        />
      )}
      {delItem && (
        <DeleteModal
          title={delItem.title}
          onConfirm={handleDelete}
          onClose={() => setDelItem(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}

// ── Calendar Timetable ────────────────────────────────────────────────────
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
        const dayScheds = schedules.filter((s) => s.days?.includes(day));
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
                    title={`${s.subjectName} — click to open classroom`}
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

// ── Schedule List (alternative list view) ────────────────────────────────
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
              .sort(
                (a, b) => a.timeStart?.localeCompare(b.timeStart ?? "") ?? 0
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
                      <span>👥 {s.sectionName}</span>
                      <span>🏫 {s.room}</span>
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

// ══════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════
export default function FacultyClassroomCalendar() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("calendar"); // "calendar" | "list"
  const [classroom, setClassroom] = useState(null); // selected schedule entry

  const fetchSchedules = useCallback(async () => {
    if (!currentUser?.user_id) return;
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "schedules"),
        where("facultyId", "==", currentUser.user_id)
      );
      const snap = await getDocs(q);
      setSchedules(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    } catch (e) {
      setError("Failed to load schedule: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.user_id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const colorMap = useMemo(() => {
    const map = {};
    [...new Set(schedules.map((s) => s.subjectCode))].forEach((code, i) => {
      map[code] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [schedules]);

  // ── Classroom view ────────────────────────────────────────────────────
  if (classroom) {
    return (
      <Classroom
        schedule={classroom}
        colorMap={colorMap}
        onBack={() => setClassroom(null)}
        currentUser={currentUser}
      />
    );
  }

  // ── Calendar / List view ──────────────────────────────────────────────
  return (
    <div className="fcc-page">
      {/* Page header */}
      <div className="fcc-page-hd">
        <div>
          <h1 className="fcc-page-title">My Classrooms</h1>
          <p className="fcc-page-sub">
            Your assigned schedule — click any class to enter the classroom and
            post lessons.
          </p>
        </div>
        <div className="fcc-page-hd-right">
          <button
            className="fcc-btn fcc-btn--ghost fcc-btn--sm"
            onClick={fetchSchedules}
          >
            <IcoRefresh />
          </button>
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

      {error && <div className="fcc-alert">⚠ {error}</div>}

      {/* Legend */}
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

      {/* Click-to-open hint */}
      {!loading && schedules.length > 0 && (
        <div className="fcc-hint-bar">
          💡 Click any class block to open the classroom and post lessons for
          that section.
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="fcc-loading">
          <Spinner />
          <span>Loading schedule…</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="fcc-empty">
          <span>📅</span>
          <p>No schedule assigned yet.</p>
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

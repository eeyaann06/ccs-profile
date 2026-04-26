import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import "../styles/Events.css";

// ── Constants ──────────────────────────────────────────────
const EVENT_TYPES = [
  "Academic",
  "Cultural",
  "Sports",
  "Seminar",
  "Workshop",
  "Meeting",
  "Other",
];

const EVENT_STATUSES = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

const TYPE_COLORS = {
  Academic: { bg: "rgba(99,102,241,0.18)", text: "#a5b4fc", dot: "#6366f1" },
  Cultural: { bg: "rgba(236,72,153,0.18)", text: "#f9a8d4", dot: "#ec4899" },
  Sports: { bg: "rgba(34,197,94,0.18)", text: "#86efac", dot: "#22c55e" },
  Seminar: { bg: "rgba(249,115,22,0.18)", text: "#fdba74", dot: "#f97316" },
  Workshop: { bg: "rgba(251,191,36,0.18)", text: "#fde68a", dot: "#fbbf24" },
  Meeting: { bg: "rgba(20,184,166,0.18)", text: "#99f6e4", dot: "#14b8a6" },
  Other: { bg: "rgba(148,163,184,0.18)", text: "#cbd5e1", dot: "#94a3b8" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  location: "",
  type: "Academic",
  status: "Upcoming",
  organizer: "",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, min] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${min} ${hour < 12 ? "AM" : "PM"}`;
}

// ── Portal ─────────────────────────────────────────────────
function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

function ModalBase({ onClose, children, maxWidth = "640px" }) {
  return (
    <ModalPortal>
      <div className="ev-overlay" onClick={onClose}>
        <div
          className="ev-modal"
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
function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}
function CloseIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CalendarIcon() {
  return (
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
  );
}
function ListIcon() {
  return (
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
  );
}
function ChevronIcon({ dir = "left" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      {dir === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{
        animation: "ev-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Upcoming: "ev-badge--upcoming",
    Ongoing: "ev-badge--ongoing",
    Completed: "ev-badge--completed",
    Cancelled: "ev-badge--cancelled",
  };
  return <span className={`ev-badge ${map[status] ?? ""}`}>{status}</span>;
}

// ── Type chip ──────────────────────────────────────────────
function TypeChip({ type }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.Other;
  return (
    <span className="ev-type-chip" style={{ background: c.bg, color: c.text }}>
      <span className="ev-type-dot" style={{ background: c.dot }} />
      {type}
    </span>
  );
}

// ── View Modal ─────────────────────────────────────────────
function ViewModal({ event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  return (
    <ModalBase onClose={onClose}>
      <div className="ev-modal-header">
        <div
          className="ev-modal-icon"
          style={{
            background: TYPE_COLORS[event.type]?.bg ?? "rgba(249,115,22,0.15)",
          }}
        >
          📅
        </div>
        <div className="ev-modal-identity">
          <h2 className="ev-modal-title">{event.title}</h2>
          <div className="ev-modal-chips">
            <TypeChip type={event.type} />
            <StatusBadge status={event.status} />
          </div>
        </div>
        <button className="ev-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="ev-modal-body">
        <div className="ev-view-meta">
          <div className="ev-meta-item">
            <CalendarIcon />
            <span>{formatDate(event.date)}</span>
          </div>
          {(event.timeStart || event.timeEnd) && (
            <div className="ev-meta-item">
              <ClockIcon />
              <span>
                {formatTime(event.timeStart)}
                {event.timeEnd ? ` – ${formatTime(event.timeEnd)}` : ""}
              </span>
            </div>
          )}
          {event.location && (
            <div className="ev-meta-item">
              <MapPinIcon />
              <span>{event.location}</span>
            </div>
          )}
          {event.organizer && (
            <div className="ev-meta-item">
              <UserIcon />
              <span>{event.organizer}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="ev-view-desc">
            <span className="ev-view-label">Description</span>
            <p>{event.description}</p>
          </div>
        )}
      </div>

      <div className="ev-form-actions">
        <button className="ev-btn ev-btn--ghost" onClick={onClose}>
          Close
        </button>
        <button
          className="ev-btn ev-btn--danger-ghost"
          onClick={() => {
            onClose();
            onDelete(event);
          }}
        >
          <TrashIcon /> Delete
        </button>
        <button
          className="ev-btn ev-btn--primary"
          onClick={() => {
            onClose();
            onEdit(event);
          }}
        >
          <EditIcon /> Edit
        </button>
      </div>
    </ModalBase>
  );
}

// ── Form Modal ─────────────────────────────────────────────
function EventFormModal({ initial, onSave, onClose, saving, error }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() =>
    isEdit ? { ...EMPTY_FORM, ...initial } : { ...EMPTY_FORM }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalBase onClose={onClose} maxWidth="680px">
      <div className="ev-modal-header">
        <div
          className="ev-modal-icon"
          style={{
            background: TYPE_COLORS[form.type]?.bg ?? "rgba(249,115,22,0.15)",
          }}
        >
          📅
        </div>
        <div className="ev-modal-identity">
          <h2 className="ev-modal-title">
            {isEdit ? "Edit Event" : "Add New Event"}
          </h2>
          <p className="ev-modal-sub">
            {isEdit
              ? formatDate(initial.date)
              : "Fill in the event details below"}
          </p>
        </div>
        <button className="ev-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="ev-modal-body ev-modal-body--form">
        <form
          className="ev-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <div className="ev-form-scroll">
            {/* Event Info */}
            <div className="ev-form-section-title">Event Information</div>
            <div className="ev-form-grid">
              <div className="ev-form-group ev-form-group--full">
                <label>Event Title *</label>
                <input
                  required
                  value={form.title}
                  placeholder="e.g. CCS Intramurals 2025"
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="ev-form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="ev-form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {EVENT_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="ev-form-group ev-form-group--full">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  placeholder="Brief description of the event…"
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="ev-form-section-title">Schedule & Location</div>
            <div className="ev-form-grid">
              <div className="ev-form-group">
                <label>Date *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className="ev-form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={form.timeStart}
                  onChange={(e) => set("timeStart", e.target.value)}
                />
              </div>
              <div className="ev-form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={form.timeEnd}
                  onChange={(e) => set("timeEnd", e.target.value)}
                />
              </div>
              <div className="ev-form-group">
                <label>Location / Venue</label>
                <input
                  value={form.location}
                  placeholder="e.g. CCS Gymnasium"
                  onChange={(e) => set("location", e.target.value)}
                />
              </div>
              <div className="ev-form-group">
                <label>Organizer</label>
                <input
                  value={form.organizer}
                  placeholder="e.g. SSC-CCS"
                  onChange={(e) => set("organizer", e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="ev-form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="ev-form-actions">
            <button
              type="button"
              className="ev-btn ev-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ev-btn ev-btn--primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBase>
  );
}

// ── Delete Modal ───────────────────────────────────────────
function DeleteModal({ event, onConfirm, onClose, deleting }) {
  return (
    <ModalBase onClose={onClose} maxWidth="420px">
      <div className="ev-confirm-body">
        <div className="ev-confirm-icon">🗑️</div>
        <h3>Delete Event?</h3>
        <p>
          You are about to permanently delete <strong>{event.title}</strong>{" "}
          scheduled on <strong>{formatDate(event.date)}</strong>. This cannot be
          undone.
        </p>
        <div className="ev-form-actions ev-form-actions--center">
          <button
            className="ev-btn ev-btn--ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="ev-btn ev-btn--danger"
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

// ── Calendar View ──────────────────────────────────────────
function CalendarView({ events, onEventClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.date) return;
      const key = ev.date; // "YYYY-MM-DD"
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="ev-calendar">
      {/* Calendar header */}
      <div className="ev-cal-header">
        <button className="ev-cal-nav" onClick={prevMonth}>
          <ChevronIcon dir="left" />
        </button>
        <h3 className="ev-cal-title">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button className="ev-cal-nav" onClick={nextMonth}>
          <ChevronIcon dir="right" />
        </button>
        <button
          className="ev-cal-today"
          onClick={() => {
            setViewMonth(today.getMonth());
            setViewYear(today.getFullYear());
          }}
        >
          Today
        </button>
      </div>

      {/* Day labels */}
      <div className="ev-cal-days">
        {DAYS.map((d) => (
          <div key={d} className="ev-cal-day-label">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="ev-cal-grid">
        {cells.map((day, idx) => {
          if (!day)
            return (
              <div
                key={`empty-${idx}`}
                className="ev-cal-cell ev-cal-cell--empty"
              />
            );
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventMap[dateStr] ?? [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`ev-cal-cell ${isToday ? "ev-cal-cell--today" : ""} ${
                dayEvents.length ? "ev-cal-cell--has-events" : ""
              }`}
            >
              <span className="ev-cal-date">{day}</span>
              <div className="ev-cal-dots">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <button
                    key={i}
                    className="ev-cal-event-pill"
                    style={{
                      background: TYPE_COLORS[ev.type]?.bg,
                      color: TYPE_COLORS[ev.type]?.text,
                    }}
                    onClick={() => onEventClick(ev)}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="ev-cal-more">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("calendar"); // "calendar" | "list"

  // Search & filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal state
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Fetch ────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "events"));
      setEvents(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load events: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── CRUD ─────────────────────────────────────────────────
  async function handleCreate(form) {
    setSaving(true);
    setFormError("");
    try {
      const data = { ...form };
      const ref = await addDoc(collection(db, "events"), data);
      setEvents((prev) => [...prev, { _docId: ref.id, ...data }]);
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
      const { _docId, ...data } = form;
      await updateDoc(doc(db, "events", editTarget._docId), data);
      setEvents((prev) =>
        prev.map((e) =>
          e._docId === editTarget._docId
            ? { _docId: editTarget._docId, ...data }
            : e
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
      await deleteDoc(doc(db, "events", deleteTarget._docId));
      setEvents((prev) => prev.filter((e) => e._docId !== deleteTarget._docId));
      setDeleteTarget(null);
    } catch (err) {
      setError("Failed to delete event: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Filter ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events
      .filter((e) => {
        const matchSearch =
          !q ||
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q);
        const matchType = !filterType || e.type === filterType;
        const matchStatus = !filterStatus || e.status === filterStatus;
        return matchSearch && matchType && matchStatus;
      })
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }, [events, search, filterType, filterStatus]);

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) => e.status === "Upcoming").length,
      ongoing: events.filter((e) => e.status === "Ongoing").length,
      completed: events.filter((e) => e.status === "Completed").length,
    }),
    [events]
  );

  return (
    <div className="ev-page">
      {/* Error banner */}
      {error && (
        <div className="ev-error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="ev-stats">
        {[
          { label: "Total Events", value: stats.total, cls: "" },
          {
            label: "Upcoming",
            value: stats.upcoming,
            cls: "ev-stat--upcoming",
          },
          { label: "Ongoing", value: stats.ongoing, cls: "ev-stat--ongoing" },
          {
            label: "Completed",
            value: stats.completed,
            cls: "ev-stat--completed",
          },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`ev-stat ${cls}`}>
            <span className="ev-stat-value">{value}</span>
            <span className="ev-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ev-toolbar">
        <div className="ev-search-wrap">
          <SearchIcon />
          <input
            className="ev-search-input"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="ev-search-clear" onClick={() => setSearch("")}>
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        <select
          className="ev-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          className="ev-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {EVENT_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <div className="ev-view-toggle">
          <button
            className={`ev-view-btn ${
              view === "calendar" ? "ev-view-btn--active" : ""
            }`}
            onClick={() => setView("calendar")}
          >
            <CalendarIcon /> Calendar
          </button>
          <button
            className={`ev-view-btn ${
              view === "list" ? "ev-view-btn--active" : ""
            }`}
            onClick={() => setView("list")}
          >
            <ListIcon /> List
          </button>
        </div>

        <div className="ev-toolbar-right">
          <button
            className="ev-btn ev-btn--ghost ev-btn--sm"
            onClick={fetchEvents}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
          <button
            className="ev-btn ev-btn--primary ev-btn--sm"
            onClick={() => {
              setFormError("");
              setAddOpen(true);
            }}
          >
            <PlusIcon /> Add Event
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="ev-loading">
          <SpinnerIcon />
          <span>Loading events…</span>
        </div>
      ) : (
        <>
          {view === "calendar" ? (
            <CalendarView events={filtered} onEventClick={setViewTarget} />
          ) : (
            // List View
            <div className="ev-list-wrap">
              {filtered.length === 0 ? (
                <div className="ev-empty-state">
                  <span>{events.length === 0 ? "📅" : "🔍"}</span>
                  <p>
                    {events.length === 0
                      ? "No events yet."
                      : "No events match the filters."}
                  </p>
                  {events.length === 0 && (
                    <button
                      className="ev-btn ev-btn--primary"
                      onClick={() => {
                        setFormError("");
                        setAddOpen(true);
                      }}
                    >
                      <PlusIcon /> Add First Event
                    </button>
                  )}
                </div>
              ) : (
                <div className="ev-list">
                  {filtered.map((ev) => (
                    <div key={ev._docId} className="ev-card">
                      <div
                        className="ev-card-accent"
                        style={{
                          background: TYPE_COLORS[ev.type]?.dot ?? "#f97316",
                        }}
                      />
                      <div className="ev-card-date">
                        <span className="ev-card-month">
                          {ev.date
                            ? MONTHS[
                                parseInt(ev.date.split("-")[1]) - 1
                              ]?.slice(0, 3)
                            : "—"}
                        </span>
                        <span className="ev-card-day">
                          {ev.date ? parseInt(ev.date.split("-")[2]) : "—"}
                        </span>
                        <span className="ev-card-year">
                          {ev.date ? ev.date.split("-")[0] : ""}
                        </span>
                      </div>
                      <div className="ev-card-body">
                        <div className="ev-card-top">
                          <h3 className="ev-card-title">{ev.title}</h3>
                          <div className="ev-card-chips">
                            <TypeChip type={ev.type} />
                            <StatusBadge status={ev.status} />
                          </div>
                        </div>
                        <div className="ev-card-meta">
                          {ev.timeStart && (
                            <span>
                              <ClockIcon /> {formatTime(ev.timeStart)}
                              {ev.timeEnd ? ` – ${formatTime(ev.timeEnd)}` : ""}
                            </span>
                          )}
                          {ev.location && (
                            <span>
                              <MapPinIcon /> {ev.location}
                            </span>
                          )}
                          {ev.organizer && (
                            <span>
                              <UserIcon /> {ev.organizer}
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="ev-card-desc">{ev.description}</p>
                        )}
                      </div>
                      <div className="ev-card-actions">
                        <button
                          className="ev-action-btn ev-action-btn--view"
                          title="View"
                          onClick={() => setViewTarget(ev)}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          className="ev-action-btn ev-action-btn--edit"
                          title="Edit"
                          onClick={() => {
                            setFormError("");
                            setEditTarget(ev);
                          }}
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="ev-action-btn ev-action-btn--delete"
                          title="Delete"
                          onClick={() => setDeleteTarget(ev)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {viewTarget && (
        <ViewModal
          event={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={(e) => {
            setFormError("");
            setEditTarget(e);
          }}
          onDelete={(e) => setDeleteTarget(e)}
        />
      )}
      {addOpen && (
        <EventFormModal
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
          saving={saving}
          error={formError}
        />
      )}
      {editTarget && (
        <EventFormModal
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          saving={saving}
          error={formError}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          event={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
   
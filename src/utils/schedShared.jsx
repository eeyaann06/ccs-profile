// src/utils/schedShared.jsx
// ─────────────────────────────────────────────────────────────
// Shared constants, icons, and the generic ConfirmModal used by
// both Curriculum.jsx and Scheduling.jsx
// ─────────────────────────────────────────────────────────────
import { createPortal } from "react-dom";

// ── Constants ────────────────────────────────────────────────
export const COURSES = ["BSCS", "BSIT", "BSIS", "ACT"];
export const YEAR_LEVELS = [1, 2, 3, 4];
export const SEMESTERS = [
  { value: 1, label: "1st Semester" },
  { value: 2, label: "2nd Semester" },
  { value: 3, label: "Summer" },
];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const SUBJECT_TYPES = [
  "Lecture",
  "Laboratory",
  "PE",
  "NSTP",
  "Elective",
];
export const COLOR_PALETTE = [
  "#4f8ef7",
  "#43c59e",
  "#f7994f",
  "#e05c8a",
  "#9b6cf7",
  "#f7cf4f",
  "#4fbff7",
  "#f74f4f",
  "#7ec97e",
  "#c96ec9",
];

export function getSchoolYears() {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => `${y - 2 + i}-${y - 1 + i}`);
}
export const SCHOOL_YEARS = getSchoolYears();

// Firestore collection names (single source of truth)
export const CURRICULUM_COL = "curriculum";
export const SECTIONS_COL = "sections";
export const SCHEDULES_COL = "schedules";
export const USERS_COL = "users";
export const STUDENTS_COL = "students";

// ── Portal wrapper ───────────────────────────────────────────
export function Modal({ children }) {
  return createPortal(children, document.body);
}

// ── Generic SVG Icon ─────────────────────────────────────────
export const Icon = ({ d, size = 16, ...p }) => (
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
    {Array.isArray(d) ? (
      d.map((path, i) => <path key={i} d={path} />)
    ) : (
      <path d={d} />
    )}
  </svg>
);

// ── Named Icons ──────────────────────────────────────────────
export const CloseIcon = () => <Icon d="M18 6 6 18M6 6l12 12" size={15} />;
export const PlusIcon = () => <Icon d="M12 5v14M5 12h14" size={15} />;
export const CheckIcon = () => <Icon d="M20 6 9 17l-5-5" size={14} />;

export const SpinnerIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{
      animation: "sc-spin 0.8s linear infinite",
      display: "inline-block",
    }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const EditIcon = () => (
  <Icon
    d={[
      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
      "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    ]}
    size={14}
  />
);

export const TrashIcon = () => (
  <Icon
    d={[
      "M3 6h18",
      "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
      "M10 11v6M14 11v6",
      "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
    ]}
    size={14}
  />
);

export const BookIcon = () => (
  <Icon
    d={[
      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
      "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    ]}
    size={16}
  />
);

export const GridIcon = () => (
  <Icon d={["M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"]} size={16} />
);

export const CalIcon = () => (
  <Icon
    d={[
      "M8 2v4M16 2v4",
      "M3 10h18",
      "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    ]}
    size={16}
  />
);

export const UserGrpIcon = () => (
  <Icon
    d={[
      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
      "M23 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
      "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    ]}
    size={16}
  />
);

// ── Generic Confirm / Delete Modal ───────────────────────────
export function ConfirmModal({ title, message, onConfirm, onClose, busy }) {
  return (
    <Modal>
      <div className="sc-overlay" onClick={onClose}>
        <div
          className="sc-modal sc-modal--sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sc-confirm-icon">🗑️</div>
          <h3 className="sc-confirm-title">{title}</h3>
          <p className="sc-confirm-msg">{message}</p>
          <div
            className="sc-form-actions"
            style={{ padding: "0 1.5rem 1.5rem" }}
          >
            <button className="sc-btn sc-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="sc-btn sc-btn--danger"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? (
                <>
                  <SpinnerIcon /> Deleting…
                </>
              ) : (
                "Yes, Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
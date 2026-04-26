import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, secondaryAuth } from "../config/firebase";
import "../styles/FacultyProfiles.css";

// ── Constants ──────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Information Systems",
  "Computer Engineering",
  "General Education",
];

const SPECIALIZATIONS = [
  "Algorithms & Data Structures",
  "Artificial Intelligence",
  "Cybersecurity",
  "Database Systems",
  "Machine Learning",
  "Mobile Development",
  "Networking",
  "Software Engineering",
  "Web Development",
  "Other",
];

const EMPTY_FORM = {
  user_id: "",
  name: "",
  gender: "Male",
  username: "",
  email: "",
  password: "",
  department: "",
  specialization: "",
  contact: "",
  status: "Active",
  subjects: [],
};

function generateId() {
  return "FAC-" + Date.now().toString(36).toUpperCase();
}

// ── Portal wrapper ─────────────────────────────────────────
function ModalPortal({ children }) {
  return createPortal(children, document.body);
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
function EditIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
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
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
function SearchIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
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
function FilterIcon() {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function ChevronIcon({ dir = "down" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      {dir === "down" ? <path d="M6 9l6 6 6-6" /> : <path d="M6 15l6-6 6 6" />}
    </svg>
  );
}
function UserIcon() {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function KeyIcon() {
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
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}
function EyeIcon({ off = false }) {
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
      {off ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
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
        animation: "fp-spin 0.8s linear infinite",
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

// ── Shared modal overlay base ──────────────────────────────
function ModalBase({ onClose, children, maxWidth = "640px" }) {
  return (
    <ModalPortal>
      <div className="fp-overlay" onClick={onClose}>
        <div
          className="fp-modal"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// ── View / Profile Modal ───────────────────────────────────
function ViewModal({ faculty, onClose, onEdit, onCreateAccount }) {
  const [tab, setTab] = useState("profile");
  if (!faculty) return null;

  const initial = faculty.name?.charAt(0)?.toUpperCase() ?? "?";

  const tabs = [
    { key: "profile", label: "Profile" },
    {
      key: "subjects",
      label: `Subjects${
        faculty.subjects?.length ? ` (${faculty.subjects.length})` : ""
      }`,
    },
    { key: "contact", label: "Contact" },
  ];

  return (
    <ModalBase onClose={onClose}>
      {/* Header */}
      <div className="fp-modal-header">
        <div className="fp-modal-avatar fp-modal-avatar--fac">{initial}</div>
        <div className="fp-modal-identity">
          <h2 className="fp-modal-name">{faculty.name}</h2>
          <p className="fp-modal-sub">{faculty.user_id}</p>
          <div className="fp-modal-chips">
            <span className="fp-chip fp-chip--dept">
              {faculty.department || "No dept."}
            </span>
            <span
              className={`fp-chip ${
                faculty.gender === "Female"
                  ? "fp-chip--female"
                  : faculty.gender === "Other"
                  ? "fp-chip--other"
                  : "fp-chip--male"
              }`}
            >
              {faculty.gender}
            </span>
            <span
              className={`fp-chip ${
                faculty.status === "Active"
                  ? "fp-chip--active"
                  : "fp-chip--inactive"
              }`}
            >
              {faculty.status || "Active"}
            </span>
          </div>
        </div>
        <div className="fp-modal-header-actions">
          <button className="fp-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="fp-modal-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`fp-modal-tab ${
              tab === t.key ? "fp-modal-tab--active" : ""
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="fp-modal-body">
        {tab === "profile" && (
          <div className="fp-tab-content">
            <div className="fp-info-grid">
              {[
                ["Username", faculty.username || "—"],
                ["Email", faculty.email || "—"],
                ["Department", faculty.department || "—"],
                ["Specialization", faculty.specialization || "—"],
                ["Gender", faculty.gender || "—"],
                ["Status", faculty.status || "Active"],
              ].map(([label, value]) => (
                <div key={label} className="fp-info-item">
                  <span className="fp-info-label">{label}</span>
                  <span className="fp-info-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="fp-view-section">
              <span className="fp-view-section-label">Faculty ID</span>
              <code className="fp-id-code">{faculty.user_id}</code>
            </div>

            <button
              className="fp-btn fp-btn--account fp-btn--full"
              onClick={() => {
                onClose();
                onCreateAccount(faculty);
              }}
            >
              <KeyIcon /> Create / View Account
            </button>
          </div>
        )}

        {tab === "subjects" && (
          <div className="fp-tab-content">
            {!(faculty.subjects ?? []).length ? (
              <div className="fp-empty-tab">
                <span>📚</span>
                <p>No subjects assigned yet.</p>
              </div>
            ) : (
              <div className="fp-subject-list">
                {faculty.subjects.map((s, i) => (
                  <div key={i} className="fp-subject-item">
                    <span className="fp-subject-dot" />
                    <span className="fp-subject-name">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "contact" && (
          <div className="fp-tab-content">
            <div className="fp-info-grid">
              {[
                ["Contact Number", faculty.contact || "—"],
                ["Email Address", faculty.email || "—"],
                ["Username", faculty.username || "—"],
              ].map(([label, value]) => (
                <div key={label} className="fp-info-item fp-info-item--full">
                  <span className="fp-info-label">{label}</span>
                  <span className="fp-info-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalBase>
  );
}

// ── Add / Edit Form Modal ──────────────────────────────────
function FacultyFormModal({ initial, onSave, onClose, saving, error }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_FORM,
          ...initial,
          subjects: initial.subjects ?? [],
        }
      : { ...EMPTY_FORM, user_id: generateId() }
  );
  const [subjectInput, setSubjectInput] = useState("");
  const [showPw, setShowPw] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function addSubject() {
    const s = subjectInput.trim();
    if (!s || form.subjects.includes(s)) return;
    set("subjects", [...form.subjects, s]);
    setSubjectInput("");
  }

  function removeSubject(s) {
    set(
      "subjects",
      form.subjects.filter((x) => x !== s)
    );
  }

  return (
    <ModalBase onClose={onClose} maxWidth="700px">
      {/* Header */}
      <div className="fp-modal-header">
        <div className="fp-modal-avatar fp-modal-avatar--fac">
          {form.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="fp-modal-identity">
          <h2 className="fp-modal-name">
            {isEdit ? "Edit Faculty" : "Add New Faculty"}
          </h2>
          <p className="fp-modal-sub">
            {isEdit ? initial.user_id : form.user_id}
          </p>
        </div>
        <button className="fp-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable form */}
      <div className="fp-modal-body fp-modal-body--form">
        <form
          className="fp-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <div className="fp-form-scroll">
            {/* Auto-generated ID */}
            <div className="fp-form-section-title">Account Details</div>
            <div className="fp-form-grid">
              <div className="fp-form-group">
                <label>Faculty ID (auto)</label>
                <input readOnly value={form.user_id} className="fp-readonly" />
              </div>
              <div className="fp-form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {["Active", "Inactive", "On Leave"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="fp-form-group">
                <label>Username *</label>
                <input
                  required
                  value={form.username}
                  disabled={isEdit}
                  placeholder="e.g. jdelacruz"
                  onChange={(e) => set("username", e.target.value)}
                />
                {isEdit && (
                  <span className="fp-form-hint">
                    Cannot be changed after creation.
                  </span>
                )}
              </div>
              {!isEdit && (
                <div className="fp-form-group">
                  <label>Password *</label>
                  <div className="fp-pw-wrap">
                    <input
                      required
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      minLength={6}
                      placeholder="Min. 6 characters"
                      onChange={(e) => set("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="fp-eye-btn"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      <EyeIcon off={showPw} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Basic info */}
            <div className="fp-form-section-title">Personal Information</div>
            <div className="fp-form-grid">
              <div className="fp-form-group fp-form-group--full">
                <label>Full Name *</label>
                <input
                  required
                  value={form.name}
                  placeholder="e.g. Dr. Maria Santos"
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="fp-form-group">
                <label>Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  {["Male", "Female", "Other"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="fp-form-group">
                <label>Contact Number</label>
                <input
                  value={form.contact}
                  placeholder="09XXXXXXXXX"
                  onChange={(e) => set("contact", e.target.value)}
                />
              </div>
              <div className="fp-form-group fp-form-group--full">
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  placeholder="email@ccs.edu.ph (auto-generated if blank)"
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>

            {/* Academic */}
            <div className="fp-form-section-title">Academic Information</div>
            <div className="fp-form-grid">
              <div className="fp-form-group">
                <label>Department *</label>
                <select
                  required
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="fp-form-group">
                <label>Specialization</label>
                <select
                  value={form.specialization}
                  onChange={(e) => set("specialization", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subjects */}
            <div className="fp-form-section-title">
              Subjects / Courses Handled
            </div>
            <div className="fp-subject-input-row">
              <input
                className="fp-subject-input"
                value={subjectInput}
                placeholder="e.g. Data Structures and Algorithms"
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubject();
                  }
                }}
              />
              <button
                type="button"
                className="fp-btn fp-btn--add-subject"
                onClick={addSubject}
              >
                <PlusIcon /> Add
              </button>
            </div>
            {form.subjects.length > 0 && (
              <div className="fp-subject-tags">
                {form.subjects.map((s) => (
                  <span key={s} className="fp-subject-tag">
                    {s}
                    <button type="button" onClick={() => removeSubject(s)}>
                      <CloseIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="fp-form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="fp-form-actions">
            <button
              type="button"
              className="fp-btn fp-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="fp-btn fp-btn--primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Faculty"
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBase>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────
function DeleteModal({ faculty, onConfirm, onClose, deleting }) {
  return (
    <ModalBase onClose={onClose} maxWidth="420px">
      <div className="fp-confirm-body">
        <div className="fp-confirm-icon">🗑️</div>
        <h3>Delete Faculty?</h3>
        <p>
          You are about to permanently delete <strong>{faculty.name}</strong> (
          {faculty.user_id}). This cannot be undone.
        </p>
        <div className="fp-form-actions fp-form-actions--center">
          <button
            className="fp-btn fp-btn--ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="fp-btn fp-btn--danger"
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

// ── Create Account Modal ───────────────────────────────────
function CreateAccountModal({ faculty, onClose, onSuccess }) {
  const defaultUsername =
    faculty.username || faculty.name?.toLowerCase().replace(/\s+/g, "") || "";
  const defaultEmail = faculty.email || `${defaultUsername}@ccs.edu`;
  const defaultPassword =
    faculty.contact?.replace(/\D/g, "") || faculty.user_id.replace(/\D/g, "");

  const [username, setUsername] = useState(defaultUsername);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [done, setDone] = useState(false);

  const addLog = (msg, type = "info") =>
    setLogs((prev) => [...prev, { msg, type }]);

  async function handleCreate() {
    if (!username.trim() || !email.trim() || !password.trim()) return;
    setCreating(true);
    setLogs([]);
    setDone(false);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim(),
        password
      );
      addLog(`✓ Auth created: ${email.trim()}`, "success");

      await setDoc(doc(db, "users", faculty.user_id), {
        user_id: faculty.user_id,
        uid: fbUser.uid,
        name: faculty.name,
        username: username.trim(),
        email: email.trim(),
        role: "Faculty",
        gender: faculty.gender || "",
        department: faculty.department || "",
        specialization: faculty.specialization || "",
        contact: faculty.contact || "",
        status: faculty.status || "Active",
        subjects: faculty.subjects ?? [],
      });
      addLog(`✓ Firestore doc saved: users/${faculty.user_id}`, "success");
      setDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        addLog(`⚠ Account already exists: ${email.trim()}`, "warn");
        setDone(true);
      } else {
        addLog(`✗ Error: ${err.message}`, "error");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <ModalBase onClose={onClose} maxWidth="500px">
      <div className="fp-modal-header">
        <div className="fp-modal-avatar fp-modal-avatar--fac">
          {faculty.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="fp-modal-identity">
          <h2 className="fp-modal-name">Create Account</h2>
          <p className="fp-modal-sub">{faculty.user_id}</p>
          <div className="fp-modal-chips">
            <span className="fp-chip fp-chip--dept">
              {faculty.department || "No dept."}
            </span>
            <span
              className={`fp-chip ${
                faculty.status === "Active"
                  ? "fp-chip--active"
                  : "fp-chip--inactive"
              }`}
            >
              {faculty.status || "Active"}
            </span>
          </div>
        </div>
        <button className="fp-modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="fp-modal-body">
        <div className="fp-account-fields">
          {[
            { label: "User ID (auto)", value: faculty.user_id },
            { label: "Role (auto)", value: "Faculty" },
          ].map(({ label, value }) => (
            <div key={label} className="fp-form-group">
              <label>{label}</label>
              <input readOnly value={value} className="fp-readonly" />
            </div>
          ))}

          <div className="fp-form-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={creating || done}
              placeholder="username"
            />
          </div>

          <div className="fp-form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={creating || done}
              placeholder="email@example.com"
            />
          </div>

          <div className="fp-form-group">
            <label>
              Password{" "}
              <span className="fp-form-hint">
                (auto-generated from contact or ID)
              </span>
            </label>
            <div className="fp-pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={creating || done}
                placeholder="password"
              />
              <button
                type="button"
                className="fp-eye-btn"
                onClick={() => setShowPw((v) => !v)}
              >
                <EyeIcon off={showPw} />
              </button>
            </div>
          </div>

          {logs.length > 0 && (
            <div className="fp-account-log">
              {logs.map((l, i) => (
                <div key={i} className={`fp-log-line fp-log-line--${l.type}`}>
                  {l.msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fp-form-actions">
        <button className="fp-btn fp-btn--ghost" onClick={onClose}>
          {done ? "Close" : "Cancel"}
        </button>
        {!done ? (
          <button
            className="fp-btn fp-btn--primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <>
                <SpinnerIcon /> Creating…
              </>
            ) : (
              <>
                <KeyIcon /> Create Account
              </>
            )}
          </button>
        ) : (
          <span className="fp-account-done">✅ Account Ready</span>
        )}
      </div>
    </ModalBase>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function FacultyProfiles() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // search & filters
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterSpec, setFilterSpec] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // modal state
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [accountTarget, setAccountTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Fetch ──────────────────────────────────────────────
  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "users"), where("role", "==", "Faculty"));
      const snap = await getDocs(q);
      setFaculty(snap.docs.map((d) => d.data()));
    } catch (err) {
      setError("Failed to load faculty: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // ── CRUD handlers ──────────────────────────────────────
  async function handleCreate(form) {
    setSaving(true);
    setFormError("");
    try {
      const email =
        form.email.trim() || `${form.username.toLowerCase()}@ccs.edu`;
      const { user: fbUser } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        form.password
      );
      await setDoc(doc(db, "users", form.user_id), {
        user_id: form.user_id,
        uid: fbUser.uid,
        name: form.name,
        gender: form.gender,
        username: form.username,
        email,
        role: "Faculty",
        department: form.department,
        specialization: form.specialization || "",
        contact: form.contact || "",
        status: form.status || "Active",
        subjects: form.subjects ?? [],
      });
      setAddOpen(false);
      fetchFaculty();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setFormError("That username/email is already taken.");
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(form) {
    setSaving(true);
    setFormError("");
    try {
      await updateDoc(doc(db, "users", form.user_id), {
        name: form.name,
        gender: form.gender,
        department: form.department,
        specialization: form.specialization || "",
        contact: form.contact || "",
        email: form.email || "",
        status: form.status || "Active",
        subjects: form.subjects ?? [],
      });
      setEditTarget(null);
      fetchFaculty();
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
      await deleteDoc(doc(db, "users", deleteTarget.user_id));
      setDeleteTarget(null);
      fetchFaculty();
    } catch (err) {
      setError("Failed to delete faculty: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Filter / search ────────────────────────────────────
  const allSpecs = useMemo(
    () =>
      [...new Set(faculty.map((f) => f.specialization).filter(Boolean))].sort(),
    [faculty]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faculty.filter((f) => {
      const matchSearch =
        !q ||
        f.name?.toLowerCase().includes(q) ||
        f.username?.toLowerCase().includes(q) ||
        f.department?.toLowerCase().includes(q) ||
        f.specialization?.toLowerCase().includes(q) ||
        f.user_id?.toLowerCase().includes(q);
      const matchDept = !filterDept || f.department === filterDept;
      const matchGender = !filterGender || f.gender === filterGender;
      const matchSpec = !filterSpec || f.specialization === filterSpec;
      const matchStatus =
        !filterStatus || (f.status || "Active") === filterStatus;
      return (
        matchSearch && matchDept && matchGender && matchSpec && matchStatus
      );
    });
  }, [faculty, search, filterDept, filterGender, filterSpec, filterStatus]);

  const activeFilters = [
    filterDept,
    filterGender,
    filterSpec,
    filterStatus,
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterDept("");
    setFilterGender("");
    setFilterSpec("");
    setFilterStatus("");
    setSearch("");
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="fp-page">
      {/* Error banner */}
      {error && (
        <div className="fp-error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="fp-toolbar">
        <div className="fp-search-wrap">
          <SearchIcon />
          <input
            className="fp-search-input"
            placeholder="Search by name, username, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="fp-search-clear" onClick={() => setSearch("")}>
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        <button
          className={`fp-filter-btn ${
            showFilters ? "fp-filter-btn--open" : ""
          } ${activeFilters ? "fp-filter-btn--active" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <FilterIcon /> Filters
          {activeFilters > 0 && (
            <span className="fp-filter-badge">{activeFilters}</span>
          )}
          <ChevronIcon dir={showFilters ? "up" : "down"} />
        </button>

        <div className="fp-toolbar-right">
          <span className="fp-count">{filtered.length} faculty</span>
          {activeFilters > 0 && (
            <button className="fp-clear-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <button
            className="fp-btn fp-btn--ghost fp-btn--sm"
            onClick={fetchFaculty}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
          <button
            className="fp-btn fp-btn--primary fp-btn--sm"
            onClick={() => {
              setFormError("");
              setAddOpen(true);
            }}
          >
            <PlusIcon /> Add Faculty
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="fp-filter-panel">
          {[
            {
              label: "Department",
              value: filterDept,
              set: setFilterDept,
              opts: DEPARTMENTS,
              placeholder: "All Departments",
            },
            {
              label: "Gender",
              value: filterGender,
              set: setFilterGender,
              opts: ["Male", "Female", "Other"],
              placeholder: "All Genders",
            },
            {
              label: "Specialization",
              value: filterSpec,
              set: setFilterSpec,
              opts: allSpecs,
              placeholder: "All Specializations",
            },
            {
              label: "Status",
              value: filterStatus,
              set: setFilterStatus,
              opts: ["Active", "Inactive", "On Leave"],
              placeholder: "All Statuses",
            },
          ].map(({ label, value, set, opts, placeholder }) => (
            <div key={label} className="fp-filter-group">
              <label className="fp-filter-label">{label}</label>
              <select
                className="fp-select"
                value={value}
                onChange={(e) => set(e.target.value)}
              >
                <option value="">{placeholder}</option>
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="fp-active-chips">
          {filterDept && (
            <span className="fp-active-chip">
              Dept: {filterDept}{" "}
              <button onClick={() => setFilterDept("")}>
                <CloseIcon size={11} />
              </button>
            </span>
          )}
          {filterGender && (
            <span className="fp-active-chip">
              Gender: {filterGender}{" "}
              <button onClick={() => setFilterGender("")}>
                <CloseIcon size={11} />
              </button>
            </span>
          )}
          {filterSpec && (
            <span className="fp-active-chip">
              Spec: {filterSpec}{" "}
              <button onClick={() => setFilterSpec("")}>
                <CloseIcon size={11} />
              </button>
            </span>
          )}
          {filterStatus && (
            <span className="fp-active-chip">
              Status: {filterStatus}{" "}
              <button onClick={() => setFilterStatus("")}>
                <CloseIcon size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="fp-table-wrap">
        {loading ? (
          <div className="fp-loading">
            <SpinnerIcon />
            <span>Loading faculty…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="fp-empty-state">
            <span>{faculty.length === 0 ? "👩‍🏫" : "🔍"}</span>
            <p>
              {faculty.length === 0
                ? "No faculty added yet."
                : "No faculty match the filters."}
            </p>
            {faculty.length === 0 ? (
              <button
                className="fp-btn fp-btn--primary"
                onClick={() => {
                  setFormError("");
                  setAddOpen(true);
                }}
              >
                <PlusIcon /> Add First Faculty
              </button>
            ) : (
              <button className="fp-clear-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="fp-table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>ID</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.user_id} className="fp-row">
                  <td>
                    <div className="fp-row-person">
                      <div className="fp-row-avatar">{f.name?.charAt(0)}</div>
                      <div>
                        <div className="fp-row-name">{f.name}</div>
                        <div className="fp-row-username">@{f.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="fp-id-code fp-id-code--sm">
                      {f.user_id}
                    </code>
                  </td>
                  <td>
                    <span className="fp-dept-label">{f.department || "—"}</span>
                  </td>
                  <td>{f.specialization || "—"}</td>
                  <td>
                    <span
                      className={`fp-chip fp-chip--sm ${
                        f.gender === "Female"
                          ? "fp-chip--female"
                          : f.gender === "Other"
                          ? "fp-chip--other"
                          : "fp-chip--male"
                      }`}
                    >
                      {f.gender}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fp-chip fp-chip--sm ${
                        (f.status || "Active") === "Active"
                          ? "fp-chip--active"
                          : f.status === "On Leave"
                          ? "fp-chip--leave"
                          : "fp-chip--inactive"
                      }`}
                    >
                      {f.status || "Active"}
                    </span>
                  </td>
                  <td>{f.contact || "—"}</td>
                  <td>
                    <div className="fp-row-actions">
                      <button
                        className="fp-action-btn fp-action-btn--view"
                        title="View"
                        onClick={() => setViewTarget(f)}
                      >
                        <UserIcon />
                      </button>
                      <button
                        className="fp-action-btn fp-action-btn--edit"
                        title="Edit"
                        onClick={() => {
                          setFormError("");
                          setEditTarget(f);
                        }}
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="fp-action-btn fp-action-btn--account"
                        title="Create Account"
                        onClick={() => setAccountTarget(f)}
                      >
                        <KeyIcon />
                      </button>
                      <button
                        className="fp-action-btn fp-action-btn--delete"
                        title="Delete"
                        onClick={() => setDeleteTarget(f)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {viewTarget && (
        <ViewModal
          faculty={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={(f) => {
            setFormError("");
            setEditTarget(f);
          }}
          onCreateAccount={(f) => setAccountTarget(f)}
        />
      )}
      {addOpen && (
        <FacultyFormModal
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
          saving={saving}
          error={formError}
        />
      )}
      {editTarget && (
        <FacultyFormModal
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          saving={saving}
          error={formError}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          faculty={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      {accountTarget && (
        <CreateAccountModal
          faculty={accountTarget}
          onClose={() => setAccountTarget(null)}
          onSuccess={fetchFaculty}
        />
      )}
    </div>
  );
}

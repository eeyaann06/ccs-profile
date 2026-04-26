import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../config/firebase";
import "../styles/StudentProfiles.css";

// ── Firestore collection ─────────────────────────────────────
const COLLECTION = "students";

// ── Icons ────────────────────────────────────────────────────
function SearchIcon({ size = 16 }) {
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
function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
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
function IdIcon() {
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
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 2H8a2 2 0 0 0-2 2v3h12V4a2 2 0 0 0-2-2z" />
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
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
function splitTags(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formToDoc(form, existing = {}) {
  return {
    studentId: form.studentId.trim().toUpperCase(),
    name: form.name.trim(),
    course: form.course,
    year: parseInt(form.year),
    email: form.email.trim(),
    status: form.status,
    personalInfo: {
      birthday: form.birthday,
      address: form.address.trim(),
      contact: form.contact.trim(),
      guardian: form.guardian.trim(),
    },
    skills: splitTags(form.skillsRaw),
    affiliations: splitTags(form.affiliationsRaw),
    // preserve existing data that the form doesn't manage
    activities: existing.activities ?? [],
    academicHistory: existing.academicHistory ?? [],
    violations: existing.violations ?? [],
  };
}

const BLANK = {
  studentId: "",
  name: "",
  course: "BSCS",
  year: "1",
  email: "",
  status: "Active",
  birthday: "",
  address: "",
  contact: "",
  guardian: "",
  skillsRaw: "",
  affiliationsRaw: "",
};

// ── Create Account Modal ─────────────────────────────────────
function CreateAccountModal({ student, onClose, onSuccess }) {
  const defaultUsername = student.studentId.toLowerCase().replace(/-/g, "");
  const defaultEmail = student.email || `${defaultUsername}@ccs.edu`;
  const defaultUserId = "USR-" + student.studentId;
  // Password = birthday digits YYYYMMDD, fallback to studentId digits
  const birthdayRaw = student.personalInfo?.birthday ?? "";
  const defaultPassword = birthdayRaw
    ? birthdayRaw.replace(/-/g, "") // "2004-03-06" → "20040306"
    : student.studentId.replace(/\D/g, ""); // fallback: digits only

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
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      addLog(`✓ Auth created: ${email.trim()}`, "success");
      await setDoc(doc(db, "users", defaultUserId), {
        user_id: defaultUserId,
        uid: firebaseUser.uid,
        name: student.name,
        username: username.trim(),
        email: email.trim(),
        role: "Student",
        studentId: student.studentId,
        course: student.course,
        year: student.year,
      });
      addLog(`✓ Firestore doc saved: users/${defaultUserId}`, "success");
      setDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        addLog(`⚠ Account already exists for: ${email.trim()}`, "warn");
        setDone(true);
      } else {
        addLog(`✗ Error: ${err.message}`, "error");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div
        className="sp-modal sp-modal--account"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — reuses existing modal header styles */}
        <div className="sp-modal-header">
          <div className="sp-modal-avatar">
            {student.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="sp-modal-identity">
            <h2 className="sp-modal-name">Create Account</h2>
            <p className="sp-modal-id">{student.studentId}</p>
            <div className="sp-modal-meta">
              <span className="sp-badge sp-badge--course">
                {student.course}
              </span>
              <span className="sp-badge sp-badge--year">
                Year {student.year}
              </span>
              <span
                className={`sp-badge ${
                  student.status === "Active"
                    ? "sp-badge--active"
                    : "sp-badge--irregular"
                }`}
              >
                {student.status}
              </span>
            </div>
          </div>
          <button className="sp-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="sp-modal-body">
          <div className="sp-account-fields">
            {/* Read-only fields */}
            {[
              { label: "User ID (auto)", value: defaultUserId },
              { label: "Role (auto)", value: "Student" },
            ].map(({ label, value }) => (
              <div key={label} className="sp-form-group">
                <label>{label}</label>
                <input readOnly value={value} className="sp-account-readonly" />
              </div>
            ))}

            {/* Username */}
            <div className="sp-form-group">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={creating || done}
                placeholder="username"
              />
            </div>

            {/* Email */}
            <div className="sp-form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={creating || done}
                placeholder="email@example.com"
              />
            </div>

            {/* Password */}
            <div className="sp-form-group">
              <label>
                Password
                <span className="sp-form-hint">
                  {" "}
                  (from birthday: {birthdayRaw || "not set"})
                </span>
              </label>
              <div className="sp-account-pw-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={creating || done}
                  placeholder="password"
                />
                <button
                  type="button"
                  className="sp-account-eye"
                  onClick={() => setShowPw((v) => !v)}
                >
                  <EyeIcon off={showPw} />
                </button>
              </div>
            </div>

            {/* Log console */}
            {logs.length > 0 && (
              <div className="sp-account-log">
                {logs.map((l, i) => (
                  <div
                    key={i}
                    className={`sp-account-log-line sp-account-log-line--${l.type}`}
                  >
                    {l.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sp-form-actions" style={{ padding: "0 1.5rem 1.5rem" }}>
          <button className="sp-btn sp-btn--ghost" onClick={onClose}>
            {done ? "Close" : "Cancel"}
          </button>
          {!done ? (
            <button
              className="sp-btn sp-btn--primary"
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
            <span className="sp-account-done">✅ Account Ready</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Student Form Modal (Add & Edit) ──────────────────────────
function StudentFormModal({ initial, onSave, onClose, saving }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          studentId: initial.studentId,
          name: initial.name,
          course: initial.course,
          year: String(initial.year),
          email: initial.email,
          status: initial.status,
          birthday: initial.personalInfo?.birthday ?? "",
          address: initial.personalInfo?.address ?? "",
          contact: initial.personalInfo?.contact ?? "",
          guardian: initial.personalInfo?.guardian ?? "",
          skillsRaw: (initial.skills ?? []).join(", "),
          affiliationsRaw: (initial.affiliations ?? []).join(", "),
        }
      : BLANK
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div
        className="sp-modal sp-modal--form"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-modal-header">
          <div className="sp-modal-avatar">
            {form.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="sp-modal-identity">
            <h2 className="sp-modal-name">
              {isEdit ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="sp-modal-id">
              {isEdit ? initial.studentId : "New Record"}
            </p>
          </div>
          <button className="sp-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="sp-modal-body">
          <form
            className="sp-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSave(form);
            }}
          >
            <div className="sp-form-section-title">Basic Information</div>
            <div className="sp-form-grid">
              <div className="sp-form-group">
                <label>Student ID *</label>
                <input
                  required
                  value={form.studentId}
                  placeholder="CCS-2024-001"
                  disabled={isEdit}
                  onChange={(e) => set("studentId", e.target.value)}
                />
              </div>
              <div className="sp-form-group">
                <label>Full Name *</label>
                <input
                  required
                  value={form.name}
                  placeholder="Juan Dela Cruz"
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="sp-form-group">
                <label>Course *</label>
                <select
                  value={form.course}
                  onChange={(e) => set("course", e.target.value)}
                >
                  {["BSCS", "BSIT", "BSIS", "ACT"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sp-form-group">
                <label>Year Level *</label>
                <select
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                >
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sp-form-group">
                <label>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  placeholder="juan@ucab.edu.ph"
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="sp-form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {["Active", "Irregular", "LOA"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sp-form-section-title">Personal Information</div>
            <div className="sp-form-grid">
              <div className="sp-form-group">
                <label>Birthday</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => set("birthday", e.target.value)}
                />
              </div>
              <div className="sp-form-group">
                <label>Contact Number</label>
                <input
                  value={form.contact}
                  placeholder="09171234567"
                  onChange={(e) => set("contact", e.target.value)}
                />
              </div>
              <div className="sp-form-group">
                <label>Guardian</label>
                <input
                  value={form.guardian}
                  placeholder="Parent / Guardian name"
                  onChange={(e) => set("guardian", e.target.value)}
                />
              </div>
              <div className="sp-form-group sp-form-group--full">
                <label>Address</label>
                <input
                  value={form.address}
                  placeholder="Brgy., City, Province"
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>
            </div>

            <div className="sp-form-section-title">
              Skills &amp; Affiliations
            </div>
            <div className="sp-form-grid">
              <div className="sp-form-group sp-form-group--full">
                <label>
                  Skills <span className="sp-form-hint">(comma-separated)</span>
                </label>
                <input
                  value={form.skillsRaw}
                  placeholder="Programming, Web Development, Python"
                  onChange={(e) => set("skillsRaw", e.target.value)}
                />
              </div>
              <div className="sp-form-group sp-form-group--full">
                <label>
                  Affiliations{" "}
                  <span className="sp-form-hint">(comma-separated)</span>
                </label>
                <input
                  value={form.affiliationsRaw}
                  placeholder="Google Dev Student Club, Basketball Varsity"
                  onChange={(e) => set("affiliationsRaw", e.target.value)}
                />
              </div>
            </div>

            <div className="sp-form-actions">
              <button
                type="button"
                className="sp-btn sp-btn--ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sp-btn sp-btn--primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <SpinnerIcon /> Saving…
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Add Student"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────
function DeleteConfirmModal({ student, onConfirm, onClose, deleting }) {
  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div
        className="sp-modal sp-modal--confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-confirm-body">
          <div className="sp-confirm-icon">🗑️</div>
          <h3>Delete Student?</h3>
          <p>
            You are about to permanently delete <strong>{student.name}</strong>{" "}
            ({student.studentId}). This action cannot be undone.
          </p>
          <div className="sp-form-actions">
            <button className="sp-btn sp-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="sp-btn sp-btn--danger"
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
      </div>
    </div>
  );
}

// ── Student Detail Modal (View) ──────────────────────────────
function StudentModal({ student, onClose, onEdit }) {
  const [tab, setTab] = useState("personal");
  if (!student) return null;

  const tabs = [
    { key: "personal", label: "Personal" },
    { key: "academic", label: "Academic" },
    { key: "activities", label: "Activities" },
    {
      key: "violations",
      label: `Violations${
        student.violations?.length ? ` (${student.violations.length})` : ""
      }`,
    },
  ];

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-header">
          <div className="sp-modal-avatar">
            {student.name?.charAt(0) ?? "?"}
          </div>
          <div className="sp-modal-identity">
            <h2 className="sp-modal-name">{student.name}</h2>
            <p className="sp-modal-id">{student.studentId}</p>
            <div className="sp-modal-meta">
              <span className="sp-badge sp-badge--course">
                {student.course}
              </span>
              <span className="sp-badge sp-badge--year">
                Year {student.year}
              </span>
              <span
                className={`sp-badge ${
                  student.status === "Active"
                    ? "sp-badge--active"
                    : "sp-badge--irregular"
                }`}
              >
                {student.status}
              </span>
            </div>
          </div>
          <div className="sp-modal-header-actions">
            <button
              className="sp-btn sp-btn--ghost sp-btn--sm"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
            >
              <EditIcon /> Edit
            </button>
            <button className="sp-modal-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="sp-modal-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`sp-modal-tab ${
                tab === t.key ? "sp-modal-tab--active" : ""
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="sp-modal-body">
          {tab === "personal" && (
            <div className="sp-tab-content">
              <div className="sp-info-grid">
                {[
                  ["Email", student.email],
                  ["Birthday", student.personalInfo?.birthday || "—"],
                  ["Contact", student.personalInfo?.contact || "—"],
                  ["Guardian", student.personalInfo?.guardian || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="sp-info-item">
                    <span className="sp-info-label">{label}</span>
                    <span className="sp-info-value">{value}</span>
                  </div>
                ))}
                <div className="sp-info-item sp-info-item--full">
                  <span className="sp-info-label">Address</span>
                  <span className="sp-info-value">
                    {student.personalInfo?.address || "—"}
                  </span>
                </div>
              </div>
              {[
                ["Skills", "sp-tag--skill", student.skills],
                ["Affiliations", "sp-tag--affil", student.affiliations],
              ].map(([title, cls, arr]) => (
                <div key={title} className="sp-skills-section">
                  <span className="sp-section-title">{title}</span>
                  <div className="sp-tags">
                    {(arr ?? []).length ? (
                      arr.map((s) => (
                        <span key={s} className={`sp-tag ${cls}`}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="sp-empty">None recorded.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "academic" && (
            <div className="sp-tab-content">
              {!(student.academicHistory ?? []).length ? (
                <p className="sp-empty">No academic history recorded.</p>
              ) : (
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>GWA</th>
                      <th>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.academicHistory.map((h, i) => (
                      <tr key={i}>
                        <td>{h.sem}</td>
                        <td>
                          <span
                            className={`sp-gwa ${
                              parseFloat(h.gwa) <= 1.5
                                ? "sp-gwa--high"
                                : parseFloat(h.gwa) <= 2.0
                                ? "sp-gwa--mid"
                                : "sp-gwa--low"
                            }`}
                          >
                            {h.gwa}
                          </span>
                        </td>
                        <td>{h.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "activities" && (
            <div className="sp-tab-content">
              {!(student.activities ?? []).length ? (
                <p className="sp-empty">No activities recorded.</p>
              ) : (
                <div className="sp-activity-list">
                  {student.activities.map((a, i) => (
                    <div key={i} className="sp-activity-item">
                      <span className="sp-activity-dot" />
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "violations" && (
            <div className="sp-tab-content">
              {!(student.violations ?? []).length ? (
                <div className="sp-no-violations">
                  <span>✅</span>
                  <p>No violations on record.</p>
                </div>
              ) : (
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Offense</th>
                      <th>Sanction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.violations.map((v, i) => (
                      <tr key={i}>
                        <td>{v.date}</td>
                        <td>{v.offense}</td>
                        <td>
                          <span className="sp-tag sp-tag--violation">
                            {v.sanction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ID Search Result Banner ──────────────────────────────────
function IdSearchResult({ result, onView, onClear }) {
  if (!result) return null;
  return (
    <div
      className={`sp-id-result ${
        result.found ? "sp-id-result--found" : "sp-id-result--notfound"
      }`}
    >
      <div className="sp-id-result-icon">{result.found ? "✅" : "❌"}</div>
      <div className="sp-id-result-text">
        {result.found ? (
          <>
            <strong>{result.student.name}</strong>
            <span>
              {result.student.studentId} — {result.student.course} Year{" "}
              {result.student.year}
            </span>
          </>
        ) : (
          <>
            <strong>Student Not Found</strong>
            <span>
              No record for ID: <em>{result.query}</em>
            </span>
          </>
        )}
      </div>
      {result.found && (
        <button
          className="sp-id-result-view"
          onClick={() => onView(result.student)}
        >
          View Profile
        </button>
      )}
      <button className="sp-id-result-clear" onClick={onClear}>
        <CloseIcon />
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function StudentProfiles() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ID search
  const [idQuery, setIdQuery] = useState("");
  const [idResult, setIdResult] = useState(null);
  const [idSearching, setIdSearching] = useState(false);

  // Filters
  const [filterSkill, setFilterSkill] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [accountStudent, setAccountStudent] = useState(null);

  // Async states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── READ: fetch all ──────────────────────────────────────
  async function fetchStudents() {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      setStudents(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load students: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  // ── READ: search by studentId (Firestore query) ──────────
  async function handleIdSearch(e) {
    e.preventDefault();
    const q = idQuery.trim().toUpperCase();
    if (!q) return;
    setIdSearching(true);
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), where("studentId", "==", q))
      );
      if (snap.empty) {
        setIdResult({ found: false, query: q });
      } else {
        setIdResult({
          found: true,
          student: { _docId: snap.docs[0].id, ...snap.docs[0].data() },
          query: q,
        });
      }
    } catch (err) {
      setError("ID search failed: " + err.message);
    } finally {
      setIdSearching(false);
    }
  }

  // ── CREATE: add to Firestore ─────────────────────────────
  async function handleAdd(form) {
    setSaving(true);
    try {
      const data = formToDoc(form);
      const ref = await addDoc(collection(db, COLLECTION), data);
      setStudents((prev) => [...prev, { _docId: ref.id, ...data }]);
      setAddOpen(false);
    } catch (err) {
      setError("Failed to add student: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── UPDATE: write changed fields to Firestore ────────────
  async function handleEdit(form) {
    if (!editStudent) return;
    setSaving(true);
    try {
      const data = formToDoc(form, editStudent);
      await updateDoc(doc(db, COLLECTION, editStudent._docId), data);
      setStudents((prev) =>
        prev.map((s) =>
          s._docId === editStudent._docId
            ? { _docId: editStudent._docId, ...data }
            : s
        )
      );
      setEditStudent(null);
    } catch (err) {
      setError("Failed to update student: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── DELETE: remove document from Firestore ───────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, COLLECTION, deleteTarget._docId));
      setStudents((prev) =>
        prev.filter((s) => s._docId !== deleteTarget._docId)
      );
      setDeleteTarget(null);
    } catch (err) {
      setError("Failed to delete student: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Client-side filters (Query 1: skill  Query 2: course) ─
  const allSkills = useMemo(
    () => [...new Set(students.flatMap((s) => s.skills ?? []))].sort(),
    [students]
  );
  const allCourses = useMemo(
    () => [...new Set(students.map((s) => s.course))].sort(),
    [students]
  );

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        const matchSkill = filterSkill
          ? (s.skills ?? []).includes(filterSkill)
          : true;
        const matchCourse = filterCourse ? s.course === filterCourse : true;
        const matchYear = filterYear ? s.year === parseInt(filterYear) : true;
        const matchName = nameSearch
          ? s.name.toLowerCase().includes(nameSearch.toLowerCase())
          : true;
        return matchSkill && matchCourse && matchYear && matchName;
      }),
    [students, filterSkill, filterCourse, filterYear, nameSearch]
  );

  const activeFilters = [filterSkill, filterCourse, filterYear].filter(
    Boolean
  ).length;
  function clearFilters() {
    setFilterSkill("");
    setFilterCourse("");
    setFilterYear("");
    setNameSearch("");
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="sp-page">
      {error && (
        <div className="sp-error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* ── ID Search (Firestore query by studentId) ────────── */}
      <section className="sp-id-section">
        <div className="sp-id-header">
          <IdIcon />
          <span>Search Student by ID</span>
        </div>
        <form className="sp-id-form" onSubmit={handleIdSearch}>
          <input
            className="sp-id-input"
            type="text"
            placeholder="Enter Student ID (e.g. CCS-2024-001)"
            value={idQuery}
            onChange={(e) => setIdQuery(e.target.value)}
          />
          <button className="sp-id-btn" type="submit" disabled={idSearching}>
            {idSearching ? <SpinnerIcon /> : <SearchIcon size={15} />}
            {idSearching ? "Searching…" : "Search"}
          </button>
        </form>
        <IdSearchResult
          result={idResult}
          onView={(s) => {
            setViewStudent(s);
            setIdResult(null);
          }}
          onClear={() => {
            setIdResult(null);
            setIdQuery("");
          }}
        />
      </section>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="sp-toolbar">
        <div className="sp-search-wrap">
          <SearchIcon />
          <input
            className="sp-search-input"
            type="text"
            placeholder="Search by name…"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
          {nameSearch && (
            <button
              className="sp-search-clear"
              onClick={() => setNameSearch("")}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <button
          className={`sp-filter-toggle ${
            showFilters ? "sp-filter-toggle--open" : ""
          } ${activeFilters ? "sp-filter-toggle--active" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <FilterIcon /> Filters
          {activeFilters > 0 && (
            <span className="sp-filter-badge">{activeFilters}</span>
          )}
          <ChevronIcon dir={showFilters ? "up" : "down"} />
        </button>

        <div className="sp-toolbar-right">
          <span className="sp-count">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          </span>
          {activeFilters > 0 && (
            <button className="sp-clear-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <button
            className="sp-btn sp-btn--primary sp-btn--sm"
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon /> Add Student
          </button>
        </div>
      </div>

      {/* ── Filter Panel ────────────────────────────────────── */}
      {showFilters && (
        <div className="sp-filter-panel">
          {[
            {
              label: "Skill",
              value: filterSkill,
              set: setFilterSkill,
              opts: allSkills,
              prefix: "All Skills",
            },
            {
              label: "Course",
              value: filterCourse,
              set: setFilterCourse,
              opts: allCourses,
              prefix: "All Courses",
            },
          ].map(({ label, value, set, opts, prefix }) => (
            <div key={label} className="sp-filter-group">
              <label className="sp-filter-label">{label}</label>
              <select
                className="sp-select"
                value={value}
                onChange={(e) => set(e.target.value)}
              >
                <option value="">{prefix}</option>
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="sp-filter-group">
            <label className="sp-filter-label">Year Level</label>
            <select
              className="sp-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeFilters > 0 && (
        <div className="sp-active-chips">
          {filterSkill && (
            <span className="sp-chip">
              Skill: {filterSkill}{" "}
              <button onClick={() => setFilterSkill("")}>
                <CloseIcon />
              </button>
            </span>
          )}
          {filterCourse && (
            <span className="sp-chip">
              Course: {filterCourse}{" "}
              <button onClick={() => setFilterCourse("")}>
                <CloseIcon />
              </button>
            </span>
          )}
          {filterYear && (
            <span className="sp-chip">
              Year: {filterYear}{" "}
              <button onClick={() => setFilterYear("")}>
                <CloseIcon />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="sp-table-wrap">
        {loading ? (
          <div className="sp-loading">
            <SpinnerIcon />
            <span>Loading students…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sp-empty-state">
            <span>{students.length === 0 ? "🎓" : "🔍"}</span>
            <p>
              {students.length === 0
                ? "No students added yet."
                : "No students match the filters."}
            </p>
            {students.length === 0 ? (
              <button
                className="sp-btn sp-btn--primary"
                onClick={() => setAddOpen(true)}
              >
                <PlusIcon /> Add First Student
              </button>
            ) : (
              <button className="sp-clear-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="sp-main-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>ID Number</th>
                <th>Course</th>
                <th>Year</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._docId} className="sp-row">
                  <td>
                    <div className="sp-row-student">
                      <div className="sp-row-avatar">{s.name?.charAt(0)}</div>
                      <div>
                        <div className="sp-row-name">{s.name}</div>
                        <div className="sp-row-email">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="sp-row-id">{s.studentId}</td>
                  <td>{s.course}</td>
                  <td>Year {s.year}</td>
                  <td>
                    <div className="sp-tags sp-tags--compact">
                      {(s.skills ?? []).slice(0, 2).map((sk) => (
                        <span key={sk} className="sp-tag sp-tag--skill">
                          {sk}
                        </span>
                      ))}
                      {(s.skills ?? []).length > 2 && (
                        <span className="sp-tag sp-tag--more">
                          +{s.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`sp-badge ${
                        s.status === "Active"
                          ? "sp-badge--active"
                          : "sp-badge--irregular"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="sp-row-actions">
                      <button
                        className="sp-action-btn sp-action-btn--view"
                        title="View"
                        onClick={() => setViewStudent(s)}
                      >
                        <UserIcon />
                      </button>
                      <button
                        className="sp-action-btn sp-action-btn--edit"
                        title="Edit"
                        onClick={() => setEditStudent(s)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="sp-action-btn sp-action-btn--account"
                        title="Create Account"
                        onClick={() => setAccountStudent(s)}
                      >
                        <KeyIcon />
                      </button>
                      <button
                        className="sp-action-btn sp-action-btn--delete"
                        title="Delete"
                        onClick={() => setDeleteTarget(s)}
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

      {/* ── Modals ──────────────────────────────────────────── */}
      {viewStudent && (
        <StudentModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
          onEdit={(s) => setEditStudent(s)}
        />
      )}
      {addOpen && (
        <StudentFormModal
          initial={null}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
          saving={saving}
        />
      )}
      {editStudent && (
        <StudentFormModal
          initial={editStudent}
          onSave={handleEdit}
          onClose={() => setEditStudent(null)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          student={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      {accountStudent && (
        <CreateAccountModal
          student={accountStudent}
          onClose={() => setAccountStudent(null)}
          onSuccess={() => {
            // optionally show a toast or just let the modal handle it
          }}
        />
      )}
    </div>
  );
}

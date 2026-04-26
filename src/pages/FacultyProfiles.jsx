import { useState, useEffect, useCallback } from "react";
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
import { db, auth } from "../config/firebase";
import "../styles/Profiles.css";

// ── Helpers ────────────────────────────────────────────────
function generateId() {
  return "FAC-" + Date.now().toString(36).toUpperCase();
}

const EMPTY_FORM = {
  user_id: "",
  name: "",
  gender: "Male",
  username: "",
  password: "",
  department: "",
  specialization: "",
  contact: "",
};

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Information Systems",
  "Computer Engineering",
  "General Education",
];

// ── Icons (inline to avoid re-importing) ──────────────────
function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
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
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg
      width="18"
      height="18"
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

// ── Modal shell ────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ name, onConfirm, onClose, loading }) {
  return (
    <Modal title="Confirm Deletion" onClose={onClose}>
      <div className="confirm-body">
        <div className="confirm-icon">🗑️</div>
        <p className="confirm-text">
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </p>
        <div className="modal-actions">
          <button
            className="btn btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FacultyFormModal({ initial, onSave, onClose, loading, error }) {
  const isEdit = !!initial?.user_id && !initial?.user_id.startsWith("NEW");
  const [form, setForm] = useState(
    initial
      ? { ...EMPTY_FORM, ...initial }
      : { ...EMPTY_FORM, user_id: generateId() }
  );

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form, isEdit);
  }

  return (
    <Modal
      title={isEdit ? "Edit Faculty" : "Add New Faculty"}
      onClose={onClose}
    >
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label className="form-label">
            Full Name *
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Dr. Maria Santos"
              required
            />
          </label>

          <label className="form-label">
            Gender *
            <select
              className="form-input"
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>

          <label className="form-label">
            Username *
            <input
              className="form-input"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="e.g. faculty02"
              required
              disabled={isEdit}
            />
            {isEdit && (
              <span className="form-hint">
                Username cannot be changed after creation.
              </span>
            )}
          </label>

          {!isEdit && (
            <label className="form-label">
              Password *
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </label>
          )}

          <label className="form-label">
            Department *
            <select
              className="form-input"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              required
            >
              <option value="">— Select department —</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Specialization
            <input
              className="form-input"
              value={form.specialization}
              onChange={(e) => set("specialization", e.target.value)}
              placeholder="e.g. Machine Learning, Networks"
            />
          </label>

          <label className="form-label form-label--full">
            Contact Number
            <input
              className="form-input"
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="e.g. 09XXXXXXXXX"
            />
          </label>
        </div>

        {error && (
          <div className="form-error">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Faculty"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
//  FACULTY PROFILES PAGE
// ═══════════════════════════════════════════════════════════
export default function FacultyProfiles() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "Faculty"));
      const snap = await getDocs(q);
      setFaculty(snap.docs.map((d) => d.data()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  async function handleCreate(form) {
    setSaving(true);
    setFormError("");
    try {
      const email = `${form.username.toLowerCase()}@ccs.edu`;
      const { user: fbUser } = await createUserWithEmailAndPassword(
        auth,
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
      });
      setShowForm(false);
      fetchFaculty();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setFormError("That username is already taken.");
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
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", deleteTarget.user_id));
      setDeleteTarget(null);
      fetchFaculty();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.username?.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q) ||
      f.specialization?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="profiles-page">
      <div className="profiles-topbar">
        <div className="profiles-topbar-left">
          <h1 className="profiles-page-title">Faculty Profiles</h1>
          <span className="profiles-count">{faculty.length} total</span>
        </div>
        <div className="profiles-topbar-right">
          <div className="profiles-search">
            <SearchIcon />
            <input
              className="profiles-search-input"
              placeholder="Search by name, username, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            onClick={() => {
              setFormError("");
              setShowForm(true);
            }}
          >
            <PlusIcon /> Add Faculty
          </button>
        </div>
      </div>

      <div className="profiles-table-wrap">
        {loading ? (
          <div className="profiles-loading">
            <span className="profiles-spinner" />
            Loading faculty…
          </div>
        ) : filtered.length === 0 ? (
          <div className="profiles-empty">
            <span>👩‍🏫</span>
            <p>{search ? "No results found." : "No faculty yet. Add one!"}</p>
          </div>
        ) : (
          <table className="profiles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Gender</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.user_id}>
                  <td>
                    <span className="id-badge">{f.user_id}</span>
                  </td>
                  <td className="name-cell">
                    <div className="name-avatar name-avatar--faculty">
                      {f.name?.charAt(0)}
                    </div>
                    {f.name}
                  </td>
                  <td className="mono">{f.username}</td>
                  <td>
                    <span
                      className={`gender-chip gender-chip--${f.gender?.toLowerCase()}`}
                    >
                      {f.gender}
                    </span>
                  </td>
                  <td>{f.department || "—"}</td>
                  <td className="spec-cell">{f.specialization || "—"}</td>
                  <td>{f.contact || "—"}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="action-btn action-btn--edit"
                        onClick={() => {
                          setFormError("");
                          setEditTarget(f);
                        }}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="action-btn action-btn--delete"
                        onClick={() => setDeleteTarget(f)}
                        title="Delete"
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

      {showForm && (
        <FacultyFormModal
          onSave={(form, isEdit) =>
            isEdit ? handleUpdate(form) : handleCreate(form)
          }
          onClose={() => setShowForm(false)}
          loading={saving}
          error={formError}
        />
      )}

      {editTarget && (
        <FacultyFormModal
          initial={editTarget}
          onSave={(form, isEdit) =>
            isEdit ? handleUpdate(form) : handleCreate(form)
          }
          onClose={() => setEditTarget(null)}
          loading={saving}
          error={formError}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// src/pages/FacultyMyProfile.jsx
// ─────────────────────────────────────────────────────────────
// Faculty portal — logged-in faculty views and edits their own
// profile pulled from Firestore's "users" collection.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/FacultyPages.css";

// ── Icons ──────────────────────────────────────────────────
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
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function SaveIcon() {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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
        animation: "fmp-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function XIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Field row ──────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="fmp-info-row">
      <span className="fmp-info-label">{label}</span>
      <span className="fmp-info-value">{value || "—"}</span>
    </div>
  );
}

// ── Subject badge ──────────────────────────────────────────
function SubjectBadge({ name }) {
  return <span className="fmp-subject-badge">{name}</span>;
}

// ══════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function FacultyMyProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  // Editable fields
  const [form, setForm] = useState({ name: "", contact: "", email: "" });

  // ── Fetch ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.user_id) return;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", currentUser.user_id));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setForm({
            name: data.name ?? "",
            contact: data.contact ?? "",
            email: data.email ?? "",
          });
        }
      } catch (err) {
        setError("Failed to load profile: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser?.user_id]);

  // ── Save ─────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateDoc(doc(db, "users", currentUser.user_id), {
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
      });
      setProfile((p) => ({ ...p, ...form }));
      setSuccess("Profile updated successfully.");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      name: profile?.name ?? "",
      contact: profile?.contact ?? "",
      email: profile?.email ?? "",
    });
    setEditing(false);
    setError("");
  }

  // ── Loading / error ───────────────────────────────────
  if (loading) {
    return (
      <div className="fmp-center">
        <SpinnerIcon />
        <span style={{ marginLeft: 8, color: "#6b7280" }}>
          Loading profile…
        </span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fmp-center">
        <p style={{ color: "#ef4444" }}>Profile not found.</p>
      </div>
    );
  }

  const initial = (profile.name ?? "?").charAt(0).toUpperCase();
  const statusColor =
    profile.status === "Active"
      ? "fmp-chip--active"
      : profile.status === "On Leave"
      ? "fmp-chip--leave"
      : "fmp-chip--inactive";

  const tabs = [
    { key: "overview", label: "Overview" },
    {
      key: "subjects",
      label: `Subjects${
        profile.subjects?.length ? ` (${profile.subjects.length})` : ""
      }`,
    },
    { key: "contact", label: "Contact" },
  ];

  return (
    <div className="fmp-page">
      {/* ── Profile Header Card ─────────────────────── */}
      <div className="fmp-hero">
        <div className="fmp-hero-avatar">{initial}</div>

        <div className="fmp-hero-info">
          {editing ? (
            <input
              className="fmp-name-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full Name"
            />
          ) : (
            <h1 className="fmp-hero-name">{profile.name}</h1>
          )}

          <p className="fmp-hero-id">{profile.user_id}</p>

          <div className="fmp-hero-chips">
            <span className="fmp-chip fmp-chip--role">Faculty</span>
            {profile.department && (
              <span className="fmp-chip fmp-chip--dept">
                {profile.department}
              </span>
            )}
            {profile.specialization && (
              <span className="fmp-chip fmp-chip--spec">
                {profile.specialization}
              </span>
            )}
            <span className={`fmp-chip ${statusColor}`}>
              {profile.status ?? "Active"}
            </span>
          </div>
        </div>

        <div className="fmp-hero-actions">
          {!editing ? (
            <button
              className="fmp-btn fmp-btn--primary"
              onClick={() => setEditing(true)}
            >
              <EditIcon /> Edit Profile
            </button>
          ) : (
            <>
              <button
                className="fmp-btn fmp-btn--ghost"
                onClick={handleCancel}
                disabled={saving}
              >
                <XIcon /> Cancel
              </button>
              <button
                className="fmp-btn fmp-btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <SpinnerIcon /> Saving…
                  </>
                ) : (
                  <>
                    <SaveIcon /> Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="fmp-alert fmp-alert--success">✓ {success}</div>
      )}
      {error && <div className="fmp-alert fmp-alert--error">⚠ {error}</div>}

      {/* ── Tabs ──────────────────────────────────── */}
      <div className="fmp-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`fmp-tab ${tab === t.key ? "fmp-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────── */}
      <div className="fmp-body">
        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="fmp-section-grid">
            {/* Academic Info */}
            <div className="fmp-card">
              <div className="fmp-card-title">🎓 Academic Information</div>
              <InfoRow label="Department" value={profile.department} />
              <InfoRow label="Specialization" value={profile.specialization} />
              <InfoRow label="Gender" value={profile.gender} />
              <InfoRow label="Status" value={profile.status ?? "Active"} />
            </div>

            {/* Account Info */}
            <div className="fmp-card">
              <div className="fmp-card-title">🔐 Account</div>
              <InfoRow label="Faculty ID" value={profile.user_id} />
              <InfoRow label="Username" value={`@${profile.username}`} />
              <InfoRow label="Role" value={profile.role} />
            </div>
          </div>
        )}

        {/* ── Subjects ── */}
        {tab === "subjects" && (
          <div className="fmp-card fmp-card--full">
            <div className="fmp-card-title">📚 Subjects / Courses Handled</div>
            {!(profile.subjects ?? []).length ? (
              <div className="fmp-empty">
                <span>📭</span>
                <p>No subjects assigned yet. Contact your administrator.</p>
              </div>
            ) : (
              <div className="fmp-subject-grid">
                {profile.subjects.map((s, i) => (
                  <SubjectBadge key={i} name={s} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Contact ── */}
        {tab === "contact" && (
          <div className="fmp-card fmp-card--full">
            <div className="fmp-card-title">📬 Contact Information</div>
            <div className="fmp-contact-grid">
              <div className="fmp-contact-field">
                <label>Contact Number</label>
                {editing ? (
                  <input
                    className="fmp-input"
                    value={form.contact}
                    placeholder="09XXXXXXXXX"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact: e.target.value }))
                    }
                  />
                ) : (
                  <span className="fmp-contact-value">
                    {profile.contact || "—"}
                  </span>
                )}
              </div>
              <div className="fmp-contact-field">
                <label>Email Address</label>
                {editing ? (
                  <input
                    className="fmp-input"
                    type="email"
                    value={form.email}
                    placeholder="email@ccs.edu.ph"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                ) : (
                  <span className="fmp-contact-value">
                    {profile.email || "—"}
                  </span>
                )}
              </div>
              <div className="fmp-contact-field">
                <label>Username</label>
                <span className="fmp-contact-value fmp-muted">
                  @{profile.username}
                </span>
              </div>
            </div>

            {editing && (
              <div className="fmp-edit-actions">
                <button
                  className="fmp-btn fmp-btn--ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <XIcon /> Cancel
                </button>
                <button
                  className="fmp-btn fmp-btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <SpinnerIcon /> Saving…
                    </>
                  ) : (
                    <>
                      <SaveIcon /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

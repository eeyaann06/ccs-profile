// src/pages/StudentMyProfile.jsx
// ─────────────────────────────────────────────────────────────
// Student portal — logged-in student views and edits their own
// profile pulled from Firestore's "students" collection.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/StudentPages.css";

// ── Icons ──────────────────────────────────────────────────
const SVG = (props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    {...props}
  />
);
function EditIcon() {
  return (
    <SVG>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </SVG>
  );
}
function SaveIcon() {
  return (
    <SVG>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </SVG>
  );
}
function XIcon() {
  return (
    <SVG>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SVG>
  );
}
function SpinIcon() {
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
        animation: "stu-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="stu-info-row">
      <span className="stu-info-label">{label}</span>
      <span className="stu-info-value">{value || "—"}</span>
    </div>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function fmtDate(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}
function gwaClass(g) {
  if (!g) return "";
  const n = parseFloat(g);
  if (n <= 1.75) return "stu-gwa--high";
  if (n <= 2.5) return "stu-gwa--mid";
  return "stu-gwa--low";
}

// ══════════════════════════════════════════════════════════
export default function StudentMyProfile() {
  const { currentUser } = useAuth();
  const studentId = currentUser?.user_id?.replace(/^USR-/, "") ?? "";

  const [profile, setProfile] = useState(null);
  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  const [form, setForm] = useState({
    contact: "",
    email: "",
    address: "",
    guardian: "",
  });

  // ── Fetch ──────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "students"), where("studentId", "==", studentId))
        );
        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();
          setProfile(data);
          setDocId(d.id);
          setForm({
            contact: data.personalInfo?.contact ?? "",
            email: data.email ?? "",
            address: data.personalInfo?.address ?? "",
            guardian: data.personalInfo?.guardian ?? "",
          });
        }
      } catch (err) {
        setError("Failed to load profile: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  // ── Save ───────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateDoc(doc(db, "students", docId), {
        email: form.email.trim(),
        "personalInfo.contact": form.contact.trim(),
        "personalInfo.address": form.address.trim(),
        "personalInfo.guardian": form.guardian.trim(),
      });
      setProfile((p) => ({
        ...p,
        email: form.email.trim(),
        personalInfo: {
          ...p.personalInfo,
          contact: form.contact.trim(),
          address: form.address.trim(),
          guardian: form.guardian.trim(),
        },
      }));
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
      contact: profile?.personalInfo?.contact ?? "",
      email: profile?.email ?? "",
      address: profile?.personalInfo?.address ?? "",
      guardian: profile?.personalInfo?.guardian ?? "",
    });
    setEditing(false);
    setError("");
  }

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="stu-center">
        <div className="stu-spinner" />
        <span style={{ color: "#94a3b8" }}>Loading profile…</span>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="stu-center">
        <p style={{ color: "#fca5a5" }}>
          Profile not found. Contact your administrator.
        </p>
      </div>
    );
  }

  const initial = (profile.name ?? "?").charAt(0).toUpperCase();
  const tabs = [
    { key: "overview", label: "Overview" },
    {
      key: "academic",
      label: `Academic${
        profile.academicHistory?.length
          ? ` (${profile.academicHistory.length})`
          : ""
      }`,
    },
    { key: "contact", label: "Contact" },
    {
      key: "subjects",
      label: `Subjects${
        profile.skills?.length ? ` (${profile.skills.length})` : ""
      }`,
    },
  ];

  return (
    <div className="stu-page">
      {/* ── Hero ────────────────────────────────────────── */}
      <div className="stu-hero">
        <div className="stu-hero-avatar">{initial}</div>

        <div className="stu-hero-info">
          {editing ? (
            <input
              className="stu-name-input"
              value={profile.name}
              readOnly
              title="Name cannot be edited here. Contact your administrator."
            />
          ) : (
            <h1 className="stu-hero-name">{profile.name}</h1>
          )}
          <p className="stu-hero-id">{profile.studentId}</p>
          <div className="stu-hero-chips">
            <span className="stu-chip stu-chip--role">Student</span>
            {profile.course && (
              <span className="stu-chip stu-chip--course">
                {profile.course}
              </span>
            )}
            {profile.year && (
              <span className="stu-chip stu-chip--year">
                Year {profile.year}
              </span>
            )}
            {profile.section && (
              <span className="stu-chip stu-chip--section">
                § {profile.section}
              </span>
            )}
            <span
              className={`stu-chip ${
                profile.status === "Active"
                  ? "stu-chip--active"
                  : "stu-chip--leave"
              }`}
            >
              {profile.status ?? "Active"}
            </span>
          </div>
        </div>

        <div className="stu-hero-actions">
          {!editing ? (
            <button
              className="stu-btn stu-btn--primary"
              onClick={() => setEditing(true)}
            >
              <EditIcon /> Edit Profile
            </button>
          ) : (
            <>
              <button
                className="stu-btn stu-btn--ghost"
                onClick={handleCancel}
                disabled={saving}
              >
                <XIcon /> Cancel
              </button>
              <button
                className="stu-btn stu-btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <SpinIcon /> Saving…
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
        <div className="stu-alert stu-alert--success">✓ {success}</div>
      )}
      {error && <div className="stu-alert stu-alert--error">⚠ {error}</div>}

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="stu-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`stu-tab${tab === t.key ? " stu-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────── */}
      <div>
        {/* Overview */}
        {tab === "overview" && (
          <div className="stu-card-grid">
            <div className="stu-card">
              <div className="stu-card-title">🎓 Academic Info</div>
              <InfoRow label="Student ID" value={profile.studentId} />
              <InfoRow label="Course" value={profile.course} />
              <InfoRow
                label="Year Level"
                value={profile.year ? `Year ${profile.year}` : "—"}
              />
              <InfoRow label="Section" value={profile.section} />
              <InfoRow label="Status" value={profile.status ?? "Active"} />
            </div>
            <div className="stu-card">
              <div className="stu-card-title">👤 Personal Info</div>
              <InfoRow
                label="Birthday"
                value={fmtDate(profile.personalInfo?.birthday)}
              />
              <InfoRow label="Gender" value={profile.gender ?? "—"} />
              <InfoRow
                label="Guardian"
                value={profile.personalInfo?.guardian}
              />
              <InfoRow label="Address" value={profile.personalInfo?.address} />
            </div>

            {/* Skills / affiliations */}
            {(profile.skills?.length > 0 ||
              profile.affiliations?.length > 0) && (
              <div className="stu-card stu-card--full">
                <div className="stu-card-title">🌟 Skills & Affiliations</div>
                {profile.skills?.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#94a3b8",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Skills
                    </div>
                    <div
                      className="stu-subject-grid"
                      style={{ marginBottom: "0.85rem" }}
                    >
                      {profile.skills.map((s, i) => (
                        <span
                          key={i}
                          className="stu-subject-badge"
                          style={{
                            background: "rgba(99,102,241,.1)",
                            borderColor: "rgba(99,102,241,.3)",
                            color: "#a5b4fc",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {profile.affiliations?.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#94a3b8",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Affiliations
                    </div>
                    <div className="stu-subject-grid">
                      {profile.affiliations.map((a, i) => (
                        <span
                          key={i}
                          className="stu-subject-badge"
                          style={{
                            background: "rgba(251,191,36,.08)",
                            borderColor: "rgba(251,191,36,.25)",
                            color: "#fde68a",
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Academic history / grades */}
        {tab === "academic" && (
          <div className="stu-card stu-card--full">
            <div className="stu-card-title">📊 Academic History</div>
            {!(profile.academicHistory ?? []).length ? (
              <div className="stu-empty">
                <span>📋</span>No academic history on record yet.
              </div>
            ) : (
              <table className="stu-grades-table">
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>School Year</th>
                    <th>GWA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.academicHistory.map((h, i) => (
                    <tr key={i}>
                      <td>{h.semester ?? "—"}</td>
                      <td>{h.schoolYear ?? "—"}</td>
                      <td>
                        <span className={`stu-gwa ${gwaClass(h.gwa)}`}>
                          {h.gwa ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="stu-badge"
                          style={{
                            background:
                              h.standing === "Dean's List"
                                ? "rgba(16,185,129,.15)"
                                : "rgba(249,115,22,.1)",
                            color:
                              h.standing === "Dean's List"
                                ? "#6ee7b7"
                                : "#fdba74",
                            border:
                              h.standing === "Dean's List"
                                ? "1px solid rgba(16,185,129,.3)"
                                : "1px solid rgba(249,115,22,.25)",
                          }}
                        >
                          {h.standing ?? "Regular"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Contact */}
        {tab === "contact" && (
          <div className="stu-card stu-card--full">
            <div className="stu-card-title">📬 Contact Information</div>
            <div className="stu-contact-grid">
              {/* Contact number */}
              <div className="stu-contact-field">
                <label>Contact Number</label>
                {editing ? (
                  <input
                    className="stu-input"
                    value={form.contact}
                    placeholder="09XXXXXXXXX"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact: e.target.value }))
                    }
                  />
                ) : (
                  <span className="stu-contact-value">
                    {profile.personalInfo?.contact || "—"}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="stu-contact-field">
                <label>Email Address</label>
                {editing ? (
                  <input
                    className="stu-input"
                    type="email"
                    value={form.email}
                    placeholder="email@ccs.edu"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                ) : (
                  <span className="stu-contact-value">
                    {profile.email || "—"}
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="stu-contact-field">
                <label>Home Address</label>
                {editing ? (
                  <input
                    className="stu-input"
                    value={form.address}
                    placeholder="Street, City, Province"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                ) : (
                  <span className="stu-contact-value">
                    {profile.personalInfo?.address || "—"}
                  </span>
                )}
              </div>

              {/* Guardian */}
              <div className="stu-contact-field">
                <label>Parent / Guardian</label>
                {editing ? (
                  <input
                    className="stu-input"
                    value={form.guardian}
                    placeholder="Guardian name"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guardian: e.target.value }))
                    }
                  />
                ) : (
                  <span className="stu-contact-value">
                    {profile.personalInfo?.guardian || "—"}
                  </span>
                )}
              </div>
            </div>

            {editing && (
              <div className="stu-edit-actions">
                <button
                  className="stu-btn stu-btn--ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <XIcon /> Cancel
                </button>
                <button
                  className="stu-btn stu-btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <SpinIcon /> Saving…
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

        {/* Skills / activities tab */}
        {tab === "subjects" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Activities */}
            <div className="stu-card">
              <div className="stu-card-title">🏆 Activities</div>
              {!(profile.activities ?? []).length ? (
                <div className="stu-empty">
                  <span>📭</span>No activities on record.
                </div>
              ) : (
                profile.activities.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      fontSize: "0.85rem",
                      color: "#e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#f97316",
                        flexShrink: 0,
                      }}
                    />
                    {a}
                  </div>
                ))
              )}
            </div>

            {/* Violations */}
            <div className="stu-card">
              <div className="stu-card-title">⚠️ Violations</div>
              {!(profile.violations ?? []).length ? (
                <div className="stu-empty">
                  <span>✅</span>No violations on record. Keep it up!
                </div>
              ) : (
                profile.violations.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      fontSize: "0.85rem",
                      color: "#fca5a5",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#ef4444",
                        flexShrink: 0,
                      }}
                    />
                    {v}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import "../styles/login.css";

// ─── Decorative particle dots ─────────────────────────────
const PARTICLE_COUNT = 18;

function Particles() {
  return (
    <div className="login-particles" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <div
          key={i}
          className="login-particle"
          style={{
            width: `${6 + (i % 5) * 8}px`,
            height: `${6 + (i % 5) * 8}px`,
            top: `${(i * 37 + 5) % 95}%`,
            left: `${(i * 53 + 10) % 98}%`,
            opacity: 0.05 + (i % 4) * 0.025,
            animationDelay: `${(i * 0.45) % 5}s`,
            animationDuration: `${6 + (i % 3) * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────
const ICON = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
function LockIcon() {
  return (
    <svg {...ICON} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg {...ICON} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg {...ICON} viewBox="0 0 24 24">
      <circle cx="8" cy="15" r="5" />
      <path d="M21 3l-9.4 9.4M16 8l2 2" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg {...ICON} viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg {...ICON} viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Role → route map
const ROLE_ROUTES = {
  Admin: "/admin/overview",
  Faculty: "/faculty",
  Student: "/student",
};

// ═══════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const formattedEmail = `${username.toLowerCase()}@ccs.edu`;
      await signInWithEmailAndPassword(auth, formattedEmail, password);

      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userData = snap.docs[0].data();
        const route = ROLE_ROUTES[userData.role] ?? "/login";
        navigate(route, { replace: true });
      } else {
        setError("User profile not found in the database.");
      }
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid username or password.");
      } else {
        setError("Cannot reach the server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <Particles />
      <aside className="login-brand">
        <div className="login-brand-inner">
          <div className="login-logo">CCS</div>
          <h1 className="login-brand-title">
            College of&nbsp;Computer&nbsp;Studies
          </h1>
          <div className="login-brand-divider" aria-hidden="true" />
          <p className="login-brand-sub">
            Unified portal for Admins, Faculty, and Students. Sign in with your
            assigned credentials.
          </p>
          <div className="login-role-chips">
            {["Admin", "Faculty", "Student"].map((role) => (
              <span key={role} className="login-chip">
                {role}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="login-form-panel">
        <div className="login-card">
          <header className="login-card-header">
            <div className="login-icon-ring">
              <LockIcon />
            </div>
            <h2 className="login-card-title">Sign In</h2>
            <p className="login-card-sub">Enter your credentials to continue</p>
          </header>

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">⚠</span>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin} noValidate>
            <label className="login-label">
              Username
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <UserIcon />
                </span>
                <input
                  className="login-input"
                  type="text"
                  placeholder="e.g. admin01"
                  maxLength={10}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  aria-label="Username"
                />
              </div>
            </label>

            <label className="login-label">
              Password
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <KeyIcon />
                </span>
                <input
                  className="login-input login-input--password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  aria-label="Password"
                />
                <button
                  type="button"
                  className="login-toggle-btn"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" aria-label="Loading">
                  ◌
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <p className="login-hint">
            Use your assigned username &amp; password from the registrar.
          </p>
        </div>
      </main>
    </div>
  );
}

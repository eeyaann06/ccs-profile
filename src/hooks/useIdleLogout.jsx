import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

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

const ROLE_ROUTES = {
  Admin: "/admin/overview",
  Faculty: "/faculty",
  Student: "/student",
};

export default function Login() {
  const navigate = useNavigate();
  const { idleLoggedOut } = useAuth(); // ✅ get idle state
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
      const snap = await getDocs(
        query(collection(db, "users"), where("username", "==", username.trim()))
      );

      if (snap.empty) {
        setError("Username not found.");
        return;
      }

      const userData = snap.docs[0].data();

      if (!userData.email) {
        setError("Account has no email. Contact your administrator.");
        return;
      }

      await signInWithEmailAndPassword(auth, userData.email, password.trim());

      // ✅ Wait for Firebase auth state to fully settle before navigating
      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve();
          }
        });
      });

      navigate(ROLE_ROUTES[userData.role] ?? "/login", { replace: true });
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Wrong password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment.");
      } else {
        setError("Cannot reach server. Check your connection.");
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
            Unified portal for Admins, Faculty, and Students.
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
            <p className="login-card-sub">
              Use your assigned username and password
            </p>
          </header>

          {/* ✅ Idle logout notice */}
          {idleLoggedOut && (
            <div
              className="login-error"
              role="alert"
              style={{
                background: "rgba(234,179,8,0.15)",
                borderColor: "#ca8a04",
                color: "#854d0e",
              }}
            >
              <span className="login-error-icon">🕐</span> You were signed out
              due to inactivity.
            </div>
          )}

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">⚠</span> {error}
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
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
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
            Contact your administrator if you forgot your credentials.
          </p>
        </div>
      </main>
    </div>
  );
}

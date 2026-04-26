import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const USERS = [
  {
    user_id: "USR-001",
    name: "System Administrator",
    gender: "Male",
    username: "admin01",
    password: "admin123",
    role: "Admin",
  },
  {
    user_id: "USR-002",
    name: "Juan dela Cruz",
    gender: "Male",
    username: "faculty01",
    password: "faculty123",
    role: "Faculty",
  },
  {
    user_id: "USR-003",
    name: "Maria Santos",
    gender: "Female",
    username: "student01",
    password: "student123",
    role: "Student",
  },
  {
    user_id: "USR-004",
    name: "Maria Santos",
    gender: "Female",
    username: "admin02",
    password: "admin123",
    role: "Admin",
  },
];

export default function SeedPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const log = (msg, type = "info") =>
    setLogs((prev) => [...prev, { msg, type }]);

  async function handleSeed() {
    setLoading(true);
    setLogs([]);
    setDone(false);

    for (const user of USERS) {
      const email = `${user.username}@ccs.edu`;
      try {
        // 1. Create Firebase Auth user
        const { user: firebaseUser } = await createUserWithEmailAndPassword(
          auth,
          email,
          user.password
        );
        log(`✓ Auth created: ${email}`, "success");

        // 2. Write Firestore profile (no password stored)
        await setDoc(doc(db, "users", user.user_id), {
          user_id: user.user_id,
          uid: firebaseUser.uid,
          name: user.name,
          gender: user.gender,
          username: user.username,
          role: user.role,
          email,
        });
        log(`✓ Firestore doc saved: users/${user.user_id}`, "success");
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          log(`⚠ Already exists, skipped: ${email}`, "warn");
        } else {
          log(`✗ Error for ${email}: ${err.message}`, "error");
        }
      }
    }

    setDone(true);
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "2rem",
          width: 420,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🌱 Firebase Seeder</h2>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 20px" }}>
          Click the button to create the 3 default users in Firebase Auth and
          Firestore. Run this <strong>once only</strong>.
        </p>

        <button
          onClick={handleSeed}
          disabled={loading || done}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            background: done ? "#22c55e" : "#2563eb",
            color: "#fff",
            border: "none",
            fontSize: 15,
            cursor: loading || done ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.3s",
          }}
        >
          {loading
            ? "Seeding…"
            : done
            ? "✅ Done! You can delete this page."
            : "Seed Firebase"}
        </button>

        {logs.length > 0 && (
          <div
            style={{
              marginTop: 16,
              background: "#111",
              borderRadius: 8,
              padding: "12px 14px",
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {logs.map((l, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  marginBottom: 4,
                  color:
                    l.type === "success"
                      ? "#4ade80"
                      : l.type === "warn"
                      ? "#facc15"
                      : "#f87171",
                }}
              >
                {l.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

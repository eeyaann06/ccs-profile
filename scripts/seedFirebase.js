/* eslint-env node */
/**
 * ════════════════════════════════════════════════════════════════
 *  Firebase Seeder  —  CCS Unified Portal
 *  Run once:  node scripts/seedFirebase.js
 *
 *  Requirements:
 *    npm install firebase-admin dotenv
 *
 *  Setup:
 *    1. Go to Firebase Console → Project Settings → Service Accounts
 *    2. Click "Generate new private key" → save as serviceAccountKey.json
 *       in your PROJECT ROOT (already in .gitignore below)
 *    3. Run:  node scripts/seedFirebase.js
 * ════════════════════════════════════════════════════════════════
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { createRequire } from "module";

// ── Load service account ──────────────────────────────────────
const require = createRequire(import.meta.url);
let serviceAccount;

try {
  serviceAccount = require("../serviceAccountKey.json");
} catch {
  console.error(
    "\n❌  serviceAccountKey.json not found in the project root.\n" +
      "    1. Firebase Console → Project Settings → Service Accounts\n" +
      "    2. Click 'Generate new private key'\n" +
      "    3. Save the file as  serviceAccountKey.json  in the root folder.\n"
  );
  process.exit(1);
}

// ── Init Admin SDK ────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// ── Seed data (mirrors your SQL INSERT) ───────────────────────
//    Passwords are stored plaintext here only for seeding.
//    Firebase Auth hashes them automatically — they are NEVER
//    stored in plaintext in Firestore or Auth.
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
];

// ── Email convention (must match login.jsx) ───────────────────
const toEmail = (username) => `${username.toLowerCase()}@ccs.edu`;

// ── Seed one user ─────────────────────────────────────────────
async function seedUser(user) {
  const email = toEmail(user.username);
  console.log(`\n▸ Seeding  ${user.username}  (${user.role})…`);

  // 1. Create (or update) Firebase Auth user
  let authUser;
  try {
    authUser = await auth.getUserByEmail(email);
    // Already exists — update password to stay in sync
    await auth.updateUser(authUser.uid, { password: user.password });
    console.log(`  ✓ Auth user already exists — password updated.`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      authUser = await auth.createUser({
        uid: user.user_id, // use our own ID so Auth & Firestore UIDs match
        email,
        password: user.password,
        displayName: user.name,
        disabled: false,
      });
      console.log(`  ✓ Auth user created  →  uid: ${authUser.uid}`);
    } else {
      throw err;
    }
  }

  // 2. Write profile document to Firestore  (collection: "users", doc id = user_id)
  //    NOTE: password is intentionally OMITTED from Firestore.
  await db.collection("users").doc(user.user_id).set(
    {
      user_id: user.user_id,
      uid: authUser.uid, // Firebase Auth UID (same as user_id here)
      name: user.name,
      gender: user.gender,
      username: user.username,
      role: user.role,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true } // safe to re-run: won't overwrite extra fields
  );
  console.log(`  ✓ Firestore doc written  →  users/${user.user_id}`);
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("════════════════════════════════════════");
  console.log("  CCS Firebase Seeder");
  console.log("════════════════════════════════════════");

  for (const user of USERS) {
    await seedUser(user);
  }

  console.log("\n════════════════════════════════════════");
  console.log(`  ✅  All ${USERS.length} users seeded successfully!`);
  console.log("════════════════════════════════════════\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Seeding failed:", err.message);
  process.exit(1);
});

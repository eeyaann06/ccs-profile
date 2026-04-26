import { createContext, useContext, useReducer, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext(null);

// ── Single reducer → one dispatch call per branch (no cascading renders) ──
const initialState = { currentUser: null, loading: true };

function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { currentUser: action.payload, loading: false };
    case "CLEAR":
      return { currentUser: null, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const q = query(
            collection(db, "users"),
            where("uid", "==", firebaseUser.uid)
          );
          const snap = await getDocs(q);
          dispatch({
            type: "SET_USER",
            payload: snap.empty ? null : snap.docs[0].data(),
          });
        } catch {
          dispatch({ type: "CLEAR" });
        }
      } else {
        dispatch({ type: "CLEAR" });
      }
    });
    return unsubscribe;
  }, []);

  async function logout() {
    await signOut(auth);
    dispatch({ type: "CLEAR" });
  }

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
}

// Exporting a hook alongside a component is intentional here — disable the
// fast-refresh warning for this file only.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

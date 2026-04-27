import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const IDLE_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

const initialState = { currentUser: null, loading: true, idleLoggedOut: false };

function authReducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true };
    case "SET_USER":
      return {
        currentUser: action.payload,
        loading: false,
        idleLoggedOut: false,
      };
    case "CLEAR":
      return { currentUser: null, loading: false, idleLoggedOut: false };
    case "IDLE_LOGOUT":
      return { currentUser: null, loading: false, idleLoggedOut: true };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const timerRef = useRef(null);
  const isIdleLogout = useRef(false); // ✅ track idle logout without state race

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      isIdleLogout.current = true;
      await signOut(auth);
    }, IDLE_TIMEOUT_MS);
  }, []);

  const startIdleTimer = useCallback(() => {
    resetTimer();
    IDLE_EVENTS.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
  }, [resetTimer]);

  const stopIdleTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    IDLE_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
  }, [resetTimer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        dispatch({ type: "LOADING" });
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
          startIdleTimer();
        } catch {
          dispatch({ type: "CLEAR" });
          stopIdleTimer();
        }
      } else {
        stopIdleTimer();
        // ✅ use ref instead of reading state (no stale closure / dispatch-as-fn bug)
        if (isIdleLogout.current) {
          isIdleLogout.current = false;
          dispatch({ type: "IDLE_LOGOUT" });
        } else {
          dispatch({ type: "CLEAR" });
        }
      }
    });

    return () => {
      unsubscribe();
      stopIdleTimer();
    };
  }, [startIdleTimer, stopIdleTimer]);

  async function logout() {
    isIdleLogout.current = false;
    stopIdleTimer();
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

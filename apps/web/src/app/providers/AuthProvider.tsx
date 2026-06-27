import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/shared/lib/firebase";
import type { UserProfile } from "@/shared/types";

export interface AuthContextValue {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  /** users/{uid} を再読込してprofileを最新化する（オンボーディング完了/設定変更後に使用） */
  refreshProfile?: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 認証状態をアプリ全体へ提供する（L-3 / UP-1）。
 * onAuthStateChanged を監視し、ログイン中は users/{uid} を読み込む。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string): Promise<void> {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
    } catch {
      setProfile(null);
    }
  }

  /** 現在のユーザーのprofileを再読込する。 */
  async function refreshProfile(): Promise<void> {
    if (currentUser) await loadProfile(currentUser.uid);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

import { useContext } from "react";
import { signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/shared/lib/firebase";
import type { UserProfile } from "@/shared/types";
import { AuthContext } from "@/app/providers/AuthProvider";

/**
 * 初回サインイン時にusersドキュメントが無ければ作成する（BR-2 / RP-3 冪等初期化）。
 *
 * 注: Unit 3 の汎用プリミティブ（useDocument）未実装のため、
 * 当面は直接 Firestore（getDoc/setDoc）でアクセスする（ブートストラップ方針）。
 * Unit 3 完成後に層1プリミティブ経由へリファクタする。
 */
async function ensureUserProfile(
  uid: string,
  displayName: string | null,
  email: string | null
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // 2回目以降は上書きしない（BR-2.5）

  const nickname = displayName?.trim() || email?.split("@")[0] || "ユーザー";
  const profile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
    nickname,
    email: email ?? "",
    isPremium: false,
    isOnboardingCompleted: false,
    favoriteCharacters: [],
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
}

/**
 * 認証操作フック。
 * signInWithGoogle / signOut を提供し、状態は AuthProvider の Context から取得する。
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider の内側で使用してください");
  }

  /** Googleアカウントでサインイン（L-1 / SP-1） */
  async function signInWithGoogle(): Promise<void> {
    const cred = await signInWithPopup(auth, googleProvider);
    const { uid, displayName, email } = cred.user;
    await ensureUserProfile(uid, displayName, email);
  }

  /** ログアウト（L-2 / BR-5） */
  async function signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  return {
    currentUser: ctx.currentUser,
    profile: ctx.profile,
    loading: ctx.loading,
    refreshProfile: ctx.refreshProfile,
    signInWithGoogle,
    signOut,
  };
}

export { ensureUserProfile };

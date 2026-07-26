import { useContext, useState } from "react";
import { AuthContext } from "@/app/providers/AuthProvider";
import { updateDocument } from "@/shared/hooks/useDocument";
import type { CharacterId, UserProfile } from "@/shared/types";

interface UseSettingsResult {
  /** ユーザープロフィール（AuthProvider が保持する購読結果） */
  profile: UserProfile | null;
  /** プレミアム判定（管理者がFirestoreで直接フラグを操作・クライアントからは変更不可） */
  isPremium: boolean;
  /** 推しキャラ設定（未設定なら空配列） */
  favoriteCharacters: CharacterId[];
  saving: boolean;
  error: Error | null;
  /** 推しキャラ設定を更新する（US-15） */
  updateFavoriteCharacters: (characterIds: CharacterId[]) => Promise<void>;
}

/**
 * 設定フック（Unit 8・US-15）。
 *
 * プロフィールの参照は AuthProvider のキャッシュを使い、更新は Firestore プリミティブ
 * （`updateDocument`）経由で `users/{uid}` に書き込む。更新後は `refreshProfile()` で
 * AuthContext を最新化する。
 *
 * 注: `isPremium` / `createdAt` は Security Rules によりクライアントから変更できない
 * （管理者がFirestoreを直接操作してアンロックする方針・FR-06）。本フックが更新するのは
 * `favoriteCharacters` のみ。
 */
export function useSettings(): UseSettingsResult {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useSettings は AuthProvider の内側で使用してください");
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { currentUser, profile, refreshProfile } = auth;

  async function updateFavoriteCharacters(
    characterIds: CharacterId[],
  ): Promise<void> {
    if (!currentUser) throw new Error("未認証です");
    setSaving(true);
    setError(null);
    try {
      await updateDocument<UserProfile>(`users/${currentUser.uid}`, {
        favoriteCharacters: characterIds,
      });
      await refreshProfile?.();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    profile,
    isPremium: profile?.isPremium ?? false,
    favoriteCharacters: profile?.favoriteCharacters ?? [],
    saving,
    error,
    updateFavoriteCharacters,
  };
}

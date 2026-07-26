import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCollectionOnce } from "@/shared/hooks/useCollection";
import { AuthContext } from "@/app/providers/AuthProvider";
import type { CharacterDialogue } from "@/shared/types";

/**
 * キャラクター台詞マスター（characterDialogues）をセッション内で一度だけ取得・キャッシュする（Unit 8）。
 *
 * - 台詞は静的マスター（Unit 2 が投入）であり、trigger発火ごとにクエリする必要がない
 * - 起動時に1回だけ取得することで Firestore 読み取りを最小化（無料枠運用・PERF方針）
 * - `useCharacterDialogue` の IF（同期関数 `getDialogue`）を維持できる
 * - マスターは認証ユーザーのみ読み取り可（Security Rules）のため、認証完了後に取得
 *
 * Provider の外側で `useCharacterDialogue` が使われた場合（テスト等）は台詞0件として扱い、
 * コード内蔵のフォールバック台詞が使われる。
 */

export interface CharacterDialogueContextValue {
  dialogues: CharacterDialogue[];
  loading: boolean;
}

export const CharacterDialogueContext =
  createContext<CharacterDialogueContextValue | null>(null);

export function CharacterDialogueProvider({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useContext(AuthContext);
  const [dialogues, setDialogues] = useState<CharacterDialogue[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = auth?.currentUser ?? null;

  useEffect(() => {
    if (!currentUser) {
      setDialogues([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data =
          await getCollectionOnce<CharacterDialogue>("characterDialogues");
        if (!active) return;
        setDialogues(data);
      } catch {
        // 取得失敗時は空のまま（内蔵フォールバック台詞で表示を継続）
        if (!active) return;
        setDialogues([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser]);

  return (
    <CharacterDialogueContext.Provider value={{ dialogues, loading }}>
      {children}
    </CharacterDialogueContext.Provider>
  );
}

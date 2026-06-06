import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { orderBy } from "firebase/firestore";
import { getCollectionOnce } from "@/shared/hooks/useCollection";
import { AuthContext } from "@/app/providers/AuthProvider";
import type { DifficultyMaster, RarityMaster } from "@/shared/types";

/**
 * マスターデータ（difficulty / rarity）をセッション内で一度だけ取得・キャッシュする。
 *
 * - アプリ起動時に getCollectionOnce で difficultyMaster / rarityMaster を order 昇順で取得
 * - 再取得によるFirestore読み取りを防止（Context経由でアプリ全体に提供）
 * - マスターは認証ユーザーのみ読み取り可（Security Rules）のため、認証完了後に取得
 */

export interface MasterDataContextValue {
  difficulties: DifficultyMaster[];
  rarities: RarityMaster[];
  loading: boolean;
}

export const MasterDataContext = createContext<MasterDataContextValue | null>(
  null,
);

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const [difficulties, setDifficulties] = useState<DifficultyMaster[]>([]);
  const [rarities, setRarities] = useState<RarityMaster[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = auth?.currentUser ?? null;

  useEffect(() => {
    // 未認証時はマスター取得しない（Security Rulesで読み取り不可のため）
    if (!currentUser) {
      setDifficulties([]);
      setRarities([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [diff, rar] = await Promise.all([
          getCollectionOnce<DifficultyMaster>("difficultyMaster", orderBy("order")),
          getCollectionOnce<RarityMaster>("rarityMaster", orderBy("order")),
        ]);
        if (!active) return;
        setDifficulties(diff);
        setRarities(rar);
      } catch {
        // マスター取得失敗時は空のまま（ラベルは識別子フォールバック）
        if (!active) return;
        setDifficulties([]);
        setRarities([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser]);

  return (
    <MasterDataContext.Provider value={{ difficulties, rarities, loading }}>
      {children}
    </MasterDataContext.Provider>
  );
}

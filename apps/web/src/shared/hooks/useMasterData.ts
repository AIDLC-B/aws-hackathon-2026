import { useContext } from "react";
import { MasterDataContext } from "@/app/providers/MasterDataProvider";
import type { DifficultyMaster, RarityMaster } from "@/shared/types";

interface UseMasterDataResult {
  difficulties: DifficultyMaster[];
  rarities: RarityMaster[];
  loading: boolean;
  /** difficulty識別子から日本語ラベルを取得（未取得時は識別子をフォールバック） */
  getDifficultyLabel: (id: string) => string;
  /** rarity識別子から表示ラベルを取得（未取得時は識別子をフォールバック） */
  getRarityLabel: (id: string) => string;
}

/**
 * マスターデータ（difficulty / rarity）アクセサ。
 * MasterDataProvider がキャッシュした値を参照する。
 */
export function useMasterData(): UseMasterDataResult {
  const ctx = useContext(MasterDataContext);
  if (!ctx) {
    throw new Error("useMasterData は MasterDataProvider の内側で使用してください");
  }
  const { difficulties, rarities, loading } = ctx;

  const getDifficultyLabel = (id: string): string =>
    difficulties.find((d: DifficultyMaster) => d.id === id)?.label ?? id;

  const getRarityLabel = (id: string): string =>
    rarities.find((r: RarityMaster) => r.id === id)?.label ?? id;

  return { difficulties, rarities, loading, getDifficultyLabel, getRarityLabel };
}

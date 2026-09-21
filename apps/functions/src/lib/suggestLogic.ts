/**
 * 献立提案の純粋ロジック（CF-02のコア・テスト容易性のためFirestoreから分離）。
 */
import type { Difficulty, Recipe } from "../types.js";

/** ガチャ誘導の閾値（レパートリーがこの件数未満なら誘導・US-06） */
export const GACHA_REDIRECT_THRESHOLD = 10;

/** 提案する最大品数 */
export const MAX_SUGGESTIONS = 3;

export type Rng = () => number;

/**
 * difficulty / duration で候補を絞り込む（mood は無視）。
 * @param recipes 確定済み除外後のレシピ
 * @param difficulty 難易度フィルタ（完全一致）
 * @param maxDuration 所要時間の上限（分・以下）
 */
export function filterCandidates(
  recipes: Recipe[],
  difficulty: Difficulty,
  maxDuration: number,
): Recipe[] {
  return recipes.filter(
    (r) =>
      r.difficulty === difficulty &&
      typeof r.duration === "number" &&
      r.duration <= maxDuration,
  );
}

/** Fisher–Yates シャッフルで先頭n件を返す（rng注入可能） */
export function pickRandom<T>(
  items: T[],
  n: number,
  rng: Rng = Math.random,
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** レパートリー総数からガチャ誘導が必要か判定 */
export function needsGachaRedirect(totalRecipeCount: number): boolean {
  return totalRecipeCount < GACHA_REDIRECT_THRESHOLD;
}

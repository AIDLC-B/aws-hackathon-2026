import type { Rarity, Difficulty } from "@shared/types";

/**
 * 料理ドメインの表示ラベル（Unit 5・Q5）。
 *
 * レアリティ表示ルール（stories US-01）:
 * - 登録画面・レパートリー一覧 → 「頻度」表記（よく作る等）
 * - ガチャ演出・結果画面 → 「N/R/SR/SSR」表記（ゲーム的演出・Unit 7）
 *
 * difficulty ラベルは difficultyMaster（easy=かんたん/normal=ふつう/hard=むずかしい）と一致させる。
 */

/** rarity → 頻度ラベル（登録・一覧で使用） */
export const FREQUENCY_LABEL: Record<Rarity, string> = {
  N: "よく作る",
  R: "しばしば作る",
  SR: "たまに作る",
  SSR: "まれに作る",
};

/** 頻度セレクトの選択肢順（N→SSR） */
export const RARITY_OPTIONS: Rarity[] = ["N", "R", "SR", "SSR"];

/** rarity → ガチャ表示（Unit 7で使用・参考） */
export const RARITY_DISPLAY: Record<Rarity, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
};

/** difficulty → 難易度ラベル（difficultyMaster と一致） */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "かんたん",
  normal: "ふつう",
  hard: "むずかしい",
};

/** 難易度セレクトの選択肢順 */
export const DIFFICULTY_OPTIONS: Difficulty[] = ["easy", "normal", "hard"];

/** 頻度ラベルを取得（未知値は空文字） */
export function frequencyLabel(rarity: Rarity): string {
  return FREQUENCY_LABEL[rarity] ?? "";
}

/** 難易度ラベルを取得（未知値は空文字） */
export function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTY_LABEL[difficulty] ?? "";
}

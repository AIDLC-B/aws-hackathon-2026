/**
 * フロントエンド共有型（src/shared/types）。
 *
 * 方針:
 * - ドメイン型・CF契約型・マスター型・union型など「フロント/Functions共通の型」は
 *   中立共有基盤 `/shared/types` が単一ソース。本ファイルはそれを再エクスポートし、
 *   フロント側は従来どおり `@/shared/types` から型を取得できる。
 * - フロント固有のUI型（コンポーネントprops・フック型）のみ本ファイルで定義する。
 */

// --- 中立共有基盤からの再エクスポート（単一ソース） ---
export type {
  FirestoreTimestamp,
  UserProfile,
  NewUserProfileInput,
  Difficulty,
  Rarity,
  Tone,
  Trigger,
  From,
  Source,
  DifficultyMaster,
  RarityMaster,
  GachaConfig,
  Recipe,
  RecipeInput,
  ConfirmedMenuItem,
  ConfirmedMenuItemInput,
  AnalyzeRecipeImageRequest,
  RecipeAnalysis,
  SuggestMealsRequest,
  SuggestMealsResponse,
  SpinGachaRequest,
  GachaResultItem,
  SpinGachaResponse,
  CharacterId,
  CharacterLine,
} from "@shared/types";

import type { Trigger, From, CharacterId, CharacterLine } from "@shared/types";

// ============================================================
// フロント固有のUI型（キャラクター一言の表示IF・実体はUnit 8）
// ============================================================

/**
 * useCharacterDialogue への入力。
 * 呼び出し元は trigger / from のみを渡す。isPremium / favoriteCharacters は
 * AuthContextからUnit 8が自動取得するため任意（IF上は受け取れる形で定義）。
 */
export interface CharacterDialogueQuery {
  trigger: Trigger;
  from: From;
  isPremium?: boolean;
  favoriteCharacters?: CharacterId[];
}

/** useCharacterDialogue フックの型（実体はUnit 8） */
export interface UseCharacterDialogue {
  getDialogue: (query: CharacterDialogueQuery) => CharacterLine | null;
  loading: boolean;
}

/**
 * CharacterBottomSheet の props（ボトムシート表示）。
 * trigger 系の一言（meal_decided / gacha_decided / meal_completed /
 * recipe_registered / gacha_reroll_limit）に使用。
 */
export interface CharacterBottomSheetProps {
  trigger: Trigger;
  from: From;
  open: boolean;
  onClose: () => void;
  /** 自動クローズまでのミリ秒（未指定=自動クローズなし。US-13/14は5000想定） */
  autoCloseMs?: number;
}

/**
 * CharacterInline の props（インライン表示）。
 * meal_suggested（フィルタリング画面）に使用。
 */
export interface CharacterInlineProps {
  trigger: Trigger;
  from: From;
}

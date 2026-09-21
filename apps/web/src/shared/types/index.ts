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
  CharacterDialogue,
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
 * CharacterMascot の props（画面隅に浮かぶ常駐マスコット）。
 * 画面内に留まり続ける一言（meal_suggested / home など）に使用。
 * 旧 CharacterInline（画面内の横帯）を置き換えたもの。
 */
export interface CharacterMascotProps {
  trigger: Trigger;
  from: From;
  /** 既定位置の画面下端からのオフセットpx（ボトムナビ有りは72・無しは16程度・既定: 72） */
  bottomOffset?: number;
  /** 立ち絵の高さpx（既定: 140） */
  size?: number;
  /** 吹き出しを自動で格納するまでのms（既定: 0 = 自動格納しない） */
  autoCollapseMs?: number;
}

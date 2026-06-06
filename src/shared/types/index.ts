import type { Timestamp } from "firebase/firestore";

/**
 * ユーザープロフィール（users/{uid} ドキュメント）
 * Unit 1 が所有。Unit 3 以降で共通型を拡張する。
 */
export interface UserProfile {
  nickname: string;
  email: string;
  isPremium: boolean;
  isOnboardingCompleted: boolean;
  favoriteCharacters: string[];
  createdAt: Timestamp;
}

/** 新規ユーザー作成時の初期値（createdAtはserverTimestampで付与） */
export type NewUserProfileInput = Omit<UserProfile, "createdAt">;

// ============================================================
// Unit 3: 共有基盤 — union型 / マスター型 / キャラクターIF型
// ------------------------------------------------------------
// 方針（Application Design / Q2=B）:
// - 付随属性を持たない制御フロー/分類用の値は TypeScript union 型としてコードに保持
// - 付随属性（label/order/probability）を持つ difficulty / rarity / gachaConfig は
//   Firestoreマスター（Unit 2投入）。ここではその「型」を定義
// - Recipe / ConfirmedMenuItem などのドメインエンティティ型は各機能ユニット(5/6/7/8)で定義
// ============================================================

// --- union型（制御フロー・分類用・マスター化しない） ---

/** 難易度識別子（recipes.difficulty / difficultyMaster.id） */
export type Difficulty = "easy" | "normal" | "hard";

/** レアリティ識別子（recipes.rarity / rarityMaster.id / gachaConfig.rarity） */
export type Rarity = "N" | "R" | "SR" | "SSR";

/** キャラクターのトーン（台詞の語調） */
export type Tone = "encouragement" | "scolding" | "praise" | "empathy";

/** キャラクター一言の発火タイミング */
export type Trigger =
  | "meal_decided"
  | "gacha_decided"
  | "meal_completed"
  | "recipe_registered"
  | "meal_suggested"
  | "gacha_reroll_limit";

/** 画面遷移元（一言表示のコンテキスト） */
export type From =
  | "suggestion"
  | "gacha"
  | "gacha_10"
  | "detail"
  | "list"
  | "registration"
  | "onboarding"
  | "filtering";

/** 確定済み献立の登録元 */
export type Source = "suggestion" | "gacha" | "gacha_10";

// --- マスターデータ型（Firestoreトップレベルコレクション・読み取り専用） ---

/** difficultyMaster/{id} — 難易度マスター（表示属性） */
export interface DifficultyMaster {
  id: Difficulty;
  label: string;
  order: number;
}

/** rarityMaster/{id} — レアリティマスター（表示属性のみ・確率はgachaConfig） */
export interface RarityMaster {
  id: Rarity;
  label: string;
  order: number;
}

/** gachaConfig/{id} — ガチャ確率設定（主にCF-03がAdmin SDKで参照） */
export interface GachaConfig {
  rarity: Rarity;
  probability: number;
}

// --- キャラクター一言 先行インターフェース（実体はUnit 8・Q3=A 型のみ） ---

/** キャラクター識別子（マスター化せずコードに保持・7キャラ） */
export type CharacterId =
  | "saboeru"
  | "sabokachan"
  | "nyamake"
  | "chefrei"
  | "meshistopheles"
  | "sabot"
  | "sabowrashi";

/**
 * 一言表示の結果（呼び出し元に返る最小表示単位）。
 * characterId / tone / message のみを公開し、選択ロジックはUnit 8内部に隠蔽。
 */
export interface CharacterLine {
  characterId: CharacterId;
  tone: Tone;
  message: string;
}

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

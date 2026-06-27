/**
 * 中立共有型（/shared/types）— フロントエンド / Cloud Functions 共通の単一ソース。
 *
 * 配置の意図:
 * - 本フォルダ `/shared` はフロント（`src/`）にも Functions（`functions/`）にも属さない
 *   「中立な共有基盤」。両者がここを参照する（依存の向きを「両者 → 共通基盤」に統一）。
 * - 型は実行時に消去されるため、本フォルダに package.json / build / install は不要。
 *   `import type` / `export type` で参照するだけでよい。
 *
 * 設計方針:
 * - **SDK非依存**: クライアントSDK（firebase/firestore）の `Timestamp` にも
 *   Admin SDK（firebase-admin/firestore）の `Timestamp` にも依存しない。
 *   Timestamp互換の構造型 `FirestoreTimestamp` を定義し、両SDKのTimestampを構造的に受容する。
 * - **単一ソース**: ドメインエンティティ（Recipe / ConfirmedMenuItem 等）と
 *   Cloud Functions契約型（CF-01/02/03の入出力）をここで一元管理する。
 *
 * フロント専用のUI型（CharacterBottomSheetProps 等）は `src/shared/types` に置く。
 */

// ============================================================
// SDK非依存の基盤型
// ============================================================

/**
 * Firestore Timestamp 互換の構造型（SDK非依存）。
 * client SDK（firebase/firestore）の Timestamp も
 * admin SDK（firebase-admin/firestore）の Timestamp も構造的に代入可能。
 */
export interface FirestoreTimestamp {
  toDate(): Date;
  toMillis(): number;
  readonly seconds: number;
  readonly nanoseconds: number;
}

// ============================================================
// ユーザー
// ============================================================

/**
 * ユーザープロフィール（users/{uid} ドキュメント）。Unit 1 が所有。
 */
export interface UserProfile {
  nickname: string;
  email: string;
  isPremium: boolean;
  isOnboardingCompleted: boolean;
  favoriteCharacters: CharacterId[];
  createdAt: FirestoreTimestamp;
}

/** 新規ユーザー作成時の初期値（createdAtはserverTimestampで付与） */
export type NewUserProfileInput = Omit<UserProfile, "createdAt">;

// ============================================================
// union型（制御フロー・分類用・マスター化しない）
// ============================================================

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

// ============================================================
// マスターデータ型（Firestoreトップレベルコレクション・読み取り専用）
// ============================================================

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

// ============================================================
// ドメインエンティティ（フロント / Functions 共通）
// ============================================================

/**
 * 料理（users/{uid}/recipes/{recipeId}）。
 * フロント（Unit 5）・Functions（CF-02/03）の双方が参照する単一ソース。
 */
export interface Recipe {
  id: string;
  name: string;
  imageUrl: string | null;
  difficulty: Difficulty;
  /** 所要時間（分） */
  duration: number;
  rarity: Rarity;
  ingredients?: string;
  recipe?: string;
  memo?: string;
  createdAt?: FirestoreTimestamp;
}

/** 料理登録時の入力（id / createdAt はシステム採番） */
export type RecipeInput = Omit<Recipe, "id" | "createdAt">;

/**
 * 確定済み献立（users/{uid}/confirmedMenuItems/{itemId}）。
 */
export interface ConfirmedMenuItem {
  id: string;
  recipeId: string;
  name: string;
  imageUrl: string | null;
  source: Source;
  rarity?: Rarity;
  confirmedAt?: FirestoreTimestamp;
}

// ============================================================
// Cloud Functions 契約型（CF-01/02/03 の入出力・フロント/Functions共通）
// ============================================================

/** CF-01: analyzeRecipeImage 入力 */
export interface AnalyzeRecipeImageRequest {
  /** Cloud Storage 等にアップロード済みの画像URL */
  imageUrl: string;
}

/** CF-01: LLM Vision が認識した料理情報（出力） */
export interface RecipeAnalysis {
  name: string;
  difficulty: Difficulty;
  duration: number;
  rarity: Rarity;
}

/** CF-02: suggestMeals 入力 */
export interface SuggestMealsRequest {
  /** 現状フィルタ未使用（将来拡張用の予約パラメータ） */
  mood?: string;
  /** 所要時間の上限（分） */
  duration: number;
  difficulty: Difficulty;
}

/** CF-02: suggestMeals 出力 */
export interface SuggestMealsResponse {
  suggestions: Recipe[];
  /** 除外後の候補総数 */
  totalCount: number;
  /** レパートリーが閾値（10件）未満でガチャ誘導が必要か */
  needsGachaRedirect: boolean;
}

/** CF-03: spinGacha 入力 */
export interface SpinGachaRequest {
  count: 1 | 10;
}

/** ガチャ抽選結果の1件 */
export interface GachaResultItem {
  recipe: Recipe;
  rarity: Rarity;
}

/** CF-03: spinGacha 出力 */
export interface SpinGachaResponse {
  results: GachaResultItem[];
}

// ============================================================
// キャラクター（識別子・表示単位）— UserProfile が参照するため中立に配置
// ============================================================

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

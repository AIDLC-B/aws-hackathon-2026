import type { Difficulty, Rarity, RecipeInput } from "@shared/types";

/**
 * 料理登録/編集フォームの値（Unit 5）。
 * duration は入力途中の文字列も許容するため string | number。
 */
export interface RecipeFormValues {
  name: string;
  /** 頻度（内部はrarity） */
  rarity: Rarity | "";
  difficulty: Difficulty | "";
  /** 所要時間（分） */
  duration: number | "";
  imageUrl?: string | null;
  ingredients?: string;
  recipe?: string;
  memo?: string;
}

/** 必須4項目のフィールド別エラー */
export type RecipeFieldErrors = Partial<
  Record<"name" | "rarity" | "difficulty" | "duration", string>
>;

/** 空のフォーム初期値 */
export const emptyRecipeForm: RecipeFormValues = {
  name: "",
  rarity: "",
  difficulty: "",
  duration: "",
  imageUrl: null,
  ingredients: "",
  recipe: "",
  memo: "",
};

/**
 * 必須項目バリデーション（US-01 / US-04）。
 * 各フィールド下に表示するエラーメッセージを返す。エラーなしなら空オブジェクト。
 */
export function validateRecipeForm(values: RecipeFormValues): RecipeFieldErrors {
  const errors: RecipeFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "料理名は必須です";
  }
  if (!values.rarity) {
    errors.rarity = "頻度は必須です";
  }
  if (!values.difficulty) {
    errors.difficulty = "難易度は必須です";
  }
  if (
    values.duration === "" ||
    typeof values.duration !== "number" ||
    !Number.isFinite(values.duration) ||
    values.duration <= 0
  ) {
    errors.duration = "所要時間は必須です";
  }

  return errors;
}

/** エラーが無いか */
export function isValidRecipeForm(values: RecipeFormValues): boolean {
  return Object.keys(validateRecipeForm(values)).length === 0;
}

/**
 * バリデーション済みフォーム値を RecipeInput に変換する。
 * 任意項目は空文字なら省略する。
 */
export function toRecipeInput(values: RecipeFormValues): RecipeInput {
  const input: RecipeInput = {
    name: values.name.trim(),
    rarity: values.rarity as Rarity,
    difficulty: values.difficulty as Difficulty,
    duration: values.duration as number,
    imageUrl: values.imageUrl ?? null,
  };
  if (values.ingredients?.trim()) input.ingredients = values.ingredients.trim();
  if (values.recipe?.trim()) input.recipe = values.recipe.trim();
  if (values.memo?.trim()) input.memo = values.memo.trim();
  return input;
}

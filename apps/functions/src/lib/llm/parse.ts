/**
 * LLMのテキスト応答を RecipeAnalysis に正規化する共通パーサ。
 * プロバイダ間でレスポンス構造は異なるが、抽出後のテキスト→構造化はここで共通化する。
 */
import type { RecipeAnalysis, Difficulty, Rarity } from "../../types.js";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
const RARITIES: Rarity[] = ["N", "R", "SR", "SSR"];

/** テキストからJSONオブジェクトを抽出（コードフェンスや前後説明文を許容） */
function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (/^null$/i.test(trimmed)) return null;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * LLM応答テキストを RecipeAnalysis に正規化する。
 * 必須フィールドが欠落・不正な場合は安全なデフォルトで補完する。
 * @param text LLMが返した生テキスト
 * @returns 正規化済み RecipeAnalysis。料理と判定できない場合は null
 */
export function parseRecipeAnalysis(text: string): RecipeAnalysis | null {
  const obj = extractJson(text);
  if (!obj) return null;

  const name =
    typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : null;
  if (!name) return null;

  const difficulty = DIFFICULTIES.includes(obj.difficulty as Difficulty)
    ? (obj.difficulty as Difficulty)
    : "normal";

  const rarity = RARITIES.includes(obj.rarity as Rarity)
    ? (obj.rarity as Rarity)
    : "N";

  const durationNum = Number(obj.duration);
  const duration =
    Number.isFinite(durationNum) && durationNum > 0
      ? Math.round(durationNum)
      : 15;

  return { name, difficulty, duration, rarity };
}

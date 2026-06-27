/**
 * CF-02: suggestMeals
 * ユーザーのレパートリーから difficulty / duration で絞り込み、ランダム最大3品を提案する。
 *
 * 入力: { mood?: string, duration: number, difficulty: Difficulty }
 *   - mood は現状未使用（将来拡張用の予約パラメータ・受け取るが無視）
 *   - duration は分（recipes.duration と直接比較）
 * 出力: { suggestions: Recipe[], totalCount: number, needsGachaRedirect: boolean }
 *
 * フィルタ/抽選の純粋ロジックは lib/suggestLogic.ts に分離。
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./lib/admin.js";
import { requireAuth } from "./lib/auth.js";
import {
  filterCandidates,
  pickRandom,
  needsGachaRedirect,
  MAX_SUGGESTIONS,
} from "./lib/suggestLogic.js";
import type {
  Difficulty,
  Recipe,
  SuggestMealsRequest,
  SuggestMealsResponse,
} from "./types.js";

const VALID_DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export const suggestMeals = onCall(
  { region: "us-central1" },
  async (request): Promise<SuggestMealsResponse> => {
    const uid = requireAuth(request);

    const { duration, difficulty } = (request.data ??
      {}) as SuggestMealsRequest;

    if (
      typeof duration !== "number" ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "duration（所要時間・分）は正の数値で指定してください。",
      );
    }
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      throw new HttpsError(
        "invalid-argument",
        "difficulty は easy / normal / hard のいずれかを指定してください。",
      );
    }

    // 1. レパートリー全件を取得
    const recipesSnap = await db
      .collection("users")
      .doc(uid)
      .collection("recipes")
      .get();
    const allRecipes: Recipe[] = recipesSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Recipe,
    );

    // 2. 確定済み献立の recipeId を除外対象として収集
    const confirmedSnap = await db
      .collection("users")
      .doc(uid)
      .collection("confirmedMenuItems")
      .get();
    const confirmedRecipeIds = new Set(
      confirmedSnap.docs
        .map((doc) => (doc.data() as { recipeId?: string }).recipeId)
        .filter((id): id is string => typeof id === "string"),
    );

    // 3. 確定済みを除外 + difficulty / duration で絞り込み
    const notConfirmed = allRecipes.filter(
      (r) => !confirmedRecipeIds.has(r.id),
    );
    const candidates = filterCandidates(notConfirmed, difficulty, duration);

    // 4. ランダムで最大3品
    const suggestions = pickRandom(candidates, MAX_SUGGESTIONS);

    return {
      suggestions,
      totalCount: candidates.length,
      needsGachaRedirect: needsGachaRedirect(allRecipes.length),
    };
  },
);

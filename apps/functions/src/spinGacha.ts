/**
 * CF-03: spinGacha
 * gachaConfig の確率でレアリティを抽選し、該当レアリティのレシピをランダム選択する。
 *
 * 入力: { count: 1 | 10 }
 * 出力: { results: { recipe: Recipe, rarity: Rarity }[] }
 *
 * 仕様（抽選ロジックは lib/gachaLogic.ts に分離）:
 *   - 確定済み献立は除外（重複提案を防止）
 *   - count分は重複なし（同じレシピを2回出さない）
 *   - 抽選レアリティに在庫がなければ隣接レアリティへフォールバック（Q5=A）
 *   - 在庫総数が count 未満の場合は可能な限り埋めて返す
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./lib/admin.js";
import { requireAuth } from "./lib/auth.js";
import { getGachaConfig } from "./lib/gachaConfig.js";
import { drawGacha } from "./lib/gachaLogic.js";
import type { Recipe, SpinGachaRequest, SpinGachaResponse } from "./types.js";

const VALID_COUNTS = [1, 10];

export const spinGacha = onCall(
  { region: "us-central1" },
  async (request): Promise<SpinGachaResponse> => {
    const uid = requireAuth(request);

    const { count } = (request.data ?? {}) as SpinGachaRequest;
    if (!VALID_COUNTS.includes(count)) {
      throw new HttpsError(
        "invalid-argument",
        "count は 1 または 10 を指定してください。",
      );
    }

    // 1. レパートリー取得
    const recipesSnap = await db
      .collection("users")
      .doc(uid)
      .collection("recipes")
      .get();
    const allRecipes: Recipe[] = recipesSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Recipe,
    );

    // 2. 確定済み献立を除外
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
    const available = allRecipes.filter((r) => !confirmedRecipeIds.has(r.id));

    // 3. gachaConfig（キャッシュ・デフォルトフォールバック付き）
    const config = await getGachaConfig();

    // 4. 抽選（純粋ロジックに委譲）
    const results = drawGacha(available, config, count);

    return { results };
  },
);

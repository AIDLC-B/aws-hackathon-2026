/**
 * CF-01: analyzeRecipeImage
 * 料理写真URLをLLM（Vision）に渡して料理情報を認識する。
 *
 * 入力: { imageUrl: string }
 * 出力: { name, difficulty, duration, rarity }（RecipeAnalysis）
 * 認識失敗時: HttpsError("not-found", "recognition_failed")
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { requireAuth } from "./lib/auth.js";
import { createLlmClient, LLM_SECRETS } from "./lib/llm/index.js";
import type { AnalyzeRecipeImageRequest, RecipeAnalysis } from "./types.js";

export const analyzeRecipeImage = onCall(
  { region: "us-central1", secrets: LLM_SECRETS },
  async (request): Promise<RecipeAnalysis> => {
    requireAuth(request);

    const { imageUrl } = (request.data ?? {}) as AnalyzeRecipeImageRequest;

    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "imageUrl（画像URL）は必須です。",
      );
    }

    const client = createLlmClient();

    let analysis: RecipeAnalysis | null;
    try {
      analysis = await client.analyzeRecipeImage(imageUrl);
    } catch (err) {
      logger.error("analyzeRecipeImage failed", {
        provider: client.provider,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError(
        "internal",
        "画像の解析中にエラーが発生しました。",
      );
    }

    if (!analysis) {
      throw new HttpsError("not-found", "recognition_failed");
    }

    return analysis;
  },
);

/**
 * モックLLMクライアント（ローカル開発・テスト用）。
 * 環境変数 LLM_PROVIDER=mock または CLAUDE_MOCK=true（後方互換）で有効。
 * 外部APIを呼ばず固定レスポンスを返す。
 */
import type { LlmClient } from "./types.js";
import type { RecipeAnalysis } from "../../types.js";

export class MockLlmClient implements LlmClient {
  readonly provider = "mock";

  async analyzeRecipeImage(imageUrl: string): Promise<RecipeAnalysis | null> {
    // imageUrl が空ならnull（認識失敗）を模倣、それ以外は固定の料理を返す
    if (!imageUrl) return null;
    return {
      name: "テスト料理",
      difficulty: "normal",
      duration: 15,
      rarity: "R",
    };
  }
}

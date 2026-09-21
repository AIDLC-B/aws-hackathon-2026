/**
 * OpenAI プロバイダ実装（Vision）。
 * モデルは環境変数 OPENAI_MODEL で上書き可能（デフォルト: gpt-4o-mini）。
 *
 * 注意: Anthropicとレスポンス構造・画像入力フォーマットが異なるため、
 * 抽出後のテキストは共通パーサ parseRecipeAnalysis で正規化する。
 */
import OpenAI from "openai";
import type { LlmClient } from "./types.js";
import { VISION_PROMPT } from "./types.js";
import { parseRecipeAnalysis } from "./parse.js";
import type { RecipeAnalysis } from "../../types.js";

export class OpenAiLlmClient implements LlmClient {
  readonly provider = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model || "gpt-4o-mini";
  }

  async analyzeRecipeImage(imageUrl: string): Promise<RecipeAnalysis | null> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return parseRecipeAnalysis(text);
  }
}

/**
 * Anthropic Claude プロバイダ実装（Vision）。
 * モデルは環境変数 ANTHROPIC_MODEL で上書き可能（デフォルト: claude-3-5-sonnet）。
 */
import Anthropic from "@anthropic-ai/sdk";
import type { LlmClient } from "./types.js";
import { VISION_PROMPT } from "./types.js";
import { parseRecipeAnalysis } from "./parse.js";
import { fetchImageAsBase64 } from "./image.js";
import type { RecipeAnalysis } from "../../types.js";

export class AnthropicLlmClient implements LlmClient {
  readonly provider = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-3-5-sonnet-latest";
  }

  async analyzeRecipeImage(imageUrl: string): Promise<RecipeAnalysis | null> {
    // Anthropic SDK の Vision 入力は base64 のため URL から取得して変換する
    const { base64, mediaType } = await fetchImageAsBase64(imageUrl);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: VISION_PROMPT },
          ],
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return parseRecipeAnalysis(text);
  }
}

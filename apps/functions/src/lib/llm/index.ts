/**
 * LLMプロバイダ ファクトリ（Q2拡張）。
 *
 * 環境変数で実装を切替:
 *   - LLM_PROVIDER = "anthropic" | "openai" | "mock"（デフォルト: anthropic）
 *   - CLAUDE_MOCK = "true" の場合は後方互換で mock を強制
 *
 * APIキーは Secret Manager で管理（コードに埋め込まない）:
 *   - ANTHROPIC_API_KEY
 *   - OPENAI_API_KEY
 * onCall の options に `secrets: LLM_SECRETS` を渡してバインドすること。
 */
import { defineSecret } from "firebase-functions/params";
import type { LlmClient } from "./types.js";
import { MockLlmClient } from "./mock.js";
import { AnthropicLlmClient } from "./anthropic.js";
import { OpenAiLlmClient } from "./openai.js";

/** Secret定義（onCallの secrets オプションで参照） */
export const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
export const openaiApiKey = defineSecret("OPENAI_API_KEY");

/** CF-01 にバインドする Secret 一覧 */
export const LLM_SECRETS = [anthropicApiKey, openaiApiKey];

type ProviderName = "anthropic" | "openai" | "mock";

function resolveProvider(): ProviderName {
  if (process.env.CLAUDE_MOCK === "true") return "mock";
  const raw = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  if (raw === "openai") return "openai";
  if (raw === "mock") return "mock";
  return "anthropic";
}

/**
 * 環境変数に基づいてLLMクライアントを生成する。
 * APIキー未設定など生成不能な場合は mock にフォールバックする（開発時の利便性）。
 */
export function createLlmClient(): LlmClient {
  const provider = resolveProvider();

  if (provider === "mock") {
    return new MockLlmClient();
  }

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return new MockLlmClient();
    return new OpenAiLlmClient(key, process.env.OPENAI_MODEL);
  }

  // anthropic
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new MockLlmClient();
  return new AnthropicLlmClient(key, process.env.ANTHROPIC_MODEL);
}

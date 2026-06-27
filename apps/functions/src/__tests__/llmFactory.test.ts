/**
 * LLMプロバイダ ファクトリの単体テスト（Q2: env切替・モックフォールバック）。
 * Secret定義（defineSecret）が初期化時にエラーにならないことも確認する。
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createLlmClient } from "../lib/llm/index.js";
import { MockLlmClient } from "../lib/llm/mock.js";

const ENV_KEYS = [
  "LLM_PROVIDER",
  "CLAUDE_MOCK",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
];

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("createLlmClient", () => {
  it("CLAUDE_MOCK=true なら mock を返す（後方互換）", () => {
    process.env.CLAUDE_MOCK = "true";
    process.env.ANTHROPIC_API_KEY = "dummy";
    expect(createLlmClient()).toBeInstanceOf(MockLlmClient);
  });

  it("LLM_PROVIDER=mock なら mock を返す", () => {
    process.env.LLM_PROVIDER = "mock";
    expect(createLlmClient().provider).toBe("mock");
  });

  it("anthropic指定 + APIキーありなら anthropic を返す", () => {
    process.env.LLM_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(createLlmClient().provider).toBe("anthropic");
  });

  it("openai指定 + APIキーありなら openai を返す", () => {
    process.env.LLM_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(createLlmClient().provider).toBe("openai");
  });

  it("APIキー未設定なら mock にフォールバックする", () => {
    process.env.LLM_PROVIDER = "anthropic";
    expect(createLlmClient().provider).toBe("mock");
  });

  it("未知のプロバイダ指定は anthropic 扱い（キーなしなら mock）", () => {
    process.env.LLM_PROVIDER = "unknown";
    expect(createLlmClient().provider).toBe("mock");
  });
});

describe("MockLlmClient", () => {
  it("imageUrlありで固定の料理を返す", async () => {
    const client = new MockLlmClient();
    const result = await client.analyzeRecipeImage("https://example.com/a.jpg");
    expect(result).toEqual({
      name: "テスト料理",
      difficulty: "normal",
      duration: 15,
      rarity: "R",
    });
  });

  it("imageUrlが空なら null", async () => {
    const client = new MockLlmClient();
    expect(await client.analyzeRecipeImage("")).toBeNull();
  });
});

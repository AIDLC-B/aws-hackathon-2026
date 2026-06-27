/**
 * parseRecipeAnalysis の単体テスト（CF-01のLLM応答正規化）。
 */
import { describe, it, expect } from "vitest";
import { parseRecipeAnalysis } from "../lib/llm/parse.js";

describe("parseRecipeAnalysis", () => {
  it("正常なJSONをそのまま解析する", () => {
    const result = parseRecipeAnalysis(
      '{"name":"カレー","difficulty":"normal","duration":30,"rarity":"R"}',
    );
    expect(result).toEqual({
      name: "カレー",
      difficulty: "normal",
      duration: 30,
      rarity: "R",
    });
  });

  it("コードフェンスや前後の説明文があっても抽出できる", () => {
    const text =
      "判定しました。\n```json\n{\"name\":\"親子丼\",\"difficulty\":\"easy\",\"duration\":15,\"rarity\":\"N\"}\n```";
    const result = parseRecipeAnalysis(text);
    expect(result?.name).toBe("親子丼");
    expect(result?.difficulty).toBe("easy");
  });

  it("不正な difficulty / rarity は安全なデフォルトに補完する", () => {
    const result = parseRecipeAnalysis(
      '{"name":"謎料理","difficulty":"ultra","duration":20,"rarity":"LEGEND"}',
    );
    expect(result?.difficulty).toBe("normal");
    expect(result?.rarity).toBe("N");
  });

  it("duration が不正なら 15 にフォールバックする", () => {
    const result = parseRecipeAnalysis(
      '{"name":"卵かけご飯","difficulty":"easy","duration":"なし","rarity":"N"}',
    );
    expect(result?.duration).toBe(15);
  });

  it("name が無い場合は null を返す", () => {
    const result = parseRecipeAnalysis(
      '{"difficulty":"easy","duration":10,"rarity":"N"}',
    );
    expect(result).toBeNull();
  });

  it('"null" 応答は null を返す', () => {
    expect(parseRecipeAnalysis("null")).toBeNull();
  });

  it("JSONが含まれないテキストは null を返す", () => {
    expect(parseRecipeAnalysis("料理ではありません")).toBeNull();
  });
});

/**
 * 献立提案ロジックの単体テスト（CF-02コア・Q4=B 通常の単体テスト）。
 */
import { describe, it, expect } from "vitest";
import {
  filterCandidates,
  pickRandom,
  needsGachaRedirect,
  GACHA_REDIRECT_THRESHOLD,
  MAX_SUGGESTIONS,
} from "../lib/suggestLogic.js";
import type { Difficulty, Recipe } from "../types.js";

function recipe(id: string, difficulty: Difficulty, duration: number): Recipe {
  return {
    id,
    name: `料理${id}`,
    imageUrl: null,
    difficulty,
    duration,
    rarity: "N",
  };
}

describe("filterCandidates", () => {
  const recipes = [
    recipe("1", "easy", 10),
    recipe("2", "easy", 20),
    recipe("3", "normal", 10),
    recipe("4", "hard", 30),
  ];

  it("difficulty 完全一致で絞り込む", () => {
    const result = filterCandidates(recipes, "easy", 60);
    expect(result.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("duration は上限以下のみ通す", () => {
    const result = filterCandidates(recipes, "easy", 15);
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("該当なしなら空配列", () => {
    expect(filterCandidates(recipes, "hard", 10)).toEqual([]);
  });
});

describe("pickRandom", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("指定件数を返す", () => {
    expect(pickRandom(items, 3, () => 0)).toHaveLength(3);
  });

  it("元件数より多く要求しても元件数までしか返さない", () => {
    expect(pickRandom(items, 10, () => 0)).toHaveLength(5);
  });

  it("元配列を破壊しない", () => {
    const copy = [...items];
    pickRandom(items, 3, () => 0.5);
    expect(items).toEqual(copy);
  });

  it("返す要素は全て元配列に含まれる", () => {
    const result = pickRandom(items, 3, () => 0.3);
    for (const r of result) expect(items).toContain(r);
  });
});

describe("needsGachaRedirect", () => {
  it("閾値未満なら true", () => {
    expect(needsGachaRedirect(GACHA_REDIRECT_THRESHOLD - 1)).toBe(true);
  });

  it("閾値ちょうどなら false", () => {
    expect(needsGachaRedirect(GACHA_REDIRECT_THRESHOLD)).toBe(false);
  });

  it("0件なら true", () => {
    expect(needsGachaRedirect(0)).toBe(true);
  });
});

describe("定数", () => {
  it("最大提案数は3", () => {
    expect(MAX_SUGGESTIONS).toBe(3);
  });
  it("ガチャ誘導閾値は10", () => {
    expect(GACHA_REDIRECT_THRESHOLD).toBe(10);
  });
});

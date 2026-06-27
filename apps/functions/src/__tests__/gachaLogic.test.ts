/**
 * ガチャ抽選ロジックの単体テスト（CF-03コア）。
 * 乱数を注入して決定論的に検証する（Q4=B: 通常の単体テスト）。
 */
import { describe, it, expect } from "vitest";
import {
  rollRarity,
  findNearestRarityWithStock,
  buildPool,
  drawGacha,
  RARITY_ORDER,
} from "../lib/gachaLogic.js";
import type { GachaConfig, Recipe, Rarity } from "../types.js";

const CONFIG: GachaConfig[] = [
  { rarity: "N", probability: 0.6 },
  { rarity: "R", probability: 0.25 },
  { rarity: "SR", probability: 0.12 },
  { rarity: "SSR", probability: 0.03 },
];

function recipe(id: string, rarity: Rarity): Recipe {
  return {
    id,
    name: `料理${id}`,
    imageUrl: null,
    difficulty: "normal",
    duration: 15,
    rarity,
  };
}

/** 固定値を順番に返すRNG（テスト用） */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("rollRarity", () => {
  it("rng=0 で先頭レアリティ(N)を引く", () => {
    expect(rollRarity(CONFIG, () => 0)).toBe("N");
  });

  it("rng≈1 で最終レアリティ(SSR)を引く", () => {
    expect(rollRarity(CONFIG, () => 0.999)).toBe("SSR");
  });

  it("中間値で R を引く（N=0.6境界の直後）", () => {
    expect(rollRarity(CONFIG, () => 0.7)).toBe("R");
  });

  it("確率が正規化されていなくても必ずいずれかを返す", () => {
    const skewed: GachaConfig[] = [
      { rarity: "N", probability: 2 },
      { rarity: "SSR", probability: 8 },
    ];
    expect(rollRarity(skewed, () => 0.5)).toBe("SSR");
  });
});

describe("findNearestRarityWithStock", () => {
  it("自レアリティに在庫があればそれを返す", () => {
    const pool = buildPool([recipe("1", "R")]);
    expect(findNearestRarityWithStock("R", pool)).toBe("R");
  });

  it("在庫がなければ隣接（低レア優先）へフォールバック", () => {
    // SR を引いたが在庫はN(距離2)とSSR(距離1)。距離が近いSSRが優先
    const pool = buildPool([recipe("1", "N"), recipe("2", "SSR")]);
    expect(findNearestRarityWithStock("SR", pool)).toBe("SSR");
  });

  it("距離が同じ場合は低レアリティを優先する", () => {
    // R を引いたが在庫はN(距離1)とSR(距離1)。低レアのNを優先
    const pool = buildPool([recipe("1", "N"), recipe("2", "SR")]);
    expect(findNearestRarityWithStock("R", pool)).toBe("N");
  });

  it("全レアリティ在庫なしなら null", () => {
    const pool = buildPool([]);
    expect(findNearestRarityWithStock("N", pool)).toBeNull();
  });
});

describe("drawGacha", () => {
  const stock: Recipe[] = [
    recipe("n1", "N"),
    recipe("n2", "N"),
    recipe("r1", "R"),
    recipe("sr1", "SR"),
    recipe("ssr1", "SSR"),
  ];

  it("count分の結果を返す", () => {
    const results = drawGacha(stock, CONFIG, 3, seqRng([0, 0.5, 0.99]));
    expect(results).toHaveLength(3);
  });

  it("重複したレシピを返さない", () => {
    const results = drawGacha(stock, CONFIG, 5, seqRng([0, 0, 0, 0, 0]));
    const ids = results.map((r) => r.recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("在庫総数が count 未満なら在庫分だけ返す", () => {
    const small = [recipe("n1", "N"), recipe("n2", "N")];
    const results = drawGacha(small, CONFIG, 10, () => 0);
    expect(results).toHaveLength(2);
  });

  it("在庫ゼロなら空配列を返す", () => {
    expect(drawGacha([], CONFIG, 10)).toEqual([]);
  });

  it("結果の rarity は実際に選ばれたレシピの rarity と一致する", () => {
    const results = drawGacha(stock, CONFIG, 5, seqRng([0, 0.5, 0.9, 0.99, 0]));
    for (const item of results) {
      expect(item.rarity).toBe(item.recipe.rarity);
    }
  });

  it("全レアリティを引いても在庫の続く限りフォールバックで充足する", () => {
    // N のみ大量在庫。常にSSRを引いてもNへフォールバックして埋まる
    const onlyN = [
      recipe("n1", "N"),
      recipe("n2", "N"),
      recipe("n3", "N"),
    ];
    const results = drawGacha(onlyN, CONFIG, 3, () => 0.99);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.rarity === "N")).toBe(true);
  });
});

describe("RARITY_ORDER", () => {
  it("N < R < SR < SSR の順", () => {
    expect(RARITY_ORDER).toEqual(["N", "R", "SR", "SSR"]);
  });
});

/**
 * ガチャ抽選の純粋ロジック（CF-03のコア・テスト容易性のためFirestoreから分離）。
 *
 * 乱数は引数 rng（[0,1) を返す関数）で注入可能。省略時は Math.random。
 * これにより単体テストで決定論的に検証できる。
 */
import type { GachaConfig, GachaResultItem, Rarity, Recipe } from "../types.js";

/** レアリティの並び順（隣接フォールバックの距離計算に使用） */
export const RARITY_ORDER: Rarity[] = ["N", "R", "SR", "SSR"];

export type Rng = () => number;

/** 確率配分に基づき1つのレアリティを抽選する */
export function rollRarity(config: GachaConfig[], rng: Rng = Math.random): Rarity {
  const total = config.reduce((sum, c) => sum + c.probability, 0);
  let r = rng() * total;
  for (const c of config) {
    r -= c.probability;
    if (r <= 0) return c.rarity;
  }
  return config[config.length - 1].rarity;
}

/**
 * 指定レアリティに在庫がなければ最も近いレアリティ（在庫あり）を返す。
 * 距離が同じ場合は低レアリティ（より一般的）を優先する。
 * @returns 在庫のあるレアリティ。全レアリティ在庫なしなら null
 */
export function findNearestRarityWithStock(
  rolled: Rarity,
  pool: Map<Rarity, Recipe[]>,
): Rarity | null {
  const rolledIdx = RARITY_ORDER.indexOf(rolled);

  for (let dist = 0; dist < RARITY_ORDER.length; dist++) {
    const candidates: Rarity[] = [];
    if (dist === 0) {
      candidates.push(rolled);
    } else {
      const lower = RARITY_ORDER[rolledIdx - dist];
      const higher = RARITY_ORDER[rolledIdx + dist];
      if (lower) candidates.push(lower);
      if (higher) candidates.push(higher);
    }
    for (const rarity of candidates) {
      const stock = pool.get(rarity);
      if (stock && stock.length > 0) return rarity;
    }
  }
  return null;
}

/** レアリティ別のプールを構築する */
export function buildPool(recipes: Recipe[]): Map<Rarity, Recipe[]> {
  const pool = new Map<Rarity, Recipe[]>();
  for (const rarity of RARITY_ORDER) pool.set(rarity, []);
  for (const recipe of recipes) {
    pool.get(recipe.rarity)?.push(recipe);
  }
  return pool;
}

/**
 * ガチャを count 回引いた結果を返す。
 * - 重複なし（同じレシピは1回まで）
 * - 抽選レアリティに在庫がなければ隣接レアリティへフォールバック
 * - 在庫総数が count 未満なら可能な限り埋める
 * @param available 抽選対象のレシピ（確定済み除外後）
 * @param config レアリティ確率
 * @param count 抽選回数
 * @param rng 乱数生成器（テスト用に注入可能）
 */
export function drawGacha(
  available: Recipe[],
  config: GachaConfig[],
  count: number,
  rng: Rng = Math.random,
): GachaResultItem[] {
  const pool = buildPool(available);
  const results: GachaResultItem[] = [];
  let remaining = available.length;

  for (let i = 0; i < count && remaining > 0; i++) {
    const rolled = rollRarity(config, rng);
    const actual = findNearestRarityWithStock(rolled, pool);
    if (!actual) break;
    const stock = pool.get(actual)!;
    const idx = Math.floor(rng() * stock.length);
    const recipe = stock.splice(idx, 1)[0];
    results.push({ recipe, rarity: actual });
    remaining--;
  }

  return results;
}

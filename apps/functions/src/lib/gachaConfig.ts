/**
 * gachaConfig（レアリティ確率）の取得（CF-03用・Q3=A）。
 *
 * 仕様:
 *   - Firestore `gachaConfig` コレクションから取得する。
 *   - 取得失敗 / 空の場合はデフォルト確率にフォールバックする。
 *   - 頻繁に変わらないため、一度取得したらモジュールレベルにキャッシュし、
 *     インスタンス存続中（ウォーム）は再取得しない。
 *     （Cloud Functions のインスタンスは複数リクエストで再利用されるため有効）
 */
import { db } from "./admin.js";
import type { GachaConfig, Rarity } from "../types.js";

/** デフォルト確率（component-methods.md 準拠：N=60% / R=25% / SR=12% / SSR=3%） */
export const DEFAULT_GACHA_CONFIG: GachaConfig[] = [
  { rarity: "N", probability: 0.6 },
  { rarity: "R", probability: 0.25 },
  { rarity: "SR", probability: 0.12 },
  { rarity: "SSR", probability: 0.03 },
];

/** モジュールレベルキャッシュ（インスタンス存続中は保持） */
let cachedConfig: GachaConfig[] | null = null;

/** レアリティ識別子の妥当性チェック */
function isValidRarity(value: unknown): value is Rarity {
  return value === "N" || value === "R" || value === "SR" || value === "SSR";
}

/** gachaConfigドキュメントの妥当性チェック */
function toValidConfig(docs: GachaConfig[]): GachaConfig[] | null {
  const valid = docs.filter(
    (d) =>
      isValidRarity(d.rarity) &&
      typeof d.probability === "number" &&
      d.probability > 0,
  );
  return valid.length > 0 ? valid : null;
}

/**
 * gachaConfigを取得する。キャッシュがあればそれを返す。
 * @returns レアリティ確率の配列（必ず1件以上）
 */
export async function getGachaConfig(): Promise<GachaConfig[]> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const snapshot = await db.collection("gachaConfig").get();
    const docs = snapshot.docs.map((doc) => doc.data() as GachaConfig);
    const valid = toValidConfig(docs);
    cachedConfig = valid ?? DEFAULT_GACHA_CONFIG;
  } catch {
    // 取得失敗時はデフォルトにフォールバック（キャッシュはしない＝次回再試行）
    return DEFAULT_GACHA_CONFIG;
  }

  return cachedConfig;
}

/** テスト用: キャッシュをクリアする */
export function __clearGachaConfigCache(): void {
  cachedConfig = null;
}

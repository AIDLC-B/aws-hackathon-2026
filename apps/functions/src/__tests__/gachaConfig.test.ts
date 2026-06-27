/**
 * gachaConfig 取得・キャッシュ・フォールバックの単体テスト（Q3）。
 * Firestore（./lib/admin）をモックする。
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// admin.ts の db をモック（initializeApp を呼ばせない）
const getMock = vi.fn();
vi.mock("../lib/admin.js", () => ({
  db: {
    collection: () => ({ get: getMock }),
  },
}));

import {
  getGachaConfig,
  DEFAULT_GACHA_CONFIG,
  __clearGachaConfigCache,
} from "../lib/gachaConfig.js";

function snapshot(docs: Array<Record<string, unknown>>) {
  return { docs: docs.map((d) => ({ data: () => d })) };
}

beforeEach(() => {
  __clearGachaConfigCache();
  getMock.mockReset();
});

describe("getGachaConfig", () => {
  it("Firestoreから有効な設定を取得して返す", async () => {
    getMock.mockResolvedValueOnce(
      snapshot([
        { rarity: "N", probability: 0.5 },
        { rarity: "SSR", probability: 0.5 },
      ]),
    );
    const config = await getGachaConfig();
    expect(config).toHaveLength(2);
    expect(config[0].rarity).toBe("N");
  });

  it("空の場合はデフォルトにフォールバックする", async () => {
    getMock.mockResolvedValueOnce(snapshot([]));
    const config = await getGachaConfig();
    expect(config).toEqual(DEFAULT_GACHA_CONFIG);
  });

  it("不正データのみの場合もデフォルトにフォールバックする", async () => {
    getMock.mockResolvedValueOnce(
      snapshot([{ rarity: "INVALID", probability: -1 }]),
    );
    const config = await getGachaConfig();
    expect(config).toEqual(DEFAULT_GACHA_CONFIG);
  });

  it("取得失敗時はデフォルトを返す", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    const config = await getGachaConfig();
    expect(config).toEqual(DEFAULT_GACHA_CONFIG);
  });

  it("一度取得したらキャッシュしFirestoreを再呼び出ししない", async () => {
    getMock.mockResolvedValueOnce(
      snapshot([{ rarity: "N", probability: 1 }]),
    );
    await getGachaConfig();
    await getGachaConfig();
    await getGachaConfig();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("失敗時はキャッシュせず次回再取得する", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    await getGachaConfig();
    getMock.mockResolvedValueOnce(
      snapshot([{ rarity: "R", probability: 1 }]),
    );
    const config = await getGachaConfig();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(config[0].rarity).toBe("R");
  });
});

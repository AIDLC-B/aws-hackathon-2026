import { useState, useCallback } from "react";
import { callFunction } from "@/shared/lib/functions";
import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import { REROLL_LIMIT } from "@/features/gacha/config";
import type {
  GachaResultItem,
  Source,
  SpinGachaRequest,
  SpinGachaResponse,
} from "@shared/types";

/** ガチャ確定モード（10連で既存献立がある場合に選択・US-12） */
export type ConfirmMode = "add" | "replace";

/** sessionStorage キー（リセマラカウント・Q1=A） */
const REROLL_KEY = "damesi.gacha.rerollCount";

/** sessionStorage からリセマラカウントを読む（SSR/未対応環境では0） */
function readRerollCount(): number {
  try {
    const raw = sessionStorage.getItem(REROLL_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** sessionStorage へリセマラカウントを書く */
function writeRerollCount(n: number): void {
  try {
    sessionStorage.setItem(REROLL_KEY, String(n));
  } catch {
    // ストレージ不可環境では永続化を諦める（メモリ状態は維持）
  }
}

/**
 * 献立ガチャドメインのサービス層フック（Unit 7・US-10/11/12）。
 *
 * - 抽選は CF-03（spinGacha）を呼び出す。確率は gachaConfig（CF-03がAdmin SDKで参照）。
 * - リセマラカウントは sessionStorage で管理（画面遷移・リロードを跨いで保持、タブ/PWAを
 *   閉じると消える＝「セッション」の語義・Q1=A）。REROLL_LIMIT 回目の「もう一度」で堕落ルート。
 * - 確定（confirmGachaResult）は useConfirmedMenu の confirm / clearAll に委譲し、
 *   add（追加）/ replace（全削除して入れ替え）を実装（Q4=A）。
 */
export function useGacha() {
  const { confirm, clearAll } = useConfirmedMenu();

  const [results, setResults] = useState<GachaResultItem[]>([]);
  const [lastCount, setLastCount] = useState<1 | 10>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [rerollCount, setRerollCount] = useState<number>(() => readRerollCount());
  const [rerollLimitReached, setRerollLimitReached] = useState(false);

  /** CF-03 を呼んで抽選結果を取得する（内部共通） */
  const runSpin = useCallback(async (count: 1 | 10): Promise<GachaResultItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await callFunction<SpinGachaRequest, SpinGachaResponse>(
        "spinGacha",
        { count },
      );
      setResults(res.results);
      setLastCount(count);
      setHasSpun(true);
      return res.results;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** 初回スピン（US-10/12）。リセマラカウントは増やさない。 */
  const spin = useCallback(
    async (count: 1 | 10) => {
      return runSpin(count);
    },
    [runSpin],
  );

  /**
   * 「もう一度」（リセマラ・US-11）。カウント+1して同じ件数で引き直す。
   * REROLL_LIMIT 回目に達したら堕落ルートを発動する（結果は保持し「やっぱり作る」で表示）。
   * @returns 堕落ルートに到達したか
   */
  const reroll = useCallback(async (): Promise<boolean> => {
    const next = rerollCount + 1;
    setRerollCount(next);
    writeRerollCount(next);
    await runSpin(lastCount);
    const limited = next >= REROLL_LIMIT;
    if (limited) {
      setRerollLimitReached(true);
    }
    return limited;
  }, [rerollCount, lastCount, runSpin]);

  /** 堕落ルートから「やっぱり作る」→ 直前の結果表示に戻る（US-11） */
  const backToResult = useCallback(() => {
    setRerollLimitReached(false);
  }, []);

  /** リセマラカウントを0にリセット（確定時・US-10/11/12） */
  const resetReroll = useCallback(() => {
    setRerollCount(0);
    writeRerollCount(0);
    setRerollLimitReached(false);
  }, []);

  /**
   * ガチャ結果を確定済み献立に書き込む（US-10/12）。
   * - mode="add": 既存に追加
   * - mode="replace": 既存を全削除してから追加（10連の入れ替え）
   * 確定後はリセマラカウントを0にリセットする。
   */
  const confirmGachaResult = useCallback(
    async (mode: ConfirmMode = "add"): Promise<void> => {
      const source: Source = lastCount === 10 ? "gacha_10" : "gacha";
      if (mode === "replace") {
        await clearAll();
      }
      for (const { recipe } of results) {
        await confirm({
          recipeId: recipe.id,
          name: recipe.name,
          imageUrl: recipe.imageUrl,
          rarity: recipe.rarity,
          difficulty: recipe.difficulty,
          duration: recipe.duration,
          source,
        });
      }
      resetReroll();
    },
    [results, lastCount, confirm, clearAll, resetReroll],
  );

  return {
    results,
    lastCount,
    loading,
    error,
    hasSpun,
    rerollCount,
    rerollLimitReached,
    spin,
    reroll,
    backToResult,
    confirmGachaResult,
    resetReroll,
  };
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const callFunctionMock = vi.fn();
const confirmMock = vi.fn();
const clearAllMock = vi.fn();

vi.mock("@/shared/lib/functions", () => ({
  callFunction: (...a: unknown[]) => callFunctionMock(...a),
}));

vi.mock("@/features/confirmedMenu/hooks/useConfirmedMenu", () => ({
  useConfirmedMenu: () => ({ confirm: confirmMock, clearAll: clearAllMock }),
}));

import { useGacha } from "@/features/gacha/hooks/useGacha";
import { REROLL_LIMIT } from "@/features/gacha/config";
import type { GachaResultItem, Recipe } from "@shared/types";

function recipe(id: string): Recipe {
  return {
    id,
    name: `料理${id}`,
    imageUrl: null,
    difficulty: "normal",
    duration: 20,
    rarity: "R",
  };
}

function resultItems(n: number): GachaResultItem[] {
  return Array.from({ length: n }, (_, i) => ({
    recipe: recipe(`r${i}`),
    rarity: "R" as const,
  }));
}

beforeEach(() => {
  callFunctionMock.mockReset();
  confirmMock.mockReset();
  clearAllMock.mockReset();
  sessionStorage.clear();
  confirmMock.mockResolvedValue("itemId");
  clearAllMock.mockResolvedValue(undefined);
});

describe("useGacha - spin", () => {
  it("spin(1) は CF-03 を {count:1} で呼び結果を反映する", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(1) });
    const { result } = renderHook(() => useGacha());

    await act(async () => {
      await result.current.spin(1);
    });

    expect(callFunctionMock).toHaveBeenCalledWith("spinGacha", { count: 1 });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.lastCount).toBe(1);
    expect(result.current.hasSpun).toBe(true);
  });

  it("spin(10) は 10件の結果を保持する", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(10) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(10);
    });
    expect(result.current.results).toHaveLength(10);
    expect(result.current.lastCount).toBe(10);
  });
});

describe("useGacha - リセマラ（US-11）", () => {
  it("reroll はカウントを+1し sessionStorage に永続化する", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(1) });
    const { result } = renderHook(() => useGacha());

    await act(async () => {
      await result.current.spin(1);
    });
    await act(async () => {
      await result.current.reroll();
    });

    expect(result.current.rerollCount).toBe(1);
    expect(sessionStorage.getItem("damesi.gacha.rerollCount")).toBe("1");
  });

  it("1〜4回目の reroll は false（通常）、5回目で true（堕落）を返す", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(1) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(1);
    });

    const limits: boolean[] = [];
    for (let i = 0; i < REROLL_LIMIT; i++) {
      await act(async () => {
        limits.push(await result.current.reroll());
      });
    }

    expect(limits.slice(0, REROLL_LIMIT - 1).every((v) => v === false)).toBe(true);
    expect(limits[REROLL_LIMIT - 1]).toBe(true);
    expect(result.current.rerollLimitReached).toBe(true);
  });

  it("初期カウントは sessionStorage から復元する（セッション継続）", async () => {
    sessionStorage.setItem("damesi.gacha.rerollCount", "3");
    const { result } = renderHook(() => useGacha());
    expect(result.current.rerollCount).toBe(3);
  });

  it("backToResult は堕落フラグを解除する", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(1) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(1);
    });
    for (let i = 0; i < REROLL_LIMIT; i++) {
      await act(async () => {
        await result.current.reroll();
      });
    }
    act(() => result.current.backToResult());
    expect(result.current.rerollLimitReached).toBe(false);
  });
});

describe("useGacha - confirmGachaResult（US-10/12・Q4）", () => {
  it("add: 結果件数分 confirm を呼び、source=gacha（シングル）", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(1) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(1);
    });
    await act(async () => {
      await result.current.confirmGachaResult("add");
    });

    expect(clearAllMock).not.toHaveBeenCalled();
    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipeId: "r0", source: "gacha" }),
    );
  });

  it("10連 add: source=gacha_10 で10回 confirm、clearAll は呼ばない", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(10) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(10);
    });
    await act(async () => {
      await result.current.confirmGachaResult("add");
    });
    expect(clearAllMock).not.toHaveBeenCalled();
    expect(confirmMock).toHaveBeenCalledTimes(10);
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ source: "gacha_10" }),
    );
  });

  it("replace: clearAll を呼んでから confirm する", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(10) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(10);
    });
    await act(async () => {
      await result.current.confirmGachaResult("replace");
    });
    expect(clearAllMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).toHaveBeenCalledTimes(10);
  });

  it("確定後はリセマラカウントが0にリセットされる", async () => {
    callFunctionMock.mockResolvedValue({ results: resultItems(1) });
    const { result } = renderHook(() => useGacha());
    await act(async () => {
      await result.current.spin(1);
    });
    await act(async () => {
      await result.current.reroll();
    });
    await act(async () => {
      await result.current.confirmGachaResult("add");
    });
    expect(result.current.rerollCount).toBe(0);
    expect(sessionStorage.getItem("damesi.gacha.rerollCount")).toBe("0");
  });
});

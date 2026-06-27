import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const callFunctionMock = vi.fn();
const confirmMock = vi.fn();

vi.mock("@/shared/lib/functions", () => ({
  callFunction: (...a: unknown[]) => callFunctionMock(...a),
}));

vi.mock("@/features/confirmedMenu/hooks/useConfirmedMenu", () => ({
  useConfirmedMenu: () => ({ confirm: confirmMock }),
}));

import { useSuggestion } from "@/features/suggestion/hooks/useSuggestion";
import type { Recipe, SuggestMealsResponse } from "@shared/types";

const recipe: Recipe = {
  id: "r1",
  name: "カレー",
  imageUrl: null,
  difficulty: "normal",
  duration: 30,
  rarity: "N",
};

const response: SuggestMealsResponse = {
  suggestions: [recipe],
  totalCount: 12,
  needsGachaRedirect: false,
};

beforeEach(() => {
  callFunctionMock.mockReset();
  confirmMock.mockReset();
});

describe("useSuggestion", () => {
  it("suggest は CF-02(suggestMeals) を呼びレスポンスを反映する", async () => {
    callFunctionMock.mockResolvedValue(response);
    const { result } = renderHook(() => useSuggestion());

    await act(async () => {
      await result.current.suggest({ duration: 30, difficulty: "normal" });
    });

    expect(callFunctionMock).toHaveBeenCalledWith("suggestMeals", {
      duration: 30,
      difficulty: "normal",
    });
    expect(result.current.suggestions).toEqual([recipe]);
    expect(result.current.needsGachaRedirect).toBe(false);
    expect(result.current.totalCount).toBe(12);
    expect(result.current.hasSuggested).toBe(true);
  });

  it("needsGachaRedirect=true を反映する（US-06）", async () => {
    callFunctionMock.mockResolvedValue({
      ...response,
      needsGachaRedirect: true,
    });
    const { result } = renderHook(() => useSuggestion());
    await act(async () => {
      await result.current.suggest({ duration: 15, difficulty: "easy" });
    });
    expect(result.current.needsGachaRedirect).toBe(true);
  });

  it("CF-02 失敗時は error をセットする", async () => {
    callFunctionMock.mockRejectedValue(new Error("internal"));
    const { result } = renderHook(() => useSuggestion());
    await act(async () => {
      await expect(
        result.current.suggest({ duration: 30, difficulty: "normal" }),
      ).rejects.toThrow("internal");
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
  });

  it("confirmMeal は Recipe をスナップショット入力に変換して confirm する", async () => {
    confirmMock.mockResolvedValue("item1");
    const { result } = renderHook(() => useSuggestion());

    let id = "";
    await act(async () => {
      id = await result.current.confirmMeal(recipe, "suggestion");
    });

    expect(id).toBe("item1");
    expect(confirmMock).toHaveBeenCalledWith({
      recipeId: "r1",
      name: "カレー",
      imageUrl: null,
      rarity: "N",
      difficulty: "normal",
      duration: 30,
      source: "suggestion",
    });
  });
});

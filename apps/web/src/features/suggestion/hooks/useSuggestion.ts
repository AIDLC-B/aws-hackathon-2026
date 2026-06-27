import { useState, useCallback } from "react";
import { callFunction } from "@/shared/lib/functions";
import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import type {
  Recipe,
  Source,
  SuggestMealsRequest,
  SuggestMealsResponse,
} from "@shared/types";

/** フィルタリング画面の入力（所要時間上限・難易度） */
export type SuggestionFilter = SuggestMealsRequest;

/**
 * 献立提案ドメインのサービス層フック（Unit 6・US-05/06）。
 *
 * CF-02（suggestMeals）を呼び出して提案候補（ランダム3品）を取得し、
 * 選んだ1品を確定済み献立として保存する（確定書き込みは useConfirmedMenu に委譲）。
 *
 * needsGachaRedirect（レパートリー10件未満）はガチャ誘導の判定に使う（US-06）。
 */
export function useSuggestion() {
  const { confirm } = useConfirmedMenu();

  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [needsGachaRedirect, setNeedsGachaRedirect] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSuggested, setHasSuggested] = useState(false);

  /**
   * フィルタ条件で献立を提案してもらう（CF-02）。
   * 成功時は suggestions に3品（候補が少なければそれ以下）が入る。
   */
  const suggest = useCallback(async (filter: SuggestionFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await callFunction<SuggestMealsRequest, SuggestMealsResponse>(
        "suggestMeals",
        filter,
      );
      setSuggestions(res.suggestions);
      setNeedsGachaRedirect(res.needsGachaRedirect);
      setTotalCount(res.totalCount);
      setHasSuggested(true);
      return res;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 提案結果から1品を選んで確定する（US-05）。
   * Recipe のスナップショット属性を ConfirmedMenuItem として保存する（Q1=A）。
   * @returns 作成された itemId
   */
  const confirmMeal = useCallback(
    async (recipe: Recipe, source: Source = "suggestion"): Promise<string> => {
      return confirm({
        recipeId: recipe.id,
        name: recipe.name,
        imageUrl: recipe.imageUrl,
        rarity: recipe.rarity,
        difficulty: recipe.difficulty,
        duration: recipe.duration,
        source,
      });
    },
    [confirm],
  );

  return {
    suggestions,
    needsGachaRedirect,
    totalCount,
    loading,
    error,
    hasSuggested,
    suggest,
    confirmMeal,
  };
}

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRecipes } from "@/features/recipe/hooks/useRecipes";
import { updateDocument } from "@/shared/hooks/useDocument";
import {
  ONBOARDING_RECIPES,
  BANANA_ID,
} from "@/features/onboarding/data/onboardingRecipes";
import type { RecipeInput } from "@shared/types";

/**
 * オンボーディング処理フック（US-00）。
 * 選択した料理（バナナは強制追加）をデフォルト値でレパートリーに一括登録し、
 * users/{uid}.isOnboardingCompleted = true を立てる。
 */
export function useOnboarding() {
  const { currentUser, refreshProfile } = useAuth();
  const { addRecipe } = useRecipes();

  /**
   * 選択した料理を一括登録してオンボーディングを完了する。
   * @param selectedIds 選択された料理ID（バナナは自動で含める）
   */
  async function completeOnboarding(selectedIds: string[]): Promise<void> {
    const uid = currentUser?.uid;
    if (!uid) throw new Error("未認証です");

    const ids = new Set(selectedIds);
    ids.add(BANANA_ID); // バナナは必ず登録

    const selected = ONBOARDING_RECIPES.filter((r) => ids.has(r.id));
    for (const r of selected) {
      const input: RecipeInput = {
        name: r.name,
        rarity: r.rarity,
        difficulty: r.difficulty,
        duration: r.duration,
        imageUrl: null,
      };
      await addRecipe(input);
    }

    await updateDocument(`users/${uid}`, { isOnboardingCompleted: true });
    // RouteGuard が最新のprofileで判定できるよう再読込
    if (refreshProfile) await refreshProfile();
  }

  return { recipes: ONBOARDING_RECIPES, completeOnboarding };
}

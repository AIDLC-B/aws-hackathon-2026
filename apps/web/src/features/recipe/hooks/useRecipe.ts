import { useDocument } from "@/shared/hooks/useDocument";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Recipe } from "@shared/types";

/**
 * 単一の料理を購読する（詳細/編集画面用）。
 */
export function useRecipe(recipeId: string) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? "";
  const path = uid
    ? `users/${uid}/recipes/${recipeId}`
    : `users/__unauthenticated__/recipes/${recipeId}`;
  return useDocument<Recipe>(path);
}

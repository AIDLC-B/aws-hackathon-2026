import { serverTimestamp } from "firebase/firestore";
import {
  useCollection,
  createDocWithId,
  newDocId,
} from "@/shared/hooks/useCollection";
import { updateDocument, removeDocument } from "@/shared/hooks/useDocument";
import {
  uploadRecipeImage as storageUploadImage,
  deleteRecipeImage as storageDeleteImage,
} from "@/shared/lib/storage";
import { callFunction } from "@/shared/lib/functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type {
  Recipe,
  RecipeInput,
  RecipeAnalysis,
  AnalyzeRecipeImageRequest,
} from "@shared/types";

/**
 * 料理管理ドメインのサービス層フック（Unit 5・US-01/04）。
 *
 * 汎用プリミティブ（useCollection/useDocument/storage/functions）を内部利用し、
 * コレクションパス・Recipeスキーマ・業務ルールを保持する。SDKは直接呼ばない。
 */
export function useRecipes() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? "";
  // RequireAuth 配下で使用される前提。uid 未確定時は購読しない安全パス。
  const path = uid ? `users/${uid}/recipes` : "users/__unauthenticated__/recipes";

  const { data: recipes, loading, error } = useCollection<Recipe>(path);

  /** 保存前に recipeId を採番（写真アップロードのStorageパス一貫性のため・Q2=A） */
  function newRecipeId(): string {
    return newDocId(path);
  }

  /**
   * 料理を追加する。id を渡すとそのIDで作成（写真フローで採番済みIDを使う）。
   * @returns 作成された recipeId
   */
  async function addRecipe(input: RecipeInput, id?: string): Promise<string> {
    const recipeId = id ?? newRecipeId();
    await createDocWithId(path, recipeId, {
      ...input,
      createdAt: serverTimestamp(),
    });
    return recipeId;
  }

  /** 料理を更新する。 */
  async function updateRecipe(
    recipeId: string,
    data: Partial<RecipeInput>,
  ): Promise<void> {
    await updateDocument(`${path}/${recipeId}`, data);
  }

  /** 料理を削除する（画像もベストエフォートで削除）。 */
  async function deleteRecipe(recipeId: string): Promise<void> {
    await removeDocument(`${path}/${recipeId}`);
    try {
      await storageDeleteImage(uid, recipeId);
    } catch {
      // 画像が無い/既に削除済みでも本処理は成功扱い
    }
  }

  /** 料理画像をアップロードし、ダウンロードURLを返す。 */
  async function uploadImage(recipeId: string, file: File): Promise<string> {
    return storageUploadImage(uid, recipeId, file);
  }

  /**
   * 画像URLをCF-01（analyzeRecipeImage）に渡して料理情報を認識する。
   * @returns 認識結果。認識不能時は呼び出し側で例外を捕捉
   */
  async function analyzeImage(imageUrl: string): Promise<RecipeAnalysis> {
    return callFunction<AnalyzeRecipeImageRequest, RecipeAnalysis>(
      "analyzeRecipeImage",
      { imageUrl },
    );
  }

  return {
    recipes,
    loading,
    error,
    recipeCount: recipes.length,
    newRecipeId,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    uploadImage,
    analyzeImage,
  };
}

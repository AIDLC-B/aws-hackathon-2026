import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipe } from "@/features/recipe/hooks/useRecipe";
import { useRecipes } from "@/features/recipe/hooks/useRecipes";
import { RecipeForm } from "@/features/recipe/components/RecipeForm";
import { Modal, Button, LoadingSpinner } from "@/shared/components/ui";
import {
  emptyRecipeForm,
  validateRecipeForm,
  toRecipeInput,
  type RecipeFormValues,
  type RecipeFieldErrors,
} from "@/features/recipe/validation";

/**
 * レシピ編集画面（US-04）。料理名/頻度/難易度/所要時間（必須）+ 材料/レシピ/メモ（任意）+ 削除。
 */
export function RecipeEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: recipe, loading } = useRecipe(id);
  const { updateRecipe, deleteRecipe, uploadImage } = useRecipes();

  const [values, setValues] = useState<RecipeFormValues>(emptyRecipeForm);
  const [errors, setErrors] = useState<RecipeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 読み込み完了時に一度だけフォームへ反映
  useEffect(() => {
    if (recipe && !initialized) {
      setValues({
        name: recipe.name,
        rarity: recipe.rarity,
        difficulty: recipe.difficulty,
        duration: recipe.duration,
        imageUrl: recipe.imageUrl,
        ingredients: recipe.ingredients ?? "",
        recipe: recipe.recipe ?? "",
        memo: recipe.memo ?? "",
      });
      setInitialized(true);
    }
  }, [recipe, initialized]);

  function patch(p: Partial<RecipeFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handlePickImage(file: File) {
    const url = await uploadImage(id, file);
    patch({ imageUrl: url });
  }

  async function handleSave() {
    const errs = validateRecipeForm(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      await updateRecipe(id, toRecipeInput(values));
      navigate(`/recipe/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setConfirmOpen(false);
    await deleteRecipe(id);
    navigate("/recipe");
  }

  if (loading || !initialized) return <LoadingSpinner />;
  if (!recipe) {
    return (
      <main style={{ padding: 16 }}>
        <p>料理が見つかりませんでした。</p>
        <Button variant="ghost" onClick={() => navigate("/recipe")}>
          ← レパートリーへ
        </Button>
      </main>
    );
  }

  return (
    <main data-testid="recipe-edit-page" style={{ padding: 16, paddingBottom: 32 }}>
      <h1 style={{ fontSize: 20, margin: "0 0 16px" }}>レシピを編集する</h1>

      <RecipeForm
        values={values}
        errors={errors}
        onChange={patch}
        onSubmit={handleSave}
        submitLabel="保存する"
        withOptional
        withPhoto
        onPickImage={handlePickImage}
        imagePreviewUrl={values.imageUrl ?? null}
        submitting={submitting}
        onDelete={() => setConfirmOpen(true)}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="料理を削除"
      >
        <p style={{ marginTop: 0 }}>削除すると元に戻せません。削除しますか？</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            削除する
          </Button>
        </div>
      </Modal>
    </main>
  );
}

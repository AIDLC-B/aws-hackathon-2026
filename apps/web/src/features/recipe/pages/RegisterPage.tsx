import { useState } from "react";
import { useRecipes } from "@/features/recipe/hooks/useRecipes";
import { RecipeForm } from "@/features/recipe/components/RecipeForm";
import { CharacterBottomSheet } from "@/features/character/components/CharacterBottomSheet";
import {
  emptyRecipeForm,
  validateRecipeForm,
  toRecipeInput,
  type RecipeFormValues,
  type RecipeFieldErrors,
} from "@/features/recipe/validation";

/**
 * 料理登録画面（US-01）。写真AI認識 or 手動入力。Container。
 *
 * 写真フロー（Q2=A）: 先に recipeId を採番 → 同IDでStorageへアップロード →
 * CF-01 で認識 → フォームへautofill → 「登録する」で同IDでドキュメント作成。
 */
export function RegisterPage() {
  const { newRecipeId, addRecipe, uploadImage, analyzeImage } = useRecipes();

  const [values, setValues] = useState<RecipeFormValues>(emptyRecipeForm);
  const [errors, setErrors] = useState<RecipeFieldErrors>({});
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  function patch(p: Partial<RecipeFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handlePickImage(file: File) {
    const rid = recipeId ?? newRecipeId();
    setRecipeId(rid);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setNotice(null);
    try {
      const url = await uploadImage(rid, file);
      patch({ imageUrl: url });
      try {
        const analysis = await analyzeImage(url);
        patch({
          name: analysis.name,
          rarity: analysis.rarity,
          difficulty: analysis.difficulty,
          duration: analysis.duration,
        });
      } catch {
        // 認識失敗: 手動入力を促す（画像は保持）
        setNotice("料理を認識できませんでした。手動で入力してください");
      }
    } catch {
      setNotice("画像のアップロードに失敗しました。もう一度お試しください");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    const errs = validateRecipeForm(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await addRecipe(toRecipeInput(values), recipeId ?? undefined);
      setSheetOpen(true); // US-14 キャラ一言
    } finally {
      setSubmitting(false);
    }
  }

  function handleSheetClose() {
    setSheetOpen(false);
    // 続けて登録できるようフォームをリセット
    setValues(emptyRecipeForm);
    setErrors({});
    setRecipeId(null);
    setImagePreview(null);
    setNotice(null);
  }

  return (
    <main data-testid="recipe-register-page" style={{ padding: 16, paddingBottom: 32 }}>
      <h1 style={{ fontSize: 20, margin: "0 0 16px" }}>料理を登録する</h1>

      <RecipeForm
        values={values}
        errors={errors}
        onChange={patch}
        onSubmit={handleSubmit}
        submitLabel="登録する"
        withPhoto
        onPickImage={handlePickImage}
        analyzing={analyzing}
        imagePreviewUrl={imagePreview}
        notice={notice}
        submitting={submitting}
        helper={
          <div
            style={{
              background: "#fff5f0",
              borderRadius: 10,
              padding: 12,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <strong>サボ母ちゃん</strong>
            <br />
            「料理名と頻度だけ入れてくれたらええで！材料やレシピはあとでゆっくり入れたらええねん」
          </div>
        }
      />

      <CharacterBottomSheet
        trigger="recipe_registered"
        from="registration"
        open={sheetOpen}
        onClose={handleSheetClose}
        autoCloseMs={5000}
      />
    </main>
  );
}

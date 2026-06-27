import { useParams, useNavigate } from "react-router-dom";
import { useRecipe } from "@/features/recipe/hooks/useRecipe";
import { Button, LoadingSpinner } from "@/shared/components/ui";
import {
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";

/**
 * レシピ詳細画面（US-04・レパートリー側）。
 * 写真・料理名・頻度・難易度・所要時間・材料・レシピ・メモを表示。
 */
export function RecipeDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: recipe, loading } = useRecipe(id);

  if (loading) return <LoadingSpinner />;
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

  const fallback = (v?: string) => (v && v.trim() ? v : "未設定");

  return (
    <main data-testid="recipe-detail-page" style={{ padding: 16, paddingBottom: 32 }}>
      <Button variant="ghost" onClick={() => navigate("/recipe")}>
        ← レパートリー
      </Button>

      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          style={{
            width: "100%",
            maxHeight: 240,
            objectFit: "cover",
            borderRadius: 12,
            margin: "12px 0",
          }}
        />
      )}

      <h1 style={{ fontSize: 22, margin: "8px 0" }}>{recipe.name}</h1>
      <p style={{ color: "#666", margin: "0 0 16px" }}>
        {FREQUENCY_LABEL[recipe.rarity]}｜{DIFFICULTY_LABEL[recipe.difficulty]}｜
        {recipe.duration}分
      </p>

      <Section title="材料" body={fallback(recipe.ingredients)} />
      <Section title="レシピ" body={fallback(recipe.recipe)} />
      <Section title="メモ" body={fallback(recipe.memo)} />

      <Button
        fullWidth
        onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
        style={{ marginTop: 16 }}
      >
        ✏️ 編集
      </Button>
    </main>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>{title}</h2>
      <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "#333" }}>{body}</p>
    </div>
  );
}

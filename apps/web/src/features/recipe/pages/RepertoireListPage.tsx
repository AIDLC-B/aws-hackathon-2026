import { useNavigate } from "react-router-dom";
import { useRecipes } from "@/features/recipe/hooks/useRecipes";
import { Button, Card, LoadingSpinner } from "@/shared/components/ui";
import {
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";

/**
 * レパートリー一覧画面（US-04）。料理名・頻度・難易度・所要時間を一覧表示。
 */
export function RepertoireListPage() {
  const { recipes, loading } = useRecipes();
  const navigate = useNavigate();

  return (
    <main data-testid="repertoire-list-page" style={{ padding: 16, paddingBottom: 80 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>レパートリー</h1>
        <Button onClick={() => navigate("/recipe/new")}>＋ 登録</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : recipes.length === 0 ? (
        <p style={{ color: "#777", textAlign: "center", marginTop: 40 }}>
          まだ料理がありません。「＋ 登録」から追加しましょう。
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recipes.map((r) => (
            <Card
              key={r.id}
              onClick={() => navigate(`/recipe/${r.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <strong style={{ fontSize: 16 }}>{r.name}</strong>
                <span style={{ fontSize: 13, color: "#888" }}>
                  {FREQUENCY_LABEL[r.rarity]}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                {DIFFICULTY_LABEL[r.difficulty]}｜{r.duration}分
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

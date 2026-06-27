import { useNavigate } from "react-router-dom";
import { Button, Card, LoadingSpinner } from "@/shared/components/ui";
import { useRecipes } from "@/features/recipe/hooks/useRecipes";

/** ガチャ誘導の閾値（レパートリーがこの件数未満なら誘導・US-06） */
const GACHA_REDIRECT_THRESHOLD = 10;

/**
 * 献立選択トップ画面（US-05/06）。確定済み献立が0件のときのホーム表示。
 *
 * - 「考えて選ぶ」→ フィルタリング画面（/suggestion/filter）
 * - 「運に任せる」→ ガチャ（/gacha・Unit 7）
 * - レパートリーが閾値未満なら、料理登録 or ガチャでレパートリーを増やす誘導（US-06）
 */
export function SelectionPage() {
  const navigate = useNavigate();
  const { recipeCount, loading } = useRecipes();

  if (loading) return <LoadingSpinner />;

  const needsMoreRepertoire = recipeCount < GACHA_REDIRECT_THRESHOLD;

  return (
    <main
      data-testid="selection-page"
      style={{ padding: 16, paddingBottom: 80 }}
    >
      <h1 style={{ fontSize: 20, margin: "8px 0 4px" }}>今日のごはん</h1>
      <p style={{ color: "#777", margin: "0 0 20px", fontSize: 14 }}>
        考えたくない日は、まかせてOK。
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Button
          fullWidth
          data-testid="selection-filter-button"
          onClick={() => navigate("/suggestion/filter")}
        >
          🍳 条件で選んで提案してもらう
        </Button>
        <Button
          fullWidth
          variant="secondary"
          data-testid="selection-gacha-button"
          onClick={() => navigate("/gacha")}
        >
          🎲 運に任せる（ガチャ）
        </Button>
      </div>

      {needsMoreRepertoire && (
        <Card
          data-testid="gacha-redirect-banner"
          style={{ marginTop: 20, background: "#fff4ef" }}
        >
          <p style={{ margin: "0 0 10px", fontSize: 14, color: "#555" }}>
            レパートリーが{recipeCount}件です。10件以上あると提案の幅が広がります。
            ガチャで新しい料理に出会ってみませんか？
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              data-testid="gacha-redirect-gacha-button"
              onClick={() => navigate("/gacha")}
            >
              ガチャを回す
            </Button>
            <Button
              variant="ghost"
              data-testid="gacha-redirect-register-button"
              onClick={() => navigate("/recipe/new")}
            >
              料理を登録する
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}

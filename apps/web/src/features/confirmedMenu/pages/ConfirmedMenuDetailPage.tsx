import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, LoadingSpinner } from "@/shared/components/ui";
import {
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";
import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import { useRecipe } from "@/features/recipe/hooks/useRecipe";
import { CharacterBottomSheet } from "@/features/character/components/CharacterBottomSheet";

/**
 * 確定済み献立の詳細画面（US-16・Q2=A）。
 *
 * ヘッダはスナップショット（name/rarity/difficulty/duration）を表示し、
 * 材料/レシピ/メモは recipeId から元レシピを参照して表示する。
 * 「つくったよ！」で確定済み献立を完了（削除）し、キャラの一言（meal_completed）を表示してホームへ。
 */
export function ConfirmedMenuDetailPage() {
  const { itemId = "" } = useParams();
  const navigate = useNavigate();
  const { items, loading: menuLoading, completeMenuItem } = useConfirmedMenu();

  const item = items.find((i) => i.id === itemId) ?? null;
  // 元レシピ（材料/レシピ/メモ）を参照（Q2=A）。recipeId 未確定時は購読しない。
  const { data: recipe, loading: recipeLoading } = useRecipe(item?.recipeId ?? "");

  const [completing, setCompleting] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  if (menuLoading) return <LoadingSpinner />;

  if (!item) {
    return (
      <main style={{ padding: 16 }}>
        <p>献立が見つかりませんでした。</p>
        <Button variant="ghost" onClick={() => navigate("/")}>
          ← ホームへ
        </Button>
      </main>
    );
  }

  const fallback = (v?: string) => (v && v.trim() ? v : "未設定");

  async function handleComplete() {
    setCompleting(true);
    try {
      await completeMenuItem(itemId);
      setCompletedOpen(true);
    } catch {
      setCompleting(false);
    }
  }

  return (
    <main
      data-testid="confirmed-menu-detail-page"
      style={{ padding: 16, paddingBottom: 32 }}
    >
      <Button variant="ghost" onClick={() => navigate("/")}>
        ← ホーム
      </Button>

      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          style={{
            width: "100%",
            maxHeight: 240,
            objectFit: "cover",
            borderRadius: 12,
            margin: "12px 0",
          }}
        />
      )}

      <h1 style={{ fontSize: 22, margin: "8px 0" }}>{item.name}</h1>
      <p style={{ color: "#666", margin: "0 0 16px" }}>
        {FREQUENCY_LABEL[item.rarity]}｜{DIFFICULTY_LABEL[item.difficulty]}｜
        {item.duration}分
      </p>

      {recipeLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Section title="材料" body={fallback(recipe?.ingredients)} />
          <Section title="レシピ" body={fallback(recipe?.recipe)} />
          <Section title="メモ" body={fallback(recipe?.memo)} />
        </>
      )}

      <Button
        fullWidth
        data-testid="made-it-button"
        onClick={handleComplete}
        disabled={completing}
        style={{ marginTop: 16 }}
      >
        🍽 つくったよ！
      </Button>

      {/* つくったよ時のキャラ一言（meal_completed）→ 閉じたらホームへ */}
      <CharacterBottomSheet
        trigger="meal_completed"
        from="detail"
        open={completedOpen}
        onClose={() => navigate("/")}
      />
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

import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/shared/components/ui";
import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import { MenuItemCard } from "@/features/confirmedMenu/components/MenuItemCard";

/**
 * 確定済み献立リスト画面（US-16）。確定済み献立が2件以上のときのホーム表示。
 * 各献立をタップで詳細（材料/レシピ/メモ + つくったよ！）へ。
 */
export function MenuListPage() {
  const navigate = useNavigate();
  const { items, loading } = useConfirmedMenu();

  if (loading) return <LoadingSpinner />;

  return (
    <main data-testid="menu-list-page" style={{ padding: 16, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 20, margin: "8px 0 16px" }}>きょうの献立</h1>

      {items.length === 0 ? (
        <p style={{ color: "#777", textAlign: "center", marginTop: 40 }}>
          確定した献立はありません。
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onClick={(i) => navigate(`/menu/${i.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

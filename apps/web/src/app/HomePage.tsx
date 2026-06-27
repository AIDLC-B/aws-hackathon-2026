import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/shared/components/ui";
import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import { SelectionPage } from "@/features/suggestion/pages/SelectionPage";
import { MenuListPage } from "@/features/confirmedMenu/pages/MenuListPage";

/**
 * ホーム画面ディスパッチ（Q3）。確定済み献立の件数で表示を分岐する。
 * - 0件 → 献立選択画面（SelectionPage）
 * - 1件 → その献立の詳細（/menu/:itemId へリダイレクト）
 * - 2件以上 → 献立リスト（MenuListPage）
 */
export function HomePage() {
  const { items, count, loading } = useConfirmedMenu();

  if (loading) return <LoadingSpinner />;

  if (count === 0) return <SelectionPage />;
  if (count === 1) return <Navigate to={`/menu/${items[0].id}`} replace />;
  return <MenuListPage />;
}

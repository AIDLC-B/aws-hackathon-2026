import { serverTimestamp } from "firebase/firestore";
import {
  useCollection,
  createDoc,
  getCollectionOnce,
} from "@/shared/hooks/useCollection";
import { removeDocument } from "@/shared/hooks/useDocument";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ConfirmedMenuItem, ConfirmedMenuItemInput } from "@shared/types";

/**
 * 確定済み献立ドメインのサービス層フック（Unit 6・US-05/06/16）。
 *
 * 汎用プリミティブ（useCollection / createDoc / removeDocument）を内部利用し、
 * コレクションパス `users/{uid}/confirmedMenuItems` と ConfirmedMenuItem スキーマ・
 * 業務ルールを保持する。SDKは直接呼ばない。
 *
 * スナップショット方式（Q1=A）: confirm 時に表示属性を保存し、一覧では
 * 元レシピを再フェッチしない。
 */
export function useConfirmedMenu() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? "";
  // RequireAuth 配下で使用される前提。uid 未確定時は購読しない安全パス。
  const path = uid
    ? `users/${uid}/confirmedMenuItems`
    : "users/__unauthenticated__/confirmedMenuItems";

  const { data: items, loading, error } = useCollection<ConfirmedMenuItem>(path);

  /**
   * 献立を確定（保存）する。提案/ガチャ結果からの確定で使用。
   * @returns 作成された itemId
   */
  async function confirm(input: ConfirmedMenuItemInput): Promise<string> {
    return createDoc(path, {
      ...input,
      confirmedAt: serverTimestamp(),
    });
  }

  /**
   * 「つくったよ！」— 確定済み献立を完了として削除する（US-16）。
   */
  async function completeMenuItem(itemId: string): Promise<void> {
    await removeDocument(`${path}/${itemId}`);
  }

  /**
   * 確定済み献立を一度だけ取得（購読なし）。提案フロー開始前の件数判定などに使用。
   */
  async function getConfirmedMenuItems(): Promise<ConfirmedMenuItem[]> {
    return getCollectionOnce<ConfirmedMenuItem>(path);
  }

  /**
   * 確定済み献立を全件削除する（Unit 7・10連ガチャ「入れ替え」用）。
   * 現在の購読データの各ドキュメントを remove する。
   */
  async function clearAll(): Promise<void> {
    const current = await getConfirmedMenuItems();
    await Promise.all(
      current.map((item) => removeDocument(`${path}/${item.id}`)),
    );
  }

  return {
    items,
    loading,
    error,
    /** 確定済み献立の件数（0→選択 / 1→詳細 / 2+→リストの分岐に使用） */
    count: items.length,
    confirm,
    completeMenuItem,
    getConfirmedMenuItems,
    clearAll,
  };
}

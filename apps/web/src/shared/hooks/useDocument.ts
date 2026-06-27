import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/shared/lib/firebase";
import type { WithId } from "@/shared/hooks/useCollection";

/**
 * 汎用Firestoreプリミティブ（層1）— 単一ドキュメント。
 *
 * - ローディング/エラー状態の共通化
 * - onSnapshot の購読解除を useEffect クリーンアップで自動実行
 * - ジェネリック <T> による型安全
 */

interface DocumentState<T> {
  data: WithId<T> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 単一ドキュメントをリアルタイム購読する。
 * @param path スラッシュ区切りのドキュメントパス（例: "users/uid"）
 */
export function useDocument<T = DocumentData>(path: string): DocumentState<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      doc(db, path),
      (snap) => {
        setData(
          snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null,
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}

/** ドキュメントを更新（updateDoc）。 */
export async function updateDocument<T extends DocumentData>(
  path: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, path), data as DocumentData);
}

/** ドキュメントを削除（deleteDoc）。 */
export async function removeDocument(path: string): Promise<void> {
  await deleteDoc(doc(db, path));
}

/** ドキュメントを一度だけ取得（getDoc・購読なし）。 */
export async function getDocumentOnce<T = DocumentData>(
  path: string,
): Promise<WithId<T> | null> {
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null;
}

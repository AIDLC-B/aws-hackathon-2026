import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  addDoc,
  setDoc,
  doc,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/shared/lib/firebase";

/**
 * 汎用Firestoreプリミティブ（層1）— コレクション。
 *
 * Firestore SDKへの直接依存はこの層に集約する。各ドメイン固有hooks（useRecipes 等）は
 * 本プリミティブを内部利用し、SDKを直接呼ばない。
 *
 * - ローディング/エラー状態の共通化
 * - onSnapshot の購読解除（unsubscribe）を useEffect クリーンアップで自動実行
 * - ジェネリック <T> による型安全
 *
 * 返却データには Firestore ドキュメントIDを `id` として付与する。
 */

/** コレクションを表す型（ドキュメントデータ + id） */
export type WithId<T> = T & { id: string };

interface CollectionState<T> {
  data: WithId<T>[];
  loading: boolean;
  error: Error | null;
}

/**
 * コレクションをリアルタイム購読する。
 * @param path スラッシュ区切りのコレクションパス（例: "users/uid/recipes"）
 * @param constraints where / orderBy などのクエリ制約（任意）
 */
export function useCollection<T = DocumentData>(
  path: string,
  ...constraints: QueryConstraint[]
): CollectionState<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // constraints は配列のため、依存配列にはシリアライズ不能。呼び出し側で
  // メモ化された制約 or 安定したpathを渡す前提とし、path変化で再購読する。
  useEffect(() => {
    setLoading(true);
    setError(null);
    const ref = constraints.length
      ? query(collection(db, path), ...constraints)
      : collection(db, path);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(
          snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) })),
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, error };
}

/** ドキュメントを追加（addDoc）。生成されたドキュメントIDを返す。 */
export async function createDoc<T extends DocumentData>(
  path: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(collection(db, path), data);
  return ref.id;
}

/** ID指定でドキュメントを作成（setDoc）。 */
export async function createDocWithId<T extends DocumentData>(
  path: string,
  id: string,
  data: T,
): Promise<void> {
  await setDoc(doc(db, path, id), data);
}

/** コレクションを一度だけ取得（getDocs・購読なし）。 */
export async function getCollectionOnce<T = DocumentData>(
  path: string,
  ...constraints: QueryConstraint[]
): Promise<WithId<T>[]> {
  const ref = constraints.length
    ? query(collection(db, path), ...constraints)
    : collection(db, path);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

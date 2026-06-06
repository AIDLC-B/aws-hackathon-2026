import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";
import { app } from "@/shared/lib/firebase";

/**
 * Cloud Functions 呼び出しヘルパー。
 *
 * - リージョンは us-central1（Infrastructure Design 確定）
 * - ローカル開発時は Functions Emulator に接続
 * - Callable Functions は Firebase Auth トークンを自動付与
 *
 * 各ドメイン固有hooks（useSuggestion / useGacha 等）はこの汎用ヘルパーを内部利用し、
 * 関数名・入出力型を自身で保持する（Q2=B: ドメイン型は機能ユニット側）。
 */

const REGION = "us-central1";

export const functions: Functions = getFunctions(app, REGION);

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

/**
 * 型付きCallable Function呼び出し。
 * @param name 関数名（例: "suggestMeals"）
 * @param data リクエストペイロード
 * @returns レスポンスデータ
 */
export async function callFunction<TReq, TRes>(
  name: string,
  data: TReq,
): Promise<TRes> {
  const callable = httpsCallable<TReq, TRes>(functions, name);
  const result = await callable(data);
  return result.data;
}

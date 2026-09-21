/**
 * Callable Functions の認証検証ヘルパー（Security Baseline拡張）。
 *
 * 全Callable Functionで request.auth を検証し、未認証は HttpsError(unauthenticated) を投げる。
 */
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

/**
 * 認証済みユーザーの uid を返す。未認証なら unauthenticated エラー。
 * @param request Callable リクエスト
 * @returns 認証済みユーザーの uid
 */
export function requireAuth(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "この操作にはログインが必要です。",
    );
  }
  return uid;
}

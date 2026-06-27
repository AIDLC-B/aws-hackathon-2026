/**
 * Firebase Auth エラーコード → 日本語メッセージ変換（BR-8 / RP-2）
 */

/** ユーザーが意図的にキャンセルした（エラー表示しない）系のコード */
const SILENT_ERROR_CODES = new Set<string>([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

const MESSAGE_MAP: Record<string, string> = {
  "auth/network-request-failed":
    "ネットワークエラーが発生しました。接続を確認してください",
  "auth/popup-blocked":
    "ポップアップがブロックされました。許可してください",
};

const FALLBACK_MESSAGE =
  "ログインに失敗しました。時間をおいて再度お試しください";

/** キャンセル系（エラー表示せず静かに戻す）かどうか */
export function isSilentAuthError(code: string | undefined): boolean {
  return code !== undefined && SILENT_ERROR_CODES.has(code);
}

/**
 * エラーコードを日本語メッセージに変換。
 * キャンセル系の場合は null を返す（呼び出し側で表示しない）。
 */
export function mapAuthError(code: string | undefined): string | null {
  if (isSilentAuthError(code)) return null;
  if (code && code in MESSAGE_MAP) return MESSAGE_MAP[code];
  return FALLBACK_MESSAGE;
}

/** unknown なエラーオブジェクトから Firebase エラーコードを安全に抽出 */
export function extractAuthErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return undefined;
}

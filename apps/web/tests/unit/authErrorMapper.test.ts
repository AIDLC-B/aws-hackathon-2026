import { describe, it, expect } from "vitest";
import {
  mapAuthError,
  isSilentAuthError,
  extractAuthErrorCode,
} from "@/shared/utils/authErrorMapper";

describe("authErrorMapper", () => {
  it("キャンセル系コードは静かに無視（null）", () => {
    expect(mapAuthError("auth/popup-closed-by-user")).toBeNull();
    expect(mapAuthError("auth/cancelled-popup-request")).toBeNull();
    expect(isSilentAuthError("auth/popup-closed-by-user")).toBe(true);
  });

  it("ネットワークエラーを日本語にマッピング", () => {
    expect(mapAuthError("auth/network-request-failed")).toContain(
      "ネットワークエラー"
    );
  });

  it("ポップアップブロックを日本語にマッピング", () => {
    expect(mapAuthError("auth/popup-blocked")).toContain("ポップアップ");
  });

  it("未知コードは汎用メッセージ", () => {
    expect(mapAuthError("auth/unknown-xyz")).toContain("ログインに失敗");
    expect(mapAuthError(undefined)).toContain("ログインに失敗");
  });

  it("エラーオブジェクトからコードを抽出", () => {
    expect(extractAuthErrorCode({ code: "auth/popup-blocked" })).toBe(
      "auth/popup-blocked"
    );
    expect(extractAuthErrorCode(new Error("x"))).toBeUndefined();
    expect(extractAuthErrorCode(null)).toBeUndefined();
  });
});

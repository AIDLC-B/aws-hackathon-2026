import { describe, it, expect, vi, beforeEach } from "vitest";

// Firebase モジュールをモック
const getDocMock = vi.fn();
const setDocMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "mock-ref" })),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: vi.fn(() => "MOCK_TS"),
}));

vi.mock("@/shared/lib/firebase", () => ({
  db: {},
  auth: {},
  googleProvider: {},
}));

import { ensureUserProfile } from "@/features/auth/hooks/useAuth";

describe("ensureUserProfile（冪等初期化 BR-2 / RP-3）", () => {
  beforeEach(() => {
    getDocMock.mockReset();
    setDocMock.mockReset();
  });

  it("ドキュメントが存在しない場合は初期値で作成（isPremium=false）", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    await ensureUserProfile("uid1", "テスト太郎", "taro@example.com");

    expect(setDocMock).toHaveBeenCalledTimes(1);
    const written = setDocMock.mock.calls[0][1];
    expect(written.nickname).toBe("テスト太郎");
    expect(written.email).toBe("taro@example.com");
    expect(written.isPremium).toBe(false);
    expect(written.isOnboardingCompleted).toBe(false);
    expect(written.favoriteCharacters).toEqual([]);
  });

  it("displayNameが空ならemailローカル部をnicknameに使う", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    await ensureUserProfile("uid2", null, "hanako@example.com");

    const written = setDocMock.mock.calls[0][1];
    expect(written.nickname).toBe("hanako");
  });

  it("既存ドキュメントがある場合は上書きしない（BR-2.5）", async () => {
    getDocMock.mockResolvedValue({ exists: () => true });
    await ensureUserProfile("uid3", "テスト", "t@example.com");

    expect(setDocMock).not.toHaveBeenCalled();
  });
});

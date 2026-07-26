import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";

const updateDocumentMock = vi.fn();
const refreshProfileMock = vi.fn();

vi.mock("@/shared/lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));
vi.mock("@/shared/hooks/useDocument", () => ({
  updateDocument: (...a: unknown[]) => updateDocumentMock(...a),
}));

import { AuthContext, type AuthContextValue } from "@/app/providers/AuthProvider";
import { useSettings } from "@/features/settings/hooks/useSettings";
import type { UserProfile } from "@/shared/types";

const profile = {
  nickname: "テスト",
  email: "t@example.com",
  isPremium: true,
  isOnboardingCompleted: true,
  favoriteCharacters: ["nyamake"],
} as unknown as UserProfile;

function wrapper({ children }: { children: ReactNode }) {
  const value: AuthContextValue = {
    currentUser: { uid: "u1" } as never,
    profile,
    loading: false,
    refreshProfile: refreshProfileMock,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

beforeEach(() => {
  updateDocumentMock.mockReset().mockResolvedValue(undefined);
  refreshProfileMock.mockReset().mockResolvedValue(undefined);
});

describe("useSettings", () => {
  it("プロフィールから isPremium / favoriteCharacters を返す", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(result.current.isPremium).toBe(true);
    expect(result.current.favoriteCharacters).toEqual(["nyamake"]);
  });

  it("updateFavoriteCharacters は users/{uid} を更新しプロフィールを再読込する", async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    await act(async () => {
      await result.current.updateFavoriteCharacters(["saboeru", "sabot"]);
    });
    expect(updateDocumentMock).toHaveBeenCalledWith("users/u1", {
      favoriteCharacters: ["saboeru", "sabot"],
    });
    expect(refreshProfileMock).toHaveBeenCalledTimes(1);
  });

  it("AuthProvider 外で使うとエラーを投げる", () => {
    expect(() => renderHook(() => useSettings())).toThrow(/AuthProvider/);
  });
});

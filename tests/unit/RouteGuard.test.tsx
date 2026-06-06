import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "@/app/providers/AuthProvider";
import { RequireAuth } from "@/app/routes";
import type { UserProfile } from "@/shared/types";

function renderWithAuth(value: AuthContextValue, initialPath = "/") {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <div data-testid="protected">保護コンテンツ</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div data-testid="login">ログイン</div>} />
          <Route
            path="/onboarding"
            element={<div data-testid="onboarding">オンボーディング</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const baseProfile: UserProfile = {
  nickname: "t",
  email: "t@example.com",
  isPremium: false,
  isOnboardingCompleted: true,
  favoriteCharacters: [],
  // @ts-expect-error テスト用のダミーTimestamp
  createdAt: { seconds: 0, nanoseconds: 0 },
};

describe("RouteGuard（L-5）", () => {
  it("loading中はローディング表示", () => {
    renderWithAuth({ currentUser: null, profile: null, loading: true });
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("未認証はログインへリダイレクト", () => {
    renderWithAuth({ currentUser: null, profile: null, loading: false });
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("認証済 & オンボーディング未完了はオンボーディングへ", () => {
    renderWithAuth({
      currentUser: { uid: "u1" } as never,
      profile: { ...baseProfile, isOnboardingCompleted: false },
      loading: false,
    });
    expect(screen.getByTestId("onboarding")).toBeInTheDocument();
  });

  it("認証済 & オンボーディング完了は保護コンテンツを表示", () => {
    renderWithAuth({
      currentUser: { uid: "u1" } as never,
      profile: baseProfile,
      loading: false,
    });
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });
});

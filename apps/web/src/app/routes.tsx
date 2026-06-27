import { useContext, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthContext } from "@/app/providers/AuthProvider";
import { AppLayout } from "@/app/AppLayout";
import { HomePage } from "@/app/HomePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";
import { RepertoireListPage } from "@/features/recipe/pages/RepertoireListPage";
import { RegisterPage } from "@/features/recipe/pages/RegisterPage";
import { RecipeDetailPage } from "@/features/recipe/pages/RecipeDetailPage";
import { RecipeEditPage } from "@/features/recipe/pages/RecipeEditPage";
import { FilteringPage } from "@/features/suggestion/pages/FilteringPage";
import { ConfirmedMenuDetailPage } from "@/features/confirmedMenu/pages/ConfirmedMenuDetailPage";

/** ローディング表示（UP-1 ローディングゲート） */
function LoadingScreen() {
  return (
    <div
      data-testid="loading-screen"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      読み込み中...
    </div>
  );
}

/** Unit 7 で実装予定のガチャ画面プレースホルダ（Q4・ナビ成立用） */
function GachaPlaceholder() {
  return (
    <div data-testid="gacha-page" style={{ padding: 16 }}>
      ガチャ（Unit 7で実装）
    </div>
  );
}

/** Unit 8 で実装予定の設定画面プレースホルダ */
function SettingsPlaceholder() {
  return <div data-testid="settings-page" style={{ padding: 16 }}>設定（Unit 8で実装）</div>;
}

/**
 * 認証ガード（L-5 / RouteGuard）。
 * - loading: ローディング表示
 * - 未認証: /login へ
 * - 認証済 & !isOnboardingCompleted: /onboarding へ
 * - 認証済 & isOnboardingCompleted: 子要素を表示
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const ctx = useContext(AuthContext);
  const location = useLocation();
  if (!ctx || ctx.loading) return <LoadingScreen />;
  if (!ctx.currentUser) return <Navigate to="/login" replace />;
  if (
    ctx.profile &&
    !ctx.profile.isOnboardingCompleted &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/** 認証済みユーザーがログイン画面に来たらリダイレクト */
function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const ctx = useContext(AuthContext);
  if (!ctx || ctx.loading) return <LoadingScreen />;
  if (ctx.currentUser) {
    const to =
      ctx.profile && !ctx.profile.isOnboardingCompleted ? "/onboarding" : "/";
    return <Navigate to={to} replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* タブ付きレイアウト（ボトムナビあり） */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe" element={<RepertoireListPage />} />
          <Route path="/settings" element={<SettingsPlaceholder />} />
        </Route>

        {/* レシピのサブ画面（ボトムナビなし・戻る導線） */}
        <Route
          path="/recipe/new"
          element={
            <RequireAuth>
              <RegisterPage />
            </RequireAuth>
          }
        />
        <Route
          path="/recipe/:id"
          element={
            <RequireAuth>
              <RecipeDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/recipe/:id/edit"
          element={
            <RequireAuth>
              <RecipeEditPage />
            </RequireAuth>
          }
        />

        {/* 献立提案フロー（Unit 6・ボトムナビなし） */}
        <Route
          path="/suggestion/filter"
          element={
            <RequireAuth>
              <FilteringPage />
            </RequireAuth>
          }
        />
        <Route
          path="/menu/:itemId"
          element={
            <RequireAuth>
              <ConfirmedMenuDetailPage />
            </RequireAuth>
          }
        />

        {/* ガチャ（Unit 7・プレースホルダ） */}
        <Route
          path="/gacha"
          element={
            <RequireAuth>
              <GachaPlaceholder />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export { RequireAuth, RedirectIfAuthed };

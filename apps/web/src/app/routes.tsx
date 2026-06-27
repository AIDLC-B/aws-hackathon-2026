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
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";
import { RepertoireListPage } from "@/features/recipe/pages/RepertoireListPage";
import { RegisterPage } from "@/features/recipe/pages/RegisterPage";
import { RecipeDetailPage } from "@/features/recipe/pages/RecipeDetailPage";
import { RecipeEditPage } from "@/features/recipe/pages/RecipeEditPage";

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

/** Unit 6 で実装予定のトップ画面プレースホルダ */
function HomePlaceholder() {
  return <div data-testid="home-page" style={{ padding: 16 }}>トップ画面（Unit 6で実装）</div>;
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
          <Route path="/" element={<HomePlaceholder />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export { RequireAuth, RedirectIfAuthed };

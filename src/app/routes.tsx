import { useContext, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthContext } from "@/app/providers/AuthProvider";
import { LoginPage } from "@/features/auth/pages/LoginPage";

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

/** Unit 5 で実装予定のオンボーディング画面プレースホルダ */
function OnboardingPlaceholder() {
  return <div data-testid="onboarding-page">オンボーディング（Unit 5で実装）</div>;
}

/** Unit 6 で実装予定のトップ画面プレースホルダ */
function HomePlaceholder() {
  return <div data-testid="home-page">トップ画面（Unit 6で実装）</div>;
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
              <OnboardingPlaceholder />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePlaceholder />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export { RequireAuth, RedirectIfAuthed };

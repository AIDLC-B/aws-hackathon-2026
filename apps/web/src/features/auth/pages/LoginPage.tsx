import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import {
  extractAuthErrorCode,
  mapAuthError,
} from "@/shared/utils/authErrorMapper";

/**
 * ログイン画面（US-17）。Google認証のみ。サインアップは統合（初回サインイン=登録）。
 */
export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // 成功時の遷移は RouteGuard が profile に基づいて自動判定（L-4）
    } catch (e) {
      const code = extractAuthErrorCode(e);
      const message = mapAuthError(code); // キャンセル系は null
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      data-testid="login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>DAMESI</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>献立を、考えない。</p>
      </div>

      <GoogleSignInButton onClick={handleSignIn} loading={submitting} />

      {error && (
        <p data-testid="login-error" role="alert" style={{ color: "#d33" }}>
          {error}
        </p>
      )}
    </main>
  );
}

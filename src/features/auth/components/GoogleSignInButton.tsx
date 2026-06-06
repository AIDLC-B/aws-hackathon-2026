interface GoogleSignInButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** 「Googleでログイン」ボタン（UP-2 ワンタップ認証） */
export function GoogleSignInButton({
  onClick,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      data-testid="login-google-button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem 1.5rem",
        fontSize: "1rem",
        borderRadius: "8px",
        border: "1px solid #dadce0",
        background: "#fff",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
      }}
    >
      <span aria-hidden="true" style={{ fontWeight: 700, color: "#4285F4" }}>
        G
      </span>
      {loading ? "ログイン中..." : "Googleでログイン"}
    </button>
  );
}

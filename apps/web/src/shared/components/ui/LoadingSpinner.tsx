import type { CSSProperties } from "react";

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
}

/** ローディングスピナー（UI Element） */
export function LoadingSpinner({ size = 32, label = "読み込み中" }: LoadingSpinnerProps) {
  const spinner: CSSProperties = {
    width: size,
    height: size,
    border: `${Math.max(2, size / 10)}px solid #f0f0f0`,
    borderTopColor: "#ff7043",
    borderRadius: "50%",
    animation: "damesi-spin 0.8s linear infinite",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={spinner} />
      <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
      <style>{`@keyframes damesi-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 20px",
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid transparent",
  transition: "opacity 0.15s ease",
};

const variants: Record<Variant, CSSProperties> = {
  primary: { background: "#ff7043", color: "#fff" },
  secondary: { background: "#fff", color: "#ff7043", border: "1px solid #ff7043" },
  ghost: { background: "transparent", color: "#555" },
  danger: { background: "#e53935", color: "#fff" },
};

/** 汎用ボタン（UI Element） */
export function Button({
  variant = "primary",
  fullWidth = false,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...base,
        ...variants[variant],
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

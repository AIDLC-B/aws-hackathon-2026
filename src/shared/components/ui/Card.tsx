import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const base: CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  padding: 16,
};

/** 汎用カードコンテナ（UI Element） */
export function Card({ style, children, ...rest }: CardProps) {
  return (
    <div {...rest} style={{ ...base, ...style }}>
      {children}
    </div>
  );
}

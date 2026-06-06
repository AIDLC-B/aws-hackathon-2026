import { useEffect, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 自動クローズまでのミリ秒（未指定=自動クローズなし） */
  autoCloseMs?: number;
  children: ReactNode;
}

/**
 * 画面下部からスライドアップする汎用ボトムシート（UI Element）。
 * キャラクター一言表示（CharacterBottomSheet）の土台として使用。
 */
export function BottomSheet({
  open,
  onClose,
  title,
  autoCloseMs,
  children,
}: BottomSheetProps) {
  // Escapeで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 自動クローズ
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          width: "100%",
          maxWidth: 600,
          padding: "20px 20px 32px",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
          animation: "damesi-slideup 0.25s ease",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 40,
            height: 4,
            background: "#ddd",
            borderRadius: 2,
            margin: "0 auto 16px",
          }}
        />
        {title && <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>{title}</h2>}
        {children}
        <style>{`@keyframes damesi-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      </div>
    </div>
  );
}

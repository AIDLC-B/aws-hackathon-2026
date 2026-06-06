import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** オーバーレイクリックで閉じるか（既定: true） */
  closeOnOverlay?: boolean;
  children: ReactNode;
}

/** 中央表示の汎用モーダル（UI Element）。確認ダイアログ等に使用。 */
export function Modal({
  open,
  onClose,
  title,
  closeOnOverlay = true,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={closeOnOverlay ? onClose : undefined}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
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
          borderRadius: 14,
          maxWidth: 420,
          width: "100%",
          padding: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        {title && (
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}

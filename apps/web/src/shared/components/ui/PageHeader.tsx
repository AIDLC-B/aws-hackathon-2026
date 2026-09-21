import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /** 画面タイトル（h1） */
  title: string;
  /**
   * 戻り先。
   * - パス文字列: そのパスへ `navigate(to)`
   * - "back": ブラウザ履歴を1つ戻る（`navigate(-1)`）
   * - 省略: 戻る導線なし
   */
  backTo?: string | "back";
  /** 戻るリンクのラベル（既定: 「もどる」） */
  backLabel?: string;
  /** タイトル右側に置く要素（保存ボタン等） */
  trailing?: ReactNode;
}

/**
 * サブ画面共通ヘッダー（戻る導線 + タイトル）。
 *
 * ボトムナビを持たない単独ルート（料理登録/詳細/編集・条件で選ぶ・確定献立詳細・
 * ガチャ・推しキャラ選択）は、この共通ヘッダーで戻る導線を統一する。
 * 画面ごとに `Button variant="ghost"` を手書きしていた実装を置き換えるもの。
 */
export function PageHeader({
  title,
  backTo,
  backLabel = "もどる",
  trailing,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header data-testid="page-header" style={{ marginBottom: 16 }}>
      {backTo && (
        <button
          type="button"
          data-testid="page-header-back-button"
          onClick={() => (backTo === "back" ? navigate(-1) : navigate(backTo))}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "none",
            padding: "8px 4px 8px 0",
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: "#ff7043",
            cursor: "pointer",
          }}
        >
          ← {backLabel}
        </button>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 20, margin: backTo ? "4px 0 0" : "0" }}>
          {title}
        </h1>
        {trailing}
      </div>
    </header>
  );
}

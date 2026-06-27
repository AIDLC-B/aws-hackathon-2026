interface GachaSpinnerProps {
  /** 10連は複数カプセルを賑やかに表示 */
  count?: 1 | 10;
  /** 表示ラベル（「ガチャ中...」等） */
  label?: string;
}

/**
 * カプセルトイ演出（Q3=A・CSS簡易演出）。
 *
 * 【Unit 7 スタブ】カプセル本体は絵文字/図形のプレースホルダ。後からイラスト画像に
 * 差し替え可能な構造（中央の `.capsule` を img に置換すればよい）。
 * 回転（揺れ）＋ 落下バウンドのCSSアニメで「回している感」を演出する。
 * 演出時間はページ側（GachaPage）の待機で制御し、本コンポーネントは見た目のみ担当。
 */
export function GachaSpinner({ count = 1, label = "ガチャを回しています..." }: GachaSpinnerProps) {
  const capsules = count === 10 ? 10 : 1;

  return (
    <div
      data-testid="gacha-spinner"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: "32px 0",
      }}
    >
      {/* ガチャマシン */}
      <div
        aria-hidden
        style={{
          position: "relative",
          width: 180,
          height: 200,
          borderRadius: 20,
          background: "linear-gradient(160deg,#ffb199 0%,#ff7043 100%)",
          boxShadow: "0 8px 24px rgba(255,112,67,0.35)",
          overflow: "hidden",
        }}
      >
        {/* ガラス球（カプセルが舞う） */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.55)",
            border: "4px solid rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 4,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: capsules }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: capsules > 1 ? 18 : 44,
                display: "inline-block",
                animation: `damesi-gacha-shake 0.5s ease-in-out ${i * 0.04}s infinite`,
              }}
            >
              {i % 2 === 0 ? "🔴" : "🔵"}
            </span>
          ))}
        </div>

        {/* 取り出し口 */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 70,
            height: 30,
            borderRadius: 8,
            background: "rgba(0,0,0,0.25)",
          }}
        />
        {/* 落ちてくるカプセル */}
        <span
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            fontSize: 26,
            transform: "translateX(-50%)",
            animation: "damesi-gacha-drop 1.1s ease-in-out infinite",
          }}
        >
          🟡
        </span>
      </div>

      <p style={{ margin: 0, color: "#ff7043", fontWeight: 600 }}>{label}</p>

      <style>{`
        @keyframes damesi-gacha-shake {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-6px) rotate(8deg); }
        }
        @keyframes damesi-gacha-drop {
          0% { transform: translate(-50%, -40px) scale(0.6); opacity: 0; }
          40% { opacity: 1; }
          70% { transform: translate(-50%, 0) scale(1); }
          85% { transform: translate(-50%, -8px) scale(1); }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

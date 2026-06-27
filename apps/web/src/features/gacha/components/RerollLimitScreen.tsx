import { Button } from "@/shared/components/ui";
import {
  useCharacterDialogue,
  CHARACTER_NAME,
} from "@/features/character/hooks/useCharacterDialogue";
import { DELIVERY_URL, DELIVERY_LABEL } from "@/features/gacha/config";

interface RerollLimitScreenProps {
  /** 「やっぱり作る」→ 直前のガチャ結果表示へ戻る */
  onBack: () => void;
}

/**
 * 堕落ルート画面（US-11）。リセマラ上限到達時にメシストフェレスが登場し、
 * デリバリー誘導リンクと「やっぱり作る」を表示する。
 *
 * 【Unit 7】一言は useCharacterDialogue（gacha_reroll_limit・現状スタブ）。
 * Unit 8 でメシストフェレスの画像・正式セリフに差し替える。
 * trigger × from 表（component-methods）では gacha_reroll_limit は専用画面・
 * メシストフェレス固定。
 */
export function RerollLimitScreen({ onBack }: RerollLimitScreenProps) {
  const { getDialogue } = useCharacterDialogue();
  const line = getDialogue({ trigger: "gacha_reroll_limit", from: "gacha" });
  const name = line ? CHARACTER_NAME[line.characterId] : "メシストフェレス";
  const message = line?.message ?? "…もう、こっちにおいでよ。";

  return (
    <div
      data-testid="reroll-limit-screen"
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
        background: "linear-gradient(180deg,#2b2433 0%,#4a3b57 100%)",
        color: "#fff",
        borderRadius: 16,
      }}
    >
      {/* Unit 8 でメシストフェレスの画像に差し替え */}
      <div
        aria-hidden
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "rgba(171,71,188,0.3)",
          border: "2px solid #ce93d8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
        }}
      >
        😈
      </div>
      <strong style={{ fontSize: 16, color: "#ce93d8" }}>{name}</strong>
      <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7 }}>{message}</p>

      <a
        href={DELIVERY_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="delivery-link"
        style={{
          display: "inline-block",
          marginTop: 8,
          padding: "12px 24px",
          borderRadius: 10,
          background: "#ab47bc",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        🛵 {DELIVERY_LABEL}
      </a>

      <Button
        variant="ghost"
        data-testid="reroll-limit-back-button"
        onClick={onBack}
        style={{ color: "#fff", marginTop: 4 }}
      >
        やっぱり作る
      </Button>
    </div>
  );
}

import { Button } from "@/shared/components/ui";
import { useCharacterDialogue } from "@/features/character/hooks/useCharacterDialogue";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";
import { DELIVERY_URL, DELIVERY_LABEL } from "@/features/gacha/config";

interface RerollLimitScreenProps {
  /** 「やっぱり作る」→ 直前のガチャ結果表示へ戻る */
  onBack: () => void;
}

/**
 * 堕落ルート画面（US-11）。リセマラ上限到達時にメシストフェレスが登場し、
 * デリバリー誘導リンクと「やっぱり作る」を表示する。
 *
 * 【Unit 8で更新】一言は useCharacterDialogue（gacha_reroll_limit）。trigger × from 表
 * （component-methods）では gacha_reroll_limit は専用画面・メシストフェレス固定であり、
 * 選択ロジック側（dialogueSelector の FIXED_CHARACTER）でも固定を保証している。
 * ビジュアルは CharacterAvatar（画像連携時に自動で画像表示へ切替）。
 */
export function RerollLimitScreen({ onBack }: RerollLimitScreenProps) {
  const { getDialogue } = useCharacterDialogue();
  const line = getDialogue({ trigger: "gacha_reroll_limit", from: "gacha" });
  const characterId = line?.characterId ?? "meshistopheles";
  const name = getCharacterProfile(characterId).name;
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
      {/* 堕落ルートは立ち絵で大きく登場させる（メシストフェレス固定） */}
      <CharacterAvatar characterId={characterId} shape="portrait" size={200} />
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

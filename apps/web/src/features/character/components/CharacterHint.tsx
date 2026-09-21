import { useMemo } from "react";
import type { CharacterId } from "@/shared/types";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { pickRandomVariant } from "@/features/character/characterImages";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";

interface CharacterHintProps {
  /** 喋らせるキャラクター（固定指定） */
  characterId: CharacterId;
  /** セリフ */
  message: string;
  /** 立ち絵の高さpx（既定: 84） */
  size?: number;
}

/**
 * 画面内に差し込む固定セリフの吹き出し（立ち絵つき）。
 *
 * `CharacterMascot` が台詞マスターから trigger に応じた一言を出すのに対し、
 * こちらは「その画面の使い方を説明する固定のセリフ」を、同じ吹き出しの見た目で出すためのもの。
 * 料理登録画面の入力ハードルを下げる案内（サボ母ちゃん）などに使う。
 */
export function CharacterHint({
  characterId,
  message,
  size = 84,
}: CharacterHintProps) {
  const profile = getCharacterProfile(characterId);
  const variant = useMemo(() => pickRandomVariant(characterId), [characterId]);

  return (
    <div
      data-testid="character-hint"
      style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
    >
      <CharacterAvatar
        characterId={characterId}
        shape="portrait"
        size={size}
        variant={variant}
      />
      <div
        style={{
          position: "relative",
          flex: 1,
          background: profile.bgColor,
          border: `2px solid ${profile.themeColor}`,
          borderRadius: 14,
          padding: "10px 12px",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: profile.themeColor,
          }}
        >
          {profile.name}
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.6, color: "#333" }}>
          {message}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: -9,
            bottom: 14,
            width: 14,
            height: 14,
            background: profile.bgColor,
            borderLeft: `2px solid ${profile.themeColor}`,
            borderBottom: `2px solid ${profile.themeColor}`,
            transform: "rotate(45deg)",
          }}
        />
      </div>
    </div>
  );
}

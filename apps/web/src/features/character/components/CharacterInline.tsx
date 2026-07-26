import type { CharacterInlineProps } from "@/shared/types";
import { useCharacterDialogue } from "@/features/character/hooks/useCharacterDialogue";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";

/**
 * キャラクター一言インライン表示（meal_suggested・フィルタリング画面）。
 *
 * 【Unit 8】ボトムシートではなく画面内に一言を差し込む表示。台詞は
 * `useCharacterDialogue`（正式実装）、ビジュアルは `CharacterAvatar`。
 */
export function CharacterInline({ trigger, from }: CharacterInlineProps) {
  const { getDialogue } = useCharacterDialogue();
  const line = getDialogue({ trigger, from });
  if (!line) return null;
  const profile = getCharacterProfile(line.characterId);

  return (
    <div
      data-testid="character-inline"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: profile.bgColor,
        border: `1px solid ${profile.themeColor}33`,
        borderRadius: 12,
        padding: "10px 14px",
      }}
    >
      <CharacterAvatar
        characterId={line.characterId}
        shape="portrait"
        size={48}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{ fontSize: 12, color: profile.themeColor, fontWeight: 600 }}
        >
          {profile.name}
        </span>
        <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>
          {line.message}
        </span>
      </div>
    </div>
  );
}

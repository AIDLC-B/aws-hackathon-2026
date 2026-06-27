import type { CharacterInlineProps } from "@/shared/types";
import {
  useCharacterDialogue,
  CHARACTER_NAME,
} from "@/features/character/hooks/useCharacterDialogue";

/**
 * キャラクター一言インライン表示（meal_suggested・フィルタリング画面）。
 *
 * 【Unit 6 スタブ】ボトムシートではなく画面内にインラインで一言を差し込む表示。
 * 一言は useCharacterDialogue（現状スタブ）。Unit 8 でキャラクター画像・
 * 正式な選択ロジックに拡張する。
 */
export function CharacterInline({ trigger, from }: CharacterInlineProps) {
  const { getDialogue } = useCharacterDialogue();
  const line = getDialogue({ trigger, from });
  if (!line) return null;

  return (
    <div
      data-testid="character-inline"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#fff4ef",
        border: "1px solid #ffd9c9",
        borderRadius: 12,
        padding: "10px 14px",
      }}
    >
      {/* Unit 8 でキャラクター画像に差し替え */}
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "50%",
          background: "#ffe0d6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        🍙
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 12, color: "#ff7043", fontWeight: 600 }}>
          {CHARACTER_NAME[line.characterId]}
        </span>
        <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>
          {line.message}
        </span>
      </div>
    </div>
  );
}

import type { CharacterBottomSheetProps } from "@/shared/types";
import { BottomSheet } from "@/shared/components/ui";
import { useCharacterDialogue } from "@/features/character/hooks/useCharacterDialogue";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";

/**
 * キャラクター一言ボトムシート（US-13 / US-14 ほか trigger 系の一言表示）。
 *
 * 【Unit 8】台詞は `useCharacterDialogue`（マスター参照 + キャラ/トーン選択 +
 * isPremium/推しキャラ絞り込み）。ビジュアルは `CharacterAvatar`（画像連携時に自動切替）。
 * ux-design 準拠: キャラクター画像 + 名前 + セリフ、閉じるボタン または自動クローズ。
 */
export function CharacterBottomSheet({
  trigger,
  from,
  open,
  onClose,
  autoCloseMs,
}: CharacterBottomSheetProps) {
  const { getDialogue } = useCharacterDialogue();
  const line = open ? getDialogue({ trigger, from }) : null;
  const profile = line ? getCharacterProfile(line.characterId) : null;

  return (
    <BottomSheet open={open && !!line} onClose={onClose} autoCloseMs={autoCloseMs}>
      {line && profile && (
        <div
          data-testid="character-bottom-sheet"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* 立ち絵（縦長イラストを切り取らずに表示） */}
            <CharacterAvatar
              characterId={line.characterId}
              shape="portrait"
              size={110}
            />
            <span style={{ display: "flex", flexDirection: "column" }}>
              <strong style={{ fontSize: 15, color: profile.themeColor }}>
                {profile.name}
              </strong>
              <span style={{ fontSize: 11, color: "#888" }}>{profile.title}</span>
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
            {line.message}
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="character-bottom-sheet-close-button"
            style={{
              alignSelf: "flex-end",
              background: "transparent",
              border: "none",
              color: profile.themeColor,
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              padding: "8px 4px",
            }}
          >
            閉じる
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

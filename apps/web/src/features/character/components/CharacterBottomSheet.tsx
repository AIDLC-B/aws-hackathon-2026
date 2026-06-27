import type { CharacterBottomSheetProps } from "@/shared/types";
import { BottomSheet } from "@/shared/components/ui";
import {
  useCharacterDialogue,
  CHARACTER_NAME,
} from "@/features/character/hooks/useCharacterDialogue";

/**
 * キャラクター一言ボトムシート（trigger系の一言表示）。
 *
 * 【Unit 5】土台は shared/ui の BottomSheet。一言は useCharacterDialogue（現状スタブ）。
 * Unit 8 でキャラクター画像・正式な選択ロジックに拡張する。
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

  return (
    <BottomSheet open={open && !!line} onClose={onClose} autoCloseMs={autoCloseMs}>
      {line && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Unit 8 でキャラクター画像に差し替え */}
            <div
              aria-hidden
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#ffe0d6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              🍙
            </div>
            <strong style={{ fontSize: 15 }}>
              {CHARACTER_NAME[line.characterId]}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
            {line.message}
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              alignSelf: "flex-end",
              background: "transparent",
              border: "none",
              color: "#ff7043",
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

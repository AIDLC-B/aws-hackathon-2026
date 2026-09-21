import { useMemo } from "react";
import type { CharacterBottomSheetProps } from "@/shared/types";
import { BottomSheet } from "@/shared/components/ui";
import { useCharacterDialogue } from "@/features/character/hooks/useCharacterDialogue";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { pickRandomVariant } from "@/features/character/characterImages";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";

/**
 * キャラクター一言ボトムシート（US-13 / US-14 ほか trigger 系の一言表示）。
 *
 * 【Unit 8】台詞は `useCharacterDialogue`（マスター参照 + キャラ/トーン選択 +
 * isPremium/推しキャラ絞り込み）。ビジュアルは `CharacterAvatar`。
 * ux-design 準拠: キャラクター画像 + 名前 + セリフ、閉じるボタン または自動クローズ。
 *
 * 表示は立ち絵 + 尻尾付き吹き出し（`CharacterMascot` と同じ「しゃべっている」見せ方）。
 * 表情は台詞1件につき一度だけランダムに選ぶ。
 */
export function CharacterBottomSheet({
  trigger,
  from,
  open,
  onClose,
  autoCloseMs,
}: CharacterBottomSheetProps) {
  const { getDialogue, loading } = useCharacterDialogue();

  /**
   * 台詞の抽選はランダムなため、レンダーのたびに呼ぶと表示中にキャラが入れ替わる。
   * 開いたときと trigger / from の変化、マスターの読み込み完了でのみ引き直す。
   */
  const line = useMemo(
    () => (open ? getDialogue({ trigger, from }) : null),
    // getDialogue は毎レンダー新しい関数になるため依存に含めない（含めると毎回再抽選になる）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, trigger, from, loading],
  );
  const profile = line ? getCharacterProfile(line.characterId) : null;

  const characterId = line?.characterId;
  const message = line?.message;
  const variant = useMemo(
    () => (characterId ? pickRandomVariant(characterId) : 0),
    // message も依存に含め、同じキャラの台詞が切り替わったら表情も選び直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterId, message],
  );

  return (
    <BottomSheet open={open && !!line} onClose={onClose} autoCloseMs={autoCloseMs}>
      {line && profile && (
        <div
          data-testid="character-bottom-sheet"
          style={{ display: "flex", alignItems: "flex-end", gap: 10 }}
        >
          {/* 立ち絵（縦長イラストを切り取らずに表示） */}
          <CharacterAvatar
            characterId={line.characterId}
            shape="portrait"
            size={160}
            variant={variant}
          />

          {/* 尻尾付き吹き出し */}
          <div
            style={{
              position: "relative",
              flex: 1,
              background: profile.bgColor,
              border: `2px solid ${profile.themeColor}`,
              borderRadius: 16,
              padding: "12px 14px",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: profile.themeColor,
              }}
            >
              {profile.name}
              <span style={{ marginLeft: 6, fontWeight: 400, color: "#888" }}>
                {profile.title}
              </span>
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 16, lineHeight: 1.6 }}>
              {line.message}
            </p>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: -9,
                bottom: 18,
                width: 14,
                height: 14,
                background: profile.bgColor,
                borderLeft: `2px solid ${profile.themeColor}`,
                borderBottom: `2px solid ${profile.themeColor}`,
                transform: "rotate(45deg)",
              }}
            />
            <button
              type="button"
              onClick={onClose}
              data-testid="character-bottom-sheet-close-button"
              style={{
                display: "block",
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: profile.themeColor,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                padding: "8px 0 0",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

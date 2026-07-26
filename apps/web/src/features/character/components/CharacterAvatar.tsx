import type { CharacterId } from "@/shared/types";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { getCharacterImage } from "@/features/character/characterImages";

interface CharacterAvatarProps {
  characterId: CharacterId;
  /** circle: 円形アバター（サイズ=直径） / portrait: 立ち絵（サイズ=高さ） */
  shape?: "circle" | "portrait";
  /** px。circle は直径、portrait は高さ */
  size?: number;
  /** 枠線を表示するか（circle のみ） */
  bordered?: boolean;
  /** 画像バリエーション番号（0始まり・枚数超過時は循環） */
  variant?: number;
}

/**
 * キャラクターアバター（Unit 8）。
 *
 * `characterImages` が解決した画像を表示し、画像が無い場合は絵文字＋テーマカラーへ
 * フォールバックする。立ち絵は縦横比がキャラごとに異なるため `objectFit: contain` で
 * 切り取らずに収める。画像の追加・差し替えは characterImages.ts のみの変更で反映される。
 */
export function CharacterAvatar({
  characterId,
  shape = "circle",
  size = 56,
  bordered = false,
  variant = 0,
}: CharacterAvatarProps) {
  const profile = getCharacterProfile(characterId);
  const image = getCharacterImage(characterId, variant);
  const isPortrait = shape === "portrait";

  return (
    <div
      data-testid={`character-avatar-${characterId}`}
      aria-hidden
      style={{
        width: isPortrait ? "auto" : size,
        height: size,
        minWidth: isPortrait ? size * 0.5 : undefined,
        flexShrink: 0,
        borderRadius: isPortrait ? 12 : "50%",
        overflow: "hidden",
        background: isPortrait ? "transparent" : profile.bgColor,
        border:
          bordered && !isPortrait ? `2px solid ${profile.themeColor}` : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.5),
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          style={{
            width: isPortrait ? "auto" : "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        profile.emoji
      )}
    </div>
  );
}

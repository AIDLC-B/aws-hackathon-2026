import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@/shared/components/ui";
import { getCharacterProfile } from "@/features/character/characterProfiles";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";
import type { CharacterId } from "@/shared/types";

interface PremiumSettingsProps {
  isPremium: boolean;
  favoriteCharacters: CharacterId[];
}

/**
 * 推しキャラ設定カード（FR-06 / US-15）。
 *
 * ux-design 準拠:
 * - isPremium を問わず常に表示し、キャッチコピーで課金を訴求する
 * - isPremium=false → 「🔒 アンロックする」（将来の課金導線・現状は案内表示のみ）
 * - isPremium=true  → 「✏️ キャラを選ぶ」→ キャラクター選択画面（/settings/characters）
 */
export function PremiumSettings({
  isPremium,
  favoriteCharacters,
}: PremiumSettingsProps) {
  const navigate = useNavigate();
  const [notice, setNotice] = useState(false);

  return (
    <Card data-testid="premium-settings" style={{ display: "grid", gap: 12 }}>
      <strong style={{ fontSize: 16 }}>★ 推しキャラ設定</strong>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#555" }}>
        推しキャラだけに語りかけてもらおう。
        <br />
        あなただけの堕落パートナーを見つけて。
      </p>

      {isPremium && favoriteCharacters.length > 0 && (
        <div
          data-testid="favorite-characters-preview"
          style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
        >
          {favoriteCharacters.map((id) => (
            <span
              key={id}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <CharacterAvatar characterId={id} size={28} />
              <span style={{ fontSize: 13, color: "#555" }}>
                {getCharacterProfile(id).name}
              </span>
            </span>
          ))}
        </div>
      )}

      {isPremium ? (
        <Button
          fullWidth
          data-testid="choose-characters-button"
          onClick={() => navigate("/settings/characters")}
        >
          ✏️ キャラを選ぶ
        </Button>
      ) : (
        <>
          <Button
            fullWidth
            variant="secondary"
            data-testid="unlock-premium-button"
            onClick={() => setNotice(true)}
          >
            🔒 アンロックする
          </Button>
          {notice && (
            <p
              data-testid="unlock-premium-notice"
              role="status"
              style={{ margin: 0, fontSize: 13, color: "#ff7043" }}
            >
              アンロックは準備中です。もう少し堕落をお楽しみください。
            </p>
          )}
        </>
      )}
    </Card>
  );
}

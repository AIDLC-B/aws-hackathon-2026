import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@/shared/components/ui";
import {
  CHARACTER_ORDER,
  CHARACTER_PROFILES,
} from "@/features/character/characterProfiles";
import { CharacterAvatar } from "@/features/character/components/CharacterAvatar";
import { useSettings } from "@/features/settings/hooks/useSettings";
import type { CharacterId } from "@/shared/types";

/**
 * 推しキャラクター選択画面（Unit 8・US-15・/settings/characters）。
 *
 * 7キャラクターから1体以上を選び、`favoriteCharacters` として保存する。設定したキャラのみが
 * 一言を発するようになる（該当triggerの台詞が無い場合は他キャラにフォールバック）。
 * ボトムナビ無しの単独ルートで、保存/戻るで設定画面へ復帰する。
 */
export function CharacterSelectPage() {
  const navigate = useNavigate();
  const { favoriteCharacters, updateFavoriteCharacters, saving } = useSettings();
  const [selected, setSelected] = useState<CharacterId[]>(favoriteCharacters);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: CharacterId): void {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSave(): Promise<void> {
    setError(null);
    try {
      await updateFavoriteCharacters(selected);
      navigate("/settings");
    } catch {
      setError("保存に失敗しました。通信状況を確認してもう一度お試しください。");
    }
  }

  return (
    <div
      data-testid="character-select-page"
      style={{ padding: 16, display: "grid", gap: 12 }}
    >
      <button
        type="button"
        data-testid="character-select-back-button"
        onClick={() => navigate("/settings")}
        style={{
          justifySelf: "start",
          background: "transparent",
          border: "none",
          color: "#ff7043",
          fontSize: 15,
          cursor: "pointer",
          padding: 0,
        }}
      >
        ← 設定へ戻る
      </button>

      <h1 style={{ margin: 0, fontSize: 20 }}>推しキャラを選ぶ</h1>
      <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.7 }}>
        選んだキャラだけが語りかけてくれます（複数選択できます）。
        <br />
        未選択にすると全キャラクターが登場します。
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {CHARACTER_ORDER.map((id) => {
          const profile = CHARACTER_PROFILES[id];
          const isSelected = selected.includes(id);
          return (
            <Card
              key={id}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              data-testid={`character-option-${id}`}
              onClick={() => toggle(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                border: isSelected
                  ? `2px solid ${profile.themeColor}`
                  : "2px solid transparent",
                background: isSelected ? profile.bgColor : "#fff",
              }}
            >
              <CharacterAvatar characterId={id} shape="portrait" size={72} />
              <div style={{ flex: 1, display: "grid", gap: 2 }}>
                <strong style={{ fontSize: 15, color: profile.themeColor }}>
                  {profile.name}
                </strong>
                <span style={{ fontSize: 11, color: "#888" }}>{profile.title}</span>
                <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                  {profile.tagline}
                </span>
              </div>
              <span aria-hidden style={{ fontSize: 20, color: profile.themeColor }}>
                {isSelected ? "☑" : "☐"}
              </span>
            </Card>
          );
        })}
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: "#e53935" }}>
          {error}
        </p>
      )}

      <Button
        fullWidth
        disabled={saving}
        data-testid="character-select-save-button"
        onClick={handleSave}
      >
        {saving ? "保存中..." : "保存する"}
      </Button>
    </div>
  );
}

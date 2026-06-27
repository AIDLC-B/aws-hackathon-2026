import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { BANANA_ID } from "@/features/onboarding/data/onboardingRecipes";
import { CharacterBottomSheet } from "@/features/character/components/CharacterBottomSheet";
import { Button, Card } from "@/shared/components/ui";
import { FREQUENCY_LABEL, DIFFICULTY_LABEL } from "@/features/recipe/utils/labels";

/**
 * 初回オンボーディング画面（US-00）。
 * サボ母ちゃんが出迎え、固定20件から作れる料理を選ぶ。バナナは選択済み・解除不可。
 */
export function OnboardingPage() {
  const { recipes, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<string>>(new Set([BANANA_ID]));
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  function toggle(id: string) {
    if (id === BANANA_ID) return; // バナナは解除不可
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleStart() {
    setSubmitting(true);
    try {
      await completeOnboarding([...selected]);
      setSheetOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSheetClose() {
    setSheetOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <main data-testid="onboarding-page" style={{ padding: 16, paddingBottom: 96 }}>
      <Card style={{ background: "#fff5f0", marginBottom: 16 }}>
        <strong>サボ母ちゃん</strong>
        <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
          あんた、はじめてやね！作れる料理、選んでみ？バナナは絶対入れといたで。
        </p>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recipes.map((r) => {
          const checked = selected.has(r.id);
          const locked = r.id === BANANA_ID;
          return (
            <label
              key={r.id}
              data-testid={`onboarding-item-${r.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: "#fff",
                borderRadius: 10,
                border: checked ? "2px solid #ff7043" : "1px solid #eee",
                cursor: locked ? "default" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={locked}
                onChange={() => toggle(r.id)}
                style={{ width: 20, height: 20 }}
              />
              <span style={{ fontSize: 24 }}>{r.emoji}</span>
              <span style={{ flex: 1 }}>
                <strong>{r.name}</strong>
                <br />
                <small style={{ color: "#888" }}>
                  {FREQUENCY_LABEL[r.rarity]}｜{DIFFICULTY_LABEL[r.difficulty]}｜
                  {r.duration}分
                </small>
              </span>
            </label>
          );
        })}
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Button fullWidth onClick={handleStart} disabled={submitting}>
          はじめる！（{selected.size}件選択中）
        </Button>
      </div>

      <CharacterBottomSheet
        trigger="recipe_registered"
        from="onboarding"
        open={sheetOpen}
        onClose={handleSheetClose}
        autoCloseMs={5000}
      />
    </main>
  );
}

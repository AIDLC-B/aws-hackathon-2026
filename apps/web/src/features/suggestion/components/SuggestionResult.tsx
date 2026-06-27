import { Card } from "@/shared/components/ui";
import {
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";
import type { Recipe } from "@shared/types";

interface SuggestionResultProps {
  suggestions: Recipe[];
  /** 候補を1品選んで確定する */
  onSelect: (recipe: Recipe) => void;
  /** 確定処理中（ボタン多重押下防止） */
  busy?: boolean;
}

/**
 * 提案結果（ランダム3品）の候補リスト（US-05）。
 * 各候補カードをタップで確定（onSelect）する。
 */
export function SuggestionResult({
  suggestions,
  onSelect,
  busy = false,
}: SuggestionResultProps) {
  if (suggestions.length === 0) {
    return (
      <p
        data-testid="suggestion-empty"
        style={{ color: "#777", textAlign: "center", marginTop: 24 }}
      >
        条件に合う料理が見つかりませんでした。条件を変えてみましょう。
      </p>
    );
  }

  return (
    <div
      data-testid="suggestion-result"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      {suggestions.map((r) => (
        <Card
          key={r.id}
          data-testid={`suggestion-item-${r.id}`}
          onClick={() => !busy && onSelect(r)}
          style={{ cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 16 }}>{r.name}</strong>
            <span style={{ fontSize: 13, color: "#888" }}>
              {FREQUENCY_LABEL[r.rarity]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            {DIFFICULTY_LABEL[r.difficulty]}｜{r.duration}分
          </div>
        </Card>
      ))}
    </div>
  );
}

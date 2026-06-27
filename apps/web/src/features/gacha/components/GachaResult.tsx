import { Button, Card } from "@/shared/components/ui";
import {
  RARITY_DISPLAY,
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
} from "@/features/recipe/utils/labels";
import type { GachaResultItem, Rarity } from "@shared/types";

interface GachaResultProps {
  results: GachaResultItem[];
  /** 「これにする！」 */
  onConfirm: () => void;
  /** 「もう一度」（リセマラ） */
  onReroll: () => void;
  /** 処理中（多重押下防止） */
  busy?: boolean;
}

/** レアリティ別のバッジ色（ゲーム的演出・N→SSR） */
const RARITY_COLOR: Record<Rarity, string> = {
  N: "#9e9e9e",
  R: "#42a5f5",
  SR: "#ab47bc",
  SSR: "#ffb300",
};

/**
 * ガチャ結果表示（US-10/12）。レアリティ（N/R/SR/SSR）・料理名・頻度・難易度・所要時間を表示。
 * 1件（シングル）・10件（10連一覧）の両対応。
 */
export function GachaResult({
  results,
  onConfirm,
  onReroll,
  busy = false,
}: GachaResultProps) {
  const isTen = results.length > 1;

  return (
    <div data-testid="gacha-result" style={{ paddingBottom: 16 }}>
      <h2 style={{ fontSize: 18, margin: "8px 0 12px" }}>
        {isTen ? `10連結果（${results.length}品）` : "結果"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map(({ recipe, rarity }, i) => (
          <Card key={`${recipe.id}-${i}`} data-testid={`gacha-result-item-${i}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 44,
                  textAlign: "center",
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: RARITY_COLOR[rarity],
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {RARITY_DISPLAY[rarity]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 16 }}>{recipe.name}</strong>
                <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                  {FREQUENCY_LABEL[recipe.rarity]}｜
                  {DIFFICULTY_LABEL[recipe.difficulty]}｜{recipe.duration}分
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Button
          variant="secondary"
          fullWidth
          data-testid="gacha-reroll-button"
          onClick={onReroll}
          disabled={busy}
        >
          🔄 もう一度
        </Button>
        <Button
          fullWidth
          data-testid="gacha-confirm-button"
          onClick={onConfirm}
          disabled={busy}
        >
          {isTen ? "この献立にする！" : "これにする！"}
        </Button>
      </div>
    </div>
  );
}

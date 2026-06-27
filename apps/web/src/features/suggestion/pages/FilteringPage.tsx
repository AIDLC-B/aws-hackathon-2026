import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, LoadingSpinner } from "@/shared/components/ui";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_OPTIONS,
} from "@/features/recipe/utils/labels";
import { CharacterInline } from "@/features/character/components/CharacterInline";
import { CharacterBottomSheet } from "@/features/character/components/CharacterBottomSheet";
import {
  useSuggestion,
  type SuggestionFilter,
} from "@/features/suggestion/hooks/useSuggestion";
import { SuggestionResult } from "@/features/suggestion/components/SuggestionResult";
import type { Difficulty, Recipe } from "@shared/types";

/** 所要時間の上限選択肢（分） */
const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: "15分以内" },
  { value: 30, label: "30分以内" },
  { value: 60, label: "60分以内" },
  { value: 999, label: "指定なし" },
];

/**
 * フィルタリング画面（US-05）。所要時間・難易度で条件を絞り、CF-02 で提案を受け取る。
 * 提案結果から1品を選んで確定すると、キャラの一言（meal_decided）を表示してホームへ戻る。
 */
export function FilteringPage() {
  const navigate = useNavigate();
  const {
    suggestions,
    needsGachaRedirect,
    loading,
    error,
    hasSuggested,
    suggest,
    confirmMeal,
  } = useSuggestion();

  const [duration, setDuration] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [confirming, setConfirming] = useState(false);
  const [decidedOpen, setDecidedOpen] = useState(false);

  async function handleSuggest() {
    const filter: SuggestionFilter = { duration, difficulty };
    try {
      await suggest(filter);
    } catch {
      // error は useSuggestion 側で保持・下部に表示
    }
  }

  async function handleSelect(recipe: Recipe) {
    setConfirming(true);
    try {
      await confirmMeal(recipe, "suggestion");
      setDecidedOpen(true);
    } catch {
      setConfirming(false);
    }
  }

  return (
    <main
      data-testid="filtering-page"
      style={{ padding: 16, paddingBottom: 80 }}
    >
      <Button variant="ghost" onClick={() => navigate("/")}>
        ← もどる
      </Button>

      <h1 style={{ fontSize: 20, margin: "8px 0 16px" }}>条件で選ぶ</h1>

      {/* インライン一言（meal_suggested・フィルタ画面） */}
      <div style={{ marginBottom: 16 }}>
        <CharacterInline trigger="meal_suggested" from="filtering" />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
          所要時間
        </label>
        <select
          data-testid="filter-duration-select"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={selectStyle}
        >
          {DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label
          style={{ display: "block", fontSize: 14, margin: "14px 0 6px" }}
        >
          難易度
        </label>
        <select
          data-testid="filter-difficulty-select"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          style={selectStyle}
        >
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>

        <Button
          fullWidth
          data-testid="filter-suggest-button"
          onClick={handleSuggest}
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? "提案中..." : "提案してもらう"}
        </Button>
      </Card>

      {loading && <LoadingSpinner />}

      {error && (
        <p data-testid="suggestion-error" style={{ color: "#e53935" }}>
          提案の取得に失敗しました。時間をおいて再度お試しください。
        </p>
      )}

      {hasSuggested && !loading && (
        <>
          {needsGachaRedirect && (
            <Card
              data-testid="filter-gacha-redirect"
              style={{ margin: "8px 0 16px", background: "#fff4ef" }}
            >
              <p style={{ margin: "0 0 10px", fontSize: 14, color: "#555" }}>
                レパートリーが少ないようです。ガチャで料理を増やしてみませんか？
              </p>
              <Button
                data-testid="filter-gacha-redirect-button"
                onClick={() => navigate("/gacha")}
              >
                ガチャを回す
              </Button>
            </Card>
          )}
          <SuggestionResult
            suggestions={suggestions}
            onSelect={handleSelect}
            busy={confirming}
          />
        </>
      )}

      {/* 確定時のキャラ一言（meal_decided）→ 閉じたらホームへ */}
      <CharacterBottomSheet
        trigger="meal_decided"
        from="suggestion"
        open={decidedOpen}
        onClose={() => navigate("/")}
      />
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ddd",
};

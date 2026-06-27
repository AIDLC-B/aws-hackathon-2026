import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GachaResult } from "@/features/gacha/components/GachaResult";
import type { GachaResultItem } from "@shared/types";

const single: GachaResultItem[] = [
  {
    recipe: {
      id: "r1",
      name: "カレー",
      imageUrl: null,
      difficulty: "easy",
      duration: 30,
      rarity: "SR",
    },
    rarity: "SR",
  },
];

describe("GachaResult（US-10/12）", () => {
  it("レアリティ表記・料理名を表示する", () => {
    render(
      <GachaResult results={single} onConfirm={() => {}} onReroll={() => {}} />,
    );
    expect(screen.getByTestId("gacha-result")).toBeInTheDocument();
    expect(screen.getByText("カレー")).toBeInTheDocument();
    expect(screen.getByText("SR")).toBeInTheDocument();
  });

  it("これにする！/もう一度 のコールバックが発火する", () => {
    const onConfirm = vi.fn();
    const onReroll = vi.fn();
    render(
      <GachaResult results={single} onConfirm={onConfirm} onReroll={onReroll} />,
    );
    fireEvent.click(screen.getByTestId("gacha-confirm-button"));
    fireEvent.click(screen.getByTestId("gacha-reroll-button"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onReroll).toHaveBeenCalledTimes(1);
  });

  it("10連は件数を見出しに表示する", () => {
    const ten: GachaResultItem[] = Array.from({ length: 10 }, (_, i) => ({
      recipe: {
        id: `r${i}`,
        name: `料理${i}`,
        imageUrl: null,
        difficulty: "normal",
        duration: 20,
        rarity: "N",
      },
      rarity: "N",
    }));
    render(<GachaResult results={ten} onConfirm={() => {}} onReroll={() => {}} />);
    expect(screen.getByText(/10連結果（10品）/)).toBeInTheDocument();
  });
});

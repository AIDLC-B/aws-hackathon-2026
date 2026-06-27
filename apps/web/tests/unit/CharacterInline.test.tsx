import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterInline } from "@/features/character/components/CharacterInline";

describe("CharacterInline（meal_suggested インライン一言・Unit 6スタブ）", () => {
  it("trigger に対応する一言を表示する", () => {
    render(<CharacterInline trigger="meal_suggested" from="filtering" />);
    expect(screen.getByTestId("character-inline")).toBeInTheDocument();
    expect(
      screen.getByText("この中から選ぶだけでええんやで。"),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterInline } from "@/features/character/components/CharacterInline";
import { CHARACTER_NAME } from "@/features/character/characterProfiles";
import { TRIGGER_FALLBACK_CHARACTERS } from "@/features/character/dialogueSelector";

/**
 * Unit 8 で useCharacterDialogue が正式実装（マスター参照 + ランダム選択）になったため、
 * 固定文言ではなく「キャラクターが一言を発している」ことを検証する。
 * Provider 外のためマスターは0件 → 内蔵フォールバック台詞が使われる。
 */
describe("CharacterInline（meal_suggested インライン一言）", () => {
  it("trigger に対応するキャラクターの一言を表示する", () => {
    // 先頭候補に固定して決定的に検証
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<CharacterInline trigger="meal_suggested" from="filtering" />);

    const expectedId = TRIGGER_FALLBACK_CHARACTERS.meal_suggested[0];
    expect(screen.getByTestId("character-inline")).toBeInTheDocument();
    expect(screen.getByText(CHARACTER_NAME[expectedId])).toBeInTheDocument();
    expect(
      screen.getByTestId(`character-avatar-${expectedId}`),
    ).toBeInTheDocument();
    vi.mocked(Math.random).mockRestore();
  });
});

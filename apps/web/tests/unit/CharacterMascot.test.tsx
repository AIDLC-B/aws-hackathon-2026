import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterMascot } from "@/features/character/components/CharacterMascot";
import { CHARACTER_NAME } from "@/features/character/characterProfiles";
import { TRIGGER_FALLBACK_CHARACTERS } from "@/features/character/dialogueSelector";

/**
 * 常駐マスコット表示（旧 CharacterInline の置き換え）。
 * Provider 外のためマスターは0件 → 内蔵フォールバック台詞が使われる。
 * Math.random は台詞選択と表情バリエーション選択の両方で使うため 0 に固定する。
 */
describe("CharacterMascot（常駐マスコット + 吹き出し）", () => {
  it("trigger に対応するキャラクターの立ち絵と吹き出しを表示する", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<CharacterMascot trigger="meal_suggested" from="filtering" />);

    const expectedId = TRIGGER_FALLBACK_CHARACTERS.meal_suggested[0];
    expect(screen.getByTestId("character-mascot")).toBeInTheDocument();
    expect(screen.getByTestId("character-mascot-bubble")).toBeInTheDocument();
    expect(screen.getByText(CHARACTER_NAME[expectedId])).toBeInTheDocument();
    expect(
      screen.getByTestId(`character-avatar-${expectedId}`),
    ).toBeInTheDocument();
    vi.mocked(Math.random).mockRestore();
  });

  it("立ち絵の押下（移動なし）で吹き出しを格納・再表示できる", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<CharacterMascot trigger="meal_suggested" from="filtering" />);

    const portrait = screen.getByTestId("character-mascot-portrait");
    // ポインタを動かさずに離す = タップ扱い
    fireEvent.pointerDown(portrait, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(portrait, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(screen.queryByTestId("character-mascot-bubble")).toBeNull();

    fireEvent.pointerDown(portrait, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(portrait, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(screen.getByTestId("character-mascot-bubble")).toBeInTheDocument();
    vi.mocked(Math.random).mockRestore();
  });

  it("吹き出しの開閉を繰り返してもキャラクターが入れ替わらない", () => {
    // 呼ばれるたびに違う値を返す = 再抽選が起きれば別キャラになる状況を作る
    const values = [0, 0.99];
    let i = 0;
    vi.spyOn(Math, "random").mockImplementation(() => values[i++ % values.length]);

    render(<CharacterMascot trigger="meal_suggested" from="filtering" />);
    const firstName = screen.getByTestId("character-mascot-bubble").textContent;

    const portrait = screen.getByTestId("character-mascot-portrait");
    for (let n = 0; n < 4; n++) {
      fireEvent.pointerDown(portrait, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerUp(portrait, { clientX: 10, clientY: 10, pointerId: 1 });
    }

    expect(screen.getByTestId("character-mascot-bubble").textContent).toBe(
      firstName,
    );
    vi.mocked(Math.random).mockRestore();
  });

  it("✕ で一時的に隠し、💬 ボタンで戻せる", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<CharacterMascot trigger="meal_suggested" from="filtering" />);

    fireEvent.click(screen.getByTestId("character-mascot-hide-button"));
    expect(screen.queryByTestId("character-mascot")).toBeNull();

    fireEvent.click(screen.getByTestId("character-mascot-show-button"));
    expect(screen.getByTestId("character-mascot")).toBeInTheDocument();
    expect(screen.getByTestId("character-mascot-bubble")).toBeInTheDocument();
    vi.mocked(Math.random).mockRestore();
  });
});

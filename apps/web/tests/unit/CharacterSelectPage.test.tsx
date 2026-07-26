import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const updateFavoriteCharactersMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/features/settings/hooks/useSettings", () => ({
  useSettings: () => ({
    favoriteCharacters: ["nyamake"],
    updateFavoriteCharacters: updateFavoriteCharactersMock,
    saving: false,
  }),
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import { CharacterSelectPage } from "@/features/settings/pages/CharacterSelectPage";
import { CHARACTER_ORDER } from "@/features/character/characterProfiles";

function renderPage() {
  return render(
    <MemoryRouter>
      <CharacterSelectPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  updateFavoriteCharactersMock.mockReset().mockResolvedValue(undefined);
  navigateMock.mockReset();
});

describe("CharacterSelectPage（US-15）", () => {
  it("7キャラクターを選択肢として表示し、既存の推しキャラを選択済みにする", () => {
    renderPage();
    for (const id of CHARACTER_ORDER) {
      expect(screen.getByTestId(`character-option-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("character-option-nyamake")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("選択をトグルして保存すると favoriteCharacters を更新し設定画面へ戻る", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("character-option-saboeru"));
    fireEvent.click(screen.getByTestId("character-option-nyamake")); // 解除
    fireEvent.click(screen.getByTestId("character-select-save-button"));

    await waitFor(() =>
      expect(updateFavoriteCharactersMock).toHaveBeenCalledWith(["saboeru"]),
    );
    expect(navigateMock).toHaveBeenCalledWith("/settings");
  });
});

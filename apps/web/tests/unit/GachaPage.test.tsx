import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { GachaResultItem } from "@shared/types";

const confirmGachaResultMock = vi.fn().mockResolvedValue(undefined);
const spinMock = vi.fn().mockResolvedValue([]);

const tenResults: GachaResultItem[] = Array.from({ length: 10 }, (_, i) => ({
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

let confirmedCount = 2;

vi.mock("@/features/gacha/hooks/useGacha", () => ({
  useGacha: () => ({
    results: tenResults,
    lastCount: 10,
    error: null,
    spin: spinMock,
    reroll: vi.fn().mockResolvedValue(false),
    backToResult: vi.fn(),
    confirmGachaResult: confirmGachaResultMock,
  }),
}));

vi.mock("@/features/confirmedMenu/hooks/useConfirmedMenu", () => ({
  useConfirmedMenu: () => ({ count: confirmedCount }),
}));

import { GachaPage } from "@/features/gacha/pages/GachaPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <GachaPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  confirmGachaResultMock.mockClear();
  spinMock.mockClear();
  confirmedCount = 2;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GachaPage（US-10/12・Q4）", () => {
  it("初期表示でスピン/10連ボタンを表示する", () => {
    renderPage();
    expect(screen.getByTestId("gacha-spin-button")).toBeInTheDocument();
    expect(screen.getByTestId("gacha-spin10-button")).toBeInTheDocument();
  });

  it("10連かつ既存献立ありで「この献立にする！」→ 追加/入れ替えダイアログ表示", async () => {
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByTestId("gacha-spin10-button"));
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(spinMock).toHaveBeenCalledWith(10);
    // 演出後に結果表示
    expect(screen.getByTestId("gacha-result")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("gacha-confirm-button"));
    });
    // 既存2件あるのでモード選択ダイアログ
    expect(screen.getByTestId("gacha-mode-add-button")).toBeInTheDocument();
    expect(screen.getByTestId("gacha-mode-replace-button")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("gacha-mode-replace-button"));
    });
    expect(confirmGachaResultMock).toHaveBeenCalledWith("replace");
  });

  it("既存献立0件なら確定でダイアログを出さず add 確定する", async () => {
    confirmedCount = 0;
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByTestId("gacha-spin10-button"));
      await vi.advanceTimersByTimeAsync(2000);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("gacha-confirm-button"));
    });

    expect(screen.queryByTestId("gacha-mode-add-button")).not.toBeInTheDocument();
    expect(confirmGachaResultMock).toHaveBeenCalledWith("add");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const useConfirmedMenuMock = vi.fn();

vi.mock("@/features/confirmedMenu/hooks/useConfirmedMenu", () => ({
  useConfirmedMenu: () => useConfirmedMenuMock(),
}));

// 子ページはスタブ化し、ディスパッチ分岐のみ検証
vi.mock("@/features/suggestion/pages/SelectionPage", () => ({
  SelectionPage: () => <div data-testid="stub-selection">選択</div>,
}));
vi.mock("@/features/confirmedMenu/pages/MenuListPage", () => ({
  MenuListPage: () => <div data-testid="stub-list">リスト</div>,
}));

import { HomePage } from "@/app/HomePage";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/menu/:itemId"
          element={<div data-testid="stub-detail">詳細</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useConfirmedMenuMock.mockReset();
});

describe("HomePage ディスパッチ（Q3）", () => {
  it("loading中はローディング表示", () => {
    useConfirmedMenuMock.mockReturnValue({ items: [], count: 0, loading: true });
    renderHome();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("0件 → 選択画面（SelectionPage）", () => {
    useConfirmedMenuMock.mockReturnValue({ items: [], count: 0, loading: false });
    renderHome();
    expect(screen.getByTestId("stub-selection")).toBeInTheDocument();
  });

  it("1件 → その献立の詳細へリダイレクト", () => {
    useConfirmedMenuMock.mockReturnValue({
      items: [{ id: "m1" }],
      count: 1,
      loading: false,
    });
    renderHome();
    expect(screen.getByTestId("stub-detail")).toBeInTheDocument();
  });

  it("2件以上 → 献立リスト（MenuListPage）", () => {
    useConfirmedMenuMock.mockReturnValue({
      items: [{ id: "m1" }, { id: "m2" }],
      count: 2,
      loading: false,
    });
    renderHome();
    expect(screen.getByTestId("stub-list")).toBeInTheDocument();
  });
});

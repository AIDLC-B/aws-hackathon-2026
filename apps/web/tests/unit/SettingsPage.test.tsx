import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const signOutMock = vi.fn();
const navigateMock = vi.fn();
let settings = {
  isPremium: false,
  favoriteCharacters: [] as string[],
};

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    profile: { nickname: "ダメ子" },
    signOut: signOutMock,
  }),
}));
vi.mock("@/features/settings/hooks/useSettings", () => ({
  useSettings: () => settings,
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import { SettingsPage } from "@/features/settings/pages/SettingsPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  signOutMock.mockReset().mockResolvedValue(undefined);
  navigateMock.mockReset();
  settings = { isPremium: false, favoriteCharacters: [] };
});

describe("SettingsPage（US-15 / US-18）", () => {
  it("ニックネームを挨拶に表示する", () => {
    renderPage();
    expect(screen.getByTestId("settings-greeting")).toHaveTextContent(
      "やあ、ダメ子！",
    );
  });

  it("isPremium=false ではアンロック導線を表示し、押下で案内を出す", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("unlock-premium-button"));
    expect(screen.getByTestId("unlock-premium-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("choose-characters-button")).toBeNull();
  });

  it("isPremium=true では推しキャラ選択画面へ遷移する", () => {
    settings = { isPremium: true, favoriteCharacters: ["nyamake"] };
    renderPage();
    fireEvent.click(screen.getByTestId("choose-characters-button"));
    expect(navigateMock).toHaveBeenCalledWith("/settings/characters");
  });

  it("ログアウトは確認ダイアログを経てから実行される", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("logout-button"));
    expect(signOutMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("logout-confirm-button"));
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    // 確認ダイアログが閉じている
    await waitFor(() =>
      expect(screen.queryByTestId("logout-confirm-button")).toBeNull(),
    );
  });
});

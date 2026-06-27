import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";

// 依存モジュールのトップレベルimportを解決するためのモック（取得処理は使わない）
vi.mock("@/shared/lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/firestore", () => ({
  orderBy: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
}));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));

import { useMasterData } from "@/shared/hooks/useMasterData";
import {
  MasterDataContext,
  type MasterDataContextValue,
} from "@/app/providers/MasterDataProvider";

function makeWrapper(value: MasterDataContextValue) {
  return ({ children }: { children: ReactNode }) =>
    createElement(MasterDataContext.Provider, { value }, children);
}

describe("useMasterData", () => {
  const value: MasterDataContextValue = {
    difficulties: [
      { id: "easy", label: "かんたん", order: 1 },
      { id: "normal", label: "ふつう", order: 2 },
      { id: "hard", label: "むずかしい", order: 3 },
    ],
    rarities: [
      { id: "N", label: "N", order: 1 },
      { id: "SSR", label: "SSR", order: 4 },
    ],
    loading: false,
  };

  it("getDifficultyLabel は識別子からラベルを返す", () => {
    const { result } = renderHook(() => useMasterData(), { wrapper: makeWrapper(value) });
    expect(result.current.getDifficultyLabel("normal")).toBe("ふつう");
  });

  it("getRarityLabel は識別子からラベルを返す", () => {
    const { result } = renderHook(() => useMasterData(), { wrapper: makeWrapper(value) });
    expect(result.current.getRarityLabel("SSR")).toBe("SSR");
  });

  it("未知の識別子は識別子自身をフォールバック返却する", () => {
    const { result } = renderHook(() => useMasterData(), { wrapper: makeWrapper(value) });
    expect(result.current.getDifficultyLabel("unknown")).toBe("unknown");
  });

  it("Provider外で使うとエラーを投げる", () => {
    expect(() => renderHook(() => useMasterData())).toThrow(/MasterDataProvider/);
  });
});

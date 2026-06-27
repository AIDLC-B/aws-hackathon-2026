import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// 汎用プリミティブ・認証・SDKをモック
const useCollectionMock = vi.fn();
const createDocMock = vi.fn();
const getCollectionOnceMock = vi.fn();
const removeDocumentMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  serverTimestamp: () => "SERVER_TS",
}));

vi.mock("@/shared/hooks/useCollection", () => ({
  useCollection: (...a: unknown[]) => useCollectionMock(...a),
  createDoc: (...a: unknown[]) => createDocMock(...a),
  getCollectionOnce: (...a: unknown[]) => getCollectionOnceMock(...a),
}));

vi.mock("@/shared/hooks/useDocument", () => ({
  removeDocument: (...a: unknown[]) => removeDocumentMock(...a),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ currentUser: { uid: "u1" } }),
}));

import { useConfirmedMenu } from "@/features/confirmedMenu/hooks/useConfirmedMenu";
import type { ConfirmedMenuItemInput } from "@shared/types";

const PATH = "users/u1/confirmedMenuItems";

beforeEach(() => {
  useCollectionMock.mockReset();
  createDocMock.mockReset();
  getCollectionOnceMock.mockReset();
  removeDocumentMock.mockReset();
  useCollectionMock.mockReturnValue({ data: [], loading: false, error: null });
});

const sampleInput: ConfirmedMenuItemInput = {
  recipeId: "r1",
  name: "カレー",
  imageUrl: null,
  rarity: "N",
  difficulty: "normal",
  duration: 30,
  source: "suggestion",
};

describe("useConfirmedMenu", () => {
  it("uid から正しいコレクションパスで購読する", () => {
    renderHook(() => useConfirmedMenu());
    expect(useCollectionMock).toHaveBeenCalledWith(PATH);
  });

  it("count は購読データの件数を返す", () => {
    useCollectionMock.mockReturnValue({
      data: [{ id: "a" }, { id: "b" }],
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useConfirmedMenu());
    expect(result.current.count).toBe(2);
  });

  it("confirm は confirmedAt を付与して createDoc を呼ぶ", async () => {
    createDocMock.mockResolvedValue("item1");
    const { result } = renderHook(() => useConfirmedMenu());
    const id = await result.current.confirm(sampleInput);
    expect(id).toBe("item1");
    expect(createDocMock).toHaveBeenCalledWith(PATH, {
      ...sampleInput,
      confirmedAt: "SERVER_TS",
    });
  });

  it("completeMenuItem は該当ドキュメントを削除する", async () => {
    removeDocumentMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmedMenu());
    await result.current.completeMenuItem("item1");
    expect(removeDocumentMock).toHaveBeenCalledWith(`${PATH}/item1`);
  });

  it("getConfirmedMenuItems は getCollectionOnce を呼ぶ", async () => {
    getCollectionOnceMock.mockResolvedValue([{ id: "x" }]);
    const { result } = renderHook(() => useConfirmedMenu());
    const items = await result.current.getConfirmedMenuItems();
    expect(items).toEqual([{ id: "x" }]);
    expect(getCollectionOnceMock).toHaveBeenCalledWith(PATH);
  });

  it("clearAll は全ドキュメントを remove する（10連入れ替え用）", async () => {
    getCollectionOnceMock.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    removeDocumentMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmedMenu());
    await result.current.clearAll();
    expect(removeDocumentMock).toHaveBeenCalledWith(`${PATH}/a`);
    expect(removeDocumentMock).toHaveBeenCalledWith(`${PATH}/b`);
    expect(removeDocumentMock).toHaveBeenCalledTimes(2);
  });
});

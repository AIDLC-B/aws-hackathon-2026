import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Firestore SDK をモック
const onSnapshotMock = vi.fn();
const getDocsMock = vi.fn();
const addDocMock = vi.fn();
const setDocMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ __ref: "collection" })),
  query: vi.fn((c: unknown) => c),
  doc: vi.fn(() => ({ __ref: "doc" })),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
}));

vi.mock("@/shared/lib/firebase", () => ({ db: {} }));

import {
  useCollection,
  createDoc,
  createDocWithId,
  getCollectionOnce,
} from "@/shared/hooks/useCollection";

beforeEach(() => {
  onSnapshotMock.mockReset();
  getDocsMock.mockReset();
  addDocMock.mockReset();
  setDocMock.mockReset();
});

describe("useCollection（リアルタイム購読）", () => {
  it("onSnapshot成功時にid付きでdataを返しloadingがfalseになる", async () => {
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({
        docs: [
          { id: "r1", data: () => ({ name: "卵かけご飯" }) },
          { id: "r2", data: () => ({ name: "カレー" }) },
        ],
      });
      return () => {};
    });

    const { result } = renderHook(() => useCollection<{ name: string }>("users/u1/recipes"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([
      { id: "r1", name: "卵かけご飯" },
      { id: "r2", name: "カレー" },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("onSnapshotエラー時にerrorをセットしloadingがfalseになる", async () => {
    const err = new Error("permission-denied");
    onSnapshotMock.mockImplementation((_ref, _onNext, onError) => {
      onError(err);
      return () => {};
    });

    const { result } = renderHook(() => useCollection("users/u1/recipes"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(err);
    expect(result.current.data).toEqual([]);
  });

  it("アンマウント時にunsubscribeを呼ぶ", () => {
    const unsubscribe = vi.fn();
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({ docs: [] });
      return unsubscribe;
    });

    const { unmount } = renderHook(() => useCollection("users/u1/recipes"));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("createDoc / createDocWithId / getCollectionOnce", () => {
  it("createDoc は addDoc の生成IDを返す", async () => {
    addDocMock.mockResolvedValue({ id: "newId" });
    const id = await createDoc("users/u1/recipes", { name: "x" });
    expect(id).toBe("newId");
    expect(addDocMock).toHaveBeenCalledTimes(1);
  });

  it("createDocWithId は setDoc を呼ぶ", async () => {
    setDocMock.mockResolvedValue(undefined);
    await createDocWithId("difficultyMaster", "easy", { id: "easy", label: "かんたん", order: 1 });
    expect(setDocMock).toHaveBeenCalledTimes(1);
  });

  it("getCollectionOnce は id付きで配列を返す", async () => {
    getDocsMock.mockResolvedValue({
      docs: [{ id: "easy", data: () => ({ label: "かんたん", order: 1 }) }],
    });
    const result = await getCollectionOnce<{ label: string; order: number }>("difficultyMaster");
    expect(result).toEqual([{ id: "easy", label: "かんたん", order: 1 }]);
  });
});

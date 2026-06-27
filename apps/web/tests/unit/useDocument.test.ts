import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const onSnapshotMock = vi.fn();
const getDocMock = vi.fn();
const updateDocMock = vi.fn();
const deleteDocMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ __ref: "doc" })),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
}));

vi.mock("@/shared/lib/firebase", () => ({ db: {} }));

import {
  useDocument,
  updateDocument,
  removeDocument,
  getDocumentOnce,
} from "@/shared/hooks/useDocument";

beforeEach(() => {
  onSnapshotMock.mockReset();
  getDocMock.mockReset();
  updateDocMock.mockReset();
  deleteDocMock.mockReset();
});

describe("useDocument（単一ドキュメント購読）", () => {
  it("存在するドキュメントはid付きで返す", async () => {
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({ exists: () => true, id: "u1", data: () => ({ nickname: "太郎" }) });
      return () => {};
    });

    const { result } = renderHook(() => useDocument<{ nickname: string }>("users/u1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: "u1", nickname: "太郎" });
  });

  it("存在しないドキュメントは null を返す", async () => {
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({ exists: () => false });
      return () => {};
    });

    const { result } = renderHook(() => useDocument("users/missing"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
  });
});

describe("updateDocument / removeDocument / getDocumentOnce", () => {
  it("updateDocument は updateDoc を呼ぶ", async () => {
    updateDocMock.mockResolvedValue(undefined);
    await updateDocument("users/u1", { nickname: "花子" });
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });

  it("removeDocument は deleteDoc を呼ぶ", async () => {
    deleteDocMock.mockResolvedValue(undefined);
    await removeDocument("users/u1/recipes/r1");
    expect(deleteDocMock).toHaveBeenCalledTimes(1);
  });

  it("getDocumentOnce は存在時にid付き、非存在時にnull", async () => {
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      id: "r1",
      data: () => ({ name: "カレー" }),
    });
    expect(await getDocumentOnce("users/u1/recipes/r1")).toEqual({ id: "r1", name: "カレー" });

    getDocMock.mockResolvedValueOnce({ exists: () => false });
    expect(await getDocumentOnce("users/u1/recipes/none")).toBeNull();
  });
});

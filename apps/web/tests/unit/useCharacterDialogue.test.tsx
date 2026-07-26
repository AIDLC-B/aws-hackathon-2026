import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// Firebase SDK 初期化を回避（Context経由の検証のため実通信は不要）
vi.mock("@/shared/lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
}));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));

import { AuthContext, type AuthContextValue } from "@/app/providers/AuthProvider";
import {
  CharacterDialogueContext,
  type CharacterDialogueContextValue,
} from "@/app/providers/CharacterDialogueProvider";
import { useCharacterDialogue } from "@/features/character/hooks/useCharacterDialogue";
import type { CharacterDialogue, UserProfile } from "@/shared/types";

/** 台詞マスターと認証状態を差し込むラッパー */
function makeWrapper(
  dialogues: CharacterDialogue[],
  profile: Partial<UserProfile> | null,
) {
  const master: CharacterDialogueContextValue = { dialogues, loading: false };
  const auth = {
    currentUser: profile ? ({ uid: "u1" } as never) : null,
    profile: profile as UserProfile | null,
    loading: false,
  } satisfies AuthContextValue;

  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>
      <CharacterDialogueContext.Provider value={master}>
        {children}
      </CharacterDialogueContext.Provider>
    </AuthContext.Provider>
  );
}

const dialogues: CharacterDialogue[] = [
  {
    characterId: "sabokachan",
    trigger: "recipe_registered",
    tone: "praise",
    message: "ええやん！また一品増えたな！",
    isPremium: false,
  },
  {
    characterId: "sabowrashi",
    trigger: "recipe_registered",
    tone: "praise",
    message: "おいしそうなの増えた〜！",
    isPremium: true,
  },
];

describe("useCharacterDialogue", () => {
  it("マスターから trigger に合致する台詞を返す", () => {
    const { result } = renderHook(() => useCharacterDialogue(), {
      wrapper: makeWrapper(dialogues, {
        nickname: "テスト",
        isPremium: false,
        favoriteCharacters: [],
      }),
    });
    const line = result.current.getDialogue({
      trigger: "recipe_registered",
      from: "registration",
    });
    expect(line?.message).toBe("ええやん！また一品増えたな！");
  });

  it("AuthContext の isPremium / favoriteCharacters を自動適用する", () => {
    const { result } = renderHook(() => useCharacterDialogue(), {
      wrapper: makeWrapper(dialogues, {
        nickname: "テスト",
        isPremium: true,
        favoriteCharacters: ["sabowrashi"],
      }),
    });
    const line = result.current.getDialogue({
      trigger: "recipe_registered",
      from: "registration",
    });
    expect(line?.characterId).toBe("sabowrashi");
  });

  it("Provider 外（マスター未取得）でもフォールバック台詞を返す", () => {
    const { result } = renderHook(() => useCharacterDialogue());
    const line = result.current.getDialogue({
      trigger: "meal_decided",
      from: "suggestion",
    });
    expect(line).not.toBeNull();
    expect(line?.message.length).toBeGreaterThan(0);
  });
});

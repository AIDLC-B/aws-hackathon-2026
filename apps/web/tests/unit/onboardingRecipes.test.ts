import { describe, it, expect } from "vitest";
import {
  ONBOARDING_RECIPES,
  BANANA_ID,
} from "@/features/onboarding/data/onboardingRecipes";

describe("オンボーディング初期料理リスト（US-00）", () => {
  it("20件ある", () => {
    expect(ONBOARDING_RECIPES).toHaveLength(20);
  });

  it("先頭はバナナ（必須登録ID）", () => {
    expect(ONBOARDING_RECIPES[0].id).toBe(BANANA_ID);
    expect(ONBOARDING_RECIPES[0].name).toBe("バナナ");
  });

  it("全料理に必須フィールドが揃っている", () => {
    for (const r of ONBOARDING_RECIPES) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.emoji).toBeTruthy();
      expect(["N", "R", "SR", "SSR"]).toContain(r.rarity);
      expect(["easy", "normal", "hard"]).toContain(r.difficulty);
      expect(r.duration).toBeGreaterThan(0);
    }
  });

  it("IDは一意", () => {
    const ids = ONBOARDING_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import { describe, it, expect } from "vitest";
import {
  FREQUENCY_LABEL,
  DIFFICULTY_LABEL,
  RARITY_OPTIONS,
  DIFFICULTY_OPTIONS,
  frequencyLabel,
  difficultyLabel,
} from "@/features/recipe/utils/labels";

describe("頻度ラベル（レアリティ→頻度表記）", () => {
  it("N/R/SR/SSR が頻度表記にマップされる", () => {
    expect(FREQUENCY_LABEL.N).toBe("よく作る");
    expect(FREQUENCY_LABEL.R).toBe("しばしば作る");
    expect(FREQUENCY_LABEL.SR).toBe("たまに作る");
    expect(FREQUENCY_LABEL.SSR).toBe("まれに作る");
  });

  it("frequencyLabel ヘルパーが対応する", () => {
    expect(frequencyLabel("N")).toBe("よく作る");
  });

  it("選択肢は N→SSR の順", () => {
    expect(RARITY_OPTIONS).toEqual(["N", "R", "SR", "SSR"]);
  });
});

describe("難易度ラベル（difficultyMaster と一致）", () => {
  it("easy/normal/hard がラベルにマップされる", () => {
    expect(DIFFICULTY_LABEL.easy).toBe("かんたん");
    expect(DIFFICULTY_LABEL.normal).toBe("ふつう");
    expect(DIFFICULTY_LABEL.hard).toBe("むずかしい");
  });

  it("difficultyLabel ヘルパーが対応する", () => {
    expect(difficultyLabel("normal")).toBe("ふつう");
  });

  it("選択肢は easy→hard の順", () => {
    expect(DIFFICULTY_OPTIONS).toEqual(["easy", "normal", "hard"]);
  });
});

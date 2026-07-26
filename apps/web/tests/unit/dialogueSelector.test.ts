import { describe, it, expect } from "vitest";
import {
  selectDialogue,
  TRIGGER_TONES,
} from "@/features/character/dialogueSelector";
import { CHARACTER_PROFILES } from "@/features/character/characterProfiles";
import type { CharacterDialogue } from "@/shared/types";

/**
 * 台詞選択ロジックの代表ケース検証（Unit 8 / Q6a）。
 * 全組み合わせの網羅ではなく、分岐ごとの代表ケースを確認する。
 */

const MASTER: CharacterDialogue[] = [
  {
    characterId: "sabokachan",
    trigger: "meal_decided",
    tone: "praise",
    message: "ええやん、それにしよ！",
    isPremium: false,
  },
  {
    characterId: "nyamake",
    trigger: "meal_decided",
    tone: "empathy",
    message: "それでいいんじゃない…zzz",
    isPremium: false,
  },
  {
    characterId: "saboeru",
    trigger: "meal_decided",
    tone: "praise",
    message: "汝の選択に幸あれ。",
    isPremium: true,
  },
  {
    characterId: "meshistopheles",
    trigger: "gacha_reroll_limit",
    tone: "scolding",
    message: "…こっちにおいでよ。",
    isPremium: false,
  },
];

/** 常に先頭候補を選ぶ乱数（決定的検証用） */
const first = () => 0;

describe("selectDialogue", () => {
  it("非プレミアムユーザーにはプレミアム台詞を出さない", () => {
    const results = [0, 0.5, 0.99].map((r) =>
      selectDialogue({
        dialogues: MASTER,
        trigger: "meal_decided",
        isPremium: false,
        favoriteCharacters: [],
        random: () => r,
      }),
    );
    expect(results.map((l) => l.message)).not.toContain("汝の選択に幸あれ。");
  });

  it("プレミアムユーザーはプレミアム台詞も候補に含む", () => {
    const line = selectDialogue({
      dialogues: MASTER,
      trigger: "meal_decided",
      isPremium: true,
      favoriteCharacters: [],
      random: () => 0.99,
    });
    expect(line.message).toBe("汝の選択に幸あれ。");
  });

  it("プレミアム + 推しキャラ設定時は推しキャラの台詞に限定する", () => {
    const line = selectDialogue({
      dialogues: MASTER,
      trigger: "meal_decided",
      isPremium: true,
      favoriteCharacters: ["nyamake"],
      random: first,
    });
    expect(line.characterId).toBe("nyamake");
  });

  it("推しキャラに該当triggerの台詞が無い場合は他キャラへフォールバックする", () => {
    const line = selectDialogue({
      dialogues: MASTER,
      trigger: "meal_decided",
      // chefrei は MASTER に meal_decided の台詞を持たない
      isPremium: true,
      favoriteCharacters: ["chefrei"],
      random: first,
    });
    expect(line.characterId).not.toBe("chefrei");
    expect(line.message.length).toBeGreaterThan(0);
  });

  it("gacha_reroll_limit はメシストフェレス固定（推しキャラ設定より優先）", () => {
    const line = selectDialogue({
      dialogues: MASTER,
      trigger: "gacha_reroll_limit",
      isPremium: true,
      favoriteCharacters: ["sabokachan"],
      random: first,
    });
    expect(line.characterId).toBe("meshistopheles");
    expect(line.tone).toBe("scolding");
  });

  it("マスター未取得（0件）でも内蔵フォールバック台詞を返す", () => {
    const line = selectDialogue({
      dialogues: [],
      trigger: "recipe_registered",
      isPremium: false,
      favoriteCharacters: [],
      random: first,
    });
    expect(line.message.length).toBeGreaterThan(0);
    expect(TRIGGER_TONES.recipe_registered).toContain(line.tone);
  });

  it("全キャラクターが全triggerのフォールバック台詞を持つ", () => {
    const triggers = Object.keys(TRIGGER_TONES) as Array<
      keyof typeof TRIGGER_TONES
    >;
    for (const profile of Object.values(CHARACTER_PROFILES)) {
      for (const trigger of triggers) {
        const line = profile.fallbackLines[trigger];
        expect(line.message.length).toBeGreaterThan(0);
        expect(TRIGGER_TONES[trigger]).toContain(line.tone);
      }
    }
  });
});

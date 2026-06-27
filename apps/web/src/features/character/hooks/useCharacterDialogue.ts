import type {
  CharacterDialogueQuery,
  CharacterId,
  CharacterLine,
  Trigger,
  UseCharacterDialogue,
} from "@/shared/types";

/**
 * 【Unit 5 スタブ】キャラクター一言フック。
 *
 * 実体は Unit 8（AIキャラクター）で実装する。本スタブは trigger に応じた
 * 固定文言を返すだけで、キャラクター選択・トーン決定・マスターデータ参照・
 * isPremium/推しキャラ絞り込みは行わない。
 *
 * IF（入出力型）は `@shared/types` の UseCharacterDialogue / CharacterDialogueQuery /
 * CharacterLine に準拠しているため、Unit 8 では本ファイルの中身のみ差し替えればよい。
 */

/** キャラクター表示名（暫定・Unit 8でマスター/正式設定に置換） */
export const CHARACTER_NAME: Record<CharacterId, string> = {
  saboeru: "サボエル",
  sabokachan: "サボ母ちゃん",
  nyamake: "ニャマケ",
  chefrei: "シェフレイ",
  meshistopheles: "メシストフェレス",
  sabot: "サボット",
  sabowrashi: "サボわらし",
};

/** trigger 別の固定一言（スタブ） */
const STUB_LINE: Record<Trigger, CharacterLine> = {
  recipe_registered: {
    characterId: "sabokachan",
    tone: "praise",
    message: "ええやん！また一品増えたな、その調子やで！",
  },
  meal_decided: {
    characterId: "sabokachan",
    tone: "praise",
    message: "これで決まりやな！考えんでええって最高やろ？",
  },
  gacha_decided: {
    characterId: "meshistopheles",
    tone: "praise",
    message: "ふふ、運命の一皿だね。委ねるって気持ちいいでしょ？",
  },
  meal_completed: {
    characterId: "sabowrashi",
    tone: "praise",
    message: "つくったんやね、えらい！えへへ、おつかれさま〜",
  },
  meal_suggested: {
    characterId: "sabokachan",
    tone: "encouragement",
    message: "この中から選ぶだけでええんやで。",
  },
  gacha_reroll_limit: {
    characterId: "meshistopheles",
    tone: "empathy",
    message: "…もう、こっちにおいでよ。",
  },
};

export function useCharacterDialogue(): UseCharacterDialogue {
  function getDialogue(query: CharacterDialogueQuery): CharacterLine | null {
    return STUB_LINE[query.trigger] ?? null;
  }
  return { getDialogue, loading: false };
}

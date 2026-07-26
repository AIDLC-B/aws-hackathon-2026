import type {
  CharacterDialogue,
  CharacterId,
  CharacterLine,
  Tone,
  Trigger,
} from "@/shared/types";
import { CHARACTER_PROFILES, getCharacterProfile } from "@/features/character/characterProfiles";

/**
 * 台詞選択ロジック（Unit 8・純粋関数）。
 *
 * Firestore/React に依存しないため単体テストが容易。`useCharacterDialogue` は
 * 台詞マスター（CharacterDialogueProvider がキャッシュ）と認証情報を渡すだけ。
 *
 * 選択手順（services.md「キャラクター台詞取得フロー」準拠）:
 *  1. trigger で絞り込み
 *  2. isPremium=false のユーザーは無料台詞のみ（プレミアムは全台詞が対象）
 *  3. trigger 固定キャラ（gacha_reroll_limit=メシストフェレス）があればそのキャラに限定
 *  4. プレミアム かつ 推しキャラ設定ありなら推しキャラに限定（0件なら limitation を解除）
 *  5. trigger に対応する tone で絞り込み（0件なら tone 条件を解除）
 *  6. 候補からランダムに1件
 *  7. 候補が0件ならコード内蔵のフォールバック台詞（characterProfiles）
 */

/** trigger × tone 定義（services.md） */
export const TRIGGER_TONES: Record<Trigger, Tone[]> = {
  meal_decided: ["praise", "empathy"],
  gacha_decided: ["encouragement", "praise"],
  meal_completed: ["praise", "encouragement"],
  recipe_registered: ["praise", "encouragement"],
  meal_suggested: ["empathy", "encouragement"],
  gacha_reroll_limit: ["scolding"],
};

/** trigger 固定キャラクター（堕落ルートはメシストフェレス固定） */
export const FIXED_CHARACTER: Partial<Record<Trigger, CharacterId>> = {
  gacha_reroll_limit: "meshistopheles",
};

/** フォールバック時に登場しうるキャラクター（services.md の trigger 対応キャラ） */
export const TRIGGER_FALLBACK_CHARACTERS: Record<Trigger, CharacterId[]> = {
  meal_decided: ["sabokachan", "sabowrashi", "nyamake", "sabot"],
  gacha_decided: ["saboeru", "sabokachan", "sabowrashi"],
  meal_completed: ["sabokachan", "sabowrashi", "saboeru"],
  recipe_registered: ["sabokachan", "sabowrashi", "saboeru"],
  meal_suggested: ["nyamake", "sabot", "saboeru", "sabokachan"],
  gacha_reroll_limit: ["meshistopheles"],
};

export interface SelectDialogueParams {
  /** 台詞マスター（未取得時は空配列でよい。フォールバックが働く） */
  dialogues: CharacterDialogue[];
  trigger: Trigger;
  isPremium: boolean;
  favoriteCharacters: CharacterId[];
  /** 0以上1未満の乱数生成関数（テストで差し替え可能） */
  random?: () => number;
}

/** 配列から乱数で1件選ぶ（空配列なら null） */
function pickRandom<T>(items: T[], random: () => number): T | null {
  if (items.length === 0) return null;
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[index];
}

/** マスター候補が無いときのフォールバック台詞を組み立てる */
function buildFallbackLine(
  trigger: Trigger,
  favoriteCharacters: CharacterId[],
  isPremium: boolean,
  random: () => number,
): CharacterLine {
  const fixed = FIXED_CHARACTER[trigger];
  const candidates: CharacterId[] = fixed
    ? [fixed]
    : isPremium && favoriteCharacters.length > 0
      ? favoriteCharacters.filter((id) => id in CHARACTER_PROFILES)
      : TRIGGER_FALLBACK_CHARACTERS[trigger];

  const characterId =
    pickRandom(
      candidates.length > 0 ? candidates : TRIGGER_FALLBACK_CHARACTERS[trigger],
      random,
    ) ?? "sabokachan";

  const { tone, message } = getCharacterProfile(characterId).fallbackLines[trigger];
  return { characterId, tone, message };
}

/**
 * 条件に合致する台詞を1件選択する。候補が無い場合もフォールバック台詞を返すため
 * 「キャラクターが何も喋らない」状態は発生しない。
 */
export function selectDialogue({
  dialogues,
  trigger,
  isPremium,
  favoriteCharacters,
  random = Math.random,
}: SelectDialogueParams): CharacterLine {
  // 1. trigger
  let candidates = dialogues.filter((d) => d.trigger === trigger);

  // 2. プレミアム台詞は非プレミアムユーザーには出さない
  if (!isPremium) {
    candidates = candidates.filter((d) => !d.isPremium);
  }

  // 3. 固定キャラ（推しキャラ設定より優先）
  const fixed = FIXED_CHARACTER[trigger];
  if (fixed) {
    candidates = candidates.filter((d) => d.characterId === fixed);
  } else if (isPremium && favoriteCharacters.length > 0) {
    // 4. 推しキャラ絞り込み（0件なら絞り込みを解除してフォールバック）
    const narrowed = candidates.filter((d) =>
      favoriteCharacters.includes(d.characterId),
    );
    if (narrowed.length > 0) candidates = narrowed;
  }

  // 5. tone 絞り込み（定義外トーンしか無い場合は解除）
  const tones = TRIGGER_TONES[trigger];
  const toneMatched = candidates.filter((d) => tones.includes(d.tone));
  if (toneMatched.length > 0) candidates = toneMatched;

  // 6. ランダム1件
  const picked = pickRandom(candidates, random);
  if (picked) {
    return {
      characterId: picked.characterId,
      tone: picked.tone,
      message: picked.message,
    };
  }

  // 7. フォールバック
  return buildFallbackLine(trigger, favoriteCharacters, isPremium, random);
}

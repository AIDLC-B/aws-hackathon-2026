import { useContext } from "react";
import type {
  CharacterDialogueQuery,
  CharacterLine,
  UseCharacterDialogue,
} from "@/shared/types";
import { AuthContext } from "@/app/providers/AuthProvider";
import { CharacterDialogueContext } from "@/app/providers/CharacterDialogueProvider";
import { selectDialogue } from "@/features/character/dialogueSelector";

/**
 * キャラクター一言フック（Unit 8・正式実装）。
 *
 * 呼び出し元は `trigger` と `from` のみを渡す。キャラクター選択・トーン決定・
 * isPremium / 推しキャラ（favoriteCharacters）による絞り込みはすべて本モジュール内部で行う
 * （キャラクタードメインIF設計・component-methods.md）。
 *
 * - 台詞マスターは `CharacterDialogueProvider` が起動時に一度だけ取得したキャッシュを参照
 * - `isPremium` / `favoriteCharacters` は AuthContext から自動取得（query で明示指定も可能）
 * - 選択ロジックは純粋関数 `selectDialogue` に委譲
 * - Provider外・マスター未取得時はコード内蔵のフォールバック台詞を返す（無言にはならない）
 */
export function useCharacterDialogue(): UseCharacterDialogue {
  const auth = useContext(AuthContext);
  const master = useContext(CharacterDialogueContext);

  const profile = auth?.profile ?? null;
  const dialogues = master?.dialogues ?? [];
  const loading = master?.loading ?? false;

  function getDialogue(query: CharacterDialogueQuery): CharacterLine | null {
    const isPremium = query.isPremium ?? profile?.isPremium ?? false;
    const favoriteCharacters =
      query.favoriteCharacters ?? profile?.favoriteCharacters ?? [];

    return selectDialogue({
      dialogues,
      trigger: query.trigger,
      isPremium,
      favoriteCharacters,
    });
  }

  return { getDialogue, loading };
}

// キャラクター表示名は characterProfiles が単一ソース。
// Unit 5/6/7 は本モジュールから `CHARACTER_NAME` を import しているため再エクスポートで互換維持。
export { CHARACTER_NAME } from "@/features/character/characterProfiles";

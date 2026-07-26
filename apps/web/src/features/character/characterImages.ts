import type { CharacterId } from "@/shared/types";

// サボエル（堕落天使）
import saboeru1 from "@/assets/サボエル/サボエル_1.png";
import saboeru2 from "@/assets/サボエル/サボエル_2.png";
import saboeru3 from "@/assets/サボエル/サボエル_3.png";
import saboeru4 from "@/assets/サボエル/サボエル_4.png";

// サボ母ちゃん（居酒屋のおかん）
import sabokachan1 from "@/assets/サボ母ちゃん/サボ母ちゃん_1.png";
import sabokachan2 from "@/assets/サボ母ちゃん/サボ母ちゃん_2.png";
import sabokachan3 from "@/assets/サボ母ちゃん/サボ母ちゃん_3.png";
import sabokachan4 from "@/assets/サボ母ちゃん/サボ母ちゃん_4.png";

// ニャマケ（ぐうたら猫）
import nyamake1 from "@/assets/ニャマケ/ニャマケ_1.png";
import nyamake2 from "@/assets/ニャマケ/ニャマケ_2.png";
import nyamake3 from "@/assets/ニャマケ/ニャマケ_3.png";
import nyamake4 from "@/assets/ニャマケ/ニャマケ_4.png";
import nyamake5 from "@/assets/ニャマケ/ニャマケ_5.png";
import nyamake6 from "@/assets/ニャマケ/ニャマケ_6.png";
import nyamake7 from "@/assets/ニャマケ/ニャマケ_7.png";

// シェフレイ（元一流シェフの幽霊）
import chefrei1 from "@/assets/シェフレイ/シェフレイ_1.png";
import chefrei2 from "@/assets/シェフレイ/シェフレイ_2.png";
import chefrei3 from "@/assets/シェフレイ/シェフレイ_3.png";
import chefrei4 from "@/assets/シェフレイ/シェフレイ_4.png";

// メシストフェレス（小悪魔）
import meshistopheles1 from "@/assets/メシストフェレス/メシストフェレス_1.png";
import meshistopheles2 from "@/assets/メシストフェレス/メシストフェレス_2.png";
import meshistopheles3 from "@/assets/メシストフェレス/メシストフェレス_3.png";

// サボット（ダメになったロボット）
import sabot1 from "@/assets/サボット/サボット_1.png";
import sabot2 from "@/assets/サボット/サボット_2.png";
import sabot3 from "@/assets/サボット/サボット_3.png";
import sabot4 from "@/assets/サボット/サボット_4.png";

// サボわらし（座敷わらし）
import sabowrashi1 from "@/assets/サボわらし/サボわらし_1.png";
import sabowrashi2 from "@/assets/サボわらし/サボわらし_2.png";
import sabowrashi3 from "@/assets/サボわらし/サボわらし_3.png";
import sabowrashi4 from "@/assets/サボわらし/サボわらし_4.png";

/**
 * キャラクター画像（Unit 8）。
 *
 * `apps/web/src/assets/{キャラ名}/` に配置された画像を Vite の asset import で解決する
 * （ビルド時にハッシュ付きURLへ変換される）。配列の先頭を代表画像とし、
 * 2枚目以降は表情・ポーズのバリエーション。画像を追加・差し替える場合は本ファイルの
 * import を更新するだけでよく、表示側（CharacterAvatar）は変更不要。
 */
export const CHARACTER_IMAGES: Record<CharacterId, string[]> = {
  saboeru: [saboeru1, saboeru2, saboeru3, saboeru4],
  sabokachan: [sabokachan1, sabokachan2, sabokachan3, sabokachan4],
  nyamake: [
    nyamake1,
    nyamake2,
    nyamake3,
    nyamake4,
    nyamake5,
    nyamake6,
    nyamake7,
  ],
  chefrei: [chefrei1, chefrei2, chefrei3, chefrei4],
  meshistopheles: [meshistopheles1, meshistopheles2, meshistopheles3],
  sabot: [sabot1, sabot2, sabot3, sabot4],
  sabowrashi: [sabowrashi1, sabowrashi2, sabowrashi3, sabowrashi4],
};

/**
 * 指定キャラの画像を取得する。`variant` は 0 始まりのバリエーション番号で、
 * 枚数を超える場合は剰余で循環させる（画像枚数がキャラごとに異なるため）。
 */
export function getCharacterImage(id: CharacterId, variant = 0): string | null {
  const images = CHARACTER_IMAGES[id];
  if (!images || images.length === 0) return null;
  const index = ((variant % images.length) + images.length) % images.length;
  return images[index];
}

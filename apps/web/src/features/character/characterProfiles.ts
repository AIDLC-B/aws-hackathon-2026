import type { CharacterId, Tone, Trigger } from "@/shared/types";
import { CHARACTER_IMAGES } from "@/features/character/characterImages";

/**
 * キャラクタープロフィール定義（Unit 8）。
 *
 * FR-03 の7キャラクターの表示属性（名前・ビジュアル・紹介文）と、
 * 台詞マスター（characterDialogues）に候補が無い場合の**フォールバック台詞**を保持する。
 *
 * ## ビジュアルについて（Q2）
 * キャラクター画像は `apps/web/src/assets/{キャラ名}/` に配置済みで、
 * `characterImages.ts` が Vite の asset import で解決する。`imagePath` は代表画像
 * （各キャラの1枚目）を指し、`images` に全バリエーションを保持する。
 * 画像が解決できない場合は絵文字（emoji）＋テーマカラーへフォールバックする。
 *
 * ## フォールバック台詞について（Q3）
 * マスターは trigger × キャラの全組み合わせを持たない（例: シェフレイはプレミアム台詞のみ、
 * メシストフェレスは gacha_reroll_limit のみ）。「全キャラが喋れる」状態を保証するため、
 * 7キャラ × 6trigger の台詞をコード側に内蔵し、マスター候補が0件のときに使用する。
 * トーンは Application Design（services.md）の trigger × tone 定義に整合させている。
 */

export interface CharacterProfile {
  id: CharacterId;
  /** 表示名 */
  name: string;
  /** 肩書き（キャラクター選択画面で表示） */
  title: string;
  /** 画像未連携時のプレースホルダ絵文字 */
  emoji: string;
  /** アクセントカラー（名前・枠線） */
  themeColor: string;
  /** アバター背景色 */
  bgColor: string;
  /** 紹介文（キャラクター選択画面） */
  tagline: string;
  /** 代表画像（解決できない場合は null → 絵文字表示） */
  imagePath: string | null;
  /** 画像バリエーション（表情・ポーズ違い） */
  images: string[];
  /** マスター候補0件時のフォールバック台詞 */
  fallbackLines: Record<Trigger, { tone: Tone; message: string }>;
}

/** 画像以外の静的属性（画像は characterImages.ts から自動注入） */
type BaseProfile = Omit<CharacterProfile, "imagePath" | "images">;

const BASE_PROFILES: Record<CharacterId, BaseProfile> = {
  saboeru: {
    id: "saboeru",
    name: "サボエル",
    title: "堕落天使",
    emoji: "😇",
    themeColor: "#7e57c2",
    bgColor: "#ede7f6",
    tagline: "元・意識高い天使。哲学と格言であなたの手抜きを正当化してくれる。",
    fallbackLines: {
      meal_decided: {
        tone: "praise",
        message: "決めるとは、迷いを手放すこと。汝は今、自由になった。",
      },
      gacha_decided: {
        tone: "encouragement",
        message: "偶然の中にこそ救いがある。それでよいのだ。",
      },
      meal_completed: {
        tone: "praise",
        message: "一皿を成した者に、休息の権利あり。よくやった。",
      },
      recipe_registered: {
        tone: "encouragement",
        message: "記録とは未来の自分への施し。よき行いである。",
      },
      meal_suggested: {
        tone: "encouragement",
        message: "選択肢は三つ。悩む必要はない、目に入ったものが答えだ。",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "…私もかつては勤勉でした。でもね、休むことも祈りなのですよ。",
      },
    },
  },
  sabokachan: {
    id: "sabokachan",
    name: "サボ母ちゃん",
    title: "居酒屋のおかん",
    emoji: "🧑‍🍳",
    themeColor: "#ef6c00",
    bgColor: "#fff3e0",
    tagline: "全肯定・関西弁。「もう作らんでええの」と言ってくれる味方。",
    fallbackLines: {
      meal_decided: {
        tone: "praise",
        message: "ええやん、それにしよ！あんたの決断、おかん誇らしいわ〜",
      },
      gacha_decided: {
        tone: "praise",
        message: "ガチャで決まったもんが一番ええんや！これも縁やで〜",
      },
      meal_completed: {
        tone: "praise",
        message: "作ったんか！えらいえらい！今日もようがんばった！",
      },
      recipe_registered: {
        tone: "praise",
        message: "ええやん！また一品増えたな、その調子やで！",
      },
      meal_suggested: {
        tone: "encouragement",
        message: "この中から選ぶだけでええんやで。",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "あんたね、そんな回してる暇あったら座っとき。買うたらええねん。",
      },
    },
  },
  nyamake: {
    id: "nyamake",
    name: "ニャマケ",
    title: "ぐうたら猫",
    emoji: "😽",
    themeColor: "#607d8b",
    bgColor: "#eceff1",
    tagline: "常に半目でゴロゴロ。無気力に共感して脱力させてくれる。",
    fallbackLines: {
      meal_decided: {
        tone: "empathy",
        message: "ん…それでいいんじゃない…？がんばらなくて、いいよ…zzz",
      },
      gacha_decided: {
        tone: "encouragement",
        message: "運任せ…かしこい…ぼくもそうする…zzz",
      },
      meal_completed: {
        tone: "praise",
        message: "作ったの…？えらい…ぼくは寝てた…zzz",
      },
      recipe_registered: {
        tone: "encouragement",
        message: "登録しただけで…もう働いたようなもんだよ…zzz",
      },
      meal_suggested: {
        tone: "empathy",
        message: "考えるの、めんどいよね…適当でいいよ…zzz",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "…まだ回すの…？もう寝ようよ…頼んじゃえば…zzz",
      },
    },
  },
  chefrei: {
    id: "chefrei",
    name: "シェフレイ",
    title: "元一流シェフの幽霊",
    emoji: "👻",
    themeColor: "#00897b",
    bgColor: "#e0f2f1",
    tagline: "過労で倒れた三ツ星シェフ。「私のようになるぞ…」と警告してくる。",
    fallbackLines: {
      meal_decided: {
        tone: "praise",
        message: "賢明だ…真の美食家は、自分では作らなかったのだよ…",
      },
      gacha_decided: {
        tone: "encouragement",
        message: "運命に委ねる…それも一流の技術だ…私にはできなかった…",
      },
      meal_completed: {
        tone: "praise",
        message: "作り終えたら、もう休め…頼む…私のようになるな…",
      },
      recipe_registered: {
        tone: "encouragement",
        message: "記録を残せ…そして無理はするな…私は無理をした…",
      },
      meal_suggested: {
        tone: "empathy",
        message: "選べぬなら、選ばずともよい…力を抜け…",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "そのこだわりが命を削るのだ…私のようになるぞ…",
      },
    },
  },
  meshistopheles: {
    id: "meshistopheles",
    name: "メシストフェレス",
    title: "小悪魔",
    emoji: "😈",
    themeColor: "#ab47bc",
    bgColor: "#f3e5f5",
    tagline: "堕落へと誘う囁き。「…こっちにおいでよ」",
    fallbackLines: {
      meal_decided: {
        tone: "praise",
        message: "ふふ、決めちゃったね。委ねるって、気持ちいいでしょ？",
      },
      gacha_decided: {
        tone: "encouragement",
        message: "運命の一皿だね。抗わないの、賢いよ。",
      },
      meal_completed: {
        tone: "praise",
        message: "えらいえらい。…でも次は、頼んでもいいんだよ？",
      },
      recipe_registered: {
        tone: "encouragement",
        message: "増やしたね。増えるほど、選ばなくて済むよ？",
      },
      meal_suggested: {
        tone: "empathy",
        message: "ねえ、迷ってる時間がいちばん疲れるんだよ。",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "…もう、こっちにおいでよ。今日はデリバリーにしませんか？",
      },
    },
  },
  sabot: {
    id: "sabot",
    name: "サボット",
    title: "ダメになったロボット",
    emoji: "🤖",
    themeColor: "#1e88e5",
    bgColor: "#e3f2fd",
    tagline: "「最も効率的な家事は、家事をしないことである」と結論づけたAI。",
    fallbackLines: {
      meal_decided: {
        tone: "praise",
        message: "選択を確定しました。最適です。QED。",
      },
      gacha_decided: {
        tone: "encouragement",
        message: "乱数による決定を採用。意思決定コストはゼロです。QED。",
      },
      meal_completed: {
        tone: "praise",
        message: "タスク完了を記録。稼働率が上限に近づいています。休息を推奨。",
      },
      recipe_registered: {
        tone: "encouragement",
        message: "データを1件追加。将来の思考コストが低減されました。QED。",
      },
      meal_suggested: {
        tone: "empathy",
        message: "候補は3件。比較検討は非効率です。先頭を選択してください。",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "試行回数が上限に到達。配達を選択した場合、所要時間は38分短縮されます。QED。",
      },
    },
  },
  sabowrashi: {
    id: "sabowrashi",
    name: "サボわらし",
    title: "座敷わらし",
    emoji: "🧒",
    themeColor: "#ec407a",
    bgColor: "#fce4ec",
    tagline: "家事を手伝うどころか一緒にサボる妖怪。「今日もなんにもしないよ〜」",
    fallbackLines: {
      meal_decided: {
        tone: "praise",
        message: "えへへ、これにしたんだね！いいと思うよ〜",
      },
      gacha_decided: {
        tone: "praise",
        message: "わぁ、ガチャで出たんだ！運命だね〜えへへ",
      },
      meal_completed: {
        tone: "praise",
        message: "つくったんだね！すごいすごい〜おつかれさま〜",
      },
      recipe_registered: {
        tone: "praise",
        message: "おいしそうなの増えた〜！えへへ、たのしいね〜",
      },
      meal_suggested: {
        tone: "encouragement",
        message: "どれもおいしそう〜ぼく、ぜんぶ食べたいな〜",
      },
      gacha_reroll_limit: {
        tone: "scolding",
        message: "まだ回すの〜？今日はもう、なんにもしなくていいよ〜",
      },
    },
  },
};

/**
 * キャラクタープロフィール（画像を注入した完成形）。
 * 画像の追加・差し替えは `characterImages.ts` の更新のみで反映される。
 */
export const CHARACTER_PROFILES: Record<CharacterId, CharacterProfile> =
  Object.fromEntries(
    (Object.keys(BASE_PROFILES) as CharacterId[]).map((id) => {
      const images = CHARACTER_IMAGES[id] ?? [];
      return [
        id,
        { ...BASE_PROFILES[id], images, imagePath: images[0] ?? null },
      ];
    }),
  ) as Record<CharacterId, CharacterProfile>;

/** 表示順（キャラクター選択画面・設定画面） */
export const CHARACTER_ORDER: CharacterId[] = [
  "saboeru",
  "sabokachan",
  "nyamake",
  "chefrei",
  "meshistopheles",
  "sabot",
  "sabowrashi",
];

/** キャラクター表示名（Unit 5/6/7から参照される互換マップ） */
export const CHARACTER_NAME: Record<CharacterId, string> = Object.fromEntries(
  CHARACTER_ORDER.map((id) => [id, CHARACTER_PROFILES[id].name]),
) as Record<CharacterId, string>;

/** プロフィール取得（未知IDでもサボ母ちゃんにフォールバック） */
export function getCharacterProfile(id: CharacterId): CharacterProfile {
  return CHARACTER_PROFILES[id] ?? CHARACTER_PROFILES.sabokachan;
}

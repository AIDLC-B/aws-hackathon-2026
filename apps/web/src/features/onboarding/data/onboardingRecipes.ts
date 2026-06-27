import type { Difficulty, Rarity } from "@shared/types";

/**
 * オンボーディング初期料理リスト（固定20件・US-00）。
 * onboarding-recipe-list.md に基づく（笑いが取れる順）。
 * バナナ（id=banana）は必須登録・選択解除不可。
 */
export interface OnboardingRecipe {
  id: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  difficulty: Difficulty;
  /** 所要時間（分） */
  duration: number;
}

/** 必須登録される料理のID（バナナ） */
export const BANANA_ID = "banana";

export const ONBOARDING_RECIPES: OnboardingRecipe[] = [
  { id: "banana", emoji: "🍌", name: "バナナ", rarity: "N", difficulty: "easy", duration: 1 },
  { id: "tkg", emoji: "🥚", name: "卵かけご飯（TKG）", rarity: "N", difficulty: "easy", duration: 2 },
  { id: "curry-retort", emoji: "🍛", name: "カレーライス（レトルト）", rarity: "N", difficulty: "easy", duration: 10 },
  { id: "ochazuke", emoji: "🍵", name: "お茶漬け", rarity: "N", difficulty: "easy", duration: 5 },
  { id: "hiyayakko", emoji: "🫙", name: "冷奴", rarity: "N", difficulty: "easy", duration: 2 },
  { id: "natto-gohan", emoji: "🫘", name: "納豆ご飯", rarity: "N", difficulty: "easy", duration: 2 },
  { id: "medamayaki", emoji: "🍳", name: "目玉焼き", rarity: "N", difficulty: "easy", duration: 5 },
  { id: "instant-ramen", emoji: "🍜", name: "インスタントラーメン", rarity: "N", difficulty: "easy", duration: 5 },
  { id: "toast", emoji: "🍞", name: "トースト", rarity: "N", difficulty: "easy", duration: 5 },
  { id: "yude-tamago", emoji: "🥚", name: "ゆで卵", rarity: "N", difficulty: "easy", duration: 15 },
  { id: "wiener-itame", emoji: "🌭", name: "ウインナー炒め", rarity: "N", difficulty: "easy", duration: 5 },
  { id: "onigiri", emoji: "🍙", name: "おにぎり", rarity: "N", difficulty: "easy", duration: 10 },
  { id: "medamayaki-don", emoji: "🍚", name: "目玉焼き丼", rarity: "N", difficulty: "easy", duration: 10 },
  { id: "medamayaki-toast", emoji: "🍞", name: "目玉焼きトースト", rarity: "N", difficulty: "easy", duration: 10 },
  { id: "salad", emoji: "🥗", name: "サラダ", rarity: "N", difficulty: "easy", duration: 5 },
  { id: "misoshiru", emoji: "🍲", name: "味噌汁", rarity: "N", difficulty: "easy", duration: 10 },
  { id: "yasai-itame", emoji: "🥬", name: "野菜炒め", rarity: "R", difficulty: "normal", duration: 15 },
  { id: "chahan", emoji: "🍳", name: "チャーハン", rarity: "R", difficulty: "normal", duration: 15 },
  { id: "yakisoba", emoji: "🍝", name: "焼きそば", rarity: "R", difficulty: "normal", duration: 15 },
  { id: "napolitan", emoji: "🍝", name: "パスタ（ナポリタン）", rarity: "R", difficulty: "normal", duration: 20 },
];

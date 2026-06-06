import type { Timestamp } from "firebase/firestore";

/**
 * ユーザープロフィール（users/{uid} ドキュメント）
 * Unit 1 が所有。Unit 3 以降で共通型を拡張する。
 */
export interface UserProfile {
  nickname: string;
  email: string;
  isPremium: boolean;
  isOnboardingCompleted: boolean;
  favoriteCharacters: string[];
  createdAt: Timestamp;
}

/** 新規ユーザー作成時の初期値（createdAtはserverTimestampで付与） */
export type NewUserProfileInput = Omit<UserProfile, "createdAt">;

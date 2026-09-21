/**
 * Firebase Admin 初期化（Functions全体で単一インスタンスを共有）。
 * Emulator接続時は FIRESTORE_EMULATOR_HOST 等の環境変数を Functions ランタイムが自動設定する。
 */
import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const app: App = getApps().length ? getApps()[0] : initializeApp();

export const db: Firestore = getFirestore(app);

import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Firestore Security Rules 単体テスト（MP-2）。
 * 実行には Firestore Emulator が必要:
 *   firebase emulators:start --only firestore
 *   npm run test:rules
 */

let testEnv: RulesTestEnvironment;

const OWNER = "user-owner";
const OTHER = "user-other";

const baseProfile = {
  nickname: "オーナー",
  email: "owner@example.com",
  isPremium: false,
  isOnboardingCompleted: false,
  favoriteCharacters: [],
  createdAt: new Date(),
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "damesi-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // 既存ドキュメントをルール無視でセットアップ
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", OWNER), baseProfile);
  });
});

describe("users コレクションの Security Rules", () => {
  it("本人は自分のドキュメントを読める", async () => {
    const db = testEnv.authenticatedContext(OWNER).firestore();
    await assertSucceeds(getDoc(doc(db, "users", OWNER)));
  });

  it("他人のドキュメントは読めない", async () => {
    const db = testEnv.authenticatedContext(OTHER).firestore();
    await assertFails(getDoc(doc(db, "users", OWNER)));
  });

  it("未認証は読めない", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", OWNER)));
  });

  it("本人は nickname を更新できる", async () => {
    const db = testEnv.authenticatedContext(OWNER).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", OWNER), { nickname: "新しい名前" })
    );
  });

  it("本人でも isPremium は変更できない（自己昇格防止）", async () => {
    const db = testEnv.authenticatedContext(OWNER).firestore();
    await assertFails(
      updateDoc(doc(db, "users", OWNER), { isPremium: true })
    );
  });

  it("作成時に isPremium=true は拒否される", async () => {
    const db = testEnv.authenticatedContext(OTHER).firestore();
    await assertFails(
      setDoc(doc(db, "users", OTHER), { ...baseProfile, isPremium: true })
    );
  });

  it("作成時 isPremium=false は許可される", async () => {
    const db = testEnv.authenticatedContext(OTHER).firestore();
    await assertSucceeds(
      setDoc(doc(db, "users", OTHER), { ...baseProfile, isPremium: false })
    );
  });
});

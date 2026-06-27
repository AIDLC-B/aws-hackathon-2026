/**
 * マスターデータ投入スクリプト（Unit 2）
 *
 * 対象切替:
 *  - FIRESTORE_EMULATOR_HOST が設定されていれば Emulator へ投入
 *  - 未設定かつ GOOGLE_APPLICATION_CREDENTIALS があれば本番へ投入
 *
 * 実行: npm run seed
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(dataDir, file), "utf8")) as T;
}

const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "damesi-local";

// 認証情報: Emulatorは不要。本番はサービスアカウント。
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
initializeApp(
  isEmulator
    ? { projectId }
    : credentialPath
      ? { credential: cert(credentialPath), projectId }
      : { credential: applicationDefault(), projectId }
);

const db = getFirestore();

interface DifficultyMaster { id: string; label: string; order: number; }
interface RarityMaster { id: string; label: string; order: number; }
interface GachaConfig { rarity: string; probability: number; }
interface CharacterDialogue {
  characterId: string;
  trigger: string;
  tone: string;
  message: string;
  isPremium: boolean;
}

/** ドキュメントID指定でコレクションを一括投入（冪等: setなので再実行で上書き） */
async function seedWithId<T extends Record<string, unknown>>(
  collection: string,
  items: T[],
  idKey: keyof T
): Promise<number> {
  const batch = db.batch();
  for (const item of items) {
    const id = String(item[idKey]);
    batch.set(db.collection(collection).doc(id), item);
  }
  await batch.commit();
  return items.length;
}

/** 自動ID採番でコレクションを一括投入（再実行前に既存を削除） */
async function seedAuto<T extends Record<string, unknown>>(
  collection: string,
  items: T[]
): Promise<number> {
  // 再実行の重複を避けるため既存ドキュメントを削除
  const existing = await db.collection(collection).get();
  const delBatch = db.batch();
  existing.forEach((doc) => delBatch.delete(doc.ref));
  await delBatch.commit();

  const batch = db.batch();
  for (const item of items) {
    batch.set(db.collection(collection).doc(), {
      ...item,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return items.length;
}

async function main() {
  console.log(
    `[seed] target = ${isEmulator ? "Emulator" : "Production"} (project: ${projectId})`
  );

  const difficulties = loadJson<DifficultyMaster[]>("difficulty-master.json");
  const rarities = loadJson<RarityMaster[]>("rarity-master.json");
  const gachaConfig = loadJson<GachaConfig[]>("gacha-config.json");
  const dialogues = loadJson<CharacterDialogue[]>("character-dialogues.json");

  const d = await seedWithId("difficultyMaster", difficulties, "id");
  console.log(`[seed] difficultyMaster: ${d}`);

  const r = await seedWithId("rarityMaster", rarities, "id");
  console.log(`[seed] rarityMaster: ${r}`);

  const g = await seedWithId("gachaConfig", gachaConfig, "rarity");
  console.log(`[seed] gachaConfig: ${g}`);

  const c = await seedAuto("characterDialogues", dialogues);
  console.log(`[seed] characterDialogues: ${c}`);

  console.log("[seed] done.");
}

main().catch((e) => {
  console.error("[seed] failed:", e);
  process.exit(1);
});

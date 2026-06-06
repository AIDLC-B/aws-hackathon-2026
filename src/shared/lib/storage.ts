import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/shared/lib/firebase";

/**
 * Cloud Storage 直接アクセスヘルパー（ブラウザから直接アップロード/読み取り/削除）。
 *
 * - 保存先: recipe-images/{uid}/{recipeId}.jpg
 * - アップロード時はクライアントで圧縮（最大長辺1280px・JPEG品質0.8、目安1MB以下）
 * - 保護は Cloud Storage Security Rules（本人ディレクトリ・サイズ上限5MB・image/*）で担保
 */

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

/** 料理画像の保存パスを生成 */
export function recipeImagePath(uid: string, recipeId: string): string {
  return `recipe-images/${uid}/${recipeId}.jpg`;
}

/**
 * 画像ファイルを長辺 MAX_DIMENSION に収まるよう縮小し、JPEG Blob に変換する。
 * canvas が利用できない環境では元ファイルをそのまま返す。
 */
export async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

/**
 * 料理画像をアップロードし、ダウンロードURLを返す。
 * @returns ダウンロードURL（Firestore の imageUrl に保存する）
 */
export async function uploadRecipeImage(
  uid: string,
  recipeId: string,
  file: File,
): Promise<string> {
  const compressed = await compressImage(file);
  const objectRef = ref(storage, recipeImagePath(uid, recipeId));
  await uploadBytes(objectRef, compressed, { contentType: "image/jpeg" });
  return getDownloadURL(objectRef);
}

/** 料理画像のダウンロードURLを取得する。 */
export async function getRecipeImageUrl(
  uid: string,
  recipeId: string,
): Promise<string> {
  return getDownloadURL(ref(storage, recipeImagePath(uid, recipeId)));
}

/** 料理画像を削除する。 */
export async function deleteRecipeImage(
  uid: string,
  recipeId: string,
): Promise<void> {
  await deleteObject(ref(storage, recipeImagePath(uid, recipeId)));
}

// --- 内部ユーティリティ ---

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

/**
 * 画像URLの取得ユーティリティ。
 * AnthropicのVision入力はbase64が必要なため、URLから取得して変換する。
 */

/** Anthropicが受け付けるメディアタイプ */
export type ImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

export interface FetchedImage {
  base64: string;
  mediaType: ImageMediaType;
}

function normalizeMediaType(contentType: string | null): ImageMediaType {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("png")) return "image/png";
  if (ct.includes("gif")) return "image/gif";
  if (ct.includes("webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * 画像URLを取得し base64 とメディアタイプを返す。
 * @param imageUrl 取得対象の画像URL
 */
export async function fetchImageAsBase64(
  imageUrl: string,
): Promise<FetchedImage> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`image fetch failed: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    base64: buf.toString("base64"),
    mediaType: normalizeMediaType(res.headers.get("content-type")),
  };
}

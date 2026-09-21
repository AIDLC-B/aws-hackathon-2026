/**
 * LLMプロバイダ抽象化の型定義（Q2拡張）。
 *
 * CF-01の料理画像認識を、プロバイダ非依存のインターフェースで扱う。
 * 環境変数 LLM_PROVIDER で実装を切替（anthropic / openai / mock）。
 */
import type { RecipeAnalysis } from "../../types.js";

/** LLMプロバイダ共通インターフェース */
export interface LlmClient {
  /** プロバイダ識別子（ログ用） */
  readonly provider: string;
  /**
   * 画像URLから料理情報を認識する（Vision）。
   * @param imageUrl 認識対象の画像URL
   * @returns 認識結果。認識不能な場合は null
   */
  analyzeRecipeImage(imageUrl: string): Promise<RecipeAnalysis | null>;
}

/** プロバイダ実装が解析結果JSONを正規化する際に使う共通プロンプト */
export const VISION_PROMPT = [
  "あなたは料理写真を解析するアシスタントです。",
  "画像に写っている料理を判定し、以下のJSONのみを返してください（前後に説明文を付けない）。",
  "{",
  '  "name": "料理名（日本語・40文字以内）",',
  '  "difficulty": "easy | normal | hard のいずれか",',
  '  "duration": 調理の目安時間（分・整数）,',
  '  "rarity": "N | R | SR | SSR のいずれか（珍しさ・手の込み具合）"',
  "}",
  "料理と判定できない場合は null とだけ返してください。",
].join("\n");

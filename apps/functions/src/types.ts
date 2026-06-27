/**
 * Cloud Functions の型は中立共有基盤（/shared/types）を参照する。
 *
 * 方針（shared一本化・中立配置）:
 *   ドメイン型・CF契約型はフロント/Functions共通の単一ソース `/shared/types/index.ts`
 *   で一元管理する。本ファイルはそれを再エクスポートする薄いバレルであり、
 *   Functions側のコードは従来どおり `./types.js` から型を取得できる。
 *
 *   `/shared` はフロント（src/）にも Functions（functions/）にも属さない中立な基盤。
 *   型は実行時に消去される（`export type`）ため、コンパイル後の Functions バンドルに
 *   shared の実体は含まれない（デプロイ境界の問題は生じない）。
 *
 *   Timestamp は中立側で SDK非依存の `FirestoreTimestamp` を用いるため、
 *   client/admin いずれのSDKからも安全に利用できる。
 */
export type {
  // union / マスター
  Difficulty,
  Rarity,
  GachaConfig,
  FirestoreTimestamp,
  // ドメインエンティティ
  Recipe,
  RecipeInput,
  ConfirmedMenuItem,
  // CF-01
  AnalyzeRecipeImageRequest,
  RecipeAnalysis,
  // CF-02
  SuggestMealsRequest,
  SuggestMealsResponse,
  // CF-03
  SpinGachaRequest,
  GachaResultItem,
  SpinGachaResponse,
} from "../../shared/types/index.js";

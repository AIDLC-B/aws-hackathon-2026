# Unit 5: 料理管理 — Code Generation 計画

> 設計4ステージ（Functional / NFR Requirements / NFR Design / Infrastructure Design）はスキップし、Code Generationのみ実行。
> 理由: `Recipe`/`RecipeInput` は `apps/shared/types` で定義済み。CRUD・バリデーション・画面仕様は stories（US-00/01/04/14）・ux-design・component-methods で確定済み。新規データモデル/NFR/インフラを伴わない。

## ユニットコンテキスト
- **対象**: Unit 5（料理管理）= `features/recipe` + `features/onboarding`
- **配置**: `apps/web/src/features/recipe`, `apps/web/src/features/onboarding`
- **対応ストーリー**: US-00（オンボーディング）, US-01（料理登録）, US-04（一覧/詳細/編集/削除）, US-14（登録時のキャラ一言）
- **依存（既存資産）**:
  - 型: `@shared/types` の `Recipe` / `RecipeInput` / `Difficulty` / `Rarity`
  - プリミティブ: `shared/hooks/useCollection`（createDoc/createDocWithId/getCollectionOnce）, `useDocument`
  - Storage: `shared/lib/storage`（uploadRecipeImage/compressImage/deleteRecipeImage・recipeId必須）
  - Functions: `shared/lib/functions` の `callFunction`（CF-01 `analyzeRecipeImage`）
  - 認証: `AuthProvider`（uid 取得）
  - UI: `shared/components/ui`（Button/Card/Modal/BottomSheet/LoadingSpinner）
  - マスター: `useMasterData`（difficulty ラベル）。難易度ラベルは difficultyMaster（easy=かんたん/normal=ふつう/hard=むずかしい）
- **横断依存**: 登録・オンボーディング完了時のキャラ一言（trigger=recipe_registered）→ 実体は Unit 8。本ユニットではスタブで対応（Q1）。

## ステージ要否評価（拡張準拠サマリー）
| ステージ | 判定 | 理由 |
|---|---|---|
| Functional Design | SKIP | 型・スキーマ・業務ルール確定済み |
| NFR Requirements | SKIP | 新規NFRなし |
| NFR Design | SKIP | 連動 |
| Infrastructure Design | SKIP | Storage/CF/Firestore定義済み |
| Code Generation | EXECUTE | 常に実行 |

- **Security Baseline拡張（Enabled）**: Firestore/Storageアクセスは常に `users/{uid}/...`（認証uidスコープ）。保護はSecurity Rules（U1）。本ユニットは認可ロジックを新規に持たない（該当箇所のみ遵守）。
- **Property-Based Testing拡張（Partial）**: 確率/抽選ロジックなし → 通常の単体テストのみ（N/A）。

## レアリティ⇔頻度表示ラベル（重要・確認）
登録画面/一覧では「頻度」表記、ガチャでは「N/R/SR/SSR」表記（stories US-01のレアリティ表示ルール）。rarityMaster.label は `N/R/SR/SSR`（ガチャ用）なので、**頻度ラベルは別マッピングが必要**:

| rarity | 頻度ラベル（登録/一覧） |
|---|---|
| N | よく作る |
| R | しばしば作る |
| SR | たまに作る |
| SSR | まれに作る |

---

## 質問

### Question 1: キャラクター一言（Unit 8依存）の扱い

登録・オンボーディング完了時に表示するキャラ一言（trigger=recipe_registered）は実体がUnit 8。本ユニットでどう繋ぐ？

A) **`features/character` に最小スタブを作成**（`useCharacterDialogue` が固定文言を返す + `CharacterBottomSheet` 実体[shared/ui BottomSheet利用]）。Unit 8で中身を差し替え。型は `@shared/types` のIFに準拠（推奨・unit-of-work方針）
B) `features/recipe`/`onboarding` 内で `shared/ui` の BottomSheet に固定文言を直接表示し、Unit 8で `features/character` に置換
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 2: 写真AI認識（CF-01）の連携フロー

写真登録では、保存前にCF-01で認識→autofillしたい。しかしStorageパスは `recipe-images/{uid}/{recipeId}.jpg` でrecipeId必須。登録前はrecipeId未確定。

A) **登録前にFirestoreのドキュメントID をクライアント生成**（`doc(collection(...)).id`）し、それを recipeId としてStorageパス＆CF-01に使用 → 認識 → autofill → 「登録する」で同IDでドキュメント作成（パス一貫・推奨）
B) 一時パスにアップロードして認識 → 保存時に正式パスへコピー/移動（処理が複雑・Storage二重保存）
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 3: ボトムナビゲーションの範囲

ux-designはボトムナビ（🏠ホーム/🍳レシピ/⚙設定）。home=Unit 6・settings=Unit 8が未実装。

A) **共通ボトムナビを今回設置**し、レシピタブを実装。home/settingsは既存/簡易プレースホルダにリンク（推奨・US-04のタブ前提が成立）
B) ボトムナビは置かず、`/recipe` 配下ルートのみ実装（ナビ統合は Unit 6/8 で）
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 4: テスト範囲

A) **フック/ロジック中心 + 軽い描画**（useRecipes/useOnboarding のCRUD・バリデーション・頻度ラベルマッピングをFirebase SDK/CFモックで検証 + 主要ページの最小レンダリングテスト・推奨）
B) フック/ロジックのみ（描画テストなし）
C) テストは今回生成せず Build & Test フェーズでまとめて
D) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 5: 頻度ラベルマッピングの配置

上記 rarity→頻度ラベル の置き場所。

A) **`features/recipe/utils`（または `shared/utils`）に定義**（N=よく作る/R=しばしば作る/SR=たまに作る/SSR=まれに作る）。料理ドメイン固有表示のため recipe feature 配下を推奨
B) `shared/utils` に汎用配置
C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## 実行ステップ（確定・完了）

- [x] Step 1: 頻度ラベルマッピング（Q5）→ `features/recipe/utils/labels.ts`
- [x] Step 2: `features/recipe/hooks/useRecipes.ts`（CRUD + 画像 + CF-01・useCollection/useDocument/storage/functions利用）+ `useRecipe.ts`
- [x] Step 3: バリデーション → `features/recipe/validation.ts`（各フィールド下エラー）
- [x] Step 4: ページ/コンポーネント（RegisterPage/RepertoireListPage/RecipeDetailPage/RecipeEditPage + RecipeForm・Container/Presentational分離）
- [x] Step 5: 写真AI認識連携（Q2・newDocId採番→アップロード→CF-01→autofill）
- [x] Step 6: `features/onboarding`（OnboardingPage/useOnboarding/onboardingRecipes 20件）
- [x] Step 7: キャラ一言スタブ（Q1・`features/character`）
- [x] Step 8: ルーティング結線（OnboardingPage実体化・/recipe配下・AppLayoutボトムナビ）
- [x] Step 9: テスト（Q4・4ファイル追加・web全50テストpass）
- [x] Step 10: ドキュメント（`aidlc-docs/construction/unit5-recipe-management/code/code-summary.md`）
- [x] Step 11: 整合性確認（typecheck/build成功・get_diagnosticsクリーン・FSD 4階層準拠・AuthProvider refreshProfile/useCollection newDocId 追加）

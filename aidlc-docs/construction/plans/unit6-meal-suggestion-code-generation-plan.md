# Unit 6: 献立提案 — Code Generation 計画

> 設計4ステージはスキップし、Code Generationのみ実行。
> 理由: 提案/確定フロー・CF-02はApplication Design/component-methodsで確定。画面仕様はstories（US-05/06/16）・ux-designで確定。新規データモデル/NFR/インフラなし。

## ユニットコンテキスト
- **対象**: Unit 6（献立提案）= `features/suggestion` + `features/confirmedMenu` + ホーム画面ディスパッチ
- **配置**: `apps/web/src/features/suggestion`, `apps/web/src/features/confirmedMenu`, `apps/web/src/app`（ホーム）
- **対応ストーリー**: US-05（考えたくない→提案）, US-06（10件未満ガチャ誘導）, US-16（つくったよ！）
- **依存（既存資産）**:
  - 型: `@shared/types` の `Recipe` / `ConfirmedMenuItem` / `Difficulty` / `Source`
  - プリミティブ: `shared/hooks/useCollection`（create/getCollectionOnce）, `useDocument`（remove）
  - Functions: `shared/lib/functions` の CF-02 `suggestMeals`
  - 料理: `features/recipe`（useRecipes の recipeCount / 表示ラベル labels）
  - キャラ: `features/character`（CharacterBottomSheet / 要 CharacterInline 追加）
  - UI: `shared/components/ui`
- **横断依存**:
  - 確定時/つくったよ時のキャラ一言（meal_decided/meal_completed）→ CharacterBottomSheet（スタブ・Unit 8で差替）
  - フィルタ画面のインライン一言（meal_suggested）→ CharacterInline（**未作成**・本ユニットでスタブ追加 or character featureに追加）
  - ガチャ誘導（運に任せる/10件未満）→ `/gacha`（Unit 7・**プレースホルダ遷移**）

## ステージ要否評価（拡張準拠）
| ステージ | 判定 | 理由 |
|---|---|---|
| Functional Design / NFR Requirements / NFR Design / Infrastructure Design | SKIP | 確定済み・新規なし |
| Code Generation | EXECUTE | 常に実行 |
- Security Baseline: Firestoreは `users/{uid}/confirmedMenuItems`（uidスコープ）。CF-02は認証検証済み（Unit 4）。新規認可ロジックなし。
- PBT: 確率ロジックなし（提案はランダム3品だがCF側・FE は表示のみ）→ N/A。

---

## 質問

### Question 1: ConfirmedMenuItem 型の整合（要確認・重要）

確定済み献立の一覧/詳細表示に必要な項目を踏まえ、`@shared/types` の `ConfirmedMenuItem` を確定スキーマに合わせて整える。
現状の型: `{ id, recipeId, name, imageUrl, source, rarity?, confirmedAt? }`
components.md スキーマ: recipeId / recipeName / rarity / difficulty / duration / confirmedAt / source

A) **スナップショット方式に統一**（推奨）: `{ id, recipeId, name, imageUrl, rarity, difficulty, duration, source, confirmedAt }` を確定時に保存。一覧は再フェッチ不要。`name` 表記に統一（schemaの`recipeName`はドキュメントを`name`に修正）
B) 最小参照方式: `{ id, recipeId, source, confirmedAt }` のみ保存し、表示は都度 recipes を参照
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 2: 確定済み献立の「詳細」表示（材料/レシピ/メモ）

ux-designの献立1件確定時の「レシピ詳細画面」は材料/レシピ/メモも表示。確定済み献立はスナップショット（材料等は持たない想定）。

A) **recipeId から元レシピを取得して詳細表示**（材料/レシピ/メモを含む）+ つくったよ！ボタン。Unit 5の `useRecipe` を再利用（推奨）
B) スナップショット項目のみ表示（材料/レシピ/メモは出さない）
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 3: ホーム画面ディスパッチの所有

ux-designのホームタブは献立確定状態で分岐（0件→選択画面 / 1件→詳細 / 2件以上→献立リスト）。現在 `/` はUnit 6プレースホルダ。

A) **本ユニットでホーム（`/`）を実装**し、確定済み献立件数で分岐（0→SelectionPage, 1→確定献立詳細, 2+→MenuListPage）（推奨・Unit 6が献立フロー所有）
B) ホームは别途、本ユニットは `/suggestion` 等の個別ルートのみ
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 4: ガチャ誘導（Unit 7未実装）の扱い

「運に任せる」/10件未満のガチャ誘導先 `/gacha` はUnit 7。

A) **`/gacha` へ遷移（プレースホルダ画面）**を用意し、Unit 7で実体化（推奨・ナビ成立）
B) ガチャ誘導ボタンは無効化/非表示にしてUnit 7で有効化
C) Other (please describe after [Answer]: tag below)

[Answer]:A

### Question 5: meal_suggested インライン一言 + テスト範囲

(5a) フィルタ画面のインライン一言（trigger=meal_suggested）用に `features/character` に `CharacterInline`（スタブ）を追加してよいか。
(5b) テストは「フック/ロジック中心 + 軽い描画」（CF-02モック・確定/つくったよロジック・件数分岐）でよいか。

A) **両方OK**（CharacterInlineスタブ追加 + ロジック/軽い描画テスト・推奨）
B) CharacterInlineは作らずインライン文言を直書き、テストはロジックのみ
C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## 実行ステップ（回答確定後に確定・仮）

- [x] Step 1: ConfirmedMenuItem 型整合（Q1・`apps/shared/types`）
- [x] Step 2: `features/confirmedMenu/hooks/useConfirmedMenu.ts`（useCollection利用・getConfirmedMenuItems/getCount/confirm追加/completeMenuItem[remove]/clearAll）
- [x] Step 3: `features/suggestion/hooks/useSuggestion.ts`（CF-02 suggestMeals 呼び出し・confirmMeal 書き込み）
- [x] Step 4: `features/character/components/CharacterInline.tsx`（Q5a・スタブ）
- [x] Step 5: `features/suggestion` ページ（SelectionPage[US-05/06]・FilteringPage[US-05]）+ components（SuggestionResult等）
- [x] Step 6: `features/confirmedMenu` ページ（MenuListPage[US-16]・確定献立詳細[Q2]）+ MenuItemCard
- [x] Step 7: ホーム画面ディスパッチ（Q3・`/` を件数分岐で実装）
- [x] Step 8: ガチャ誘導プレースホルダ（Q4・`/gacha`）+ ルーティング結線
- [x] Step 9: テスト（Q5b）
- [x] Step 10: ドキュメント（`aidlc-docs/construction/unit6-meal-suggestion/code/code-summary.md`）
- [x] Step 11: 整合性確認（typecheck/build・get_diagnostics・FSD準拠）

---

*質問に回答したら「回答しました」とお知らせください。推奨でよければ「すべてAで進めて」でOKです。*

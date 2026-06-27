# Unit 6: 献立提案 — Code 生成サマリー

> 本書はドキュメント（マークダウン）。実コードは `apps/web/src` 配下に配置。
> 対応ストーリー: US-05（考えたくない→提案）/ US-06（10件未満ガチャ誘導）/ US-16（つくったよ！）

## 概要
献立提案フロー（提案 → 確定 → つくったよ！）と、確定済み献立件数によるホーム画面ディスパッチを実装した。
CF-02（suggestMeals）でランダム提案を取得し、選んだ1品を確定済み献立（スナップショット）として保存する。
キャラクター一言は Unit 5 のスタブ（`useCharacterDialogue`）を流用し、インライン表示用に `CharacterInline` を追加した。

## 設計上の決定（Q1〜Q5）
| 質問 | 決定 | 内容 |
|---|---|---|
| Q1 | A | `ConfirmedMenuItem` をスナップショット方式に統一（name/imageUrl/rarity/difficulty/duration/source/confirmedAt を確定時保存）。一覧は再フェッチ不要 |
| Q2 | A | 確定済み献立詳細は recipeId から元レシピを参照し材料/レシピ/メモを表示（`useRecipe` 再利用）+ つくったよ！ |
| Q3 | A | ホーム（`/`）を確定件数で分岐（0→選択 / 1→詳細リダイレクト / 2+→リスト） |
| Q4 | A | ガチャ誘導先 `/gacha` はプレースホルダ画面を用意（Unit 7で実体化） |
| Q5 | A | `CharacterInline`（スタブ）を追加。テストはロジック中心+軽い描画 |

## 生成・変更ファイル

### 共有型（変更）
- **変更** `apps/shared/types/index.ts`
  - `ConfirmedMenuItem` をスナップショット方式に拡張（`rarity`/`difficulty`/`duration` を必須化、`recipeName`→`name` 統一）
  - `ConfirmedMenuItemInput`（`Omit<ConfirmedMenuItem, "id" | "confirmedAt">`）を追加
- **変更** `apps/web/src/shared/types/index.ts` — `ConfirmedMenuItemInput` 再エクスポート追加

### features/confirmedMenu（新規）
- **新規** `hooks/useConfirmedMenu.ts` — `users/{uid}/confirmedMenuItems` のサービス層。`items`/`count`/`confirm`/`completeMenuItem`/`getConfirmedMenuItems`。汎用プリミティブ（useCollection/createDoc/removeDocument/getCollectionOnce）を内部利用
- **新規** `components/MenuItemCard.tsx` — 確定済み献立の一覧カード（スナップショット表示）
- **新規** `pages/MenuListPage.tsx` — 確定済み献立リスト（US-16・2件以上のホーム表示）
- **新規** `pages/ConfirmedMenuDetailPage.tsx` — 確定済み献立詳細（Q2: 元レシピ参照で材料/レシピ/メモ表示）+ つくったよ！（meal_completed 一言）

### features/suggestion（新規）
- **新規** `hooks/useSuggestion.ts` — CF-02（suggestMeals）呼び出し + `confirmMeal`（Recipe→スナップショット入力に変換し確定書き込みは useConfirmedMenu に委譲）。`needsGachaRedirect`/`hasSuggested` 保持
- **新規** `components/SuggestionResult.tsx` — 提案候補（最大3品）リスト・タップで確定
- **新規** `pages/SelectionPage.tsx` — 献立選択トップ（US-05/06）。フィルタ/ガチャ導線 + レパートリー10件未満のガチャ/登録誘導
- **新規** `pages/FilteringPage.tsx` — フィルタ画面（US-05）。所要時間/難易度で提案 → 確定（meal_decided 一言）→ ホーム。meal_suggested インライン一言表示

### features/character（新規）
- **新規** `components/CharacterInline.tsx` — インライン一言（meal_suggested・スタブ・Unit 8で差替）

### app（変更・新規）
- **新規** `app/HomePage.tsx` — ホームディスパッチ（Q3・確定件数で SelectionPage / 詳細リダイレクト / MenuListPage を分岐）
- **変更** `app/routes.tsx` — `/` を `HomePage` に差し替え（HomePlaceholder 削除）。`/suggestion/filter`・`/menu/:itemId`・`/gacha`（プレースホルダ）ルート追加

### テスト（新規・tests/unit）
- **新規** `useConfirmedMenu.test.ts` — パス/件数/confirm（confirmedAt付与）/completeMenuItem/getConfirmedMenuItems
- **新規** `useSuggestion.test.ts` — CF-02呼び出し/needsGachaRedirect/エラー/confirmMeal変換
- **新規** `HomePage.test.tsx` — 件数分岐（0/1/2+・loading）
- **新規** `CharacterInline.test.tsx` — 一言描画

## 検証結果
- `npm run typecheck`（web + functions）: 成功
- `npm run build`（web・tsc -b + vite build）: 成功
- `npm run test --workspace @damesi/web`: 新規4ファイル含む 64 passed / 7 skipped
  - 既知の失敗: `tests/rules/firestore.rules.test.ts`（Firebaseエミュレータ + `firestore.rules` パス前提の統合テスト・本ユニットと無関係の環境依存）
- `get_diagnostics`（新規/変更11ファイル）: クリーン
- 既知のlint指摘: `shared/hooks/useCollection.ts:72`（`react-hooks/exhaustive-deps` ルール未登録・Unit 3由来の既存問題・本ユニットと無関係）

## 後続ユニットへの引き継ぎ
- **Unit 7（ガチャ）**: `/gacha` プレースホルダを実体化。ガチャ確定（source=`gacha`/`gacha_10`）は `useConfirmedMenu.confirm` を再利用可能
- **Unit 8（AIキャラクター）**: `useCharacterDialogue` スタブを正式実装に差し替えれば、`CharacterBottomSheet`/`CharacterInline` はそのまま機能

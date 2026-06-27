# Unit 5: 料理管理 — コードサマリー

**生成日**: 2026-06-27
**配置**: `apps/web/src/features/recipe`, `apps/web/src/features/onboarding`, `apps/web/src/features/character`（一言スタブ）
**対応ストーリー**: US-00（オンボーディング）, US-01（料理登録）, US-04（一覧/詳細/編集/削除）, US-14（登録時のキャラ一言）

---

## 概要

料理管理ドメイン（レパートリーのCRUD）とオンボーディングを実装。FSD 4階層（Page/Widget/Feature Component/UI Element）とContainer/Presentational分離に準拠。Firestore/Storage/FunctionsへのアクセスはUnit 3の汎用プリミティブ経由。

---

## ディレクトリ構成

```
apps/web/src/
├── features/recipe/
│   ├── utils/labels.ts          頻度ラベル（rarity→よく作る等）/難易度ラベル（Q5）
│   ├── validation.ts            フォーム値型・必須バリデーション・RecipeInput変換
│   ├── hooks/
│   │   ├── useRecipes.ts        CRUD + 画像アップロード + CF-01認識（useCollection/storage/functions利用）
│   │   └── useRecipe.ts         単一料理購読（useDocument利用）
│   ├── components/RecipeForm.tsx  登録/編集共通フォーム（プレゼンテーショナル）
│   └── pages/
│       ├── RegisterPage.tsx       料理登録（US-01・写真AI認識フロー）
│       ├── RepertoireListPage.tsx 一覧（US-04）
│       ├── RecipeDetailPage.tsx   詳細（US-04）
│       └── RecipeEditPage.tsx     編集・削除（US-04）
├── features/onboarding/
│   ├── data/onboardingRecipes.ts  固定20件（バナナ必須・US-00）
│   ├── hooks/useOnboarding.ts     一括登録 + isOnboardingCompleted更新
│   └── pages/OnboardingPage.tsx   オンボーディング画面（US-00）
├── features/character/            ★Unit 5スタブ（実体はUnit 8）
│   ├── hooks/useCharacterDialogue.ts  trigger別固定一言を返す
│   └── components/CharacterBottomSheet.tsx  一言ボトムシート（shared/ui BottomSheet利用）
├── app/
│   ├── AppLayout.tsx            ボトムナビ（🏠/🍳/⚙・Q3）
│   └── routes.tsx              ルーティング結線（onboarding実体化・/recipe配下・layout）
└── （Unit3資産を更新）
    ├── shared/hooks/useCollection.ts  newDocId（保存前ID採番）を追加
    └── app/providers/AuthProvider.tsx refreshProfile を追加
```

テスト: `apps/web/tests/unit/` に4ファイル追加（recipeValidation/recipeLabels/onboardingRecipes/RecipeForm）。**web 全50テストpass**。`typecheck`・`build` 成功・get_diagnosticsクリーン。

---

## 主要な設計判断（Q&A反映）

- **Q1=A キャラ一言スタブ**: `features/character` に `useCharacterDialogue`（trigger別固定文言）と `CharacterBottomSheet`（shared/ui BottomSheet土台）を最小実装。IFは `@/shared/types`（CharacterBottomSheetProps/UseCharacterDialogue/CharacterDialogueQuery）に準拠し、Unit 8で中身のみ差し替え可能。
- **Q2=A 写真AI認識フロー**: 保存前に `newDocId` で recipeId を採番（`useCollection` に追加）。同IDで Storage アップロード → CF-01 `analyzeRecipeImage` で認識 → フォームへautofill → 「登録する」で同IDのドキュメント作成。Storageパス（`recipe-images/{uid}/{recipeId}.jpg`）が一貫。認識失敗時は通知を出し手動入力へ。
- **Q3=A ボトムナビ設置**: `AppLayout` に🏠ホーム(Unit6)/🍳レシピ(Unit5)/⚙設定(Unit8)のタブを設置。レシピのサブ画面（new/detail/edit）はナビ無しの単独ルート。
- **Q4=A テスト**: バリデーション・ラベルマッピング・オンボーディングデータのロジックテスト + RecipeForm の描画/操作テスト。
- **Q5=A 頻度ラベル配置**: `features/recipe/utils/labels.ts` に rarity→頻度（N=よく作る/R=しばしば作る/SR=たまに作る/SSR=まれに作る）。登録/一覧は頻度表記、ガチャ（Unit7）はN/R/SR/SSR表記。

---

## 既存資産への変更（Unit 1/3）

| ファイル | 変更 | 理由 |
|---|---|---|
| `shared/hooks/useCollection.ts` | `newDocId(path)` 追加 | 写真フローで保存前にrecipeIdを確定（Q2） |
| `app/providers/AuthProvider.tsx` | `refreshProfile?()` 追加（任意フィールド） | オンボーディング完了後にprofileを最新化しガード遷移を正す。既存テスト互換のため任意型 |
| `features/auth/hooks/useAuth.ts` | `refreshProfile` を返却に追加 | useOnboardingから利用 |

---

## セキュリティ / 拡張準拠

| 項目 | 対応 |
|---|---|
| Security Baseline | Firestore/Storageは常に `users/{uid}/...`（認証uidスコープ）。保護はSecurity Rules（Unit 1）。本ユニットは認可ロジックを新規に持たない |
| Property-Based Testing | 確率/抽選ロジックなし → 通常の単体テストのみ（N/A） |

---

## フローと画面の対応

| 画面/フロー | ルート | ストーリー |
|---|---|---|
| オンボーディング | `/onboarding` | US-00 |
| レパートリー一覧 | `/recipe` | US-04 |
| 料理登録 | `/recipe/new` | US-01 |
| レシピ詳細 | `/recipe/:id` | US-04 |
| レシピ編集・削除 | `/recipe/:id/edit` | US-04 |
| 登録時のキャラ一言 | （登録/オンボーディング完了時ボトムシート） | US-14 |

---

## TODO / 申し送り（Unit 6/8）

- キャラ一言は**スタブ**（固定文言）。Unit 8 で `useCharacterDialogue` をマスターデータ参照・キャラ/トーン選択・isPremium絞り込みに差し替え、`CharacterBottomSheet` にキャラクター画像を追加。
- レシピ詳細画面（レパートリー側）には「つくったよ！」を置いていない（確定済み献立の完了=US-16はUnit 6の責務）。
- ホーム（Unit 6）・設定（Unit 8）はプレースホルダ。ボトムナビは設置済みなので各ユニットで中身を実装すれば繋がる。
- 画像プレビューに `URL.createObjectURL` を使用（簡易）。必要なら revoke 追加を検討。

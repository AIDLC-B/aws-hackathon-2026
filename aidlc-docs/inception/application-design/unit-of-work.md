# ユニット定義（Firebase版）

> **注**: 本書は旧AWS版（Lambda/DynamoDB/Cognito）を全面刷新し、Firebaseアーキテクチャ（Cloud Functions + Firestore + Cloud Storage + Firebase Auth + Claude API）に基づいて再構成したものです。分解方針はハイブリッド（基盤系=横断ユニット、機能系=垂直ユニット）。

## ユニット構成（8ユニット）

| # | ユニット名 | 種別 | 対応ドメイン/feature | 対応FR | 優先度 | 実装順序 |
|---|---|---|---|---|---|---|
| Unit 1 | Firebase基盤 & 認証 | 基盤（横断） | Firebase設定 / features/auth | FR-認証 | 🔴 Must | 1st |
| Unit 2 | セットアップ／マスターデータ | 基盤（横断） | seed / マスターデータ | — | 🔴 Must | 2nd |
| Unit 3 | 共有基盤 | 基盤（横断） | shared / app/providers | 全FR共通 | 🔴 Must | 3rd |
| Unit 4 | Cloud Functions | 基盤（横断） | functions（CF-01/02/03） | FR-01,02,05 | 🔴 Must | 4th |
| Unit 5 | 料理管理 | 機能（垂直） | features/recipe, onboarding | FR-00, FR-01 | � Must | 5th |
| Unit 6 | 献立提案 | 機能（垂直） | features/suggestion, confirmedMenu | FR-02 | 🔴 Must | 6th |
| Unit 7 | 献立ガチャ | 機能（垂直） | features/gacha | FR-05 | 🔴 Must | 7th |
| Unit 8 | AIキャラクター | 機能（垂直） | features/character, settings | FR-03, FR-06 | 🟡 Should | 8th |

---

## Unit 1: Firebase基盤 & 認証

**種別**: 基盤（横断）
**対応feature**: features/auth（LoginPage / SignUpPage / useAuth）+ app/providers/AuthProvider
**対応Firebaseサービス**: Firebase Authentication, Firestore, Cloud Storage, Hosting

### 責務
- Firebaseプロジェクト設定（`firebase.json`, プロジェクト初期化）
- Firebase Authentication セットアップ（メール+パスワード）
- Firestore Security Rules（`firestore.rules`）の定義
- Cloud Storage Security Rules（`storage.rules`）の定義
- Firestore インデックス定義（`firestore.indexes.json`）
- Hosting 設定
- features/auth: サインアップ・ログイン・ログアウト画面 + `useAuth` フック
- AuthProvider（認証状態管理・isPremium取得・初回判定）

### 対応ストーリー
- US-17（サインアップ・ログイン）、US-18（ログアウト）

### 成果物
- `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`
- features/auth（pages, components, hooks/useAuth.ts）
- app/providers/AuthProvider.tsx
- Firebase初期化（`shared/lib/firebase.ts` の雛形はUnit 3と連携）

---

## Unit 2: セットアップ／マスターデータ

**種別**: 基盤（横断・独立管理）
**配置**: 専用フォルダ（`setup/` または `scripts/seed/`）+ インストレーションガイド
**対応Firebaseサービス**: Firestore（Admin SDKで投入）

### 責務
- マスターデータ投入スクリプト（seed）
- インストレーションガイド（SETUP.md：Firebaseプロジェクト作成手順・seed実行手順・環境変数設定）
- 全マスターデータの管理（JSON等）
  - `characterDialogues`（7キャラ × トーン × トリガーのセリフ・Claude APIで事前生成）
  - `difficultyMaster`（easy/normal/hard の id, label, order）
  - `rarityMaster`（N/R/SR/SSR の id, label, order）
  - `gachaConfig`（レアリティ確率 N=60/R=25/SR=12/SSR=3）

### 対応ストーリー
- なし（全機能の前提となるマスターデータ基盤）

### 成果物
- `setup/SETUP.md`（インストレーションガイド）
- `setup/seed/`（投入スクリプト・Admin SDK使用）
- `setup/seed/data/`（マスターデータJSON：character-dialogues.json, difficulty-master.json, rarity-master.json, gacha-config.json）

### 補足
- アプリ実行コードとライフサイクルが異なるため独立管理
- マスターデータはSecurity Rules上は読み取り専用、投入はAdmin SDK（seed）でのみ実施

---

## Unit 3: 共有基盤

**種別**: 基盤（横断）
**対応feature**: shared / app/providers（AuthProvider除く）
**対応Firebaseサービス**: Firestore, Cloud Storage（SDKラッパー）

### 責務
- 汎用Firestoreプリミティブ（`shared/hooks/useCollection.ts` / `useDocument.ts`）
- マスターデータアクセサ（`shared/hooks/useMasterData.ts`）+ MasterDataProvider
- UI Element（`shared/components/ui/`：Button, Card, Modal, BottomSheet, LoadingSpinner）
- ライブラリ（`shared/lib/firebase.ts`, `functions.ts`, `storage.ts`）
- 共通型定義（`shared/types/index.ts`：Recipe, ConfirmedMenuItem, CharacterDialogue, 各union型）
- ルーティング（`app/routes.tsx`）・AppProvider
- CharacterBottomSheet/useCharacterDialogue の **インターフェース型定義**（実体はUnit 8）

### 対応ストーリー
- 全ストーリー共通の基盤（直接の主担当ストーリーなし）

### 成果物
- shared/hooks（useCollection, useDocument, useMasterData）
- shared/components/ui/
- shared/lib（firebase, functions, storage）
- shared/types/index.ts
- app/providers/MasterDataProvider.tsx, AppProvider.tsx
- app/routes.tsx, App.tsx

---

## Unit 4: Cloud Functions

**種別**: 基盤（横断）
**配置**: `functions/`
**対応Firebaseサービス**: Cloud Functions, Firestore（Admin SDK）, Secret Manager, Claude API

### 責務
- CF-01: analyzeRecipeImage（料理写真をClaude APIで認識）
- CF-02: suggestMeals（difficulty/duration フィルタ + ランダム3品。moodは予約・未使用）
- CF-03: spinGacha（gachaConfigから確率取得しレアリティ抽選）
- Secret Manager経由のClaude APIキー管理
- Callable Functionsの認証検証（request.auth）

### 対応ストーリー
- US-01（写真認識）、US-05（提案）、US-10/US-12（ガチャ抽選）のサーバーサイドロジック

### 成果物
- `functions/src/analyzeRecipeImage.ts`（CF-01）
- `functions/src/suggestMeals.ts`（CF-02）
- `functions/src/spinGacha.ts`（CF-03）
- `functions/package.json`, `functions/tsconfig.json`

---

## Unit 5: 料理管理

**種別**: 機能（垂直）
**対応feature**: features/recipe, features/onboarding
**対応FR**: FR-00（オンボーディング）, FR-01（料理登録）

### 責務
- 料理登録（写真→Cloud Storage直接アップロード→CF-01認識→Firestore保存）
- レパートリー一覧・詳細・編集・削除
- レパートリー件数取得
- オンボーディング（固定20件からの一括登録）
- `useRecipes`（useCollection<Recipe> を内部利用）、`useOnboarding`

### 対応ストーリー
- US-00（オンボーディング）、US-01（料理登録）、US-04（確認・編集）

### 成果物
- features/recipe（pages, components, hooks/useRecipes.ts）
- features/onboarding（pages, components, hooks/useOnboarding.ts, data/onboardingRecipes.ts）

### 横断依存
- 料理登録・オンボーディング完了時にキャラクター一言（recipe_registered）を表示 → Unit 8のキャラクターモジュールを利用

---

## Unit 6: 献立提案

**種別**: 機能（垂直）
**対応feature**: features/suggestion, features/confirmedMenu
**対応FR**: FR-02

### 責務
- 選択画面（レパートリー件数による分岐・ガチャ誘導）
- フィルタリング画面（difficulty/duration[number]選択。moodは未使用）
- CF-02呼び出し → 3品提案
- 献立確定（confirmedMenuItems へFirestore直接書き込み）
- 確定済み献立一覧・「つくったよ！」削除・件数による画面遷移
- `useSuggestion`, `useConfirmedMenu`（useCollection を内部利用）

### 対応ストーリー
- US-05（献立提案）、US-06（ガチャ誘導）、US-16（つくったよ！）

### 成果物
- features/suggestion（SelectionPage, FilteringPage, components, hooks/useSuggestion.ts）
- features/confirmedMenu（MenuListPage, components, hooks/useConfirmedMenu.ts）

### 横断依存
- 献立確定時・つくったよ！時にキャラクター一言（meal_decided / meal_completed / meal_suggested）を表示 → Unit 8
- レシピデータモデル（Unit 5）、CF-02（Unit 4）に依存

---

## Unit 7: 献立ガチャ

**種別**: 機能（垂直）
**対応feature**: features/gacha
**対応FR**: FR-05

### 責務
- ガチャ画面（シングル / 10連）
- CF-03呼び出し（レアリティ抽選）
- カプセルトイ演出（CSS/JSアニメーション）
- ガチャ結果確定（confirmedMenuItems へ書き込み。10連は追加/入れ替え選択）
- リセマラカウント管理（セッション内・5回目で堕落ルート）
- 堕落ルート画面（メシストフェレス固定・デリバリー誘導）
- `useGacha`（useCollection を内部利用）

### 対応ストーリー
- US-10（シングルガチャ）、US-11（リセマラ堕落ルート）、US-12（10連ガチャ）

### 成果物
- features/gacha（GachaPage, GachaSpinner, GachaResult, RerollLimitScreen, hooks/useGacha.ts）

### 横断依存
- ガチャ確定時にキャラクター一言（gacha_decided）、堕落ルート（gacha_reroll_limit）→ Unit 8
- CF-03（Unit 4）、レシピ（Unit 5）、確定済み献立（Unit 6）に依存

---

## Unit 8: AIキャラクター

**種別**: 機能（垂直・横断的に消費される）
**対応feature**: features/character, features/settings
**対応FR**: FR-03（今日の一言）, FR-06（依存度向上・課金）

### 責務
- キャラクター一言表示（CharacterBottomSheet / CharacterInline）
- `useCharacterDialogue`（trigger/from を受け取り、キャラ・トーンを内部決定 → characterDialogues から選択）
- isPremium に応じた台詞・推しキャラ絞り込み
- 設定画面（推しキャラ固定・プレミアム導線）
- `useSettings`（useDocument を内部利用）

### 対応ストーリー
- US-13（献立確定時の一言）、US-14（料理登録時の一言）、US-15（推しキャラ固定）
- US-11の堕落ルートセリフ（gacha_reroll_limit）

### 成果物
- features/character（CharacterBottomSheet, CharacterInline, hooks/useCharacterDialogue.ts）
- features/settings（SettingsPage, PremiumSettings, hooks/useSettings.ts）

### 横断依存
- characterDialogues マスターデータ（Unit 2）に依存
- Unit 5/6/7 から一言表示として呼ばれる（インターフェース型はUnit 3で先行定義）

---

## コード構成（モノレポ）

> フロントエンド `src/` 構成は Application Design で確定済み。本書はリポジトリ最上位を含む全体像を示す。

```
/
├── src/                           ← React アプリ（Unit 1 auth / Unit 3 shared / Unit 5-8 features）
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx             ← Unit 3
│   │   └── providers/
│   │       ├── AuthProvider.tsx       ← Unit 1
│   │       ├── MasterDataProvider.tsx ← Unit 3
│   │       └── AppProvider.tsx        ← Unit 3
│   ├── features/
│   │   ├── auth/                  ← Unit 1
│   │   ├── onboarding/            ← Unit 5
│   │   ├── recipe/                ← Unit 5
│   │   ├── suggestion/            ← Unit 6
│   │   ├── confirmedMenu/         ← Unit 6
│   │   ├── gacha/                 ← Unit 7
│   │   ├── character/             ← Unit 8
│   │   └── settings/              ← Unit 8
│   ├── shared/                    ← Unit 3
│   │   ├── components/ui/
│   │   ├── hooks/                 ← useCollection, useDocument, useMasterData
│   │   ├── lib/                   ← firebase, functions, storage
│   │   └── types/
│   └── assets/                    ← characters/, gacha/
│
├── functions/                     ← Unit 4: Cloud Functions
│   ├── src/
│   │   ├── analyzeRecipeImage.ts  ← CF-01
│   │   ├── suggestMeals.ts        ← CF-02
│   │   └── spinGacha.ts           ← CF-03
│   ├── package.json
│   └── tsconfig.json
│
├── setup/                         ← Unit 2: セットアップ／マスターデータ
│   ├── SETUP.md                   ← インストレーションガイド
│   └── seed/
│       ├── seed.ts                ← Admin SDK 投入スクリプト
│       └── data/
│           ├── character-dialogues.json
│           ├── difficulty-master.json
│           ├── rarity-master.json
│           └── gacha-config.json
│
├── firebase.json                  ← Unit 1
├── firestore.rules                ← Unit 1
├── storage.rules                  ← Unit 1
├── firestore.indexes.json         ← Unit 1
├── package.json                   ← フロントエンド（Vite + React + TS）
├── tsconfig.json
└── aidlc-docs/                    ← ドキュメント（コードではない）
```

### テスト方針

| テスト種別 | 対象 | ツール想定 | 方針 |
|---|---|---|---|
| FE 単体テスト | hooks（ドメイン層・プリミティブ層）/ utils | Vitest | ロジック検証。Firebase SDKはモック |
| FE 結合テスト | Feature Component（Container + View） | Vitest + React Testing Library | Firestore/Functionsをモック（エミュレータ or MSW相当） |
| Functions 単体テスト | CF-01/02/03のロジック | Vitest | Firestore/Claude APIをモック。PBT対象（CF-03抽選）はfast-check |
| E2E | フロントエンド全体 | Playwright | Firebase Emulator Suite 上でユーザーフロー検証 |

---

## ローカル開発環境

### Firebaseサービスのローカル代替（Firebase Emulator Suite）

| Firebaseサービス | ローカル代替 | 備考 |
|---|---|---|
| Firestore | Firestore Emulator | Security Rules含めて本番同等に検証可能 |
| Authentication | Auth Emulator | メール+パスワード認証をローカルで再現 |
| Cloud Functions | Functions Emulator | CF-01/02/03をローカル起動 |
| Cloud Storage | Storage Emulator | アップロード・Security Rules検証 |
| Hosting | Hosting Emulator | 静的配信のローカル確認 |

### モック戦略
- **Claude API（CF-01/CF-03のセリフ・認識）**: 環境変数 `CLAUDE_MOCK=true` で固定レスポンス返却（例: 認識結果 `{ name: "テスト料理", difficulty: "normal", duration: 15, rarity: "R" }`）
- **マスターデータ**: `setup/seed` をEmulatorに対して実行し、ローカルにマスター投入

### 環境変数

| 環境変数 | local | prod | 効果 |
|---|---|---|---|
| `VITE_FIREBASE_*` | Emulator向け設定 | 本番設定 | Firebase接続情報 |
| `CLAUDE_MOCK` | `true` | `false` | Claude APIをモック化 |
| `FIRESTORE_EMULATOR_HOST` | `localhost:8080` | （未設定） | Firestore Emulator接続 |

### ローカル開発フロー
```
1. firebase emulators:start        ← Firestore/Auth/Functions/Storage Emulator起動
2. npm run seed:local              ← setup/seed をEmulatorへ投入（マスターデータ）
3. npm run dev                     ← Vite開発サーバー起動（Emulator接続）
4. テスト実行
   ├── npm run test                ← 単体・結合（Vitest）
   └── npm run test:e2e            ← E2E（Playwright → Emulator）
```

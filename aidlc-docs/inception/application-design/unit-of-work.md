# ユニット定義

## ユニット構成（6ユニット）

| # | ユニット名 | 種別 | 対応ドメイン | 対応FR | 優先度 | 実装順序 |
|---|---|---|---|---|---|---|
| Unit 0 | 認証基盤 | バックエンド | 認証 | — | 🔴 Must | 1st |
| Unit 1 | 料理管理 | バックエンド | 料理管理 | FR-00, FR-01 | 🔴 Must | 2nd |
| Unit 2 | 献立提案 | バックエンド | 献立提案 | FR-02 | 🔴 Must | 3rd |
| Unit 3 | 献立ガチャ | バックエンド | ガチャ | FR-05 | 🔴 Must | 4th |
| Unit 4 | AIキャラクター | バックエンド | キャラクター | FR-03, FR-06 | 🟡 Should | 5th |
| Unit 5 | フロントエンド | フロントエンド | 全ドメイン | 全FR | 🔴 Must | 6th（BE完成後） |

---

## Unit 0: 認証基盤

**種別**: バックエンド
**対応Lambda**: BE-05: AuthLambda
**所有テーブル**: Users（DynamoDB）
**対応AWSサービス**: Amazon Cognito, DynamoDB

### 責務
- Cognito User Pool のセットアップ
- Post Confirmation トリガー（ユーザープロファイル初期化）
- getUserProfile API（GET /users/me）
- Amplify Auth 設定（フロントエンド連携用）

### 成果物
- Cognito User Pool 設定
- AuthLambda（postConfirmation + getUserProfile）
- DynamoDB Users テーブル定義
- Amplify Auth 設定ファイル

---

## Unit 1: 料理管理

**種別**: バックエンド
**対応Lambda**: BE-01: RecipeManagementLambda
**所有テーブル**: Recipes（DynamoDB）
**対応AWSサービス**: API Gateway, Lambda, DynamoDB, S3, Amazon Bedrock

### 責務
- 料理登録API（写真→S3→Bedrock認識→DynamoDB保存）
- レパートリー一覧・検索API（条件付きクエリ）
- レシピIDリスト取得API（条件付きクエリ・IDのみ返却。BE-03からの軽量呼び出し用）
- 料理更新・削除API
- レパートリー件数取得API
- オンボーディング一括登録API

### 成果物
- RecipeManagementLambda（5エンドポイント）
- DynamoDB Recipes テーブル定義
- S3 バケット設定（料理写真）
- Bedrock 連携（マルチモーダル写真認識）
- API Gateway 設定（/recipes）

---

## Unit 2: 献立提案

**種別**: バックエンド
**対応Lambda**: BE-02: MenuSuggestionLambda
**所有テーブル**: ConfirmedMenuItems（DynamoDB）
**対応AWSサービス**: API Gateway, Lambda, DynamoDB

### 責務
- 献立提案API（フィルタリング→3品ランダム選択）
- 献立確定API（ConfirmedMenuItems保存）
- 確定済み献立取得API
- 「つくったよ！」API（確定済み献立削除）
- BE-01（RecipeManagementLambda）の内部呼び出し

### 成果物
- MenuSuggestionLambda（4エンドポイント）
- DynamoDB ConfirmedMenuItems テーブル定義
- API Gateway 設定（/menu-suggestions, /confirmed-menu-items）

---

## Unit 3: 献立ガチャ

**種別**: バックエンド
**対応Lambda**: BE-03: GachaLambda
**所有テーブル**: GachaResults（※TODO: 将来追加）
**対応AWSサービス**: API Gateway, Lambda

### 責務
- ガチャ実行API（POST /gacha, count指定）
- BE-02 呼び出し（確定済み献立の除外）
- BE-01 呼び出し（レシピIDリスト取得・軽量API使用）
- レアリティ抽選ロジック（N:60%/R:25%/SR:12%/SSR:3%）
- 排出率は環境変数で管理（デプロイ時に変更可能）
- count 最大数バリデーション

### 成果物
- GachaLambda（1エンドポイント）
- API Gateway 設定（/gacha）
- レアリティ抽選ロジック

---

## Unit 4: AIキャラクター

**種別**: バックエンド
**対応Lambda**: BE-04: CharacterLambda
**所有テーブル**: CharacterDialogues（DynamoDB・マスターテーブル）
**対応AWSサービス**: API Gateway, Lambda, DynamoDB, Amazon Bedrock

### 責務
- キャラクター台詞取得API（POST /character-dialogues）
- trigger/from/isPremium に基づくキャラクター・トーン内部決定
- マスターテーブルからのランダム返却（5トリガー対応）
- Bedrock リアルタイム生成（gacha_reroll_limit）
- isPremium に応じた推しキャラ絞り込み
- isPremium に応じたキャラクター×トーンの追加組み合わせ解放（非プレミアムは基本組み合わせのみ）
- マスターデータ投入スクリプト（Bedrock で手動生成したセリフを DynamoDB に投入）

### 成果物
- CharacterLambda（1エンドポイント）
- DynamoDB CharacterDialogues テーブル定義
- API Gateway 設定（/character-dialogues）
- Bedrock 連携（リアルタイム生成）
- マスターデータ投入スクリプト
- マスターデータ（7キャラクター × トーン × トリガー × 10種類以上のセリフ）

---

## Unit 5: フロントエンド

**種別**: フロントエンド
**対応feature**: 全feature（auth / onboarding / home / suggestion / gacha / recipe / confirmedMenuItem / settings）+ shared
**対応AWSサービス**: AWS Amplify Hosting

### 責務
- React + TypeScript アプリケーション全体
- 全 feature の Page / Widget / Feature Component / UI Element
- shared/ 配下の共通コンポーネント（必要になったタイミングで作成）
- ルーティング・ナビゲーション
- API クライアント（shared/api/client）
- 認証状態管理（AuthContext）
- 確定済み献立状態管理（ConfirmedMenuItemContext）

### 成果物
- React アプリケーション（全 feature）
- shared/ 共通コンポーネント群
- ルーティング設定
- Amplify Hosting デプロイ設定

### 実装方針
- バックエンド API が完成した後にまとめて実装
- shared/ は各 feature で必要になったタイミングで作成（重複が出たら shared/ に移動）
- 4階層コンポーネントモデル（Page / Widget / Feature Component / UI Element）に従う
- Container / Presentational 分離を全 Feature Component で適用

---

## コード構成（モノレポ）

```
/
├── frontend/                      ← React アプリ（Unit 5）
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── onboarding/
│   │   │   ├── home/
│   │   │   ├── suggestion/
│   │   │   ├── gacha/
│   │   │   ├── recipe/
│   │   │   ├── confirmedMenuItem/
│   │   │   └── settings/
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── CharacterBottomSheet/
│   │       │   ├── BottomNavigation/
│   │       │   └── ui/
│   │       ├── hooks/
│   │       ├── api/
│   │       ├── contexts/
│   │       ├── types/
│   │       └── constants/
│   ├── tests/                     ← フロントエンド単体・結合テスト
│   │   ├── unit/                  ← 単体テスト（Hook・ユーティリティ）
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── integration/           ← 結合テスト（Feature Component + API モック）
│   │       ├── auth/
│   │       ├── onboarding/
│   │       ├── suggestion/
│   │       ├── gacha/
│   │       ├── recipe/
│   │       ├── confirmedMenuItem/
│   │       └── settings/
│   ├── package.json
│   └── tsconfig.json
│
├── e2e/                           ← E2Eテスト（フロントエンドのみ）
│   ├── tests/
│   │   ├── auth.spec.ts           ← サインアップ・ログイン・ログアウト
│   │   ├── onboarding.spec.ts     ← 初回オンボーディングフロー
│   │   ├── suggestion.spec.ts     ← 献立提案フロー（選択→フィルタ→確定）
│   │   ├── gacha.spec.ts          ← ガチャフロー（シングル・10連・堕落ルート）
│   │   ├── recipe.spec.ts         ← 料理登録・一覧・編集・削除
│   │   ├── confirmedMenuItem.spec.ts ← 献立リスト・つくったよ！
│   │   └── settings.spec.ts       ← 設定・推しキャラ
│   ├── fixtures/                  ← テストデータ・モックレスポンス
│   ├── support/                   ← ヘルパー・カスタムコマンド
│   ├── playwright.config.ts       ← E2Eテスト設定（Playwright想定）
│   └── package.json
│
├── backend/                       ← Lambda 群（Unit 0〜4）
│   ├── auth/                      ← Unit 0: BE-05
│   │   ├── src/
│   │   ├── tests/
│   │   │   ├── unit/             ← 単体テスト（services / repositories）
│   │   │   └── integration/      ← 結合テスト（handler + DynamoDB Local）
│   │   └── package.json
│   ├── recipe/                    ← Unit 1: BE-01
│   │   ├── src/
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   └── package.json
│   ├── suggestion/                ← Unit 2: BE-02
│   │   ├── src/
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   └── package.json
│   ├── gacha/                     ← Unit 3: BE-03
│   │   ├── src/
│   │   ├── tests/
│   │   │   ├── unit/             ← PBT適用対象（レアリティ抽選ロジック）
│   │   │   └── integration/
│   │   └── package.json
│   └── character/                 ← Unit 4: BE-04
│       ├── src/
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       └── package.json
│
├── infra/                         ← IaC（CDK / SAM / Terraform）
│   ├── lib/
│   └── package.json
│
└── aidlc-docs/                    ← ドキュメント（コードではない）
```

### 各バックエンドユニットの内部構造

```
backend/{unit-name}/
├── src/
│   ├── handlers/          ← Lambda ハンドラー（エントリーポイント）
│   ├── services/          ← ビジネスロジック
│   ├── repositories/      ← DynamoDB アクセス
│   ├── clients/           ← 外部サービス呼び出し（Bedrock / S3 / 他Lambda）
│   ├── types/             ← 型定義
│   └── utils/             ← ユーティリティ
├── tests/
│   ├── unit/              ← 単体テスト
│   │   ├── services/      ← ビジネスロジックのテスト（モック使用）
│   │   ├── repositories/  ← リポジトリのテスト（DynamoDB Local）
│   │   └── utils/         ← ユーティリティのテスト
│   └── integration/       ← 結合テスト
│       └── handlers/      ← ハンドラー経由のエンドツーエンド（外部依存はモック）
├── package.json
└── tsconfig.json
```

### テスト方針

| テスト種別 | 対象 | ツール想定 | 方針 |
|---|---|---|---|
| **BE 単体テスト** | services / repositories / utils | Vitest | 外部依存はモック。PBT対象（ガチャ抽選等）はfast-checkで実施 |
| **BE 結合テスト** | handlers（Lambda全体） | Vitest + DynamoDB Local | ハンドラー経由でリクエスト→レスポンスを検証。他Lambdaはモック |
| **FE 単体テスト** | hooks / utils | Vitest | ロジックのみ検証。UIは含まない |
| **FE 結合テスト** | Feature Component（Container + View） | Vitest + React Testing Library | APIモック（MSW）でコンポーネント単位の動作を検証 |
| **E2Eテスト** | フロントエンド全体 | Playwright | ブラウザ上でユーザーフロー全体を検証。バックエンドは実環境 or モックサーバー |

---

## ローカル開発環境

### AWSサービスのローカル代替

| AWSサービス | ローカル代替 | 再現度 | 備考 |
|---|---|---|---|
| DynamoDB | DynamoDB Local（Docker） | ◎ 高い | テーブル定義・クエリが本番同等 |
| S3 | LocalStack（Docker） | ◎ 高い | PutObject / GetObject が動作 |
| Cognito | モック（ローカルモード） | △ 限定的 | JWT検証スキップ・固定userId使用 |
| API Gateway + Lambda | SAM Local（sam local start-api） | ○ 中程度 | Lambda をローカル起動・ホットリロード |
| Bedrock | モック（固定レスポンス返却） | △ 限定的 | 写真認識・セリフ生成は固定値で代替 |

### 設計方針: 依存注入（DI）パターン

AWSクライアントを差し替え可能にし、ローカル/テスト/本番で接続先を切り替える。

```typescript
// 例: backend/{unit}/src/repositories/recipeRepository.ts
export const createRecipeRepository = (dynamoClient: DynamoDBDocumentClient) => ({
  getRecipes: async (userId: string) => { /* ... */ },
  putRecipe: async (recipe: Recipe) => { /* ... */ },
});
```

- テスト時: DynamoDB Local のクライアントを注入
- 本番時: 実 AWS クライアントを注入
- Bedrock / S3 も同様にクライアントを注入可能にする

### 環境変数によるモード切り替え

| 環境変数 | local | dev / prod | 効果 |
|---|---|---|---|
| `STAGE` | `local` | `dev` / `prod` | 全体のモード切り替え |
| `DYNAMODB_ENDPOINT` | `http://localhost:8000` | （未設定=AWS実環境） | DynamoDB 接続先 |
| `S3_ENDPOINT` | `http://localhost:4566` | （未設定=AWS実環境） | S3 接続先 |
| `BEDROCK_MOCK` | `true` | `false` | Bedrock をモック化（固定レスポンス返却） |
| `COGNITO_MOCK` | `true` | `false` | 認証検証をスキップ（userId直接取得） |
| `GACHA_RATE_N` | `60` | `60` | ガチャ排出率 N（%） |
| `GACHA_RATE_R` | `25` | `25` | ガチャ排出率 R（%） |
| `GACHA_RATE_SR` | `12` | `12` | ガチャ排出率 SR（%） |
| `GACHA_RATE_SSR` | `3` | `3` | ガチャ排出率 SSR（%） |
| `GACHA_MAX_COUNT` | `10` | `10` | ガチャ最大回数 |

### Docker Compose（ローカルインフラ）

```yaml
# docker-compose.yml
services:
  dynamodb-local:
    image: amazon/dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb"

  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3
      - DEFAULT_REGION=ap-northeast-1
```

### モック戦略

**Bedrock モック（BEDROCK_MOCK=true 時）**:
- 写真認識（BE-01）: 固定の認識結果を返却（`{ recipeName: "テスト料理", difficulty: "ふつう", duration: 15, rarity: "R" }`）
- セリフ生成（BE-04 gacha_reroll_limit）: 固定のメシストフェレスセリフを返却
- ローカルでは AI の品質検証はしない（本番環境でのみ確認）

**Cognito モック（COGNITO_MOCK=true 時）**:
- `Authorization` ヘッダーから userId を直接取得（JWT検証スキップ）
- テスト用の固定ユーザー（`userId: "test-user-001"`）を DynamoDB Local に事前投入
- フロントエンドは Amplify Auth のモックモードを使用

**フロントエンド（バックエンド未完成時）**:
- MSW（Mock Service Worker）で API レスポンスをモック
- バックエンド未完成でもフロントエンド単独開発が可能

### ローカル開発フロー

```
開発者のマシン
  |
  +--(1) docker compose up           ← DynamoDB Local + LocalStack(S3) 起動
  |
  +--(2) npm run seed:local           ← テーブル作成 + テストデータ投入
  |       （Users / Recipes / ConfirmedMenuItems / CharacterDialogues）
  |
  +--(3) sam local start-api          ← Lambda群をローカル起動（ホットリロード）
  |       環境変数: STAGE=local, DYNAMODB_ENDPOINT=http://localhost:8000,
  |                 S3_ENDPOINT=http://localhost:4566,
  |                 BEDROCK_MOCK=true, COGNITO_MOCK=true
  |
  +--(4) cd frontend && npm run dev   ← Vite 開発サーバー起動
  |       環境変数: VITE_API_BASE_URL=http://localhost:3001
  |
  +--(5) テスト実行
          ├── npm run test:unit        ← 単体テスト（Vitest・外部依存モック）
          ├── npm run test:integration ← 結合テスト（DynamoDB Local使用）
          └── npm run test:e2e         ← E2E（Playwright → localhost）
```

### テストデータ投入スクリプト（seed:local）

ローカル開発・テスト用に以下のデータを自動投入するスクリプトを用意する:

| テーブル | 投入データ |
|---|---|
| Users | テストユーザー（isPremium: false / true の2パターン） |
| Recipes | オンボーディング20件 + 追加テスト料理10件 |
| ConfirmedMenuItems | テスト用確定済み献立（0件 / 1件 / 5件パターン） |
| CharacterDialogues | 全キャラクター × トーン × トリガーのマスターデータ（最小セット） |

### ディレクトリ構成（ローカル開発関連ファイル）

```
/
├── docker-compose.yml             ← ローカルインフラ定義
├── scripts/
│   ├── seed-local.ts              ← テーブル作成 + テストデータ投入
│   ├── create-tables.ts           ← DynamoDB テーブル作成
│   └── fixtures/                  ← テストデータ（JSON）
│       ├── users.json
│       ├── recipes.json
│       ├── confirmed-menu-items.json
│       └── character-dialogues.json
└── ...
```

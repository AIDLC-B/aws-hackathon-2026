# Application Design — 統合ドキュメント

## 設計方針サマリー

| 項目 | 決定内容 |
|---|---|
| バックエンド構成 | ドメインごとに独立したAPI Gateway + Lambda |
| フロントエンド状態管理 | React Context + useReducer |
| DB設計 | ドメインごとにテーブル分割（Users/Recipes/ConfirmedMenuItems/CharacterDialogues） |
| 画像アップロード | フロントエンド → Lambda → S3 → Bedrock（同期型） |
| キャラクター一言 | ハイブリッド（頻繁トリガー=キャッシュ、特殊トリガー=リアルタイム） |
| 認証トークン管理 | Amplify Auth（Cognitoベストプラクティス） |
| ガチャ抽選 | フロントエンドで実行（N:60%/R:25%/SR:12%/SSR:3%） |
| リセマラカウント | フロントエンドのメモリ（セッション内） |

---

## 命名規則（確定）

| 概念 | 命名 | 備考 |
|---|---|---|
| 確定済み献立 | `ConfirmedMenuItem` | 複数形: `ConfirmedMenuItems` |
| 料理レパートリー | `Recipe` | 複数形: `Recipes` |
| キャラクター台詞 | `CharacterDialogue` | 複数形: `CharacterDialogues` |
| ユーザー | `User` | 複数形: `Users` |

---

## システム全体構成

```
[ユーザー（スマートフォンブラウザ）]
    |
[React + TypeScript（AWS Amplify Hosting）]
    |
    +--[Amplify Auth]---> [Amazon Cognito]
    |                           |
    |                     [BE-05: AuthLambda]
    |                           |
    |                     [DynamoDB: Users]
    |
    +---> [API Gateway: /recipes]                ---> [BE-01: RecipeManagementLambda]
    |                                                       |---> [S3: 料理写真]
    |                                                       |---> [Bedrock: 写真認識]
    |                                                       |---> [DynamoDB: Recipes]
    |
    +---> [API Gateway: /menu-suggestions        ---> [BE-02: MenuSuggestionLambda]
    |              /confirmed-menu-items]                   |---> [BE-01（内部呼び出し）]
    |                                                       |---> [DynamoDB: ConfirmedMenuItems]
    |
    +---> [API Gateway: /gacha]                  ---> [BE-03: GachaLambda]
    |                                                       |---> [BE-02（内部呼び出し）: 確定済み献立除外]
    |                                                       |---> [BE-01（内部呼び出し）: レシピ取得]
    |                                                       ※ガチャ確定時はフロントエンドがBE-02を直接呼び出す
    |
    +---> [API Gateway: /character-dialogues]    ---> [BE-04: CharacterLambda]
                                                            |---> [DynamoDB: CharacterDialogues（キャッシュ）]
                                                            |---> [Bedrock: リアルタイム生成]
```

---

## フロントエンドアーキテクチャ

**採用パターン**: Feature-Sliced Design（FSD）的な構成

```
src/
  features/
    auth/                          ← 認証機能一式
      components/                  ← LoginForm, SignupForm, ConfirmCodeForm
      hooks/                       ← useAuth
      api/                         ← authApi（Amplify Auth呼び出し）
    onboarding/                    ← 初回オンボーディング
      components/                  ← OnboardingList, RecipeCheckItem
      hooks/                       ← useOnboarding
      api/                         ← onboardingApi
    home/                          ← トップ画面分岐
      components/                  ← HomeRouter
      hooks/                       ← useHomeState
    suggestion/                    ← 献立提案フロー
      components/                  ← SelectionScreen, FilteringScreen, SuggestionCards
      hooks/                       ← useSuggestion, useFiltering
      api/                         ← menuSuggestionApi
    gacha/                         ← ガチャ
      components/                  ← GachaScreen, GachaResult, DeliveryRoute
      hooks/                       ← useGacha, useRerollCount
      api/                         ← gachaApi（GachaLambda呼び出し）
                                      confirmedMenuItemApi（ガチャ確定時にBE-02を直接呼び出し）
    recipe/                        ← 料理管理
      components/                  ← RecipeForm, RecipeList, RecipeDetail, RecipeEditForm
      hooks/                       ← useRecipe
      api/                         ← recipeApi
    confirmedMenuItem/             ← 確定済み献立管理
      components/                  ← ConfirmedMenuItemList, ConfirmedMenuItemDetail
      hooks/                       ← useConfirmedMenuItem
      api/                         ← confirmedMenuItemApi
    settings/                      ← 設定
      components/                  ← SettingsScreen, CharacterSelector
      hooks/                       ← useSettings
  shared/
    components/
      CharacterBottomSheet/        ← 全画面共通ボトムシート（4箇所で使用）
      BottomNavigation/            ← タブバー
      LoadingSpinner/
      ConfirmDialog/
    hooks/
      useCharacterDialogue/        ← キャラクター台詞取得（全featureで使用）
    api/
      client/                      ← 共通APIクライアント（認証ヘッダー・エラーハンドリング）
    contexts/
      AuthContext/                 ← 認証状態（全featureで参照）
      ConfirmedMenuItemContext/    ← 確定済み献立状態（HomeRouterで参照）
    types/                         ← 共通型定義（Recipe, ConfirmedMenuItem, CharacterDialogue等）
    constants/                     ← 定数（レアリティ確率、オンボーディングリスト等）
```

**設計方針**:
- 各featureは独立して動作し、他featureに直接依存しない
- feature間の共有ロジック・UIは`shared/`に集約
- `CharacterBottomSheet`は`shared/components/`で共通化（suggestion/gacha/recipe/confirmedMenuItemの4箇所で使用）
- APIクライアントは`shared/api/client/`で共通化（認証ヘッダー付与・エラーハンドリング・リトライ）
- 重複コードは`shared/`で吸収し、feature内の重複は許容

---

## バックエンドコンポーネント一覧

| ID | Lambda | APIパス | 主な責務 |
|---|---|---|---|
| BE-01 | RecipeManagementLambda | /recipes | 料理CRUD・検索API提供 |
| BE-02 | MenuSuggestionLambda | /menu-suggestions, /confirmed-menu-items | 献立提案・確定済み献立管理 |
| BE-03 | GachaLambda | /gacha | ガチャ実行（確定はフロントエンドがBE-02を直接呼び出す） |
| BE-04 | CharacterLambda | /character-dialogues | 台詞生成（キャッシュ/リアルタイム） |
| BE-05 | AuthLambda | Cognitoトリガー | ユーザー初期化 |

---

## DynamoDBテーブル構成

**原則**: ドメイン間のDB直接アクセスは禁止。各ドメインが自分のテーブルを所有し、他ドメインのデータが必要な場合はAPIリクエストで取得する。

| テーブル | 所有ドメイン | PK | SK | 主な属性 |
|---|---|---|---|---|
| Users | 認証 | userId | — | nickname, isPremium, isOnboarded |
| Recipes | 料理管理 | userId | recipeId | name, difficulty, duration, rarity, imageUrl, ingredients, steps, memo |
| ConfirmedMenuItems | 献立提案 | userId | confirmedMenuItemId | recipeId, confirmedAt |
| GachaResults | ガチャ | userId | gachaResultId | recipeId, rarity, spunAt | ※TODO: 将来追加 |
| CharacterDialogues | キャラクター | characterId | dialogueId | tone, trigger, line, isCache |

---

## キャラクタードメインIF設計（確定）

呼び出し元が渡す情報：

| パラメータ | 内容 |
|---|---|
| trigger | イベント種別（meal_decided / meal_completed / recipe_registered / gacha_reroll_limit） |
| from | 画面遷移元（suggestion / gacha / gacha_10 / detail / list / registration） |
| isPremium | プレミアムフラグ（推しキャラ絞り込みに使用） |

キャラクタードメイン内部で決定するもの（呼び出し元から渡さない）：
- キャラクターID
- トーン
- 台詞

---

## 詳細ドキュメント参照

- コンポーネント詳細: `components.md`
- メソッド定義: `component-methods.md`
- サービス層・通信フロー: `services.md`
- 依存関係・データフロー: `component-dependency.md`

# Application Design — 統合ドキュメント

## 設計方針サマリー

| 項目 | 決定内容 |
|---|---|
| バックエンド構成 | ドメインごとに独立したAPI Gateway + Lambda |
| フロントエンド状態管理 | React Context + useReducer |
| DB設計 | ドメインごとにテーブル分割（Users/Recipes/ConfirmedMenuItems/CharacterDialogues） |
| 画像アップロード | フロントエンド → Lambda → S3 → Bedrock（同期型） |
| キャラクター一言 | ハイブリッド（頻繁トリガー=DynamoDBマスター参照、特殊トリガー=リアルタイム）。マスターデータはBedrockで手動生成 |
| 認証トークン管理 | Amplify Auth（Cognitoベストプラクティス） |
| ガチャ抽選 | BE-03（GachaLambda）で実行（N:60%/R:25%/SR:12%/SSR:3%） |
| リセマラカウント | フロントエンドのメモリ（セッション内）※抽選ロジック自体はBE-03 |

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
    |                           |---> Cognitoトリガー: ユーザー初期化
    |                           |---> GET /users/me: プロファイル取得
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
                                                            |---> [DynamoDB: CharacterDialogues（マスター）]
                                                            |---> [Bedrock: リアルタイム生成]
```

---

## フロントエンドアーキテクチャ

**採用パターン**: Feature-Sliced Design（FSD）的な構成 + 4階層コンポーネントモデル

### コンポーネント階層

| 階層 | 役割 | 粒度 |
|---|---|---|
| **Page** | ルート単位の画面 | 1画面 |
| **Widget** | 画面内の意味的ブロック | 複数要素の塊 |
| **Feature Component** | 特定機能の再利用可能単位・ロジックを持つ | 1機能 |
| **UI Element** | 汎用パーツ・ロジックを持たない | 最小 |

詳細は `components.md` の「コンポーネント設計指針」を参照。

### ディレクトリ構造

```
src/
  features/
    auth/                          ← 認証機能一式
      pages/                       ← LoginPage, SignupPage, ConfirmCodePage
      components/                  ← LoginForm, SignupForm, ConfirmCodeForm
      hooks/                       ← useAuth
      api/                         ← authApi（Amplify Auth呼び出し）
    onboarding/                    ← 初回オンボーディング
      pages/                       ← OnboardingPage
      widgets/                     ← OnboardingHeader, OnboardingFooter
      components/                  ← OnboardingList, RecipeCheckItem
      hooks/                       ← useOnboarding
      api/                         ← onboardingApi
    home/                          ← トップ画面分岐
      pages/                       ← HomePage
      components/                  ← HomeRouter
      hooks/                       ← useHomeState
    suggestion/                    ← 献立提案フロー
      pages/                       ← SelectionPage, FilteringPage, SuggestionResultPage
      widgets/                     ← CharacterSection, SuggestionCardList
      components/                  ← MoodSelector, DurationSelector, DifficultySelector, SuggestionCard
      hooks/                       ← useSuggestion, useFiltering
      api/                         ← menuSuggestionApi
    gacha/                         ← ガチャ
      pages/                       ← GachaPage, GachaResultPage, DeliveryRoutePage
      widgets/                     ← GachaCapsuleSection, GachaResultList
      components/                  ← GachaCapsule, GachaResultCard, GachaConfirmDialog
      hooks/                       ← useGacha, useRerollCount
      api/                         ← gachaApi（POST /gacha, count指定）
                                      confirmedMenuItemApi（ガチャ確定時にBE-02を直接呼び出し）
    recipe/                        ← 料理管理
      pages/                       ← RecipeRegistrationPage, RecipeListPage, RecipeDetailPage, RecipeEditPage
      widgets/                     ← RecipeListHeader, RecipeDetailHeader
      components/                  ← RecipeForm, RecipeEditForm, RecipeListItem, RecipeDetailView, PhotoUploadField
      hooks/                       ← useRecipe
      api/                         ← recipeApi
    confirmedMenuItem/             ← 確定済み献立管理
      pages/                       ← ConfirmedMenuItemListPage, ConfirmedMenuItemDetailPage
      components/                  ← ConfirmedMenuItemList, ConfirmedMenuItemListItem, CompleteButton
      hooks/                       ← useConfirmedMenuItem
      api/                         ← confirmedMenuItemApi
    settings/                      ← 設定
      pages/                       ← SettingsPage, CharacterSelectorPage
      widgets/                     ← ProfileHeader, PremiumSection
      components/                  ← CharacterSelector, LogoutButton
      hooks/                       ← useSettings
  shared/
    components/
      CharacterBottomSheet/        ← 全画面共通ボトムシート（5箇所で使用）
      BottomNavigation/            ← タブバー
      ui/                          ← UI Element群（Button, Input, Select, LoadingSpinner, ConfirmDialog 等）
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

### Container / Presentational の分離

すべての Feature Component で分離する（テスタビリティ重視）：

```
features/recipe/components/RecipeForm/
├── RecipeForm.tsx              ← Container（Hook を呼び、ロジックを持つ）
├── RecipeFormView.tsx          ← Presentational（propsだけ受け取り描画）
├── RecipeForm.types.ts         ← 型定義
└── index.ts                    ← 公開インターフェース
```

**設計方針**:
- 各featureは独立して動作し、他featureに直接依存しない
- feature間の共有ロジック・UIは`shared/`に集約
- `CharacterBottomSheet`は`shared/components/`で共通化（suggestion/gacha/recipe/confirmedMenuItem/onboardingの5箇所で使用）
- APIクライアントは`shared/api/client/`で共通化（認証ヘッダー付与・エラーハンドリング・リトライ）
- 重複コードは`shared/`で吸収し、feature内の重複は許容
- **上位→下位の単方向依存**: Page は Widget / Feature Component / UI Element を import するが逆は禁止
- **ビジネスロジックは Hook に隔離**: UI コンポーネントは presentation のみ担当

---

## バックエンドコンポーネント一覧

| ID | Lambda | APIパス | 主な責務 |
|---|---|---|---|
| BE-01 | RecipeManagementLambda | /recipes | 料理CRUD・検索API提供 |
| BE-02 | MenuSuggestionLambda | /menu-suggestions, /confirmed-menu-items | 献立提案・確定済み献立管理 |
| BE-03 | GachaLambda | /gacha | ガチャ実行（確定はフロントエンドがBE-02を直接呼び出す）。count入力で件数指定 |
| BE-04 | CharacterLambda | /character-dialogues | 台詞生成（マスター参照/リアルタイム） |
| BE-05 | AuthLambda | Cognitoトリガー, /users/me | ユーザー初期化・プロファイル取得 |

---

## DynamoDBテーブル構成

**原則**: ドメイン間のDB直接アクセスは禁止。各ドメインが自分のテーブルを所有し、他ドメインのデータが必要な場合はAPIリクエストで取得する。

| テーブル | 所有ドメイン | PK | SK | 主な属性 |
|---|---|---|---|---|
| Users | 認証 | userId | — | nickname, isPremium, isOnboarded |
| Recipes | 料理管理 | userId | recipeId | name, difficulty, duration, rarity, imageUrl, ingredients, steps, memo |
| ConfirmedMenuItems | 献立提案 | userId | confirmedMenuItemId | recipeId, confirmedAt |
| GachaResults | ガチャ | userId | gachaResultId | recipeId, rarity, spunAt | ※TODO: 将来追加 |
| CharacterDialogues | キャラクター（マスター） | characterId | dialogueId | tone, trigger, line |

---

## キャラクタードメインIF設計（確定）

呼び出し元が渡す情報：

| パラメータ | 内容 |
|---|---|
| trigger | イベント種別（meal_decided / gacha_decided / recipe_registered / gacha_reroll_limit / meal_suggested / meal_completed） |
| from | 画面遷移元（suggestion / gacha / gacha_10 / detail / list / registration / onboarding） |
| isPremium | プレミアムフラグ（推しキャラ絞り込みに使用）※DynamoDB Usersテーブルから取得・Cognitoには保持しない |

キャラクタードメイン内部で決定するもの（呼び出し元から渡さない）：
- キャラクターID
- トーン
- 台詞

### trigger × トーン × キャラクター 組み合わせ定義

| trigger | トーン | 対応キャラクター | 表示方式 |
|---|---|---|---|
| `meal_decided` | 褒める | サボ母ちゃん、サボわらし | ボトムシート |
| `meal_decided` | 共感・脱力 | ニャマケ、サボット | ボトムシート |
| `gacha_decided` | 褒める | サボ母ちゃん、サボわらし | ボトムシート |
| `gacha_decided` | 叱咤激励 | サボエル、サボ母ちゃん | ボトムシート |
| `recipe_registered` | 褒める | サボ母ちゃん、サボわらし、サボエル、サボット | ボトムシート（from: registration=個別登録 / onboarding=一括登録完了時に1回） |
| `gacha_reroll_limit` | 誘惑・煽り | メシストフェレス（固定） | 専用画面（堕落ルート） |
| `meal_suggested` | 共感・脱力 | ニャマケ、サボット | インライン（フィルタリング画面内） |
| `meal_suggested` | 叱咤激励 | サボエル、サボ母ちゃん | インライン（フィルタリング画面内） |
| `meal_suggested` | 叱責 | シェフレイ、メシストフェレス | インライン（フィルタリング画面内） |
| `meal_completed` | 褒める | サボ母ちゃん、サボわらし、ニャマケ、サボエル | ボトムシート |

### キャラクター × トーン 全体マッピング

| キャラクター | 叱咤激励 | 叱責 | 褒める | 共感・脱力 | 誘惑・煽り |
|---|---|---|---|---|---|
| サボエル | ✅ | — | ✅ | — | — |
| サボ母ちゃん | ✅ | — | ✅ | — | — |
| ニャマケ | — | — | ✅ | ✅ | — |
| シェフレイ | — | ✅ | — | — | — |
| メシストフェレス | — | ✅ | — | — | ✅ |
| サボット | — | — | ✅ | ✅ | — |
| サボわらし | — | — | ✅ | — | — |

### 表示方式まとめ

| trigger | 表示方式 | 理由 |
|---|---|---|
| `meal_decided` | ボトムシート | 確定アクション後の演出 |
| `gacha_decided` | ボトムシート | 確定アクション後の演出 |
| `recipe_registered` | ボトムシート | 登録完了後の演出 |
| `gacha_reroll_limit` | 専用画面（堕落ルート画面） | デリバリーリンク表示が必要 |
| `meal_suggested` | インライン（フィルタリング画面内） | 画面遷移を伴わない・質問文言として表示 |
| `meal_completed` | ボトムシート | 「つくったよ！」後の演出 |

---

## 詳細ドキュメント参照

- コンポーネント詳細: `components.md`
- メソッド定義: `component-methods.md`
- サービス層・通信フロー: `services.md`
- 依存関係・データフロー: `component-dependency.md`

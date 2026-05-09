# コンポーネント定義

## フロントエンドコンポーネント

**アーキテクチャ**: Feature-Sliced Design（FSD）的な構成
各featureは独立。共通ロジック・UIは`shared/`に集約。

---

## コンポーネント設計指針

### 4階層モデル

```
Page（画面）
  ↓ 配置
Widget（画面内ブロック）
  ↓ 組み合わせ
Feature Component（機能単位）
  ↓ 構成
UI Element（汎用パーツ）
```

| 階層 | 役割 | 粒度 | 例 |
|---|---|---|---|
| **Page** | ルート単位の画面 | 1画面 | `OnboardingPage` / `SelectionPage` / `GachaPage` |
| **Widget** | 画面内の意味的ブロック | 複数要素の塊 | `CharacterSection`（キャラ画像+セリフ）/ `RecipeCard` |
| **Feature Component** | 特定機能の再利用可能単位・ロジックを持つ | 1機能 | `RecipeForm` / `GachaCapsule` / `CharacterBottomSheet` |
| **UI Element** | 汎用パーツ・ロジックを持たない | 最小 | `Button` / `Input` / `Select` / `LoadingSpinner` |

### 粒度の決め方

| 分割基準 | 該当する階層 |
|---|---|
| 画面遷移の単位 | Page |
| 独立した意味を持つ画面内ブロック | Widget |
| 再利用される機能・ビジネスロジックを持つ | Feature Component |
| ロジックを持たない純粋な見た目 | UI Element |

**Form単位で切るのではなく、機能・責務単位で切る**
- `RecipeForm` は Feature Component（ロジック含む）
- 内部の `RecipeNameInput` などは UI Element の組合せ

### 結合・疎結合の方針

**3つの原則**:
1. **上位→下位の単方向依存**: Page は Widget / Feature Component / UI Element を import するが、逆は禁止
2. **兄弟コンポーネント同士は直接通信しない**: 親経由 or Context 経由で連携
3. **ビジネスロジックは Hook に隔離**: UI コンポーネントは presentation のみ担当

**データフロー**:
```
Page (useXxx hook で状態を保持)
  │ props で渡す
  ↓
Widget / Feature Component (状態を受け取る・イベントを親に通知)
  │ props で渡す
  ↓
UI Element (見た目のみ・onChange を親に通知)
```

**Context の使用範囲**:
- グローバルに近い状態（`AuthContext`・`ConfirmedMenuItemContext`）のみ Context
- feature 内の状態は Hook + props で渡す（Context は濫用しない）

### Container / Presentational の分離

**すべての Feature Component で分離する**（テスタビリティ重視）。

```
features/recipe/components/RecipeForm/
├── RecipeForm.tsx              ← Container（Hook を呼び、ロジックを持つ）
├── RecipeFormView.tsx          ← Presentational（propsだけ受け取り描画）
├── RecipeForm.types.ts         ← 型定義
└── index.ts                    ← 公開インターフェース
```

- **Container**: API 呼び出し・バリデーション・状態管理・Hook の使用
- **Presentational**: JSX のみ、単体テストしやすい・Storybook化しやすい

### 依存方向の厳格化（FSD の原則）

```
features/  ← 他の features を import しない
  ↑
shared/    ← すべての features から import 可能
```

feature 間で機能を共有したい場合：
- UI なら `shared/components/` に移動
- Hook なら `shared/hooks/` に移動
- feature 同士の直接依存は禁止（循環依存を防ぐ）

### ディレクトリ構造（feature 内）

```
features/{featureName}/
├── pages/              ← Page（画面コンポーネント）
├── widgets/            ← Widget（画面内ブロック）
├── components/         ← Feature Component（機能単位）
│   └── {ComponentName}/
│       ├── {ComponentName}.tsx          ← Container
│       ├── {ComponentName}View.tsx      ← Presentational
│       ├── {ComponentName}.types.ts
│       └── index.ts
├── hooks/              ← ビジネスロジック
├── api/                ← API 呼び出し
└── types/              ← feature 内で閉じた型
```

UI Element は `shared/components/ui/` に集約する。

---

## features/auth

- **目的**: Cognito認証・セッション管理
- **Page**: LoginPage, SignupPage, ConfirmCodePage
- **Widget**: （なし）
- **Feature Component**: LoginForm, SignupForm, ConfirmCodeForm
- **hooks**: useAuth（ログイン・ログアウト・サインアップ状態管理）
- **api**: authApi（Amplify Auth呼び出し）
- **責務**:
  - サインアップ・ログイン・ログアウト処理
  - Amplify Authによるトークン管理
  - 認証状態をAuthContext（shared）に提供
  - 未認証時のリダイレクト制御

---

## features/onboarding

- **目的**: 初回起動時のレパートリー初期設定
- **Page**: OnboardingPage
- **Widget**: OnboardingHeader（サボ母ちゃんのアイコンと歓迎セリフ）, OnboardingFooter（「はじめる！」ボタン+件数表示）
- **Feature Component**: OnboardingList, RecipeCheckItem
- **hooks**: useOnboarding（選択状態・件数管理）
- **api**: onboardingApi（料理管理APIへの一括登録）
- **責務**:
  - 初回フラグの確認・管理（isOnboarded）
  - 20件の固定料理リスト表示（shared/constants）
  - バナナの強制選択状態管理
  - 選択件数のリアルタイム表示
  - 一括登録完了時にshared/useCharacterDialogueで台詞取得（trigger=recipe_registered, from=onboarding）してボトムシート表示（1回のみ発火）

---

## features/home

- **目的**: トップ画面の状態管理と画面分岐
- **Page**: HomePage（HomeRouterのラッパー）
- **Widget**: （なし）
- **Feature Component**: HomeRouter（条件分岐で子Pageを表示）
- **hooks**: useHomeState（献立件数取得・分岐判定）
- **責務**:
  - ConfirmedMenuItemContext（shared）から献立確定状態を取得
  - 0件→選択画面 / 1件→レシピ詳細 / 2件以上→献立リストへ分岐
  - レパートリー件数チェック（10件未満判定）

---

## features/suggestion

- **目的**: 献立提案フロー（フィルタリング→3品提案→確定）
- **Page**: SelectionPage, FilteringPage, SuggestionResultPage
- **Widget**: CharacterSection（フィルタリング画面のキャラインライン表示）, SuggestionCardList（3品カード表示）
- **Feature Component**: MoodSelector, DurationSelector, DifficultySelector, SuggestionCard
- **hooks**: useSuggestion, useFiltering
- **api**: menuSuggestionApi（MenuSuggestionLambda呼び出し）
- **責務**:
  - 選択画面（考えたくない / 運に任せる）
  - フィルタリング画面（デフォルト: 楽したい/15分以内/かんたん）
  - 3品提案結果の表示・選択
  - 献立確定処理 → ConfirmedMenuItemContext更新
  - shared/useCharacterDialogueで台詞取得
    - meal_suggested: フィルタリング画面にインライン表示（CharacterSection Widget）
    - meal_decided: 献立確定後にボトムシート表示（CharacterBottomSheet）

---

## features/gacha

- **目的**: ガチャ演出・結果表示・リセマラ管理
- **Page**: GachaPage, GachaResultPage, DeliveryRoutePage
- **Widget**: GachaCapsuleSection（カプセルトイアニメーション）, GachaResultList（10連結果リスト）
- **Feature Component**: GachaCapsule, GachaResultCard, GachaConfirmDialog
- **hooks**: useGacha, useRerollCount（セッション内カウント管理）
- **api**:
  - gachaApi（GachaLambda呼び出し: POST /gacha, count指定）
  - confirmedMenuItemApi（ガチャ確定時にBE-02: MenuSuggestionLambdaを直接呼び出し）
- **責務**:
  - カプセルトイアニメーション制御
  - セッション内リセマラカウント管理（メモリ）
  - 堕落ルート発動判定（5回でメシストフェレス）
  - 10連ガチャの追加/入れ替え選択ダイアログ
  - ガチャ確定時はフロントエンドからBE-02（MenuSuggestionLambda）を直接呼び出す
  - shared/useCharacterDialogueでボトムシート表示（trigger=gacha_decided）

---

## features/recipe

- **目的**: 料理登録・レパートリー一覧・詳細・編集
- **Page**: RecipeRegistrationPage, RecipeListPage, RecipeDetailPage, RecipeEditPage
- **Widget**: RecipeListHeader（登録ボタン配置）, RecipeDetailHeader（編集・つくったよ！ボタン配置）
- **Feature Component**: RecipeForm, RecipeEditForm, RecipeListItem, RecipeDetailView, PhotoUploadField
- **hooks**: useRecipe
- **api**: recipeApi（RecipeManagementLambda呼び出し）
- **責務**:
  - 写真アップロード（Lambda経由・同期型）
  - AI認識結果の確認・編集フォーム
  - バリデーション（料理名・頻度・難易度・所要時間は必須）
  - レパートリー一覧・詳細・編集・削除
  - shared/useCharacterDialogueでボトムシート表示（登録完了時、trigger=recipe_registered, from=registration）

---

## features/confirmedMenuItem

- **目的**: 確定済み献立リスト・詳細表示・つくったよ！
- **Page**: ConfirmedMenuItemListPage, ConfirmedMenuItemDetailPage
- **Widget**: （なし）
- **Feature Component**: ConfirmedMenuItemList, ConfirmedMenuItemListItem, CompleteButton
- **hooks**: useConfirmedMenuItem
- **api**: confirmedMenuItemApi（MenuSuggestionLambda呼び出し）
- **責務**:
  - 確定済み献立リスト表示（10連ガチャ後など）
  - 「つくったよ！」ボタン処理 → ConfirmedMenuItemContext更新
  - 削除後の件数に応じた自動遷移
  - shared/useCharacterDialogueでボトムシート表示（trigger=meal_completed）

---

## features/settings

- **目的**: 設定画面
- **Page**: SettingsPage, CharacterSelectorPage
- **Widget**: ProfileHeader（ニックネーム表示）, PremiumSection（推しキャラ設定メニュー）
- **Feature Component**: CharacterSelector, LogoutButton
- **hooks**: useSettings
- **責務**:
  - ニックネーム表示
  - 推しキャラ設定（isPremiumフラグ確認・キャッチコピー表示）
  - ログアウト処理

---

## shared コンポーネント

### shared/components/CharacterBottomSheet（Feature Component）
- **目的**: 全画面共通のキャラクターボトムシート
- **使用箇所**: suggestion（献立確定）/ gacha（ガチャ確定）/ recipe（登録完了）/ confirmedMenuItem（つくったよ！）/ onboarding（一括登録完了）
- **責務**:
  - ボトムシートのスライドアップアニメーション
  - キャラクター画像・名前・台詞の表示
  - 5秒自動クローズタイマー管理
  - 「閉じる」ボタン

### shared/components/BottomNavigation（Widget）
- **目的**: 全画面共通のタブバー
- **責務**: ホーム / レシピ / 設定 のタブ切り替え

### shared/components/ui/*（UI Element）
- 汎用パーツを集約
- 例: Button, Input, Select, NumberInput, Checkbox, LoadingSpinner, ConfirmDialog, ValidationMessage, ImagePreview
- ロジックを持たず、props のみで動作

### shared/hooks/useCharacterDialogue
- **目的**: キャラクター台詞取得の共通フック
- **責務**: trigger/from/isPremiumをCharacterLambdaに送信して台詞を取得
- **対応trigger**: meal_decided / gacha_decided / recipe_registered / meal_suggested / meal_completed / gacha_reroll_limit

### shared/api/client
- **目的**: 共通APIクライアント
- **責務**: 認証ヘッダー付与（Amplify Auth）・エラーハンドリング・リトライ

### shared/contexts/AuthContext
- **目的**: 認証状態の全体共有
- **責務**: userId・nickname・isPremium・isOnboardedを全featureに提供（isPremiumはDynamoDB Usersテーブルから取得・Cognitoには保持しない）

### shared/contexts/ConfirmedMenuItemContext
- **目的**: 確定済み献立状態の全体共有
- **責務**: 確定済み献立件数をHomeRouterに提供

---

## バックエンドコンポーネント（Lambda）

### BE-01: RecipeManagementLambda
- **目的**: 料理管理ドメインのAPIエンドポイント群
- **所有テーブル**: Recipes
- **責務**:
  - 料理登録（写真→S3→Bedrock認識→DynamoDB保存）
  - レパートリー一覧・検索（条件付きクエリ）
  - 料理更新・削除
  - レパートリー件数取得

### BE-02: MenuSuggestionLambda
- **目的**: 献立提案ドメインのAPIエンドポイント群
- **所有テーブル**: ConfirmedMenuItems
- **責務**:
  - フィルタリング条件を受け取り料理管理APIを呼び出して絞り込み
  - 3品ランダム選択
  - 献立確定・保存（ConfirmedMenuItemsテーブルへ）
  - 確定済み献立の取得・削除(つくったよ！）
  - ガチャ確定時のフロントエンドからの直接呼び出しにも対応

### BE-03: GachaLambda
- **目的**: ガチャドメインのAPIエンドポイント群
- **所有テーブル**: GachaResults（※TODO: 将来追加。現時点では未実装）
- **責務**:
  - ガチャ実行時にBE-02を呼び出して確定済み献立を除外
  - BE-01を呼び出してレシピリストを取得
  - レアリティ抽選（N:60%/R:25%/SR:12%/SSR:3%）を実施
  - 抽選済みの結果（recipe + rarity）をフロントエンドに返却
  - ガチャ確定処理はフロントエンドが担当（BE-03は関与しない）

### BE-04: CharacterLambda
- **目的**: キャラクタードメインのAPIエンドポイント
- **所有テーブル**: CharacterDialogues
- **責務**:
  - trigger/from/isPremiumを受け取りキャラクター・トーンを内部決定
  - マスターテーブル（CharacterDialogues）からのランダム返却（頻繁トリガー）
  - Bedrock呼び出しによるリアルタイム生成（特殊トリガー）
  - isPremiumフラグに応じた推しキャラ絞り込み

### BE-05: AuthLambda
- **目的**: Cognito連携の補助処理
- **所有テーブル**: Users
- **責務**:
  - Cognitoトリガー（Post Confirmation等）
  - ユーザープロファイル初期化（DynamoDB）
  - ログイン成功後のユーザー情報取得（isPremium・nickname・isOnboarded）をフロントエンドに提供

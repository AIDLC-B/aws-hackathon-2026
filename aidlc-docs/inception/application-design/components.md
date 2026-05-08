# コンポーネント定義

## フロントエンドコンポーネント

**アーキテクチャ**: Feature-Sliced Design（FSD）的な構成
各featureは独立。共通ロジック・UIは`shared/`に集約。

---

### features/auth
- **目的**: Cognito認証・セッション管理
- **components**: LoginForm, SignupForm, ConfirmCodeForm
- **hooks**: useAuth（ログイン・ログアウト・サインアップ状態管理）
- **api**: authApi（Amplify Auth呼び出し）
- **責務**:
  - サインアップ・ログイン・ログアウト処理
  - Amplify Authによるトークン管理
  - 認証状態をAuthContext（shared）に提供
  - 未認証時のリダイレクト制御

---

### features/onboarding
- **目的**: 初回起動時のレパートリー初期設定
- **components**: OnboardingList, RecipeCheckItem
- **hooks**: useOnboarding（選択状態・件数管理）
- **api**: onboardingApi（料理管理APIへの一括登録）
- **責務**:
  - 初回フラグの確認・管理（isOnboarded）
  - 20件の固定料理リスト表示（shared/constants）
  - バナナの強制選択状態管理
  - 選択件数のリアルタイム表示

---

### features/home
- **目的**: トップ画面の状態管理と画面分岐
- **components**: HomeRouter
- **hooks**: useHomeState（献立件数取得・分岐判定）
- **責務**:
  - ConfirmedMenuItemContext（shared）から献立確定状態を取得
  - 0件→選択画面 / 1件→レシピ詳細 / 2件以上→献立リストへ分岐
  - レパートリー件数チェック（10件未満判定）

---

### features/suggestion
- **目的**: 献立提案フロー（フィルタリング→3品提案→確定）
- **components**: SelectionScreen, FilteringScreen, SuggestionCards
- **hooks**: useSuggestion, useFiltering
- **api**: menuSuggestionApi（MenuSuggestionLambda呼び出し）
- **責務**:
  - 選択画面（考えたくない / 運に任せる）
  - フィルタリング画面（デフォルト: 楽したい/15分以内/かんたん）
  - 3品提案結果の表示・選択
  - 献立確定処理 → ConfirmedMenuItemContext更新
  - shared/useCharacterDialogueでボトムシート表示

---

### features/gacha
- **目的**: ガチャ演出・結果表示・リセマラ管理
- **components**: GachaScreen, GachaResult, GachaConfirmDialog, DeliveryRoute
- **hooks**: useGacha, useRerollCount（セッション内カウント管理）
- **api**: gachaApi（GachaLambda呼び出し）
- **責務**:
  - カプセルトイアニメーション制御
  - レアリティ抽選ロジック（N:60%/R:25%/SR:12%/SSR:3%）
  - セッション内リセマラカウント管理（メモリ）
  - 堕落ルート発動判定（5回でメシストフェレス）
  - 10連ガチャの追加/入れ替え選択ダイアログ
  - ガチャ確定時はフロントエンドからBE-02（MenuSuggestionLambda）を直接呼び出す
  - shared/useCharacterDialogueでボトムシート表示

---

### features/recipe
- **目的**: 料理登録・レパートリー一覧・詳細・編集
- **components**: RecipeForm, RecipeList, RecipeDetail, RecipeEditForm
- **hooks**: useRecipe
- **api**: recipeApi（RecipeManagementLambda呼び出し）
- **責務**:
  - 写真アップロード（Lambda経由・同期型）
  - AI認識結果の確認・編集フォーム
  - バリデーション（料理名・頻度・難易度・所要時間は必須）
  - レパートリー一覧・詳細・編集・削除
  - shared/useCharacterDialogueでボトムシート表示（登録完了時）

---

### features/confirmedMenuItem
- **目的**: 確定済み献立リスト・詳細表示・つくったよ！
- **components**: ConfirmedMenuItemList, ConfirmedMenuItemDetail
- **hooks**: useConfirmedMenuItem
- **api**: confirmedMenuItemApi（MenuSuggestionLambda呼び出し）
- **責務**:
  - 確定済み献立リスト表示（10連ガチャ後など）
  - 「つくったよ！」ボタン処理 → ConfirmedMenuItemContext更新
  - 削除後の件数に応じた自動遷移
  - shared/useCharacterDialogueでボトムシート表示

---

### features/settings
- **目的**: 設定画面
- **components**: SettingsScreen, CharacterSelector
- **hooks**: useSettings
- **責務**:
  - ニックネーム表示
  - 推しキャラ設定（isPremiumフラグ確認・キャッチコピー表示）
  - ログアウト処理

---

## shared コンポーネント

### shared/components/CharacterBottomSheet
- **目的**: 全画面共通のキャラクターボトムシート
- **使用箇所**: suggestion（献立確定）/ gacha（ガチャ確定）/ recipe（登録完了）/ confirmedMenuItem（つくったよ！）
- **責務**:
  - ボトムシートのスライドアップアニメーション
  - キャラクター画像・名前・台詞の表示
  - 5秒自動クローズタイマー管理
  - 「閉じる」ボタン

### shared/hooks/useCharacterDialogue
- **目的**: キャラクター台詞取得の共通フック
- **責務**: trigger/fromをCharacterLambdaに送信して台詞を取得

### shared/api/client
- **目的**: 共通APIクライアント
- **責務**: 認証ヘッダー付与（Amplify Auth）・エラーハンドリング・リトライ

### shared/contexts/AuthContext
- **目的**: 認証状態の全体共有
- **責務**: userId・nickname・isPremium・isOnboardedを全featureに提供

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
  - 確定済み献立の取得・削除（つくったよ！）
  - ガチャ確定時のフロントエンドからの直接呼び出しにも対応

### BE-03: GachaLambda
- **目的**: ガチャドメインのAPIエンドポイント群
- **所有テーブル**: GachaResults（※TODO: 将来追加。現時点では未実装）
- **責務**:
  - ガチャ実行時にBE-02を呼び出して確定済み献立を除外
  - BE-01を呼び出してレシピリストを取得
  - SR以上確定保証ロジック（10連ガチャ）
  - ガチャ確定処理はフロントエンドが担当（BE-03は関与しない）

### BE-04: CharacterLambda
- **目的**: キャラクタードメインのAPIエンドポイント
- **所有テーブル**: CharacterDialogues
- **責務**:
  - trigger/fromを受け取りキャラクター・トーンを内部決定
  - キャッシュ済み台詞のランダム返却（頻繁トリガー）
  - Bedrock呼び出しによるリアルタイム生成（特殊トリガー）
  - isPremiumフラグに応じた推しキャラ絞り込み

### BE-05: AuthLambda
- **目的**: Cognito連携の補助処理
- **所有テーブル**: Users
- **責務**:
  - Cognitoトリガー（Post Confirmation等）
  - ユーザープロファイル初期化（DynamoDB）

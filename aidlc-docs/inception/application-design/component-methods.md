# コンポーネントメソッド定義

※詳細なビジネスロジックはConstruction PhaseのFunctional Designで定義する

---

## BE-01: RecipeManagementLambda

| メソッド | HTTPメソッド | パス | 入力 | 出力 |
|---|---|---|---|---|
| registerRecipe | POST | /recipes | userId, imageBase64?, recipeName?, difficulty, duration, rarity | recipe |
| getRecipes | GET | /recipes | userId, difficulty?, duration?, rarity?, limit? | recipe[] |
| getRecipeIds | GET | /recipes/ids | userId, difficulty?, duration?, rarity? | recipeId[] |
| getRecipeCount | GET | /recipes/count | userId | count |
| updateRecipe | PUT | /recipes/{recipeId} | userId, recipeName?, difficulty?, duration?, rarity?, ingredients?, steps?, memo? | recipe |
| deleteRecipe | DELETE | /recipes/{recipeId} | userId | success |

---

## BE-02: MenuSuggestionLambda

| メソッド | HTTPメソッド | パス | 入力 | 出力 |
|---|---|---|---|---|
| suggestMenus | POST | /menu-suggestions | userId, mood, duration, difficulty | recipe[3] |
| confirmMenuItem | POST | /confirmed-menu-items | userId, recipeId | confirmedMenuItem |
| getConfirmedMenuItems | GET | /confirmed-menu-items | userId | confirmedMenuItem[] |
| completeMenuItem | DELETE | /confirmed-menu-items/{confirmedMenuItemId} | userId | remainingCount |

**所有テーブル**: ConfirmedMenuItems

---

## BE-03: GachaLambda

| メソッド | HTTPメソッド | パス | 入力 | 出力 |
|---|---|---|---|---|
| spinGacha | POST | /gacha | userId, count | { recipe, rarity }[] |

**所有テーブル**: GachaResults（※TODO: 将来追加。現時点では未実装）

**入力パラメータ**:
- `count`: ガチャ回数（1=シングル、10=10連）。Lambda側で最大数バリデーションを実施

**ドメイン間通信（ガチャ実行時のみ）**:
- BE-02（MenuSuggestionLambda）の`getConfirmedMenuItems`を呼び出して確定済み献立を取得し、BE-03側でrecipeIdを抽出して除外対象として使用
- BE-01（RecipeManagementLambda）の`getRecipeIds`を呼び出してレシピIDリストを取得（軽量API・大量レシピ対応）
- BE-03内でレアリティ抽選（排出率は環境変数で管理: デフォルト N:60%/R:25%/SR:12%/SSR:3%）を実施
- 抽選済みの結果（recipe + rarity）をフロントエンドに返却

**ガチャ確定はフロントエンドが担当**:
- ユーザーがガチャ結果から献立を選択・確定する処理はフロントエンドで行う
- 確定後はフロントエンドがBE-02（MenuSuggestionLambda）の`confirmMenuItem`を直接呼び出す
- ガチャ確定時にBE-03は関与しない

---

## BE-04: CharacterLambda

| メソッド | HTTPメソッド | パス | 入力 | 出力 |
|---|---|---|---|---|
| getCharacterDialogue | POST | /character-dialogues | userId, trigger, from, isPremium | characterId, characterName, line, imageKey |

**所有テーブル**: CharacterDialogues

**マスターテーブル参照戦略**:
- マスター参照対象トリガー: `meal_decided`, `gacha_decided`, `recipe_registered`, `meal_suggested`, `meal_completed`
  - キャラクター×トーン×トリガーごとに10種類以上のセリフをCharacterDialoguesマスターテーブルに事前格納（Bedrockで手動生成）
  - ランダムで1件返却
- リアルタイム対象トリガー: `gacha_reroll_limit`（メシストフェレス固定・Bedrock生成）

---

## BE-05: AuthLambda

| メソッド | トリガー/HTTPメソッド | パス/処理 | 入力 | 出力 |
|---|---|---|---|---|
| postConfirmation | Cognito Post Confirmation | — | — | DynamoDBにユーザープロファイル初期化（userId, nickname, isPremium: false） |
| getUserProfile | GET | /users/me | userId（Cognitoトークンから取得） | { userId, nickname, isPremium, isOnboarded } |

**所有テーブル**: Users

**認証セッション方針**:
- Cognitoの認証期間は1か月に設定
- ログイン時にgetUserProfileを呼び出してAuthContextにセット
- 1か月ごとの再認証時にisPremiumフラグが最新化される

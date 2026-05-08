# コンポーネントメソッド定義

※詳細なビジネスロジックはConstruction PhaseのFunctional Designで定義する

---

## BE-01: RecipeManagementLambda

| メソッド | HTTPメソッド | パス | 入力 | 出力 |
|---|---|---|---|---|
| registerRecipe | POST | /recipes | userId, imageBase64?, recipeName?, difficulty, duration, rarity | recipe |
| getRecipes | GET | /recipes | userId, difficulty?, duration?, rarity?, limit? | recipe[] |
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
| spinGacha | POST | /gacha/single | userId | recipe[], rarityMap |
| spinGacha10 | POST | /gacha/ten | userId | recipe[10], rarityList |

**所有テーブル**: GachaResults（※TODO: 将来追加。現時点では未実装）

**ドメイン間通信（ガチャ実行時のみ）**:
- BE-02（MenuSuggestionLambda）を呼び出して確定済み献立のrecipeIdを取得し、除外対象として使用
- BE-01（RecipeManagementLambda）を呼び出してレシピリストを取得
- 確定済み献立を除外したレシピリストをフロントエンドに返却

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

**キャッシュ戦略**:
- キャッシュ対象トリガー: `meal_decided`, `meal_completed`, `recipe_registered`
  - キャラクター×トーンごとに10種類以上のセリフをCharacterDialoguesテーブルに事前格納
  - ランダムで1件返却
- リアルタイム対象トリガー: `gacha_reroll_limit`（メシストフェレス固定・Bedrock生成）

---

## BE-05: AuthLambda

| メソッド | トリガー | 処理 |
|---|---|---|
| postConfirmation | Cognito Post Confirmation | DynamoDBにユーザープロファイル初期化（userId, nickname, isPremium: false） |

**所有テーブル**: Users

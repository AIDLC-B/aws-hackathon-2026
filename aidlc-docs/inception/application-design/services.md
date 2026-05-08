# サービス層定義

## アーキテクチャ概要

ドメインごとに独立したAPI Gateway + Lambdaを持つ構成。
フロントエンドが結合レイヤーとして各ドメインAPIを直接呼び出す。

**原則**: ドメイン間のDB直接アクセスは禁止。他ドメインのデータが必要な場合はAPIリクエストで取得する。

```
[React Frontend]
    |
    +---> [API Gateway: /recipes]              --> [BE-01: RecipeManagementLambda]
    |
    +---> [API Gateway: /menu-suggestions      --> [BE-02: MenuSuggestionLambda]
    |              /confirmed-menu-items]
    |
    +---> [API Gateway: /gacha]                --> [BE-03: GachaLambda]
    |
    +---> [API Gateway: /character-dialogues]  --> [BE-04: CharacterLambda]
    |
    +---> [Cognito]                            --> [BE-05: AuthLambda（Trigger）]
```

---

## サービス間通信

### 献立提案 → 料理管理
- MenuSuggestionLambdaはRecipeManagementLambdaのAPIを内部呼び出し
- フィルタリング条件（mood/duration/difficulty）を渡してレシピリストを取得
- 確定済み献立のrecipeIdを除外してから3品選択
- 確定済み献立はConfirmedMenuItemsテーブル（献立提案ドメイン所有）に保存

### ガチャ → 料理管理・献立提案（ガチャ実行時）
- GachaLambdaはBE-02（MenuSuggestionLambda）のAPIを呼び出して確定済み献立のrecipeIdを取得
- 確定済み献立を除外した上で、BE-01（RecipeManagementLambda）のAPIを呼び出してレシピリストを取得
- SR以上確定保証ロジックを適用してフロントエンドに返却

### ガチャ確定（フロントエンドが担当）
- ユーザーがガチャ結果から献立を選択・確定する処理はフロントエンドで行う
- 確定後はフロントエンドがBE-02（MenuSuggestionLambda）の`/confirmed-menu-items`を直接呼び出す
- ガチャ確定時にBE-03（GachaLambda）は関与しない

### フロントエンド → キャラクター
- trigger/fromのみ渡す（キャラクター・トーンは内部決定）
- isPremiumフラグはCognitoトークンから取得してリクエストに含める

---

## DynamoDBテーブル構成（ドメイン所有原則）

| テーブル | 所有ドメイン | PK | SK | 主な属性 |
|---|---|---|---|---|
| Users | 認証 | userId | — | nickname, isPremium, isOnboarded |
| Recipes | 料理管理 | userId | recipeId | name, difficulty, duration, rarity, imageUrl, ingredients, steps, memo |
| ConfirmedMenuItems | 献立提案 | userId | confirmedMenuItemId | recipeId, confirmedAt |
| GachaResults | ガチャ | userId | gachaResultId | recipeId, rarity, spunAt | ※TODO: 将来追加 |
| CharacterDialogues | キャラクター | characterId | dialogueId | tone, trigger, line, isCache |

**設計方針**:
- 全リクエストにuserIdを含める（Cognitoトークンから検証）
- 各ドメインは自分が所有するテーブルのみアクセス可能
- 他ドメインのデータが必要な場合は必ずAPIリクエストで取得

---

## 認証フロー

```
[Frontend: Amplify Auth]
    |
    +---> サインアップ → Cognito User Pool
    |         |
    |         +---> メール確認コード送信
    |         +---> 確認後 → Post Confirmation Trigger
    |                           → BE-05: DynamoDBにユーザー初期化
    |
    +---> ログイン → Cognito → JWTトークン取得
    |         |
    |         +---> Amplify Authがlocalに管理
    |
    +---> 各APIリクエスト → Authorizationヘッダーにトークン付与
              |
              +---> API Gateway → Cognito Authorizer → Lambda
```

---

## キャラクター台詞キャッシュ戦略

```
【キャッシュ対象（頻繁トリガー）】
trigger: meal_decided / meal_completed / recipe_registered

  CharacterLambda
      |
      +---> DynamoDB: CharacterDialoguesテーブルを検索
      |     （characterId × tone × trigger でフィルタ）
      +---> ランダムで1件返却（10種類以上から選択）

【リアルタイム対象（特殊トリガー）】
trigger: gacha_reroll_limit

  CharacterLambda
      |
      +---> Bedrock呼び出し（メシストフェレス固定）
      +---> 生成されたセリフを返却
```

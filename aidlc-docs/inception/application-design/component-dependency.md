# コンポーネント依存関係

**原則**: ドメイン間のDB直接アクセスは禁止。他ドメインのデータが必要な場合はAPIリクエストで取得する。

---

## 依存関係マトリクス

| 呼び出し元 | 呼び出し先 | 通信方式 | 用途 |
|---|---|---|---|
| features/home | BE-02 MenuSuggestionLambda | REST API | 確定済み献立件数取得 |
| features/suggestion | BE-02 MenuSuggestionLambda | REST API | 献立提案・確定 |
| features/suggestion | BE-01 RecipeManagementLambda | REST API | レパートリー件数確認 |
| features/gacha | BE-03 GachaLambda | REST API | ガチャ実行・確定 |
| shared/useCharacterDialogue | BE-04 CharacterLambda | REST API | キャラクター台詞取得 |
| features/recipe | BE-01 RecipeManagementLambda | REST API | 料理登録・一覧・編集・削除 |
| features/confirmedMenuItem | BE-02 MenuSuggestionLambda | REST API | 確定済み献立一覧・つくったよ！ |
| features/settings | Cognito（Amplify Auth） | SDK | ログアウト |
| features/auth | BE-05 AuthLambda | REST API | ログイン後のユーザー情報取得（isPremium等） |
| BE-02 MenuSuggestionLambda | BE-01 RecipeManagementLambda | 内部API呼び出し | フィルタリング・レシピ取得 |
| BE-03 GachaLambda | BE-01 RecipeManagementLambda | 内部API呼び出し | ガチャ対象レシピ取得 |
| BE-03 GachaLambda | BE-02 MenuSuggestionLambda | 内部API呼び出し | 確定済み献立の除外（ガチャ実行時） |
| BE-04 CharacterLambda | Amazon Bedrock | AWS SDK | リアルタイム台詞生成 |
| BE-04 CharacterLambda | DynamoDB（CharacterDialogues） | AWS SDK | マスター台詞取得 |
| BE-01 RecipeManagementLambda | Amazon Bedrock | AWS SDK | 料理写真認識 |
| BE-01 RecipeManagementLambda | Amazon S3 | AWS SDK | 写真保存 |
| BE-05 AuthLambda | DynamoDB（Users） | AWS SDK | ユーザー初期化 |

---

## データフロー図

### 料理登録フロー
```
features/recipe
  |
  +--(1) 写真 + 料理情報 --> BE-01: RecipeManagementLambda
                              |
                              +--(2) 写真 --> S3
                              +--(3) 写真URL --> Bedrock（認識）
                              +--(4) 認識結果 --> DynamoDB（Recipes）※BE-01所有
                              |
                              <--(5) 登録済みレシピ--
  |
  +--(6) trigger=recipe_registered --> BE-04: CharacterLambda
                                          |
                                          +--(7) マスター検索 --> DynamoDB（CharacterDialogues）※BE-04所有
                                          <--(8) キャラクター・台詞--
  |
  <--(9) ボトムシート表示--
```

### 献立提案フロー
```
features/suggestion
  |
  +--(1) フィルタリング条件 --> BE-02: MenuSuggestionLambda
                                  |
                                  +--(2) 条件付きクエリ --> BE-01（API呼び出し）
                                  |                          |
                                  |                          +--> DynamoDB（Recipes）※BE-01所有
                                  |                          <-- レシピリスト--
                                  +--(3) 確定済み除外 --> DynamoDB（ConfirmedMenuItems）※BE-02所有
                                  +--(4) 3品ランダム選択
                                  <--(5) 3品返却--
  |
  +--(6) 1品選択・確定 --> BE-02: MenuSuggestionLambda
                              |
                              +--(7) 保存 --> DynamoDB（ConfirmedMenuItems）※BE-02所有
                              <--(8) confirmedMenuItemId--
  |
  +--(9) trigger=meal_decided --> BE-04: CharacterLambda
  <--(10) キャラクター・台詞--
```

### ガチャフロー
```
features/gacha
  |
  +--(1) ガチャ実行リクエスト（count指定） --> BE-03: GachaLambda
                                    |
                                    +--(2) 確定済み献立取得 --> BE-02（API呼び出し）
                                    |                            +--> DynamoDB（ConfirmedMenuItems）※BE-02所有
                                    |                            <-- 確定済みrecipeId一覧--
                                    +--(3) 全レシピ取得 --> BE-01（API呼び出し）
                                    |                        +--> DynamoDB（Recipes）※BE-01所有
                                    |                        <-- レシピリスト--
                                    +--(4) 確定済み献立を除外
                                    +--(5) レアリティ抽選（N:60%/R:25%/SR:12%/SSR:3%）
                                    +--(6) 抽選結果（recipe + rarity）を返却
  |
  <--(7) 抽選済みガチャ結果返却--
  |
  +--(8) 結果表示・ユーザーが確定を選択
  |
  +--(9) 確定済み献立登録 --> BE-02: MenuSuggestionLambda（フロントエンドから直接呼び出し）
  |                               ※ガチャドメイン（BE-03）は確定処理に無関係
  |                               +--> DynamoDB（ConfirmedMenuItems）※BE-02所有
  |
  +--(10) trigger=gacha_decided (from=gacha or gacha_10) --> BE-04: CharacterLambda
  <--(11) キャラクター・台詞--
```

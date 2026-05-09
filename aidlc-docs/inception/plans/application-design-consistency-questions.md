# Application Design — 整合性確認質問

全5ファイルの整合性チェックを実施した結果、以下の点を確認させてください。

---

## 質問 1: spinGacha の出力件数

`component-methods.md` で `spinGacha`（シングル）の出力が `{ recipe, rarity }[]`（配列）になっています。

シングルガチャは1品のみ返却する想定ですが、配列にしている理由は「将来的に複数候補を返す可能性」を考慮したものです。

A) シングルガチャは常に1件のみ返却する（出力を `{ recipe, rarity }` 単体に変更）
B) シングルガチャも配列で返却する（フロントエンドで先頭1件を使用。10連と同じインターフェースで統一）
C) その他（[Answer]: タグの後に記述してください）

[Answer]:C（/gacha/singleと/gacha/tenは1つに統合して、入力にガチャ数を含めるように変更。なお、Lambda側ではガチャ数の最大数を必ずチェックするようにしてください。）

---

## 質問 2: isPremium の取得タイミング

`AuthContext` が `isPremium` を保持する設計ですが、`isPremium` は DynamoDB の Users テーブルにのみ存在します。

フロントエンドが `isPremium` を取得するタイミングはどうしますか？

A) ログイン成功後に BE-05（AuthLambda）経由で Users テーブルから取得し、AuthContext にセットする
B) ログイン成功後にフロントエンドが直接 Users テーブルを参照する API（新規追加）を呼び出す
C) Cognito の Post Authentication トリガーでレスポンスに含める
D) その他（[Answer]: タグの後に記述してください）

[Answer]:A（Cognitoの認証期間は1か月とすることで、isPremiumフラグを取り直せるようにする）

---

## 質問 3: ガチャ実行時の BE-02 呼び出し — 確定済み献立の取得方法

`component-dependency.md` のガチャフローで、BE-03 が BE-02 を呼び出して「確定済み献立の recipeId 一覧」を取得しています。

しかし `component-methods.md` の BE-02 には `getConfirmedMenuItems` が `confirmedMenuItem[]` を返す定義しかありません。BE-03 が必要なのは `recipeId[]` のみです。

A) 現状の `getConfirmedMenuItems` をそのまま使い、BE-03 側で recipeId を抽出する
B) BE-02 に `getConfirmedRecipeIds` のような軽量エンドポイントを追加する
C) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

*すべての質問に回答したら「完了」とお知らせください。*

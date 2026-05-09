# Application Design — 最終整合性確認質問

inception配下の全ファイルを横断的に再確認した結果、以下の点で不整合または明確化が必要な箇所を発見しました。

---

## 質問 1: ガチャ確定時の trigger の不整合

trigger の組み合わせ定義表（`application-design.md`）では、ガチャ確定時は `gacha_decided` を使うことになっています。

しかし `component-dependency.md` のガチャフロー図の最後の行では以下のように記述されています：

```
  +--(10) trigger=meal_decided --> BE-04: CharacterLambda
```

同じく `stories.md` の US-13 の trigger テーブルは `gacha_decided` に修正済みですが、フロー図だけ `meal_decided` のままです。

**修正方針**: `component-dependency.md` のガチャフロー図の trigger を `gacha_decided` に修正する

A) はい、`gacha_decided` に修正してください
B) いいえ、実は `meal_decided` のまま統一したい（組み合わせ定義表を戻す）
C) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

## 質問 2: features/gacha の api 欄の記述

`components.md` の `features/gacha` の api 欄が以下のようになっています：

```
- api: gachaApi（GachaLambda呼び出し: POST /gacha, count指定）
```

しかし責務欄には「ガチャ確定時はフロントエンドからBE-02（MenuSuggestionLambda）を直接呼び出す」と記述されており、`application-design.md` のFSD構成図では `confirmedMenuItemApi` も含まれています。

**修正方針**: `components.md` の features/gacha の api 欄に `confirmedMenuItemApi` を追記する

A) はい、追記してください（gachaApi と confirmedMenuItemApi の2つを記載）
B) いいえ、現状のままで良い
C) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

## 質問 3: BE-04 CharacterLambda の入力パラメータ

`components.md` の BE-04 の責務には「trigger/fromを受け取りキャラクター・トーンを内部決定」と記述されていますが、`component-methods.md` では入力に `isPremium` も含まれています（`userId, trigger, from, isPremium`）。

**修正方針**: `components.md` の BE-04 の責務を「trigger/from/isPremiumを受け取り〜」に修正する

A) はい、isPremium を明示的に追記してください
B) いいえ、現状のままで良い（isPremium は暗黙的に含まれる）
C) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

## 質問 4: features/suggestion の useCharacterDialogue 使用記述

`components.md` の features/suggestion の責務に「shared/useCharacterDialogueでボトムシート表示」と記述されていますが、`meal_suggested`（フィルタリング画面）はインライン表示、`meal_decided`（献立確定後）はボトムシート表示です。

**修正方針**: features/suggestion の責務を「shared/useCharacterDialogueで台詞取得（meal_suggestedはインライン表示、meal_decidedはボトムシート表示）」に明確化する

A) はい、明確化してください
B) いいえ、現状のままで良い（詳細は Construction Phase で明確化する）
C) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

## 質問 5: 10連ガチャ確定時の trigger

10連ガチャの確定はフロントエンドが BE-02 を呼び出して行います。このときボトムシートで表示される一言の trigger は以下のどれですか？

A) `gacha_decided` （from: gacha_10）
B) 10連ガチャは複数品確定のため、10件分の ボトムシートを順次表示せず、献立リスト画面に遷移してから表示する
C) 10連ガチャは確定時にボトムシート表示しない
D) その他（[Answer]: タグの後に記述してください）

[Answer]:A

---

## 質問 6: `recipe_registered` の from 値

組み合わせ定義表では `recipe_registered` の from は `registration` とあります。

しかし、オンボーディング（一括登録）時にも `recipe_registered` は発火しますか？

A) オンボーディングでは `recipe_registered` は発火しない（一括登録のため個別発火しない）
B) オンボーディング完了時に1回だけ発火する（from: onboarding）
C) 個々の料理ごとに発火する（from: onboarding）
D) その他（[Answer]: タグの後に記述してください）

[Answer]:B

---

*すべての質問に回答したら「完了」とお知らせください。*

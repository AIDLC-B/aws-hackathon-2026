# Application Design — 最終整合性確認質問

inception配下の全ファイルを横断的に確認した結果、1点だけ確認させてください。

---

## 質問 1: キャラクタードメインの trigger 一覧の不整合

`story-generation-plan.md`（計画段階）では以下の6つの trigger が定義されていました：

| trigger | 用途 |
|---|---|
| `meal_decided` | 献立確定時 |
| `recipe_registered` | 料理登録時 |
| `gacha_reroll_limit` | ガチャリセマラ5回目 |
| `meal_suggested` | 献立提案時（通常） |
| `gacha_decided` | ガチャ結果確定時 |
| `meal_completed` | つくったよ！押下時 |

一方、Application Design（`application-design.md` / `services.md` / `component-methods.md`）および `ux-design.md` / `stories.md` では以下の4つのみ定義されています：

| trigger | 用途 |
|---|---|
| `meal_decided` | 献立確定時（提案・ガチャ問わず） |
| `recipe_registered` | 料理登録時 |
| `gacha_reroll_limit` | ガチャリセマラ5回目 |
| `meal_completed` | つくったよ！押下時 |

**差分**: `meal_suggested`（献立提案時）と `gacha_decided`（ガチャ結果確定時）が Application Design 以降では使われていません。

これは `meal_decided` に統合された（提案確定もガチャ確定も同じ `meal_decided` として扱う）と理解していますが、正しいですか？

A) はい、正しい。`meal_decided` に統合済み。`story-generation-plan.md` は計画段階の古い情報なので問題ない
B) いいえ、`meal_suggested` と `gacha_decided` も別 trigger として残すべき（Application Design に追加が必要）
C) その他（[Answer]: タグの後に記述してください）

[Answer]:B（triggerとキャラクターとトーンの組み合わせの定義は検討したい）


---

*回答が終わったら「完了」とお知らせください。*

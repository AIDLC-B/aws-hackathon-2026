# Unit 2: セットアップ／マスターデータ — Code Generation 計画

> Unit 2は設計4ステージをスキップし、Code Generationのみ実行（マスターデータ＋seedスクリプト＋インストールガイド）。

## ユニットコンテキスト
- **対象**: Unit 2（セットアップ／マスターデータ）
- **配置**: `setup/` フォルダ（独立管理・Q5/5a=A）
- **依存**: Unit 1（Firebaseプロジェクト・Firestore・Security Rules）
- **所有データ**: `characterDialogues` / `difficultyMaster` / `rarityMaster` / `gachaConfig`（全マスター）

## 確定済みスキーマ（Application Design）
- `difficultyMaster`: { id: easy/normal/hard, label, order }
- `rarityMaster`: { id: N/R/SR/SSR, label, order }
- `gachaConfig`: { rarity, probability } — N=0.60, R=0.25, SR=0.12, SSR=0.03
- `characterDialogues`: { characterId, trigger, tone, message, isPremium }

## 7キャラクター
| id | 名前 | トーン傾向 |
|---|---|---|
| saboeru | 堕落天使サボエル | 哲学的・格言 |
| sabokachan | 居酒屋のおかんサボ母ちゃん | 全肯定・関西弁 |
| nyamake | ぐうたら猫ニャマケ | 脱力・無気力 |
| chefrei | 元シェフの幽霊シェフレイ | 叱責・ブラックユーモア |
| meshistopheles | 小悪魔メシストフェレス | 誘惑・煽り（堕落ルート固定） |
| sabot | ダメロボサボット | 論理的・AI的 |
| sabowrashi | 座敷わらしサボわらし | 無邪気・和風 |

---

## 質問

### Question 1: characterDialogues の生成方法

セリフ（7キャラ × トリガー × トーン）の用意方法は？

A) **手動でスターターセットを作成**（各 trigger×tone×character の組み合わせに 2〜3 パターンの日本語セリフをJSONで用意・推奨：すぐ動く・コスト0）
B) Claude APIで一括生成するスクリプトを作る（実行時にClaude API課金・大量生成可）
C) 最小1パターンずつだけ用意（後で拡充）
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 2: スターターセットの分量（Q1=A/Cの場合）

各組み合わせのセリフ数の目安は？

A) 各組み合わせ 2〜3パターン（バリエーション確保・推奨）
B) 各組み合わせ 1パターン（最小）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 2a（フォローアップ・矛盾解消）

Q1で「最小1パターンずつ」（C）、Q2で「各2〜3パターン」（A）と、分量の回答が矛盾しています。最終的にどちらにしますか？

A) 各組み合わせ **2〜3パターン**（バリエーション重視）
B) 各組み合わせ **1パターン**（最小・すぐ拡充前提）
C) **キャラ×トリガーの主要組み合わせのみ2〜3、それ以外は1**（メリハリ）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

seed投入の対象は？

A) Emulator と 本番の両対応（環境変数で切替・推奨）
B) Emulatorのみ（本番は手動）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: seedの実行方式

投入スクリプトの実装は？

A) TypeScript + firebase-admin（`npm run seed` で実行・推奨）
B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: プレミアム専用セリフ（isPremium）

`isPremium=true` のセリフ（プレミアム専用）は今回用意しますか？

A) 今回は全て isPremium=false のみ用意（プレミアム拡充は将来・推奨）
B) 一部 isPremium=true も用意（[Answer]に記述）
C) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 5a（フォローアップ）: プレミアム専用セリフの範囲

Q5=B（一部isPremium=trueも用意）の具体的な範囲を教えてください。

A) **各キャラに数パターンずつ** isPremium=true のセリフを追加（推し愛着向け・薄く広く）
B) **特定キャラ（例: 推され度が高いキャラ）に集中** して追加（[Answer]に対象キャラ記述）
C) **特定トリガー（例: meal_completed の特別な褒め）** に限定して追加（[Answer]に対象記述）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

- [x] Step 1: `setup/SETUP.md`（インストレーションガイド：Firebaseプロジェクト作成・Google認証有効化・seed実行・環境変数）
- [x] Step 2: マスターデータJSON生成
  - `setup/seed/data/difficulty-master.json`
  - `setup/seed/data/rarity-master.json`
  - `setup/seed/data/gacha-config.json`
  - `setup/seed/data/character-dialogues.json`
- [x] Step 3: seedスクリプト生成（`setup/seed/seed.ts` + firebase-admin・環境切替）
- [x] Step 4: seed用 package.json / 実行手順（`npm run seed` 連携）
- [x] Step 5: ドキュメント生成（aidlc-docs/construction/unit2-setup-masterdata/code/ 概要）
- [x] Step 6: 整合性確認（スキーマ・Security Rules・キャラ×trigger×tone対応）+ firestore.rules にマスター読み取り専用ルールを有効化

---

*質問に回答したら「回答しました」とお知らせください。回答に基づきステップを確定し、生成します。*

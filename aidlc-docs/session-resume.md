# セッション再開ガイド

> このファイルは次回セッション開始時にスムーズに作業を再開するためのガイドです。

---

## プロジェクト概要

| 項目 | 内容 |
|---|---|
| **アプリ名** | DAMESI（ダメシ） |
| **ハッカソンテーマ** | 「人をダメにするサービス」 |
| **コンセプト** | 主婦・主夫の献立思考を完全に肩代わりし、心地よく思考停止させる |
| **技術スタック** | React + TypeScript / AWS（Lambda・Bedrock・DynamoDB・S3・Cognito） |

---

## 現在の作業状態

- **フェーズ**: INCEPTION
- **完了済みステージ**: Workspace Detection、Requirements Analysis
- **中断ポイント**: Workflow Planning の実行計画を作成済み。**ユーザーの承認待ちで中断**

---

## 次回の再開手順

1. `aidlc-docs/inception/requirements/requirements.md` を読み込む（要件定義書・最終版）
2. `aidlc-docs/inception/plans/execution-plan.md` を読み込む（実行計画書）
3. ユーザーに以下を提示して承認を得る：

> **Workflow Planning の実行計画が作成済みです。**  
> `aidlc-docs/inception/plans/execution-plan.md` をご確認ください。  
> 承認いただければ **Application Design** へ進みます。

---

## 要件定義書サマリー（最終版）

### 機能要件（FR-01〜FR-06）

| FR | 機能名 | 優先度 | 概要 |
|---|---|---|---|
| FR-01 | 料理登録 | 🔴 Must | 写真 or 手動 + AI認識（確認・修正可）+ 難易度・所要時間記録 |
| FR-02 | 献立提案（ワンボタン） | 🔴 Must | ボタン1つで提案 + 楽したいモード（難易度フィルタ） |
| FR-03 | AIキャラクターによる「今日の一言」 | 🟡 Should | 7キャラクターがトーンに応じて登場（叱咤激励・叱責・褒め・脱力） |
| FR-04 | 連続使用ストリーク・週次レポート | 🟢 Nice | 連続使用記録・「今週節約した思考時間」レポート |
| FR-05 | 献立ガチャ | 🔴 Must（シングル）/ 🟡 Should（10連） | レアリティN〜SSR・リセマラ5回でデリバリー降伏ルート |
| FR-06 | AIキャラクター依存度向上（課金） | 🟢 Nice | トーン追加・組み合わせ拡充・推しキャラ固定（すべて課金要素） |

### 7キャラクター一覧

| # | 名前 | トーン |
|---|---|---|
| ① | 堕落天使「サボエル」 | 哲学的・格言 |
| ② | 居酒屋のおかん「サボ母ちゃん」 | 全肯定・関西弁 |
| ③ | ぐうたら猫「ニャマケ」 | 脱力・無気力 |
| ④ | 元一流シェフの幽霊「シェフレイ」 | 叱責・ブラックユーモア |
| ⑤ | 小悪魔「メシストフェレス」 | 誘惑・煽り（ガチャ堕落ルート固定） |
| ⑥ | ダメになったロボット「サボット」 | 論理的・AI的 |
| ⑦ | 座敷わらし「サボわらし」 | 無邪気・和風 |

### 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React + TypeScript（レスポンシブ） |
| バックエンド | AWS Lambda + API Gateway |
| DB | Amazon DynamoDB |
| ストレージ | Amazon S3 |
| AI/ML | Amazon Bedrock（マルチモーダル + テキスト生成） |
| 認証 | Amazon Cognito |
| ホスティング | AWS Amplify または CloudFront + S3 |

---

## 関連ファイル一覧

| ファイル | 内容 |
|---|---|
| `aidlc-docs/aidlc-state.md` | ステージ進捗・状態管理 |
| `aidlc-docs/audit.md` | 全インタラクションの監査ログ |
| `aidlc-docs/inception/requirements/requirements.md` | 要件定義書（最終版） |
| `aidlc-docs/inception/requirements/requirement-verification-questions.md` | 要件確認質問（回答済み） |
| `aidlc-docs/inception/requirements/requirement-clarification-questions.md` | 追加質問（回答済み） |
| `aidlc-docs/inception/plans/execution-plan.md` | ワークフロー実行計画（承認待ち） |

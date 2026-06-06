# Unit 1: Firebase基盤 & 認証 — Infrastructure Design 計画

## 対象ユニット
- **Unit 1: Firebase基盤 & 認証**（Firebaseプロジェクト基盤＝**全ユニット共有インフラ**を定義）

## スコープ
- Firebaseプロジェクト構成（環境・リージョン）
- Firebase Authentication（Google Provider）設定
- Firebase Hosting（SPA配信）
- Firebase Emulator Suite（ローカル開発）
- デプロイ／CI方針
- モニタリング方針
- → 共有インフラとして `construction/shared-infrastructure.md` にも反映

## 前提（確定済み）
- Firebase（Auth + Firestore + Cloud Storage + Functions + Hosting）+ Claude API
- 個人開発 / 無料枠重視 / 小規模

## 設計チェックリスト（Part 2で実行）
- [x] infrastructure-design.md 生成（Firebaseサービスマッピング・設定）
- [x] deployment-architecture.md 生成（デプロイ構成・環境・CI）
- [x] shared-infrastructure.md 生成（全ユニット共有のFirebase基盤）
- [x] 整合性確認

---

## 質問

### Question 1: 環境構成

開発/本番の環境分離は？

A) 単一Firebaseプロジェクト + ローカルはEmulator（最小構成・無料枠に優しい・推奨）
B) dev用と本番用で別Firebaseプロジェクトを用意（環境分離・運用は増える）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: Firestore / プロジェクトのリージョン

**後から変更できない重要な決定**です。主な対象ユーザーの所在は？

A) 東京（`asia-northeast1`）— 日本のユーザー向け・推奨
B) 大阪（`asia-northeast2`）
C) その他（[Answer]に記述）
D) Other (please describe after [Answer]: tag below)

[Answer]: C（usリージョンで）

#### Question 2a（フォローアップ）: USの具体的なFirestoreロケーション

USには複数のロケーションがあり、**後から変更不可**・コストにも影響します（マルチリージョンは割高）。どれにしますか？

A) `us-central1`（単一リージョン・Cloud Functions既定リージョンと一致・コスト最小・推奨）
B) `us-east1` または `us-west1` 等の単一リージョン（[Answer]に記述）
C) `nam5`（USマルチリージョン・高可用だが割高）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: デプロイ／CI

デプロイ方法は？

A) 手動（`firebase deploy`）で運用開始（最小・個人開発向け・推奨）
B) GitHub Actions等でCI/CD自動デプロイを構築
C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4: モニタリング／ロギング

監視・ログの方針は？

A) Firebaseコンソール標準（Functionsログ・使用量ダッシュボード）のみ（最小・推奨）
B) 追加導入したい（例: Crashlytics / Performance Monitoring / Google Analytics）（[Answer]に記述）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: Cloud Functions の課金プラン

Cloud Functions（Unit 4・外部Claude API呼び出し）は **Blazeプラン（従量・無料枠あり）** が必要です（Sparkプランでは外部ネットワーク呼び出し不可）。

A) Blazeプランを使用（無料枠内運用・予算アラート設定を推奨）
B) Cloud Functionsを使わない代替を検討したい（[Answer]に記述）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

*すべての質問に回答したら「回答しました」とお知らせください。*

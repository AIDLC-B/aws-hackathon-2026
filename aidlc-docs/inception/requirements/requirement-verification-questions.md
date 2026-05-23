# Firebase移行に伴う要件確認質問

Firebaseアーキテクチャへの移行にあたり、以下の質問にお答えください。

## Question 1
Firebaseの利用範囲はどこまでを想定していますか？

A) Firebase全面採用（Authentication + Firestore + Cloud Storage + Cloud Functions + Hosting）
B) Firebase部分採用（認証・DB・ストレージのみFirebase、AI処理は別サービス）
C) Firebase + Google Cloud Platform（Firebase基盤 + Vertex AI等のGCPサービス併用）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
AI/ML機能（料理写真認識・キャラクター台詞生成）はどのサービスを利用しますか？

A) Google Cloud Vertex AI（Gemini モデル）
B) OpenAI API（GPT-4o / GPT-4o-mini）
C) Anthropic Claude API（直接利用）
D) Firebase Extensions + 外部AI API の組み合わせ
E) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 3
データベースはどちらを利用しますか？

A) Cloud Firestore（リアルタイム同期・ドキュメントDB）
B) Firebase Realtime Database（JSON型・シンプル）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
フロントエンドのホスティングはどうしますか？

A) Firebase Hosting（CDN配信・カスタムドメイン対応）
B) Vercel（Next.js最適化）
C) Cloudflare Pages
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
バックエンドロジック（献立提案・ガチャ抽選等）の実行環境はどうしますか？

A) Cloud Functions for Firebase（サーバーレス関数）
B) Firebase + Cloud Run（コンテナベース）
C) フロントエンドで直接Firestore操作 + 最小限のCloud Functions
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6
既存の要件（FR-00〜FR-06）の機能仕様自体に変更はありますか？

A) 機能仕様は変更なし（技術スタックのみ変更）
B) 一部機能仕様も見直したい（具体的に記述してください）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
ハッカソンのテーマ・コンテキストに変更はありますか？

A) 変更なし（「人をダメにするサービス」テーマ、ハッカソン向けPoC）
B) テーマは同じだがハッカソン以外の用途に変更
C) Other (please describe after [Answer]: tag below)

[Answer]: B（ハッカソンには落ちたので、最小限のコストで実装したい）

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

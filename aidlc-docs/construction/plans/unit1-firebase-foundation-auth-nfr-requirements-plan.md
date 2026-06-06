# Unit 1: Firebase基盤 & 認証 — NFR Requirements 計画

## 対象ユニット
- **Unit 1: Firebase基盤 & 認証**（Google認証・usersプロフィール・Firestore/Storage Security Rules・Hosting）

## 前提コンテキスト
- **個人開発**（ハッカソン後）／**Firebase無料枠（Spark/Blazeの無料範囲）内運用**を重視
- 想定ユーザー規模は小（個人〜少数）。大規模スケールは現時点で不要
- 技術スタックは確定済み（Firebase Authentication[Google] + Firestore + Cloud Storage + Hosting）

## 設計チェックリスト（Part 2で実行）
- [x] nfr-requirements.md 生成（セキュリティ・性能・可用性・保守性・ユーザビリティのNFR）
- [x] tech-stack-decisions.md 生成（認証/Security Rules/ホスティングの技術選定と根拠）
- [x] 整合性確認

---

## 質問

以下の `[Answer]:` タグにご回答ください。デフォルト（推奨）を併記しています。

### Question 1: Google認証のフロー方式

`signInWithPopup`（ポップアップ）と `signInWithRedirect`（リダイレクト）のどちらを基本にしますか？

A) ポップアップ（PC・モバイルともに基本。実装がシンプル）
B) リダイレクト（モバイルのポップアップブロック回避に強い）
C) PCはポップアップ／モバイルはリダイレクト（ハイブリッド）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: Security Rulesでの isPremium 保護レベル

`isPremium` をクライアントから改ざんさせない保護をどこまで厳密にしますか？

A) フィールドレベルで厳密に保護（usersドキュメント更新時に isPremium の変更を拒否するルールを書く・推奨）
B) 簡易（本人のみ書き込み可とし、isPremiumの個別保護はしない）
C) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 2a（フォローアップ・セキュリティ矛盾の解消）

Q2=Bは、承認済みFunctional Design **BR-7.2「isPremiumはクライアントから変更不可」** と矛盾します。

Bの場合、ユーザーは自分の `users/{uid}` ドキュメントに書き込み権限を持つため、`isPremium=true` を**自分で書き換えてプレミアム機能を無料解放できてしまいます**（権限昇格）。Security Baseline拡張（有効）の観点でも、これは認可バイパスに該当します。

現状プレミアム（FR-06）は「管理者がアンロック」「課金は未実装の導線のみ」のため実害は小さいですが、設計上の整合のため方針を確定させてください。

A) **フィールドレベル保護を採用（推奨・BR-7.2を維持）** — usersドキュメント更新時、`isPremium` と `createdAt` の変更を拒否するSecurity Rulesを書く。本人は nickname / favoriteCharacters / isOnboardingCompleted のみ更新可
B) **Bのまま（リスクを受容）** — isPremiumの個別保護はしない。BR-7.2を「当面は強制しない（将来課金実装時に対応）」へ緩和することを明記
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: スケール／性能の目標

性能・スケールの目標水準は？

A) 無料枠内・小規模想定（明示的なSLOは設けず、Firebaseマネージドの標準性能に委ねる・推奨）
B) 具体的な目標を設定したい（[Answer]に記述：例「ログイン完了まで3秒以内」等）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: 対象プラットフォーム／レスポンシブ

対象とする画面・ブラウザは？

A) モバイルファースト + PC対応（レスポンシブ・モダンブラウザ最新版）
B) モバイルのみ
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: 可用性／バックアップ

可用性・データ保護の方針は？

A) ベストエフォート（Firebaseマネージドの可用性に依拠。明示的なバックアップ運用は当面なし・推奨）
B) 定期バックアップ等を設計に含めたい（[Answer]に記述）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: プライバシー（Google認証スコープ）

Googleから取得する情報の範囲は？

A) 基本プロフィールのみ（email, displayName, photoURL。最小スコープ・推奨）
B) その他も取得したい（[Answer]に記述）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

*すべての質問に回答したら「回答しました」とお知らせください。*

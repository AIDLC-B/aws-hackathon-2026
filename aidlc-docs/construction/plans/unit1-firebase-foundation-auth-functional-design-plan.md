# Unit 1: Firebase基盤 & 認証 — Functional Design 計画

## 対象ユニット
- **Unit 1: Firebase基盤 & 認証**
- **対応feature**: features/auth（LoginPage / SignUpPage / useAuth）+ AuthProvider + Firebase設定/Security Rules
- **対応ストーリー**: US-17（サインアップ・ログイン）、US-18（ログアウト）

## 設計スコープ
- usersドキュメントのドメインモデル
- 認証フローの業務ルール（サインアップ・ログイン・ログアウト・初回判定・isPremium取得）
- 認証関連フロントエンドコンポーネント（ログイン/サインアップ/確認画面）
- Firestore/Storage Security Rules の認可ルール（詳細はInfrastructure/NFR Designでも扱うが、業務ルールとして整理）

> **重要な前提のずれ**: 既存ストーリー（US-17）はAWS Cognito前提で「メール確認コード入力画面」を記述していますが、Firebase Authのメール認証は通常「確認リンク方式」です。下記Q1で方式を確定します。

---

## 設計チェックリスト（Part 2で実行）

- [x] domain-entities.md 生成（usersエンティティ・型・制約）
- [x] business-rules.md 生成（バリデーション・認証フロー・認可ルール）
- [x] business-logic-model.md 生成（サインアップ/ログイン/ログアウト/初回判定のロジック）
- [x] frontend-components.md 生成（ログイン/サインアップ/確認画面のコンポーネント階層・props/state・バリデーション）
- [x] 整合性確認

---

## 質問

以下の `[Answer]:` タグにご回答ください。

### Question 1: メール検証（email verification）方式

Firebase Authのメール検証はCognitoの「確認コード」と異なります。どの方式にしますか？

A) **検証なし**（ハッカソン優先・サインアップ後すぐ利用可。最小実装）
B) **確認リンク方式**（Firebase標準。登録後に検証メールのリンクを踏むと有効化。未検証でも一旦ログインは可能にするか別途指定）
C) **確認コード方式を自前実装**（ストーリー通りのコード入力画面。Cloud Functions等で実装・工数増）
D) Other (please describe after [Answer]: tag below)

[Answer]: D（Googleアカウント認証に変更）

#### Question 1a（フォローアップ）: Google認証時の nickname の扱い

Google認証では `displayName` と `email` がGoogleプロフィールから自動取得されます。usersドキュメントの `nickname` はどうしますか？

A) Googleの `displayName` を初期 `nickname` として自動セット（ユーザー入力なし・設定画面で後から変更可）
B) 初回サインイン後にニックネーム入力画面を表示して設定（オンボーディングの前段）
C) `nickname` フィールド自体を廃止し、表示は常にGoogleの `displayName` を使用
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 1b（フォローアップ）: ログイン/サインアップ画面の構成

Google認証ではサインアップとログインが実質同一フロー（初回サインイン=登録）になります。

A) 単一の「ログイン画面」に統合し「Googleでログイン」ボタンのみ配置（SignUpPageは廃止）
B) ログイン画面とサインアップ画面を残す（両方にGoogleボタン）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 7a（フォローアップ）: Google認証のエラーハンドリング

Google認証（ポップアップ/リダイレクト）特有のエラー（ポップアップ閉鎖 `auth/popup-closed-by-user`、キャンセル、ネットワークエラー等）の扱いは？

A) 主要エラー（ユーザーキャンセル・ネットワークエラー）を日本語メッセージにマッピング、その他は汎用メッセージ
B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: usersドキュメントの初期生成タイミング

`users/{uid}` ドキュメント（nickname, email, isPremium, isOnboardingCompleted, favoriteCharacters, createdAt）はいつ作成しますか？

A) サインアップ完了時にフロントエンド（useAuth.signUp）から作成
B) 初回ログイン時に存在チェックして無ければ作成
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: パスワードポリシー

ストーリーでは「8文字以上」とあります（Firebaseデフォルトは6文字以上）。

A) 8文字以上（ストーリー準拠・フロント側で追加バリデーション）
B) 6文字以上（Firebaseデフォルトのまま）
C) Other (please describe after [Answer]: tag below)

[Answer]: C（Googleアカウント認証を想定しているため不要）

### Question 4: セッション永続化

ログイン状態の保持方式は？

A) ローカル永続化（ブラウザを閉じても維持・Firebase既定の `browserLocalPersistence`）
B) セッションのみ（タブを閉じると破棄）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: 初回判定（オンボーディング誘導）のロジック

ログイン後の遷移分岐の判定基準は？

A) `users/{uid}.isOnboardingCompleted === false` ならオンボーディングへ、true ならトップへ
B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: isPremium の扱い

isPremiumフラグの初期値と更新方法は？

A) 初期値false。更新は管理者がFirestoreを直接操作（アプリ内に変更UIなし・FR-06は導線のみ）
B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7: エラーメッセージのマッピング

Firebase Authのエラーコード（auth/wrong-password, auth/email-already-in-use 等）を日本語メッセージにマッピングする方針は？

A) ストーリー記載の文言に合わせて主要エラーを日本語マッピング（その他は汎用メッセージ）
B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 8: 確認ダイアログ（ログアウト）

US-18のログアウト確認ダイアログは共通UIのModalを使いますか？

A) shared/components/ui/Modal を使う（Unit 3で定義）
B) Other (please describe after [Answer]: tag below)

[Answer]: A

---

*すべての質問に回答したら「回答しました」とお知らせください。*

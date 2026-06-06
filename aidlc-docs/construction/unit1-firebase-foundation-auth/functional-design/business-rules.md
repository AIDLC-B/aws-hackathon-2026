# Unit 1: ビジネスルール

> 認証方式: **Google アカウント認証**。US-17/18 のCognito前提AC（メール+パスワード・確認コード）はGoogle認証前提に置換。

## BR-1: サインイン（Googleアカウント認証）

| ルール | 内容 |
|---|---|
| BR-1.1 | ログインは「Googleでログイン」のみ。メール+パスワード入力は廃止 |
| BR-1.2 | 初回サインイン＝新規登録。専用のサインアップ画面は持たない（ログイン画面に統合） |
| BR-1.3 | サインイン成功後、`users/{uid}` の存在を確認し、無ければ新規作成（BR-2参照） |
| BR-1.4 | 認証はポップアップ方式（`signInWithPopup`）を基本とする |

## BR-2: usersドキュメント初期生成

| ルール | 内容 |
|---|---|
| BR-2.1 | 初回サインイン時に `users/{uid}` が存在しなければ作成する |
| BR-2.2 | `nickname` ← Googleの `displayName`（空なら email のローカル部をフォールバック） |
| BR-2.3 | `email` ← Googleの `email` |
| BR-2.4 | `isPremium=false`, `isOnboardingCompleted=false`, `favoriteCharacters=[]`, `createdAt=サーバー時刻` |
| BR-2.5 | 2回目以降のサインインでは既存ドキュメントを読み込むのみ（上書きしない） |

## BR-3: ログイン後の遷移（初回判定）

| ルール | 内容 |
|---|---|
| BR-3.1 | `isOnboardingCompleted === false` → オンボーディング画面へ遷移 |
| BR-3.2 | `isOnboardingCompleted === true` → トップ画面へ遷移 |
| BR-3.3 | 未ログイン状態でアプリ起動 → ログイン画面を表示（他画面は出さない） |
| BR-3.4 | ログイン済み（セッション有効）でアプリ起動 → ログイン画面をスキップしBR-3.1/3.2の判定へ |

## BR-4: セッション管理

| ルール | 内容 |
|---|---|
| BR-4.1 | ローカル永続化（`browserLocalPersistence`）。ブラウザを閉じても維持 |
| BR-4.2 | トークンはFirebase Authが自動更新 |
| BR-4.3 | `isPremium` はサインイン後 `users/{uid}` から取得しAuthProviderで全体提供 |

## BR-5: ログアウト（US-18）

| ルール | 内容 |
|---|---|
| BR-5.1 | 設定画面に「ログアウト」ボタンを表示 |
| BR-5.2 | 押下時に確認ダイアログ（共通UI Modal）を表示（「ログアウトしますか？」+ ログアウト/キャンセル） |
| BR-5.3 | 「ログアウト」確定でFirebase Authのセッションを破棄 |
| BR-5.4 | ログアウト後はログイン画面へ遷移し、ローカルキャッシュをクリア |

## BR-6: nickname バリデーション（設定画面での変更時）

| ルール | 内容 |
|---|---|
| BR-6.1 | `nickname` は1文字以上（空は不可） |
| BR-6.2 | 前後の空白はトリム |

## BR-7: 認可ルール（Security Rules）

| ルール | 内容 |
|---|---|
| BR-7.1 | `users/{uid}` は本人（`request.auth.uid == uid`）のみ読み書き可 |
| BR-7.2 | `isPremium` はクライアントから変更不可（管理者がAdmin SDK/コンソールで操作） |
| BR-7.3 | 未認証ユーザーは全データにアクセス不可 |

> 注: BR-7.2の「isPremiumクライアント変更不可」はSecurity Rulesでのフィールドレベル制御が必要。詳細はInfrastructure/NFR Designで具体化。

## BR-8: エラーハンドリング

| エラーケース | 対応 |
|---|---|
| `auth/popup-closed-by-user`（ユーザーがポップアップを閉じた） | 「ログインがキャンセルされました」（エラー扱いせず静かに戻す） |
| `auth/cancelled-popup-request` | 無視（連続クリック時） |
| `auth/network-request-failed` | 「ネットワークエラーが発生しました。接続を確認してください」 |
| `auth/popup-blocked` | 「ポップアップがブロックされました。許可してください」 |
| その他 | 「ログインに失敗しました。時間をおいて再度お試しください」（汎用） |
| Firestore書き込み失敗（usersドキュメント作成時） | リトライ or 「初期設定に失敗しました」表示 |

# Unit 1: ビジネスロジックモデル

> 認証方式: **Google アカウント認証**

## ロジック概要

Unit 1 は認証状態の管理と、サインイン/サインアウトに伴うusersドキュメントのライフサイクルを担う。中心は `useAuth` フックと `AuthProvider`。

---

## L-1: サインイン（Googleアカウント）

```
入力: なし（「Googleでログイン」ボタン押下）
処理:
  1. signInWithPopup(GoogleProvider) を実行
  2. 成功 → FirebaseUser（uid, displayName, email, photoURL）取得
  3. users/{uid} の存在チェック（getOne）
     a. 存在しない → usersドキュメント作成（BR-2）
        - nickname = displayName || emailローカル部
        - email = email
        - isPremium = false, isOnboardingCompleted = false
        - favoriteCharacters = [], createdAt = serverTimestamp()
     b. 存在する → 既存プロフィールを読み込む
  4. AuthProvider に currentUser / profile をセット
  5. 遷移判定（L-4）
失敗:
  - popup-closed-by-user / cancelled → 静かに戻す
  - network/popup-blocked/その他 → BR-8のメッセージ表示
出力: 認証済み状態 + プロフィール
```

## L-2: ログアウト

```
入力: ログアウト確定（確認ダイアログでOK）
処理:
  1. signOut() 実行
  2. AuthProvider の currentUser / profile を null に
  3. ローカルキャッシュクリア
  4. ログイン画面へ遷移
出力: 未認証状態
```

## L-3: 認証状態の監視（AuthProvider初期化）

```
処理:
  1. setPersistence(browserLocalPersistence)
  2. onAuthStateChanged を購読
  3. ユーザーあり → users/{uid} を取得して profile にセット、loading=false
  4. ユーザーなし → currentUser=null, profile=null, loading=false
  5. アンマウント時に購読解除
出力: { currentUser, profile, loading } を Context で提供
```

## L-4: ログイン後の遷移判定

```
入力: profile.isOnboardingCompleted
処理:
  - false → /onboarding へ
  - true  → / （トップ）へ
出力: 画面遷移
```

## L-5: ルートガード（アプリ起動時）

```
処理:
  - loading 中 → ローディング表示
  - currentUser == null → /login へリダイレクト（保護ルートへのアクセス時）
  - currentUser != null → L-4 の判定に従う
出力: 適切な画面表示
```

---

## メソッド定義（features/auth/hooks/useAuth.ts）

> 旧設計（email+password の signUp/signIn）から Google認証用に再定義。

| メソッド | 入力 | 出力 | 説明 |
|---|---|---|---|
| signInWithGoogle | なし | `UserProfile` | L-1。Googleポップアップ認証 + usersドキュメント存在チェック/作成 |
| signOut | なし | `void` | L-2。セッション破棄 + キャッシュクリア |
| （Provider提供）currentUser / profile / loading | — | 状態 | L-3。AuthProviderのContext値 |

> usersドキュメント生成は `useAuth` 内で `shared/hooks/useDocument`（createWithId/getOne）を利用（CRUD 2層構造）。

---

## シーケンス（初回サインイン）

```
[User] → [LoginPage] 「Googleでログイン」
        → useAuth.signInWithGoogle()
        → signInWithPopup(Google)         … Firebase Auth
        → getOne(users/{uid})              … 存在チェック（なし）
        → createWithId(users/{uid}, {...}) … 初期プロフィール作成
        → AuthProvider 更新
        → L-4 判定: isOnboardingCompleted=false
        → /onboarding へ遷移
```

## シーケンス（2回目以降）

```
[起動] → AuthProvider: onAuthStateChanged（ユーザーあり）
        → getOne(users/{uid})  … 既存プロフィール取得
        → L-4 判定: isOnboardingCompleted=true
        → / （トップ）へ遷移
```

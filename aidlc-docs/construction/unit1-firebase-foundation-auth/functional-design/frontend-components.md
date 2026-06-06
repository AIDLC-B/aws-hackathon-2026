# Unit 1: フロントエンドコンポーネント

> 認証方式: **Google アカウント認証**。SignUpPageは廃止し、ログイン画面に統合。

## コンポーネント階層

```
app/
├── App.tsx
├── routes.tsx                 ← ルートガード（L-5）含む
└── providers/
    └── AuthProvider.tsx       ← 認証状態Context（L-3）

features/auth/
├── pages/
│   └── LoginPage.tsx          ← Googleログイン画面（SignUpPage統合）
├── components/
│   └── GoogleSignInButton.tsx ← 「Googleでログイン」ボタン
└── hooks/
    └── useAuth.ts             ← signInWithGoogle / signOut / 状態
```

> SignUpPage / LoginForm / SignUpForm（旧email+password用）は廃止。

---

## コンポーネント詳細

### LoginPage

| 項目 | 内容 |
|---|---|
| 役割 | アプリのエントリ画面。未認証時に表示 |
| 表示 | アプリロゴ「DAMESI」 + キャッチ + GoogleSignInButton |
| state | `error: string \| null`（ログインエラーメッセージ）, `submitting: boolean` |
| イベント | GoogleSignInButton押下 → `useAuth.signInWithGoogle()` |
| 遷移 | 成功時 L-4 に従い /onboarding または / へ |
| エラー表示 | BR-8 のマッピング結果を表示（キャンセルは表示しない） |

**画面レイアウト**:
```
+---------------------------+
|        DAMESI             |
|   献立を、考えない。       |
|                           |
|  [  G  Googleでログイン ] |
|                           |
|  （エラー時メッセージ）    |
+---------------------------+
```

### GoogleSignInButton

| 項目 | 内容 |
|---|---|
| 役割 | Google認証トリガーボタン |
| props | `onClick: () => void`, `loading: boolean`, `disabled?: boolean` |
| 表示 | Googleロゴ + 「Googleでログイン」。loading中はスピナー表示 |
| 依存 | shared/components/ui（Button/LoadingSpinner・Unit 3） |

### AuthProvider

| 項目 | 内容 |
|---|---|
| 役割 | 認証状態をアプリ全体へ提供（L-3） |
| Context値 | `{ currentUser, profile, loading, signInWithGoogle, signOut }` |
| 初期化 | setPersistence(local) + onAuthStateChanged購読 + profile取得 |
| 提供範囲 | アプリ全体（App直下でラップ） |

### ルートガード（routes.tsx / L-5）

| 状態 | 表示 |
|---|---|
| loading | LoadingSpinner |
| 未認証 | /login（LoginPage） |
| 認証済み & isOnboardingCompleted=false | /onboarding（Unit 5） |
| 認証済み & isOnboardingCompleted=true | /（トップ・Unit 6） |

---

## ログアウトUI（US-18・設定画面内）

> 設定画面本体は Unit 8（features/settings）が所有。ログアウトの**処理**（useAuth.signOut）は Unit 1 が提供。

| コンポーネント | 役割 | props/挙動 |
|---|---|---|
| LogoutButton（settings内） | ログアウト起動 | 押下で確認Modal表示 |
| 確認Modal（shared/ui/Modal） | 確認ダイアログ | 「ログアウトしますか？」+ ログアウト/キャンセル。確定で `useAuth.signOut()` |

**確認ダイアログ**:
```
+---------------------------+
|  ログアウトしますか？      |
|                           |
|  [キャンセル] [ログアウト] |
+---------------------------+
```

---

## API/データ連携ポイント

| コンポーネント | 連携先 | 経由 |
|---|---|---|
| useAuth.signInWithGoogle | Firebase Auth（signInWithPopup）+ Firestore users/{uid} | Auth SDK + useDocument（Unit 3） |
| useAuth.signOut | Firebase Auth（signOut） | Auth SDK |
| AuthProvider | Firebase Auth（onAuthStateChanged）+ Firestore users/{uid} | Auth SDK + useDocument |

---

## バリデーション

| 対象 | ルール |
|---|---|
| ログイン入力 | なし（Google認証のためフォーム入力なし） |
| nickname（設定画面・参考） | BR-6（1文字以上・トリム）※実装はUnit 8設定画面 |

---

## ストーリー対応

| ストーリー | コンポーネント |
|---|---|
| US-17（サインイン・登録） | LoginPage, GoogleSignInButton, AuthProvider, useAuth |
| US-18（ログアウト） | LogoutButton（settings）, 確認Modal, useAuth.signOut |

> US-17/18 の旧AC（メール+パスワード・確認コード入力画面）はGoogle認証フローに置換済み。ストーリー文書の更新が必要な場合はINCEPTION側で別途対応。

# Unit 1: ドメインエンティティ

> 認証方式: **Google アカウント認証（OAuth）**。メール+パスワード方式は不採用。

## エンティティ: User

`users/{uid}` ドキュメント。`uid` はFirebase AuthのユーザーUID。

| フィールド | 型 | 必須 | 初期値 | 説明 |
|---|---|---|---|---|
| `nickname` | string | ✅ | Googleの `displayName` | 表示名。初回サインイン時にdisplayNameを自動セット。設定画面で変更可 |
| `email` | string | ✅ | Googleの `email` | Googleプロフィールから自動取得 |
| `isPremium` | boolean | ✅ | `false` | プレミアム判定。更新は管理者がFirestore直接操作 |
| `isOnboardingCompleted` | boolean | ✅ | `false` | オンボーディング完了フラグ。初回判定に使用 |
| `favoriteCharacters` | string[] | ✅ | `[]` | 推しキャラID配列（プレミアム機能） |
| `createdAt` | timestamp | ✅ | サーバー時刻 | ドキュメント作成日時 |

### 型定義（shared/types で定義・Unit 3）

```typescript
interface UserProfile {
  nickname: string;
  email: string;
  isPremium: boolean;
  isOnboardingCompleted: boolean;
  favoriteCharacters: string[];
  createdAt: Timestamp;
}
```

### 制約
- `uid` はFirebase Authが発行（ドキュメントIDとして使用）
- `email` / `nickname` の初期値はGoogleプロフィール由来（`displayName` が空の場合は email のローカル部をフォールバックに使用）
- `nickname` は1文字以上（設定画面での変更時にバリデーション）
- `email` の形式検証は不要（Google認証済みのため信頼）
- `isPremium` はクライアントから変更不可（Security Rulesで保護・管理者のみ）

---

## 認証セッション（エンティティではないが状態として管理）

Firebase Auth が管理するセッション情報。アプリ側はAuthProviderで状態保持。

| 状態 | 型 | 説明 |
|---|---|---|
| `currentUser` | FirebaseUser \| null | ログイン中ユーザー（uid, displayName, email, photoURL） |
| `profile` | UserProfile \| null | Firestoreのusersドキュメント |
| `loading` | boolean | 認証状態の初期化中フラグ |

### 永続化
- **ローカル永続化**（`browserLocalPersistence`）。ブラウザを閉じても維持

---

## エンティティ関係

```
FirebaseUser (Firebase Auth管理・uid発行)
    │ 1:1 (uid をキーに対応)
    ▼
users/{uid} (Firestore・UserProfile)
    │ 1:N
    ├── recipes/{recipeId}          (Unit 5が所有)
    └── confirmedMenuItems/{itemId} (Unit 6が所有)
```

> Unit 1は `users/{uid}` ドキュメント本体（プロフィール）を所有。サブコレクション（recipes, confirmedMenuItems）は各機能ユニットが所有する。

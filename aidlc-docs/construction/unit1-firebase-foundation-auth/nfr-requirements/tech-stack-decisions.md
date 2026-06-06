# Unit 1: 技術スタック選定

> 全体アーキテクチャ（Firebase + Claude API）はApplication Designで確定済み。本書はUnit 1固有の技術選定と根拠を記す。

## 確定済み（プロジェクト共通）

| レイヤー | 技術 |
|---|---|
| フロントエンド | React + TypeScript（Vite想定・レスポンシブ） |
| 認証 | Firebase Authentication |
| データ | Cloud Firestore |
| ストレージ | Cloud Storage |
| ホスティング | Firebase Hosting |
| ローカル開発 | Firebase Emulator Suite |

## Unit 1 固有の技術決定

### TD-1: 認証プロバイダ — Google（OAuth）
- **決定**: Firebase Authentication の Google Provider を使用
- **根拠**: パスワード管理不要・ワンタップログイン・個人開発でのセキュリティ運用負荷が低い
- **影響**: メール+パスワード方式の関連実装（確認コード・パスワードポリシー）は不要

### TD-2: 認証フロー方式 — ポップアップ（signInWithPopup）
- **決定**: `signInWithPopup(GoogleAuthProvider)` を基本（Q1=A）
- **根拠**: PC・モバイルともに実装がシンプル。画面遷移を伴わずUXが滑らか
- **留意**: モバイルの一部環境でポップアップがブロックされた場合は `auth/popup-blocked` を案内（BR-8）。将来必要ならリダイレクトへの切替を検討

### TD-3: セッション永続化 — ローカル永続化
- **決定**: `browserLocalPersistence`（Q4関連・Functional Design Q4=A）
- **根拠**: ブラウザを閉じても自動ログインを維持し再ログイン負荷を低減

### TD-4: Security Rules — フィールドレベル保護
- **決定**: usersドキュメント更新時に `isPremium` と `createdAt` の変更を拒否（Q2a=A）
- **実装方針（Firestore Rules 擬似）**:
```javascript
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && request.auth.uid == uid
                && request.resource.data.isPremium == false;
  allow update: if request.auth != null && request.auth.uid == uid
                && request.resource.data.isPremium == resource.data.isPremium
                && request.resource.data.createdAt == resource.data.createdAt;
  // 本人は nickname / favoriteCharacters / isOnboardingCompleted のみ実質変更可
}
```
- **根拠**: 権限昇格（自己isPremium付与）を防止。Security Baseline拡張に準拠

### TD-5: Googleスコープ — 最小（基本プロフィール）
- **決定**: email / displayName / photoURL のみ（Q6=A）
- **根拠**: 最小権限の原則。追加スコープは要件が出た時点で検討

### TD-6: ホスティング — Firebase Hosting
- **決定**: Firebase Hosting にSPAをデプロイ
- **根拠**: Firebaseエコシステム統合・無料枠・SPAリライトとHTTPSが容易

---

## 想定ライブラリ

| 用途 | ライブラリ |
|---|---|
| Firebase SDK | `firebase`（auth, firestore, storage） |
| ルーティング | `react-router`（想定） |
| テスト | `vitest`, `@testing-library/react`, Firebase Emulator |
| E2E | `playwright`（想定） |

> 具体的なバージョン・追加ライブラリはCode Generation時に確定。

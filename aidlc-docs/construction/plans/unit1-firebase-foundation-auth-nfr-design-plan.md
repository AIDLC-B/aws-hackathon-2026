# Unit 1: Firebase基盤 & 認証 — NFR Design 計画

## 対象ユニット
- **Unit 1: Firebase基盤 & 認証**

## 前提（NFR Requirementsより確定済み）
- セキュリティ: 本人のみアクセス / isPremium・createdAtフィールドレベル保護 / Google OAuth / 最小スコープ
- 認証フロー: ポップアップ / ローカル永続化
- 性能・可用性・スケール: 無料枠・ベストエフォート・小規模
- UX: モバイルファースト+PCレスポンシブ

## 設計チェックリスト（Part 2で実行）
- [x] nfr-design-patterns.md 生成（セキュリティ/レジリエンス/UXパターン）
- [x] logical-components.md 生成（AuthProvider, Security Rules, エラーマッパー等の論理コンポーネント）
- [x] 整合性確認

---

## 質問

### Question 1: usersドキュメント作成の冪等性／競合対策

初回サインイン時の「存在チェック→無ければ作成」の競合対策は？

A) `getDoc` で存在確認 → 無ければ `setDoc`（シンプル。同一ユーザーの同時多重サインインは稀なため十分・推奨）
B) Firestoreトランザクションで存在確認と作成をアトミックに実行（厳密だが複雑）
C) `setDoc(..., { merge: true })` で常に欠損フィールドのみ補完（チェック省略）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: エラー時のリトライ戦略

usersドキュメント作成失敗（ネットワーク等）時の挙動は？

A) リトライなし・エラー表示して再ログインを促す（シンプル・推奨）
B) 1〜2回の自動リトライ後にエラー表示
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: Security Rules のテスト方針

フィールドレベル保護（isPremium改ざん拒否等）の検証方法は？

A) Firebase Emulator + Rules単体テストで主要ケースを検証（本人/他人/isPremium改ざん/未認証・推奨）
B) 手動確認のみ
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: 認証状態のグローバル提供パターン

AuthProviderの提供方式は？

A) React Context + カスタムフック（useAuth）でアプリ全体に提供（推奨・標準パターン）
B) 状態管理ライブラリ（Zustand/Redux等）を導入
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

*すべての質問に回答したら「回答しました」とお知らせください。*
